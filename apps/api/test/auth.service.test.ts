import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  AuthRepository,
  AuthUserRecord,
  CreateSessionData,
  CreateUserData,
  SessionWithUserRecord,
  VerificationResendUser,
} from "../src/modules/auth/auth.repository.js";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { hashVerificationToken } from "../src/modules/auth/email-verification.js";
import type { PasswordHasher } from "../src/modules/auth/password.js";
import type { SendVerificationEmailInput, VerificationEmailSender } from "../src/modules/auth/verification-email.sender.js";
import { EmailAlreadyRegisteredError, InvalidVerificationTokenError } from "../src/shared/errors.js";

class FakeAuthRepository implements AuthRepository {
  duplicateRegistration = false;
  createdUser?: CreateUserData;
  deletedToken?: { userId: string; tokenHash: string };
  resendUser: VerificationResendUser | null = null;
  replacedToken?: { userId: string; tokenHash: string; expiresAt: Date; createdAt: Date };
  consumedTokenHash?: string;
  consumeResult = true;

  async createUnverifiedUser(data: CreateUserData): Promise<{ id: string }> {
    if (this.duplicateRegistration) {
      throw new EmailAlreadyRegisteredError();
    }
    this.createdUser = data;
    return { id: "new-user" };
  }
  async deleteVerificationToken(userId: string, tokenHash: string): Promise<void> {
    this.deletedToken = { userId, tokenHash };
  }
  async findUserForVerificationResend(): Promise<VerificationResendUser | null> { return this.resendUser; }
  async replaceVerificationToken(input: { userId: string; tokenHash: string; expiresAt: Date; createdAt: Date }): Promise<void> {
    this.replacedToken = input;
  }
  async consumeVerificationToken(tokenHash: string): Promise<boolean> {
    this.consumedTokenHash = tokenHash;
    return this.consumeResult;
  }
  async findUserByEmail(): Promise<AuthUserRecord | null> { return null; }
  async createSession(_data: CreateSessionData): Promise<void> { throw new Error("Not used"); }
  async findSessionWithUser(): Promise<SessionWithUserRecord | null> { return null; }
  async rotateRefreshToken(): Promise<boolean> { return false; }
  async revokeSession(): Promise<void> { throw new Error("Not used"); }
}

class FakeVerificationEmailSender implements VerificationEmailSender {
  sent: SendVerificationEmailInput[] = [];
  shouldFail = false;

  async send(input: SendVerificationEmailInput): Promise<void> {
    this.sent.push(input);
    if (this.shouldFail) throw new Error("Fake delivery failure");
  }
}

const passwordHasher: PasswordHasher = {
  async hash() { return "encoded-argon2id-hash"; },
  async verify() { return false; },
};

function registrationInput() {
  return {
    firstName: "Ahamed",
    lastName: "Mohamed",
    email: "ahamed@example.com",
    password: "  Keep this password exact 🔐  ",
  };
}

describe("AuthService email verification", () => {
  it("preserves the password, stores only the token hash, and sends the raw token", async () => {
    const repository = new FakeAuthRepository();
    const emailSender = new FakeVerificationEmailSender();
    let receivedPassword: string | undefined;
    const service = new AuthService(repository, {
      ...passwordHasher,
      async hash(password) {
        receivedPassword = password;
        return "encoded-argon2id-hash";
      },
    }, emailSender);

    await service.register(registrationInput());

    assert.equal(receivedPassword, registrationInput().password);
    assert.equal(emailSender.sent.length, 1);
    assert.equal(repository.createdUser?.verificationTokenHash, hashVerificationToken(emailSender.sent[0]!.rawToken));
    assert.equal(repository.createdUser?.passwordHash, "encoded-argon2id-hash");
    assert.equal(repository.createdUser?.verificationExpiresAt.getTime() > Date.now(), true);
  });

  it("returns generically for an existing account after equalizing password-hashing work", async () => {
    const repository = new FakeAuthRepository();
    repository.duplicateRegistration = true;
    const emailSender = new FakeVerificationEmailSender();
    let hashCalled = false;
    const service = new AuthService(repository, {
      ...passwordHasher,
      async hash() {
        hashCalled = true;
        return "encoded-argon2id-hash";
      },
    }, emailSender);

    await service.register(registrationInput());

    assert.equal(hashCalled, true);
    assert.equal(repository.createdUser, undefined);
    assert.equal(emailSender.sent.length, 0);
  });

  it("keeps the account but removes the token after delivery failure so resend is not blocked", async () => {
    const repository = new FakeAuthRepository();
    const emailSender = new FakeVerificationEmailSender();
    emailSender.shouldFail = true;
    const service = new AuthService(repository, passwordHasher, emailSender);

    await service.register(registrationInput());

    assert.equal(repository.deletedToken?.userId, "new-user");
    assert.equal(repository.deletedToken?.tokenHash, repository.createdUser?.verificationTokenHash);
  });

  it("hashes the submitted token and rejects invalid or expired records", async () => {
    const repository = new FakeAuthRepository();
    repository.consumeResult = false;
    const service = new AuthService(repository, passwordHasher, new FakeVerificationEmailSender());

    await assert.rejects(service.verifyEmail("a".repeat(43)), InvalidVerificationTokenError);
    assert.equal(repository.consumedTokenHash, hashVerificationToken("a".repeat(43)));
  });

  it("replaces and sends a resend token only after the persistent cooldown", async () => {
    const repository = new FakeAuthRepository();
    const emailSender = new FakeVerificationEmailSender();
    repository.resendUser = {
      id: "user-id",
      firstName: "Ahamed",
      email: "ahamed@example.com",
      emailVerifiedAt: null,
      currentTokenCreatedAt: new Date(Date.now() - 61_000),
    };
    const service = new AuthService(repository, passwordHasher, emailSender);

    await service.resendVerification("ahamed@example.com");

    assert.equal(emailSender.sent.length, 1);
    assert.equal(repository.replacedToken?.tokenHash, hashVerificationToken(emailSender.sent[0]!.rawToken));
  });
});
