import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEnv } from "../src/config/env.js";

const base = {
  PORT: "4000",
  DATABASE_URL: "postgresql://user:password@127.0.0.1:5433/database",
  WEB_ORIGIN: "http://localhost:3000",
  JWT_ACCESS_SECRET: "a".repeat(32),
  JWT_REFRESH_SECRET: "b".repeat(32),
};

describe("authentication environment safeguards", () => {
  it("defaults the unverified-email bypass to false", () => {
    assert.equal(parseEnv({ ...base, NODE_ENV: "development" }).AUTH_ALLOW_UNVERIFIED_DEV, false);
  });

  it("allows the explicit bypass only with local development services", () => {
    const parsed = parseEnv({ ...base, NODE_ENV: "development", AUTH_ALLOW_UNVERIFIED_DEV: "true" });
    assert.equal(parsed.AUTH_ALLOW_UNVERIFIED_DEV, true);
  });

  it("rejects the bypass in production", () => {
    assert.throws(() => parseEnv({ ...base, NODE_ENV: "production", AUTH_ALLOW_UNVERIFIED_DEV: "true" }));
  });

  it("rejects the bypass with a remote database or web origin", () => {
    assert.throws(() => parseEnv({
      ...base,
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@db.example.com/database",
      AUTH_ALLOW_UNVERIFIED_DEV: "true",
    }));
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
