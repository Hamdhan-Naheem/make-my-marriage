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

const emailPrefix = `task-test-${Date.now()}`;
const password = "A secure task test password";
let ownerId: string;
let otherId: string;
let ownerCookies: string;
let otherCookies: string;
let brideWeddingId: string;
let jointWeddingId: string;
let otherWeddingId: string;
let brideEventId: string;
let bothEventId: string;
let savedTaskId: string;

function cookiesFrom(response: Response): string {
  const header = response.headers["set-cookie"];
  const values = Array.isArray(header) ? header : typeof header === "string" ? [header] : [];
  return values.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

async function createUser(email: string) {
  return prisma.user.create({ data: { email, firstName: "Task", lastName: "Tester", passwordHash: await argon2PasswordHasher.hash(password), emailVerifiedAt: new Date() } });
}

async function login(email: string) {
  return cookiesFrom(await request(app).post("/api/v1/auth/login").set("Origin", env.WEB_ORIGIN).send({ email, password }).expect(200));
}

async function createWedding(name: string, managementType: "BRIDE_SIDE" | "JOINT", userId: string, side: "BRIDE" | "BOTH") {
  return prisma.wedding.create({ data: { name, brideName: "Bride", groomName: "Groom", managementType, createdByUserId: userId, members: { create: { userId, role: "OWNER", side } } } });
}

describe("wedding-scoped Tasks", { concurrency: false }, () => {
  before(async () => {
    const owner = await createUser(`${emailPrefix}-owner@example.com`);
    const other = await createUser(`${emailPrefix}-other@example.com`);
    ownerId = owner.id;
    otherId = other.id;
    const brideWedding = await createWedding("Bride Tasks", "BRIDE_SIDE", ownerId, "BRIDE");
    const jointWedding = await createWedding("Joint Tasks", "JOINT", ownerId, "BOTH");
    const otherWedding = await createWedding("Other Tasks", "JOINT", otherId, "BOTH");
    brideWeddingId = brideWedding.id;
    jointWeddingId = jointWedding.id;
    otherWeddingId = otherWedding.id;
    await prisma.weddingMember.create({ data: { weddingId: jointWeddingId, userId: otherId, role: "ADMIN", side: "BOTH" } });
    const [brideEvent, bothEvent] = await Promise.all([
      prisma.event.create({ data: { weddingId: jointWeddingId, name: "Bride Event", side: "BRIDE", createdByUserId: ownerId } }),
      prisma.event.create({ data: { weddingId: jointWeddingId, name: "Both Event", side: "BOTH", createdByUserId: ownerId } }),
    ]);
    brideEventId = brideEvent.id;
    bothEventId = bothEvent.id;
    [ownerCookies, otherCookies] = await Promise.all([login(owner.email), login(other.email)]);
  });

  after(async () => {
    await prisma.task.deleteMany({ where: { weddingId: { in: [brideWeddingId, jointWeddingId, otherWeddingId] } } });
    await prisma.event.deleteMany({ where: { weddingId: { in: [brideWeddingId, jointWeddingId, otherWeddingId] } } });
    await prisma.wedding.deleteMany({ where: { id: { in: [brideWeddingId, jointWeddingId, otherWeddingId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
    await prisma.$disconnect();
  });

  it("requires authentication, a trusted write origin, and active Owner access", async () => {
    await request(app).get(`/api/v1/weddings/${jointWeddingId}/tasks`).expect(401);
    await request(app).post(`/api/v1/weddings/${jointWeddingId}/tasks`).set("Cookie", ownerCookies).send({ name: "No origin", side: "BOTH" }).expect(403);
    const forbidden = await request(app).get(`/api/v1/weddings/${jointWeddingId}/tasks`).set("Cookie", otherCookies).expect(403);
    assert.equal(forbidden.body.error.code, "TASKS_OWNER_ACCESS_REQUIRED");
  });

  it("creates wedding-wide and Event-linked Tasks with strict side compatibility", async () => {
    await request(app).post(`/api/v1/weddings/${brideWeddingId}/tasks`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Wrong side", side: "GROOM" }).expect(400);
    await request(app).post(`/api/v1/weddings/${jointWeddingId}/tasks`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Wrong linked side", side: "BOTH", eventId: brideEventId }).expect(400);
    await request(app).post(`/api/v1/weddings/${jointWeddingId}/tasks`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Cross wedding Event", side: "BOTH", eventId: crypto.randomUUID() }).expect(404);

    const created = await request(app).post(`/api/v1/weddings/${jointWeddingId}/tasks`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({
      name: "Confirm photographer", description: "Call and confirm", side: "BRIDE", eventId: brideEventId, dueDate: "2027-01-10",
    }).expect(201);
    savedTaskId = created.body.data.id;
    assert.equal(created.body.data.status, "TO_DO");
    assert.equal(created.body.data.completedAt, null);
  });

  it("lists, filters, gets, edits, completes, reopens, and isolates Tasks", async () => {
    const filtered = await request(app).get(`/api/v1/weddings/${jointWeddingId}/tasks?status=TO_DO&side=BRIDE&eventId=${brideEventId}`).set("Cookie", ownerCookies).expect(200);
    assert.ok(filtered.body.data.some((task: { id: string }) => task.id === savedTaskId));
    assert.deepEqual(filtered.body.meta, { page: 1, limit: 20, total: 1, totalPages: 1 });
    await request(app).get(`/api/v1/weddings/${brideWeddingId}/tasks/${savedTaskId}`).set("Cookie", ownerCookies).expect(404);
    await request(app).get(`/api/v1/weddings/${otherWeddingId}/tasks/${savedTaskId}`).set("Cookie", otherCookies).expect(404);

    const completed = await request(app).patch(`/api/v1/weddings/${jointWeddingId}/tasks/${savedTaskId}`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ status: "COMPLETED", eventId: bothEventId, side: "BOTH" }).expect(200);
    assert.equal(completed.body.data.status, "COMPLETED");
    assert.ok(completed.body.data.completedAt);
    const reopened = await request(app).patch(`/api/v1/weddings/${jointWeddingId}/tasks/${savedTaskId}`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ status: "TO_DO" }).expect(200);
    assert.equal(reopened.body.data.completedAt, null);
  });

  it("creates an Event and draft Tasks atomically and blocks incompatible Event Side changes", async () => {
    const beforeCount = await prisma.task.count({ where: { weddingId: jointWeddingId } });
    await request(app).post(`/api/v1/weddings/${jointWeddingId}/events`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Invalid draft", side: "BRIDE", tasks: [{ name: "Wrong task", side: "GROOM" }] }).expect(400);
    assert.equal(await prisma.task.count({ where: { weddingId: jointWeddingId } }), beforeCount);

    const event = await request(app).post(`/api/v1/weddings/${jointWeddingId}/events`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ name: "Event with tasks", side: "BOTH", tasks: [{ name: "Bride draft", side: "BRIDE" }, { name: "Shared draft", side: "BOTH" }] }).expect(201);
    assert.equal(await prisma.task.count({ where: { weddingId: jointWeddingId, eventId: event.body.data.id } }), 2);
    const conflict = await request(app).patch(`/api/v1/weddings/${jointWeddingId}/events/${event.body.data.id}`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).send({ side: "BRIDE" }).expect(409);
    assert.equal(conflict.body.error.code, "EVENT_SIDE_TASK_CONFLICT");
  });

  it("deletes a scoped Task and returns not found afterward", async () => {
    await request(app).delete(`/api/v1/weddings/${jointWeddingId}/tasks/${savedTaskId}`).set("Origin", env.WEB_ORIGIN).set("Cookie", ownerCookies).expect(204);
    await request(app).get(`/api/v1/weddings/${jointWeddingId}/tasks/${savedTaskId}`).set("Cookie", ownerCookies).expect(404);
  });
});
