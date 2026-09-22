import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request, { type Response } from "supertest";
import { configureTestDatabaseEnvironment } from "../src/config/test-database.js";
import { hashVerificationToken } from "../src/modules/auth/email-verification.js";
import type { SendVerificationEmailInput, VerificationEmailSender } from "../src/modules/auth/verification-email.sender.js";

configureTestDatabaseEnvironment();

const [{ app }, { prisma }, { env }, { setVerificationEmailSenderForTests }] = await Promise.all([
  import("../src/app.js"),
  import("../src/config/database.js"),
  import("../src/config/env.js"),
  import("../src/modules/auth/auth.dependencies.js"),
]);

class FakeVerificationEmailSender implements VerificationEmailSender {
  sent: SendVerificationEmailInput[] = [];
  failingEmails = new Set<string>();

  async send(input: SendVerificationEmailInput): Promise<void> {
    if (this.failingEmails.has(input.email)) throw new Error("Fake delivery failure");
    this.sent.push(input);
  }

  latestToken(email: string): string {
    const message = [...this.sent].reverse().find((item) => item.email === email);
    assert.ok(message);
    return message.rawToken;
  }
}

const emailSender = new FakeVerificationEmailSender();
const restoreEmailSender = setVerificationEmailSenderForTests(emailSender);
const emailPrefix = `verification-test-${Date.now()}`;
const password = "A secure verification password 123";

function register(email: string) {
  return request(app)
    .post("/api/v1/auth/register")
    .send({ firstName: "Ahamed", lastName: "Mohamed", email, password });
}

describe("email verification", { concurrency: false }, () => {
  before(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
  });

  after(async () => {
    restoreEmailSender();
    await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
    await prisma.$disconnect();
  });

  it("registers generically, stores only a hash, verifies once, and then permits login", async () => {
    const email = `${emailPrefix}-success@example.com`;
    const registration = await register(email).expect(202);
    assert.equal(registration.body.data.message.includes("created"), false);
    assert.equal(registration.body.data.message.includes("sent"), false);

    const rawToken = emailSender.latestToken(email);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const storedToken = await prisma.emailVerificationToken.findUniqueOrThrow({ where: { userId: user.id } });
    assert.equal(storedToken.tokenHash, hashVerificationToken(rawToken));
    assert.notEqual(storedToken.tokenHash, rawToken);
    await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", env.WEB_ORIGIN)
      .send({ email, password })
      .expect(403);

    await request(app).post("/api/v1/auth/verify-email").send({ token: rawToken }).expect(200);
    const verifiedUser = await prisma.user.findUniqueOrThrow({ where: { email } });
    const consumedToken = await prisma.emailVerificationToken.findUniqueOrThrow({ where: { userId: user.id } });
    assert.ok(verifiedUser.emailVerifiedAt);
    assert.ok(consumedToken.usedAt);
    await request(app)
      .post("/api/v1/auth/login")
      .set("Origin", env.WEB_ORIGIN)
      .send({ email, password })
      .expect(200);
    await request(app).post("/api/v1/auth/verify-email").send({ token: rawToken }).expect(400);
  });

  it("rejects expired tokens", async () => {
    const email = `${emailPrefix}-expired@example.com`;
    await register(email).expect(202);
    const rawToken = emailSender.latestToken(email);
    await prisma.emailVerificationToken.update({
      where: { tokenHash: hashVerificationToken(rawToken) },
      data: { expiresAt: new Date(Date.now() - 1_000) },
    });

    const response = await request(app).post("/api/v1/auth/verify-email").send({ token: rawToken }).expect(400);
    assert.equal(response.body.error.code, "INVALID_OR_EXPIRED_VERIFICATION_TOKEN");
  });

  it("invalidates the previous link when resending", async () => {
    const email = `${emailPrefix}-resend@example.com`;
    await register(email).expect(202);
    const originalToken = emailSender.latestToken(email);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await prisma.emailVerificationToken.update({
      where: { userId: user.id },
      data: { createdAt: new Date(Date.now() - 61_000) },
    });

    await request(app).post("/api/v1/auth/resend-verification").send({ email }).expect(200);
    const replacementToken = emailSender.latestToken(email);
    assert.notEqual(replacementToken, originalToken);
    await request(app).post("/api/v1/auth/verify-email").send({ token: originalToken }).expect(400);
    await request(app).post("/api/v1/auth/verify-email").send({ token: replacementToken }).expect(200);
  });

  it("uses the same resend response for missing and verified accounts", async () => {
    const verifiedEmail = `${emailPrefix}-success@example.com`;
    const missing = await request(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: `${emailPrefix}-missing@example.com` })
      .expect(200);
    const verified = await request(app)
      .post("/api/v1/auth/resend-verification")
      .send({ email: verifiedEmail })
      .expect(200);
    assert.deepEqual(missing.body, verified.body);
  });

  it("allows immediate resend recovery after delivery failure", async () => {
    const email = `${emailPrefix}-delivery-failure@example.com`;
    emailSender.failingEmails.add(email);
    await register(email).expect(202);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    assert.equal(await prisma.emailVerificationToken.count({ where: { userId: user.id } }), 0);

    emailSender.failingEmails.delete(email);
    await request(app).post("/api/v1/auth/resend-verification").send({ email }).expect(200);
    assert.ok(emailSender.latestToken(email));
    assert.equal(await prisma.emailVerificationToken.count({ where: { userId: user.id } }), 1);
  });

  it("allows only one concurrent token consumer", async () => {
    const email = `${emailPrefix}-concurrent@example.com`;
    await register(email).expect(202);
    const token = emailSender.latestToken(email);
    const responses = await Promise.all([
      request(app).post("/api/v1/auth/verify-email").send({ token }),
      request(app).post("/api/v1/auth/verify-email").send({ token }),
    ]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 400]);
  });

  it("rate-limits verification and resend attempts", async () => {
    let verifyLimited: Response | undefined;
    for (let attempt = 0; attempt < 25; attempt += 1) {
      const response = await request(app)
        .post("/api/v1/auth/verify-email")
        .send({ token: "z".repeat(43) });
      if (response.status === 429) {
        verifyLimited = response;
        break;
      }
    }
    assert.equal(verifyLimited?.body.error.code, "RATE_LIMITED");

    let resendLimited: Response | undefined;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await request(app)
        .post("/api/v1/auth/resend-verification")
        .send({ email: `${emailPrefix}-rate-${attempt}@example.com` });
      if (response.status === 429) {
        resendLimited = response;
        break;
      }
    }
    assert.equal(resendLimited?.body.error.code, "RATE_LIMITED");
  });
});
