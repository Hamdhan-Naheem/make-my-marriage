import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import * as argon2 from "argon2";
import request from "supertest";
import { configureTestDatabaseEnvironment } from "../src/config/test-database.js";

configureTestDatabaseEnvironment();

const [{ app }, { prisma }] = await Promise.all([
  import("../src/app.js"),
  import("../src/config/database.js"),
]);

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
      .expect(201);

    assert.deepEqual(response.body, {
      success: true,
      data: {
        message: "Account created. Email verification is required before sign-in.",
        verification: { required: true, emailSent: false },
      },
    });
    assert.equal(JSON.stringify(response.body).includes("password"), false);

    const user = await prisma.user.findUniqueOrThrow({ where: { email: normalizedEmail } });
    assert.equal(user.emailVerifiedAt, null);
    assert.match(user.passwordHash, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    assert.equal(await argon2.verify(user.passwordHash, password), true);
    assert.equal(await argon2.verify(user.passwordHash, password.trim()), false);
    assert.equal(await prisma.session.count({ where: { userId: user.id } }), 0);
    assert.equal(await prisma.emailVerificationToken.count({ where: { userId: user.id } }), 0);
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

  it("rejects a duplicate normalized email", async () => {
    const email = `${emailPrefix}-duplicate@example.com`;

    await request(app).post("/api/v1/auth/register").send(registrationBody(email)).expect(201);
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send(registrationBody(email.toUpperCase()))
      .expect(409);

    assert.deepEqual(response.body, {
      success: false,
      error: {
        code: "EMAIL_ALREADY_REGISTERED",
        message: "An account with this email already exists.",
      },
    });
    assert.equal(await prisma.user.count({ where: { email } }), 1);
  });

  it("allows exactly one of two concurrent registrations for the same email", async () => {
    const email = `${emailPrefix}-concurrent@example.com`;
    const responses = await Promise.all([
      request(app).post("/api/v1/auth/register").send(registrationBody(email)),
      request(app).post("/api/v1/auth/register").send(registrationBody(email.toUpperCase())),
    ]);

    assert.deepEqual(
      responses.map((response) => response.status).sort(),
      [201, 409],
    );
    assert.equal(await prisma.user.count({ where: { email } }), 1);
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
