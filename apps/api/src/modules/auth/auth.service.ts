import { randomUUID } from "node:crypto";
import { env } from "../../config/env.js";
import {
  AuthenticationRequiredError,
  EmailAlreadyRegisteredError,
  EmailVerificationRequiredError,
  InvalidCredentialsError,
  RefreshAlreadyRotatedError,
} from "../../shared/errors.js";
import type { AuthRepository, SessionWithUserRecord } from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.schema.js";
import { CONCURRENT_REFRESH_GRACE_MS, SESSION_TTL_MS } from "./auth.constants.js";
import type { PasswordHasher } from "./password.js";
import {
  hashRefreshToken,
  issueTokenPair,
  type RefreshClaims,
  type TokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "./tokens.js";

export type SafeUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
};

export type AuthenticatedResult = {
  user: SafeUser;
  tokens: TokenPair;
  sessionExpiresAt: Date;
};

export class AuthService {
  private dummyPasswordHash?: Promise<string>;

  constructor(
    private readonly repository: AuthRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(input: RegisterInput): Promise<void> {
    const existingUserId = await this.repository.findUserIdByEmail(input.email);

    if (existingUserId) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    await this.repository.createUnverifiedUser({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      passwordHash,
    });
  }

  async login(input: LoginInput, userAgent: string | undefined): Promise<AuthenticatedResult> {
    const user = await this.repository.findUserByEmail(input.email);
    const passwordHash = user?.passwordHash ?? await this.getDummyPasswordHash();
    const passwordMatches = await this.passwordHasher.verify(passwordHash, input.password);

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (!user.emailVerifiedAt && !env.AUTH_ALLOW_UNVERIFIED_DEV) {
      throw new EmailVerificationRequiredError();
    }

    const sessionId = randomUUID();
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const tokens = await issueTokenPair({
      userId: user.id,
      sessionId,
      refreshTokenVersion: 1,
      sessionExpiresAt,
    });

    await this.repository.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashRefreshToken(tokens.refreshToken),
      expiresAt: sessionExpiresAt,
      userAgent: userAgent?.slice(0, 512) ?? null,
    });

    return {
      user: this.toSafeUser(user),
      tokens,
      sessionExpiresAt,
    };
  }

  async authenticate(accessToken: string | undefined): Promise<SafeUser> {
    if (!accessToken) throw new AuthenticationRequiredError();

    try {
      const claims = await verifyAccessToken(accessToken);
      const session = await this.repository.findSessionWithUser(claims.sid);

      if (!this.isActiveSession(session) || session.userId !== claims.sub) {
        throw new AuthenticationRequiredError("The session is no longer active.");
      }

      return this.toSafeUser(session.user);
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) throw error;
      throw new AuthenticationRequiredError("The access token is invalid or expired.");
    }
  }

  async refresh(refreshToken: string | undefined): Promise<AuthenticatedResult> {
    if (!refreshToken) throw new AuthenticationRequiredError("A refresh token is required.");

    let claims: RefreshClaims;
    try {
      claims = await verifyRefreshToken(refreshToken);
    } catch {
      throw new AuthenticationRequiredError("The refresh token is invalid or expired.");
    }

    const presentedHash = hashRefreshToken(refreshToken);
    const session = await this.repository.findSessionWithUser(claims.sid);

    if (!this.isActiveSession(session) || session.userId !== claims.sub) {
      throw new AuthenticationRequiredError("The session is no longer active.");
    }

    if (session.refreshTokenHash !== presentedHash || session.refreshTokenVersion !== claims.ver) {
      await this.handleStaleRefresh(session, claims);
    }

    const nextVersion = claims.ver + 1;
    const rotatedAt = new Date();
    const tokens = await issueTokenPair({
      userId: session.userId,
      sessionId: session.id,
      refreshTokenVersion: nextVersion,
      sessionExpiresAt: session.expiresAt,
      now: rotatedAt,
    });
    const rotated = await this.repository.rotateRefreshToken({
      sessionId: session.id,
      userId: session.userId,
      currentHash: presentedHash,
      currentVersion: claims.ver,
      nextHash: hashRefreshToken(tokens.refreshToken),
      rotatedAt,
    });

    if (!rotated) {
      const currentSession = await this.repository.findSessionWithUser(session.id);
      if (this.isActiveSession(currentSession)) {
        await this.handleStaleRefresh(currentSession, claims);
      }
      throw new AuthenticationRequiredError("The session is no longer active.");
    }

    return {
      user: this.toSafeUser(session.user),
      tokens,
      sessionExpiresAt: session.expiresAt,
    };
  }

  async logout(accessToken: string | undefined, refreshToken: string | undefined): Promise<void> {
    const sessionId = await this.getSignedSessionId(refreshToken, accessToken);
    if (sessionId) await this.repository.revokeSession(sessionId);
  }

  private async handleStaleRefresh(session: SessionWithUserRecord, claims: RefreshClaims): Promise<never> {
    const isImmediatePreviousVersion = claims.ver === session.refreshTokenVersion - 1;
    const isConcurrentWindow = Date.now() - session.lastRotatedAt.getTime() <= CONCURRENT_REFRESH_GRACE_MS;

    if (isImmediatePreviousVersion && isConcurrentWindow) {
      throw new RefreshAlreadyRotatedError();
    }

    await this.repository.revokeSession(session.id);
    throw new AuthenticationRequiredError("Refresh-token reuse was detected and the session was revoked.");
  }

  private isActiveSession(session: SessionWithUserRecord | null): session is SessionWithUserRecord {
    return Boolean(session && !session.revokedAt && session.expiresAt.getTime() > Date.now());
  }

  private toSafeUser(user: SessionWithUserRecord["user"] | Omit<SessionWithUserRecord["user"], never>): SafeUser {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailVerified: Boolean(user.emailVerifiedAt),
    };
  }

  private getDummyPasswordHash(): Promise<string> {
    this.dummyPasswordHash ??= this.passwordHasher.hash(randomUUID());
    return this.dummyPasswordHash;
  }

  private async getSignedSessionId(refreshToken: string | undefined, accessToken: string | undefined): Promise<string | null> {
    if (refreshToken) {
      try {
        return (await verifyRefreshToken(refreshToken)).sid;
      } catch {
        // Try the access cookie so logout remains useful if refresh is invalid.
      }
    }

    if (accessToken) {
      try {
        return (await verifyAccessToken(accessToken)).sid;
      } catch {
        return null;
      }
    }

    return null;
  }
}
