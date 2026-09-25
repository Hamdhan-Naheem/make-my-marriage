import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as argon2 from "argon2";
import { argon2PasswordHasher } from "../src/modules/auth/password.js";

describe("Argon2id password hashing", () => {
  it("uses the approved parameters and verifies only the exact password", async () => {
    const password = "  Unicode passphrase 🔐  ";
    const hash = await argon2PasswordHasher.hash(password);

    assert.match(hash, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    assert.equal(await argon2.verify(hash, password), true);
    assert.equal(await argon2PasswordHasher.verify(hash, password), true);
    assert.equal(await argon2PasswordHasher.verify(hash, password.trim()), false);
  });
});
