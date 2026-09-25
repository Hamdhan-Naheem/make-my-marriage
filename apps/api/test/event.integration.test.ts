import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import request, { type Response } from "supertest";
import { configureTestDatabaseEnvironment } from "../src/config/test-database.js";
import { argon2PasswordHasher } from "../src/modules/auth/password.js";

configureTestDatabaseEnvironment();

const [{ app }, { prisma }, { env }] = await Promise.all([
  import("../src/app.js"),
  import("../src/config/database.js"),
  import("../src/config/env.js"),
]);

const emailPrefix = `event-test-${Date.now()}`;
const ownerEmail = `${emailPrefix}-owner@example.com`;
const otherEmail = `${emailPrefix}-other@example.com`;
const password = "A secure event test password";
let ownerId: string;
let otherId: string;
let ownerCookies: string;
let otherCookies: string;
let brideWeddingId: string;
let groomWeddingId: string;
let jointWeddingId: string;
let otherWeddingId: string;
let scheduledEventId: string;

function cookiesFrom(response: Response): string {
  const header = response.headers["set-cookie"];
  const values = Array.isArray(header) ? header : typeof header === "string" ? [header] : [];
  return values.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

async function createVerifiedUser(email: string) {
  return prisma.user.create({ data: { email, firstName: "Event", lastName: "Tester", passwordHash: await argon2PasswordHasher.hash(password), emailVerifiedAt: new Date() } });
}

async function login(email: string) {
  return cookiesFrom(await request(app).post("/api/v1/auth/login").set("Origin", env.WEB_ORIGIN).send({ email, password }).expect(200));
}

async function createWedding(name: string, managementType: "BRIDE_SIDE" | "GROOM_SIDE" | "JOINT", userId: string, side: "BRIDE" | "GROOM" | "BOTH") {
  return prisma.wedding.create({
    data: { name, brideName: "Bride", groomName: "Groom", managementType, createdByUserId: userId, members: { create: { userId, role: "OWNER", side } } },
  });
}

describe("wedding-scoped Events", { concurrency: false }, () => {
  before(async () => {
    await prisma.event.deleteMany({ where: { createdBy: { email: { startsWith: emailPrefix } } } });
    await prisma.wedding.deleteMany({ where: { createdBy: { email: { startsWith: emailPrefix } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
    const [owner, other] = await Promise.all([createVerifiedUser(ownerEmail), createVerifiedUser(otherEmail)]);
    ownerId = owner.id;
    otherId = other.id;
    const [brideWedding, groomWedding, jointWedding, otherWedding] = await Promise.all([
      createWedding("Bride Wedding", "BRIDE_SIDE", ownerId, "BRIDE"),
      createWedding("Groom Wedding", "GROOM_SIDE", ownerId, "GROOM"),
      createWedding("Joint Wedding", "JOINT", ownerId, "BOTH"),
      createWedding("Other Wedding", "JOINT", otherId, "BOTH"),
    ]);
    brideWeddingId = brideWedding.id;
    groomWeddingId = groomWedding.id;
    jointWeddingId = jointWedding.id;
    otherWeddingId = otherWedding.id;
    await prisma.weddingMember.create({ data: { weddingId: jointWeddingId, userId: otherId, role: "ADMIN", side: "BOTH" } });
    [ownerCookies, otherCookies] = await Promise.all([login(ownerEmail), login(otherEmail)]);
  });

  after(async () => {
    await prisma.event.deleteMany({ where: { weddingId: { in: [brideWeddingId, groomWeddingId, jointWeddingId, otherWeddingId] } } });
    await prisma.wedding.deleteMany({ where: { id: { in: [brideWeddingId, groomWeddingId, jointWeddingId, otherWeddingId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
    await prisma.$disconnect();
  });

  it("requires authentication, trusted write origins, and an active Owner membership", async () => {
    await request(app).get(`/api/v1/weddings/${jointWeddingId}/events`).expect(401);
    await request(app).post(`/api/v1/weddings/${jointWeddingId}/events`).set("Cookie", ownerCookies).send({ name: "No origin", side: "BOTH" }).expect(403);
    const forbidden = await request(app).get(`/api/v1/weddings/${jointWeddingId}/events`).set("Cookie", otherCookies).expect(403);
    assert.equal(forbidden.body.error.code, "EVENTS_OWNER_ACCESS_REQUIRED");
  });

  it("enforces Bride, Groom, and Joint Event Side rules", async () => {
    await request(app).post(`/api/v1/weddings/${brideWeddingId}/events`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Wrong Bride Side", side: "GROOM" }).expect(400);
    await request(app).post(`/api/v1/weddings/${groomWeddingId}/events`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Wrong Groom Side", side: "BOTH" }).expect(400);
    const bride = await request(app).post(`/api/v1/weddings/${brideWeddingId}/events`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Bride Celebration", side: "BRIDE" }).expect(201);
    assert.equal(bride.body.data.side, "BRIDE");
    for (const side of ["BRIDE", "GROOM", "BOTH"]) {
      await request(app).post(`/api/v1/weddings/${jointWeddingId}/events`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: `${side} Event`, side }).expect(201);
    }
  });

  it("creates, lists, and filters saved Events with optional scheduling and location", async () => {
    const unscheduled = await request(app).post(`/api/v1/weddings/${jointWeddingId}/events`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Family Dinner", side: "BOTH" }).expect(201);
    assert.equal(unscheduled.body.data.eventDate, null);
    assert.equal(unscheduled.body.data.startTime, null);
    assert.equal(unscheduled.body.data.venueName, null);

    const scheduled = await request(app).post(`/api/v1/weddings/${jointWeddingId}/events`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({
      name: "Wedding Ceremony", description: "Main ceremony", side: "BRIDE", eventDate: "2027-01-20", startTime: "10:00", endTime: "13:30", venueName: "Grand Hall", address: "Colombo",
    }).expect(201);
    scheduledEventId = scheduled.body.data.id;
    assert.equal(scheduled.body.data.startTime, "10:00");

    const all = await request(app).get(`/api/v1/weddings/${jointWeddingId}/events`).set("Cookie", ownerCookies).expect(200);
    assert.ok(all.body.data.some((event: { id: string }) => event.id === scheduledEventId));
    const brideOnly = await request(app).get(`/api/v1/weddings/${jointWeddingId}/events?side=BRIDE`).set("Cookie", ownerCookies).expect(200);
    assert.ok(brideOnly.body.data.length > 0);
    assert.equal(brideOnly.body.data.every((event: { side: string }) => event.side === "BRIDE"), true);
  });

  it("rejects invalid scheduling and fields outside this milestone", async () => {
    for (const body of [
      { name: "Impossible Date", side: "BOTH", eventDate: "2027-02-31" },
      { name: "Time Without Date", side: "BOTH", startTime: "10:00" },
      { name: "Wrong Time Order", side: "BOTH", eventDate: "2027-01-20", startTime: "12:00", endTime: "11:00" },
      { name: "Budget Not Allowed", side: "BOTH", budgetAmount: 1000 },
    ]) {
      const response = await request(app).post(`/api/v1/weddings/${jointWeddingId}/events`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send(body).expect(400);
      assert.equal(response.body.error.code, "VALIDATION_ERROR");
    }
  });

  it("gets and edits only Events belonging to the selected wedding", async () => {
    const detail = await request(app).get(`/api/v1/weddings/${jointWeddingId}/events/${scheduledEventId}`).set("Cookie", ownerCookies).expect(200);
    assert.equal(detail.body.data.name, "Wedding Ceremony");

    const updated = await request(app).patch(`/api/v1/weddings/${jointWeddingId}/events/${scheduledEventId}`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Updated Ceremony", venueName: null }).expect(200);
    assert.equal(updated.body.data.name, "Updated Ceremony");
    assert.equal(updated.body.data.venueName, null);

    await request(app).patch(`/api/v1/weddings/${jointWeddingId}/events/${scheduledEventId}`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ eventDate: null }).expect(400);
    await request(app).get(`/api/v1/weddings/${brideWeddingId}/events/${scheduledEventId}`).set("Cookie", ownerCookies).expect(404);
    await request(app).get(`/api/v1/weddings/${otherWeddingId}/events/${scheduledEventId}`).set("Cookie", ownerCookies).expect(404);
  });
});
