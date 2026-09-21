import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import { decodeJwt } from "jose";
import { ACCESS_TOKEN_TTL_SECONDS, SESSION_TTL_MS } from "../src/modules/auth/auth.constants.js";
import { hashRefreshToken, issueTokenPair, verifyAccessToken, verifyRefreshToken } from "../src/modules/auth/tokens.js";

describe("authentication tokens", () => {
  it("issues typed tokens with the approved lifetimes and validates their claims", async () => {
    const now = new Date("2026-09-21T12:00:00.000Z");
    const userId = randomUUID();
    const sessionId = randomUUID();
    const sessionExpiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    const tokens = await issueTokenPair({ userId, sessionId, refreshTokenVersion: 3, sessionExpiresAt, now });
    const accessPayload = decodeJwt(tokens.accessToken);
    const refreshPayload = decodeJwt(tokens.refreshToken);

    assert.equal(Number(accessPayload.exp) - Number(accessPayload.iat), ACCESS_TOKEN_TTL_SECONDS);
    assert.equal(Number(refreshPayload.exp), Math.floor(sessionExpiresAt.getTime() / 1000));
    assert.deepEqual(await verifyAccessToken(tokens.accessToken, now), { sub: userId, sid: sessionId, typ: "access" });
    assert.deepEqual(await verifyRefreshToken(tokens.refreshToken), { sub: userId, sid: sessionId, typ: "refresh", ver: 3 });
    assert.match(hashRefreshToken(tokens.refreshToken), /^[a-f0-9]{64}$/);
  });

  it("rejects an access token after its 15-minute expiration", async () => {
    const now = new Date();
    const tokens = await issueTokenPair({
      userId: randomUUID(),
      sessionId: randomUUID(),
      refreshTokenVersion: 1,
      sessionExpiresAt: new Date(now.getTime() + SESSION_TTL_MS),
      now,
    });

    await assert.rejects(verifyAccessToken(tokens.accessToken, new Date(now.getTime() + (ACCESS_TOKEN_TTL_SECONDS + 1) * 1000)));
  });
});
