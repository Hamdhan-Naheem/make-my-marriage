import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { getSriLankaTodayDate } from "@make-my-marriage/shared";
import request, { type Response } from "supertest";
import { configureTestDatabaseEnvironment } from "../src/config/test-database.js";
import { argon2PasswordHasher } from "../src/modules/auth/password.js";

configureTestDatabaseEnvironment();

const [{ app }, { prisma }, { env }] = await Promise.all([
  import("../src/app.js"),
  import("../src/config/database.js"),
  import("../src/config/env.js"),
]);

const emailPrefix = `wedding-test-${Date.now()}`;
const ownerEmail = `${emailPrefix}-owner@example.com`;
const otherEmail = `${emailPrefix}-other@example.com`;
const password = "A secure wedding test password";
const futureWeddingDate = (() => {
  const value = new Date(`${getSriLankaTodayDate()}T00:00:00.000Z`);
  value.setUTCFullYear(value.getUTCFullYear() + 1);
  return value.toISOString().slice(0, 10);
})();
let ownerId: string;
let otherId: string;
let ownerCookies: string;
let otherCookies: string;
let editableWeddingId: string;

function cookiesFrom(response: Response): string {
  const header = response.headers["set-cookie"];
  const values = Array.isArray(header) ? header : typeof header === "string" ? [header] : [];
  return values.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

function createBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Ahamed & Fathima Wedding",
    brideName: "Fathima",
    groomName: "Ahamed",
    managementType: "JOINT",
    mainWeddingDate: null,
    creatorSide: "GROOM",
    ...overrides,
  };
}

async function createVerifiedUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      firstName: "Wedding",
      lastName: "Tester",
      passwordHash: await argon2PasswordHasher.hash(password),
      emailVerifiedAt: new Date(),
    },
  });
}

async function login(email: string) {
  const response = await request(app).post("/api/v1/auth/login").set("Origin", env.WEB_ORIGIN).send({ email, password }).expect(200);
  return cookiesFrom(response);
}

describe("Wedding creation and membership isolation", { concurrency: false }, () => {
  before(async () => {
    await prisma.event.deleteMany({ where: { createdBy: { email: { startsWith: emailPrefix } } } });
    await prisma.wedding.deleteMany({ where: { createdBy: { email: { startsWith: emailPrefix } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
    const [owner, other] = await Promise.all([createVerifiedUser(ownerEmail), createVerifiedUser(otherEmail)]);
    ownerId = owner.id;
    otherId = other.id;
    [ownerCookies, otherCookies] = await Promise.all([login(ownerEmail), login(otherEmail)]);
  });

  after(async () => {
    await prisma.event.deleteMany({ where: { createdByUserId: { in: [ownerId, otherId] } } });
    await prisma.wedding.deleteMany({ where: { createdByUserId: { in: [ownerId, otherId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
    await prisma.$disconnect();
  });

  it("requires authentication and trusted Origin", async () => {
    await request(app).get("/api/v1/weddings").expect(401);
    await request(app).post("/api/v1/weddings").set("Cookie", ownerCookies).send(createBody()).expect(403);
  });

  it("rejects invalid side combinations and deferred financial fields", async () => {
    const side = await request(app).post("/api/v1/weddings").set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies)
      .send(createBody({ managementType: "BRIDE_SIDE", creatorSide: "GROOM" })).expect(400);
    assert.equal(side.body.error.code, "VALIDATION_ERROR");

    const financial = await request(app).post("/api/v1/weddings").set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies)
      .send(createBody({ budgetAmount: 5_000_000, currency: "LKR" })).expect(400);
    assert.equal(financial.body.error.code, "VALIDATION_ERROR");
  });

  it("atomically creates each wedding with one active Owner membership", async () => {
    for (const [managementType, creatorSide] of [["BRIDE_SIDE", "BRIDE"], ["GROOM_SIDE", "GROOM"], ["JOINT", "BOTH"]] as const) {
      const response = await request(app).post("/api/v1/weddings").set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies)
        .send(createBody({ name: `${managementType} Test`, managementType, creatorSide, mainWeddingDate: managementType === "JOINT" ? futureWeddingDate : null })).expect(201);
      assert.deepEqual(response.body.data.member, { role: "OWNER", side: creatorSide });
      assert.equal("budgetAmount" in response.body.data, false);
      assert.equal("currency" in response.body.data, false);

      const stored = await prisma.wedding.findUniqueOrThrow({ where: { id: response.body.data.id }, include: { members: true } });
      assert.equal(stored.createdByUserId, ownerId);
      assert.equal(stored.members.length, 1);
      assert.equal(stored.members[0]?.userId, ownerId);
      assert.equal(stored.members[0]?.role, "OWNER");
      assert.equal(stored.members[0]?.isActive, true);
      if (managementType === "JOINT") editableWeddingId = response.body.data.id as string;
    }
  });

  it("allows only an active Owner to edit names and set or clear the main date without changing Events", async () => {
    const event = await prisma.event.create({
      data: { weddingId: editableWeddingId, name: "Existing Event", side: "BOTH", eventDate: new Date(`${futureWeddingDate}T00:00:00.000Z`), createdByUserId: ownerId },
    });
    await prisma.weddingMember.create({ data: { weddingId: editableWeddingId, userId: otherId, role: "ADMIN", side: "BOTH" } });

    await request(app).patch(`/api/v1/weddings/${editableWeddingId}`).set("Cookie", ownerCookies).send({ name: "No Origin" }).expect(403);
    const forbidden = await request(app).patch(`/api/v1/weddings/${editableWeddingId}`).set("Origin", env.WEB_ORIGIN).set("Cookie", otherCookies).send({ name: "Admin Edit" }).expect(403);
    assert.equal(forbidden.body.error.code, "WEDDING_OWNER_ACCESS_REQUIRED");

    const updated = await request(app).patch(`/api/v1/weddings/${editableWeddingId}`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({
      name: "Updated Wedding", brideName: "Updated Bride", groomName: "Updated Groom", mainWeddingDate: futureWeddingDate,
    }).expect(200);
    assert.equal(updated.body.data.name, "Updated Wedding");
    assert.equal(updated.body.data.mainWeddingDate, futureWeddingDate);
    assert.equal(updated.body.data.managementType, "JOINT");

    await request(app).patch(`/api/v1/weddings/${editableWeddingId}`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ managementType: "BRIDE_SIDE" }).expect(400);
    const cleared = await request(app).patch(`/api/v1/weddings/${editableWeddingId}`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ mainWeddingDate: null }).expect(200);
    assert.equal(cleared.body.data.mainWeddingDate, null);
    assert.equal((await prisma.event.findUniqueOrThrow({ where: { id: event.id } })).eventDate?.toISOString().slice(0, 10), futureWeddingDate);

    await prisma.weddingMember.delete({ where: { weddingId_userId: { weddingId: editableWeddingId, userId: otherId } } });
  });

  it("lists only active memberships and protects wedding details", async () => {
    const otherWedding = await prisma.wedding.create({
      data: {
        name: "Other Family Wedding",
        brideName: "Other Bride",
        groomName: "Other Groom",
        managementType: "JOINT",
        createdByUserId: otherId,
        members: { create: { userId: otherId, role: "OWNER", side: "BOTH" } },
      },
    });

    const list = await request(app).get("/api/v1/weddings").set("Cookie", ownerCookies).expect(200);
    assert.ok(list.body.data.length >= 3);
    assert.equal(list.body.data.some((wedding: { id: string }) => wedding.id === otherWedding.id), false);
    assert.equal(JSON.stringify(list.body).includes("budgetAmount"), false);

    const otherList = await request(app).get("/api/v1/weddings").set("Cookie", otherCookies).expect(200);
    assert.deepEqual(otherList.body.data.map((wedding: { id: string }) => wedding.id), [otherWedding.id]);

    await request(app).get(`/api/v1/weddings/${otherWedding.id}`).set("Cookie", ownerCookies).expect(404);
    const ownId = list.body.data[0].id as string;
    const detail = await request(app).get(`/api/v1/weddings/${ownId}`).set("Cookie", ownerCookies).expect(200);
    assert.equal(detail.body.data.id, ownId);

    await prisma.weddingMember.update({ where: { weddingId_userId: { weddingId: ownId, userId: ownerId } }, data: { isActive: false } });
    await request(app).get(`/api/v1/weddings/${ownId}`).set("Cookie", ownerCookies).expect(404);
    const afterDeactivation = await request(app).get("/api/v1/weddings").set("Cookie", ownerCookies).expect(200);
    assert.equal(afterDeactivation.body.data.some((wedding: { id: string }) => wedding.id === ownId), false);
  });

  it("keeps the health endpoint unchanged", async () => {
    const response = await request(app).get("/api/v1/health").expect(200);
    assert.deepEqual(response.body, { success: true, data: { status: "ok", service: "make-my-marriage-api" } });
  });
});
