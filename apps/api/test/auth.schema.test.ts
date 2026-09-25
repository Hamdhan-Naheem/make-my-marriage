import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RequestValidationError } from "../src/shared/errors.js";
import { parseLoginRequest, parseRegisterRequest } from "../src/modules/auth/auth.schema.js";

describe("registration request validation", () => {
  it("trims names, normalizes email, and preserves the password exactly", () => {
    const password = "  Exact Unicode passphrase 🔐  ";
    const result = parseRegisterRequest({
      firstName: "  Ahamed  ",
      lastName: "  Mohamed  ",
      email: "  AHAMED@Example.COM  ",
      password,
    });

    assert.deepEqual(result, {
      firstName: "Ahamed",
      lastName: "Mohamed",
      email: "ahamed@example.com",
      password,
    });
  });

  it("rejects invalid fields and unknown account properties", () => {
    assert.throws(
      () =>
        parseRegisterRequest({
          firstName: "",
          lastName: "x".repeat(101),
          email: "not-an-email",
          password: "too short",
          role: "OWNER",
        }),
      (error) => {
        assert.ok(error instanceof RequestValidationError);
        assert.equal(error.code, "VALIDATION_ERROR");
        assert.deepEqual(Object.keys(error.fields ?? {}).sort(), ["_form", "email", "firstName", "lastName", "password"]);
        return true;
      },
    );
  });

  it("rejects a password longer than 128 characters", () => {
    assert.throws(
      () =>
        parseRegisterRequest({
          firstName: "Ahamed",
          lastName: "Mohamed",
          email: "ahamed@example.com",
          password: "x".repeat(129),
        }),
      RequestValidationError,
    );
  });
});

describe("login request validation", () => {
  it("normalizes email and preserves the password exactly", () => {
    const password = "  Exact login password 🔐  ";
    assert.deepEqual(parseLoginRequest({ email: " USER@Example.COM ", password }), {
      email: "user@example.com",
      password,
    });
  });

  it("rejects unknown fields", () => {
    assert.throws(
      () => parseLoginRequest({ email: "user@example.com", password: "password", role: "OWNER" }),
      RequestValidationError,
    );
  });
});
