import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import * as argon2 from "argon2";
import request from "supertest";
import { configureTestDatabaseEnvironment } from "../src/config/test-database.js";
import type { SendVerificationEmailInput, VerificationEmailSender } from "../src/modules/auth/verification-email.sender.js";

configureTestDatabaseEnvironment();

const [{ app }, { prisma }, { setVerificationEmailSenderForTests }] = await Promise.all([
  import("../src/app.js"),
  import("../src/config/database.js"),
  import("../src/modules/auth/auth.dependencies.js"),
]);

class FakeVerificationEmailSender implements VerificationEmailSender {
  sent: SendVerificationEmailInput[] = [];
  async send(input: SendVerificationEmailInput): Promise<void> { this.sent.push(input); }
}

const emailSender = new FakeVerificationEmailSender();
const restoreEmailSender = setVerificationEmailSenderForTests(emailSender);

const emailPrefix = `signup-test-${Date.now()}`;

function registrationBody(email: string, password = "A secure password 123") {
  return {
    firstName: "Ahamed",
    lastName: "Mohamed",
    email,
    password,
  };
}

describe("POST /api/v1/auth/register", { concurrency: false }, () => {
  before(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
  });

  after(async () => {
    restoreEmailSender();
    await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
    await prisma.$disconnect();
  });

  it("keeps the health endpoint unchanged", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);

    assert.deepEqual(response.body, {
      success: true,
      data: { status: "ok", service: "make-my-marriage-api" },
    });
  });

  it("creates an unverified user with normalized email and an exact-password Argon2id hash", async () => {
    const email = `${emailPrefix}-valid@Example.COM`;
    const normalizedEmail = email.toLowerCase();
    const password = "  Exact Unicode passphrase 🔐  ";
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registrationBody(email, password))
      .expect(202);

    assert.deepEqual(response.body, {
      success: true,
      data: {
        message: "If this email can be registered, use the verification message to continue. If it does not arrive, request a new link.",
      },
    });
    assert.equal(JSON.stringify(response.body).includes("password"), false);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: normalizedEmail } });
    assert.equal(user.emailVerifiedAt, null);
    assert.match(user.passwordHash, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    assert.equal(await argon2.verify(user.passwordHash, password), true);
    assert.equal(await argon2.verify(user.passwordHash, password.trim()), false);
    assert.equal(await prisma.session.count({ where: { userId: user.id } }), 0);
    const verificationToken = await prisma.emailVerificationToken.findUniqueOrThrow({ where: { userId: user.id } });
    const sent = emailSender.sent.find((email) => email.email === normalizedEmail);
    assert.ok(sent);
    assert.match(verificationToken.tokenHash, /^[a-f0-9]{64}$/);
    assert.equal(JSON.stringify(verificationToken).includes(sent.rawToken), false);
  });

  it("returns safe validation errors for invalid fields and unknown properties", async () => {
    const invalidResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({
        firstName: "",
        lastName: "x".repeat(101),
        email: "not-an-email",
        password: "too short",
      })
      .expect(400);

    assert.equal(invalidResponse.body.success, false);
    assert.equal(invalidResponse.body.error.code, "VALIDATION_ERROR");
    assert.equal(JSON.stringify(invalidResponse.body).includes("too short"), false);

    const unknownResponse = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...registrationBody(`${emailPrefix}-unknown@example.com`), role: "OWNER" })
      .expect(400);

    assert.equal(unknownResponse.body.error.code, "VALIDATION_ERROR");
    assert.deepEqual(unknownResponse.body.error.fields._form, ["Request contains unsupported fields."]);
  });

  it("rejects request bodies above the configured limit", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...registrationBody(`${emailPrefix}-oversized@example.com`), firstName: "x".repeat(110_000) })
      .expect(413);

    assert.deepEqual(response.body, {
      success: false,
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large.",
      },
    });
  });

  it("returns the same honest generic response for a duplicate normalized email", async () => {
    const email = `${emailPrefix}-duplicate@example.com`;

    const created = await request(app).post("/api/v1/auth/register").send(registrationBody(email)).expect(202);
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registrationBody(email.toUpperCase()))
      .expect(202);

    assert.deepEqual(response.body, created.body);
    assert.equal(response.body.data.message.includes("created"), false);
    assert.equal(response.body.data.message.includes("sent"), false);
    assert.equal(await prisma.user.count({ where: { email } }), 1);
  });

  it("allows exactly one of two concurrent registrations for the same email", async () => {
    const email = `${emailPrefix}-concurrent@example.com`;
    const responses = await Promise.all([
      request(app).post("/api/v1/auth/register").send(registrationBody(email)),
      request(app).post("/api/v1/auth/register").send(registrationBody(email.toUpperCase())),
    ]);

    assert.deepEqual(responses.map((response) => response.status).sort(), [202, 202]);
    assert.equal(await prisma.user.count({ where: { email } }), 1);
    assert.equal(emailSender.sent.filter((message) => message.email === email).length, 1);
  });

  it("rate-limits repeated registration attempts before hashing", async () => {
    let limitedResponse: request.Response | undefined;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await request(app).post("/api/v1/auth/register").send({});
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
