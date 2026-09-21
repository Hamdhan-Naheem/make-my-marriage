import { createHash, randomUUID } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { env } from "../../config/env.js";
import { ACCESS_TOKEN_TTL_SECONDS } from "./auth.constants.js";

const JWT_ALGORITHM = "HS256";
const JWT_ISSUER = "make-my-marriage-api";
const JWT_AUDIENCE = "make-my-marriage-web";
const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
const refreshSecret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

const accessClaimsSchema = z.object({
  sub: z.string().uuid(),
  sid: z.string().uuid(),
  typ: z.literal("access"),
});

const refreshClaimsSchema = z.object({
  sub: z.string().uuid(),
  sid: z.string().uuid(),
  typ: z.literal("refresh"),
  ver: z.number().int().positive(),
});

export type AccessClaims = z.infer<typeof accessClaimsSchema>;
export type RefreshClaims = z.infer<typeof refreshClaimsSchema>;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

export async function issueTokenPair(input: {
  userId: string;
  sessionId: string;
  refreshTokenVersion: number;
  sessionExpiresAt: Date;
  now?: Date;
}): Promise<TokenPair> {
  const nowSeconds = Math.floor((input.now ?? new Date()).getTime() / 1000);
  const sessionExpirySeconds = Math.floor(input.sessionExpiresAt.getTime() / 1000);

  const accessToken = await new SignJWT({ sid: input.sessionId, typ: "access" })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
    .setSubject(input.userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(nowSeconds)
    .setJti(randomUUID())
    .setExpirationTime(nowSeconds + ACCESS_TOKEN_TTL_SECONDS)
    .sign(accessSecret);

  const refreshToken = await new SignJWT({
    sid: input.sessionId,
    typ: "refresh",
    ver: input.refreshTokenVersion,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM, typ: "JWT" })
    .setSubject(input.userId)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt(nowSeconds)
    .setJti(randomUUID())
    .setExpirationTime(sessionExpirySeconds)
    .sign(refreshSecret);

  return { accessToken, refreshToken };
}

export async function verifyAccessToken(token: string, currentDate?: Date): Promise<AccessClaims> {
  const { payload } = await jwtVerify(token, accessSecret, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    currentDate,
  });

  return accessClaimsSchema.parse(payload);
}

export async function verifyRefreshToken(token: string): Promise<RefreshClaims> {
  const { payload } = await jwtVerify(token, refreshSecret, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  return refreshClaimsSchema.parse(payload);
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
