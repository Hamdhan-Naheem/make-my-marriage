import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request, { type Response } from "supertest";
import { configureTestDatabaseEnvironment } from "../src/config/test-database.js";

configureTestDatabaseEnvironment();

const [{ app }, { prisma }, { env }] = await Promise.all([
  import("../src/app.js"),
  import("../src/config/database.js"),
  import("../src/config/env.js"),
]);

const emailPrefix = `session-test-${Date.now()}`;
const verifiedEmail = `${emailPrefix}-verified@example.com`;
const unverifiedEmail = `${emailPrefix}-unverified@example.com`;
const password = "  Secure Unicode password 🔐  ";

function getSetCookies(response: Response): string[] {
  const header = response.headers["set-cookie"];
  if (Array.isArray(header)) return header;
  return typeof header === "string" ? [header] : [];
}

function asCookieHeader(setCookies: string[]): string {
  return setCookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

async function register(email: string) {
  await request(app)
    .post("/api/v1/auth/register")
    .send({ firstName: "Ahamed", lastName: "Mohamed", email, password })
    .expect(201);
}

function login(email: string, submittedPassword = password) {
  return request(app)
    .post("/api/v1/auth/login")
    .set("Origin", env.WEB_ORIGIN)
    .send({ email, password: submittedPassword });
}

describe("Sign In and database-backed sessions", { concurrency: false }, () => {
  before(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
    await register(verifiedEmail);
    await register(unverifiedEmail);
    await prisma.user.update({ where: { email: verifiedEmail }, data: { emailVerifiedAt: new Date() } });
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
    await prisma.$disconnect();
  });

  it("requires the trusted same-origin request boundary for cookie-setting login", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: verifiedEmail, password })
      .expect(403);

    assert.equal(response.body.error.code, "CSRF_VALIDATION_FAILED");
  });

  it("returns the same generic error for a missing user and an incorrect password", async () => {
    const [missing, incorrect] = await Promise.all([
      login(`${emailPrefix}-missing@example.com`).expect(401),
      login(verifiedEmail, "an incorrect password").expect(401),
    ]);

    assert.equal(missing.body.error.code, "INVALID_CREDENTIALS");
    assert.deepEqual(missing.body, incorrect.body);
  });

  it("rejects unverified users by default and permits only the explicit local-development bypass", async () => {
    env.AUTH_ALLOW_UNVERIFIED_DEV = false;
    const denied = await login(unverifiedEmail).expect(403);
    assert.equal(denied.body.error.code, "EMAIL_VERIFICATION_REQUIRED");

    env.AUTH_ALLOW_UNVERIFIED_DEV = true;
    const allowed = await login(unverifiedEmail).expect(200);
    assert.equal(allowed.body.data.user.emailVerified, false);
    const cookies = asCookieHeader(getSetCookies(allowed));
    await request(app)
      .post("/api/v1/auth/logout")
      .set("Origin", env.WEB_ORIGIN)
      .set("Cookie", cookies)
      .expect(204);
  });

  it("creates a fixed seven-day Session and returns only HttpOnly SameSite cookies", async () => {
    const response = await login(verifiedEmail).expect(200);
    const serializedCookies = getSetCookies(response);

    assert.equal(response.body.data.user.email, verifiedEmail);
    assert.equal(response.body.data.user.emailVerified, true);
    assert.equal(JSON.stringify(response.body).includes("Token"), false);
    assert.equal(serializedCookies.length, 2);
    assert.ok(serializedCookies.every((cookie) => cookie.includes("HttpOnly") && cookie.includes("SameSite=Lax")));
    assert.ok(serializedCookies.some((cookie) => cookie.startsWith("access_token=") && cookie.includes("Path=/")));
    assert.ok(serializedCookies.some((cookie) => cookie.startsWith("refresh_token=") && cookie.includes("Path=/api/v1/auth")));
    assert.ok(serializedCookies.every((cookie) => !cookie.includes("Secure")));

    const user = await prisma.user.findUniqueOrThrow({ where: { email: verifiedEmail } });
    const session = await prisma.session.findFirstOrThrow({
      where: { userId: user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
    const lifetime = session.expiresAt.getTime() - session.createdAt.getTime();
    assert.ok(lifetime > 7 * 24 * 60 * 60 * 1000 - 5_000);
    assert.ok(lifetime <= 7 * 24 * 60 * 60 * 1000 + 5_000);
    assert.match(session.refreshTokenHash, /^[a-f0-9]{64}$/);

    const cookieHeader = asCookieHeader(serializedCookies);
    const me = await request(app).get("/api/v1/auth/me").set("Cookie", cookieHeader).expect(200);
    assert.deepEqual(me.body.data, response.body.data.user);
  });

  it("allows one atomic rotation, handles a concurrent loser, and revokes later stale reuse", async () => {
    const loginResponse = await login(verifiedEmail).expect(200);
    const originalCookies = asCookieHeader(getSetCookies(loginResponse));
    const user = await prisma.user.findUniqueOrThrow({ where: { email: verifiedEmail } });
    const session = await prisma.session.findFirstOrThrow({
      where: { userId: user.id, revokedAt: null },
      orderBy: { createdAt: "desc" },
    });
    const originalExpiry = session.expiresAt.getTime();

    const refreshRequests = await Promise.all([
      request(app).post("/api/v1/auth/refresh").set("Origin", env.WEB_ORIGIN).set("Cookie", originalCookies),
      request(app).post("/api/v1/auth/refresh").set("Origin", env.WEB_ORIGIN).set("Cookie", originalCookies),
    ]);
    assert.deepEqual(refreshRequests.map((response) => response.status).sort(), [200, 409]);

    const winner = refreshRequests.find((response) => response.status === 200);
    const loser = refreshRequests.find((response) => response.status === 409);
    assert.ok(winner);
    assert.ok(loser);
    assert.equal(loser.body.error.code, "REFRESH_ALREADY_ROTATED");
    assert.equal(getSetCookies(loser).length, 0);

    const rotated = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    assert.equal(rotated.refreshTokenVersion, 2);
    assert.equal(rotated.expiresAt.getTime(), originalExpiry);
    assert.notEqual(rotated.refreshTokenHash, session.refreshTokenHash);

    const winnerCookies = asCookieHeader(getSetCookies(winner));
    await request(app).get("/api/v1/auth/me").set("Cookie", winnerCookies).expect(200);

    await prisma.session.update({
      where: { id: session.id },
      data: { lastRotatedAt: new Date(Date.now() - 10_000) },
    });
    const staleReuse = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Origin", env.WEB_ORIGIN)
      .set("Cookie", originalCookies)
      .expect(401);
    assert.equal(staleReuse.body.error.code, "AUTHENTICATION_REQUIRED");
    assert.equal(getSetCookies(staleReuse).length, 2);

    const revoked = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });
    assert.ok(revoked.revokedAt);
    await request(app).get("/api/v1/auth/me").set("Cookie", winnerCookies).expect(401);
  });

  it("revokes the current Session, clears cookies, and makes the access token unusable on logout", async () => {
    const loginResponse = await login(verifiedEmail).expect(200);
    const cookies = asCookieHeader(getSetCookies(loginResponse));
    const logoutResponse = await request(app)
      .post("/api/v1/auth/logout")
      .set("Origin", env.WEB_ORIGIN)
      .set("Cookie", cookies)
      .expect(204);

    const clearedCookies = getSetCookies(logoutResponse);
    assert.equal(clearedCookies.length, 2);
    assert.ok(clearedCookies.every((cookie) => cookie.includes("Expires=Thu, 01 Jan 1970")));
    await request(app).get("/api/v1/auth/me").set("Cookie", cookies).expect(401);
  });

  it("rate-limits repeated login attempts", async () => {
    let limitedResponse: Response | undefined;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await request(app)
        .post("/api/v1/auth/login")
        .set("Origin", env.WEB_ORIGIN)
        .send({});
      if (response.status === 429) {
        limitedResponse = response;
        break;
      }
    }

    assert.ok(limitedResponse);
    assert.equal(limitedResponse.body.error.code, "RATE_LIMITED");
    assert.ok(limitedResponse.headers["retry-after"]);
  });
});
