import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEnv } from "../src/config/env.js";

const base = {
  PORT: "4000",
  DATABASE_URL: "postgresql://user:password@127.0.0.1:5433/database",
  WEB_ORIGIN: "http://localhost:3000",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
  RESEND_API_KEY: "re_test_key",
  AUTH_EMAIL_FROM: "Make My Marriage <verification@example.com>",
};

describe("authentication environment safeguards", () => {
  it("accepts Vercel's managed PORT=0 value", () => {
    const parsed = parseEnv({
      ...base,
      PORT: "0",
    });

    assert.equal(parsed.PORT, 0);
  });

  it("requires private Resend email configuration", () => {
    assert.throws(() => parseEnv({ ...base, RESEND_API_KEY: "" }));
    assert.throws(() => parseEnv({ ...base, AUTH_EMAIL_FROM: "" }));
  });

  it("requires separate access and refresh signing secrets", () => {
    assert.throws(() => parseEnv({
      ...base,
      JWT_REFRESH_SECRET: base.JWT_ACCESS_SECRET,
    }));
  });

  it("rejects tracked example secret placeholders", () => {
    assert.throws(() => parseEnv({
      ...base,
      JWT_ACCESS_SECRET: "replace-with-at-least-32-random-characters",
    }));
  });
});
