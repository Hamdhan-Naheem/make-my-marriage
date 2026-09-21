import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  AuthRepository,
  AuthUserRecord,
  CreateSessionData,
  CreateUserData,
  SessionWithUserRecord,
} from "../src/modules/auth/auth.repository.js";
import { AuthService } from "../src/modules/auth/auth.service.js";
import type { PasswordHasher } from "../src/modules/auth/password.js";
import { EmailAlreadyRegisteredError } from "../src/shared/errors.js";

class FakeAuthRepository implements AuthRepository {
  existingUserId: string | null = null;
  createdUser?: CreateUserData;

  async findUserIdByEmail(): Promise<string | null> {
    return this.existingUserId;
  }

  async createUnverifiedUser(data: CreateUserData): Promise<void> {
    this.createdUser = data;
  }

  async findUserByEmail(): Promise<AuthUserRecord | null> { return null; }
  async createSession(_data: CreateSessionData): Promise<void> { throw new Error("Not used"); }
  async findSessionWithUser(): Promise<SessionWithUserRecord | null> { return null; }
  async rotateRefreshToken(): Promise<boolean> { return false; }
  async revokeSession(): Promise<void> { throw new Error("Not used"); }
}

describe("AuthService registration", () => {
  it("passes the exact password to the hasher and persists only its hash", async () => {
    const repository = new FakeAuthRepository();
    let receivedPassword: string | undefined;
    const passwordHasher: PasswordHasher = {
      async hash(password) {
        receivedPassword = password;
        return "encoded-argon2id-hash";
      },
      async verify() { return false; },
    };
    const service = new AuthService(repository, passwordHasher);
    const password = "  Keep this password exact 🔐  ";

    await service.register({
      firstName: "Ahamed",
      lastName: "Mohamed",
      email: "ahamed@example.com",
      password,
    });

    assert.equal(receivedPassword, password);
    assert.deepEqual(repository.createdUser, {
      firstName: "Ahamed",
      lastName: "Mohamed",
      email: "ahamed@example.com",
      passwordHash: "encoded-argon2id-hash",
    });
  });

  it("rejects an existing email before hashing", async () => {
    const repository = new FakeAuthRepository();
    repository.existingUserId = "existing-user";
    let hashCalled = false;
    const service = new AuthService(repository, {
      async hash() {
        hashCalled = true;
        return "unused";
      },
      async verify() { return false; },
    });

    await assert.rejects(
      service.register({
        firstName: "Ahamed",
        lastName: "Mohamed",
        email: "ahamed@example.com",
        password: "a valid password",
      }),
      EmailAlreadyRegisteredError,
    );
    assert.equal(hashCalled, false);
    assert.equal(repository.createdUser, undefined);
  });
});
