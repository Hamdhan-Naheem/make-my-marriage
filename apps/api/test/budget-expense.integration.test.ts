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

const emailPrefix = `finance-test-${Date.now()}`;
const ownerEmail = `${emailPrefix}-owner@example.com`;
const otherEmail = `${emailPrefix}-other@example.com`;
const password = "A secure finance test password";
let ownerId: string;
let otherId: string;
let weddingId: string;
let independentWeddingId: string;
let otherWeddingId: string;
let ownerCookies: string;
let otherCookies: string;
let bothEventId: string;
let groomEventId: string;
let expenseId: string;

function cookiesFrom(response: Response): string {
  const header = response.headers["set-cookie"];
  const values = Array.isArray(header) ? header : typeof header === "string" ? [header] : [];
  return values.map((cookie) => cookie.split(";", 1)[0]).join("; ");
}

async function createVerifiedUser(email: string) {
  return prisma.user.create({
    data: {
      email,
      firstName: "Finance",
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

async function createWedding(name: string, userId: string) {
  return prisma.wedding.create({
    data: {
      name,
      brideName: "Bride",
      groomName: "Groom",
      managementType: "JOINT",
      createdByUserId: userId,
      members: { create: { userId, role: "OWNER", side: "BOTH" } },
    },
  });
}

function write(method: "post" | "patch" | "delete", path: string, cookies = ownerCookies) {
  return request(app)[method](path).set("Origin", env.WEB_ORIGIN).set("Cookie", cookies);
}

describe("Budget and Expense backend", { concurrency: false }, () => {
  before(async () => {
    await prisma.expense.deleteMany({ where: { createdBy: { email: { startsWith: emailPrefix } } } });
    await prisma.task.deleteMany({ where: { createdBy: { email: { startsWith: emailPrefix } } } });
    await prisma.event.deleteMany({ where: { createdBy: { email: { startsWith: emailPrefix } } } });
    await prisma.wedding.deleteMany({ where: { createdBy: { email: { startsWith: emailPrefix } } } });
    await prisma.user.deleteMany({ where: { email: { startsWith: emailPrefix } } });
    const [owner, other] = await Promise.all([createVerifiedUser(ownerEmail), createVerifiedUser(otherEmail)]);
    ownerId = owner.id;
    otherId = other.id;
    const [wedding, independentWedding, otherWedding] = await Promise.all([
      createWedding("Finance Wedding", ownerId),
      createWedding("Independent Budgets Wedding", ownerId),
      createWedding("Other Finance Wedding", otherId),
    ]);
    weddingId = wedding.id;
    independentWeddingId = independentWedding.id;
    otherWeddingId = otherWedding.id;
    await prisma.weddingMember.create({
      data: { weddingId, userId: otherId, role: "ADMIN", side: "BOTH" },
    });
    [ownerCookies, otherCookies] = await Promise.all([login(ownerEmail), login(otherEmail)]);
  });

  after(async () => {
    const ids = [weddingId, independentWeddingId, otherWeddingId];
    await prisma.expense.deleteMany({ where: { weddingId: { in: ids } } });
    await prisma.task.deleteMany({ where: { weddingId: { in: ids } } });
    await prisma.event.deleteMany({ where: { weddingId: { in: ids } } });
    await prisma.wedding.deleteMany({ where: { id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerId, otherId] } } });
    await prisma.$disconnect();
  });

  it("requires active Owner access and a configured currency", async () => {
    await request(app).get(`/api/v1/weddings/${weddingId}/expenses`).expect(401);
    const forbidden = await request(app).get(`/api/v1/weddings/${weddingId}/expenses`).set("Cookie", otherCookies).expect(403);
    assert.equal(forbidden.body.error.code, "EXPENSES_OWNER_ACCESS_REQUIRED");

    const noCurrency = await write("post", `/api/v1/weddings/${weddingId}/expenses`)
      .send({ name: "Deposit", amount: "10.00", side: "BOTH" }).expect(409);
    assert.equal(noCurrency.body.error.code, "FINANCIAL_CURRENCY_REQUIRED");
  });

  it("configures currency and an overall budget atomically with exact decimal strings", async () => {
    const response = await write("patch", `/api/v1/weddings/${weddingId}`)
      .send({ currency: "USD", budgetAmount: "100.00" }).expect(200);
    assert.equal(response.body.data.currency, "USD");
    assert.equal(response.body.data.budgetAmount, "100.00");

    for (const invalid of ["1.001", "-1", "1e2", "1,000", "10000000000000000.00"]) {
      await write("patch", `/api/v1/weddings/${weddingId}`).send({ budgetAmount: invalid }).expect(400);
    }
    await write("patch", `/api/v1/weddings/${weddingId}`).send({ currency: "EUR" }).expect(400);
  });

  it("enforces Event allocations and allows independent Event budgets without an overall budget", async () => {
    const first = await write("post", `/api/v1/weddings/${weddingId}/events`)
      .send({ name: "Joint Ceremony", side: "BOTH", budgetAmount: "60.00" }).expect(201);
    bothEventId = first.body.data.id;
    assert.equal(first.body.data.budgetAmount, "60.00");

    const exceeded = await write("post", `/api/v1/weddings/${weddingId}/events`)
      .send({ name: "Too Much", side: "BOTH", budgetAmount: "50.00" }).expect(409);
    assert.equal(exceeded.body.error.code, "EVENT_BUDGET_ALLOCATION_EXCEEDED");

    await write("patch", `/api/v1/weddings/${independentWeddingId}`).send({ currency: "AUD" }).expect(200);
    const independent = await write("post", `/api/v1/weddings/${independentWeddingId}/events`)
      .send({ name: "Independent Event", side: "BOTH", budgetAmount: "500.50" }).expect(201);
    assert.equal(independent.body.data.budgetAmount, "500.50");
  });

  it("creates Wedding-wide and Event Expenses, enforces side compatibility, and permits over-budget spending", async () => {
    const groomEvent = await write("post", `/api/v1/weddings/${weddingId}/events`)
      .send({ name: "Groom Event", side: "GROOM", budgetAmount: "40.00" }).expect(201);
    groomEventId = groomEvent.body.data.id;

    await write("post", `/api/v1/weddings/${weddingId}/expenses`).send({
      name: "Wrong side", amount: "1.00", side: "BRIDE", eventId: groomEventId,
    }).expect(400);

    const weddingWide = await write("post", `/api/v1/weddings/${weddingId}/expenses`).send({
      name: "Wedding-wide", amount: "70.00", side: "BRIDE", category: "Venue", expenseDate: "2026-12-01",
    }).expect(201);
    expenseId = weddingWide.body.data.id;
    assert.equal(weddingWide.body.data.amount, "70.00");

    await write("post", `/api/v1/weddings/${weddingId}/expenses`).send({
      name: "Event expense", amount: "50.00", side: "BOTH", eventId: bothEventId,
    }).expect(201);
    const overBudget = await write("post", `/api/v1/weddings/${weddingId}/expenses`).send({
      name: "Allowed overage", amount: "20.50", side: "BOTH", eventId: bothEventId,
    }).expect(201);
    assert.equal(overBudget.body.data.amount, "20.50");

    const summary = await request(app).get(`/api/v1/weddings/${weddingId}/budget-summary`).set("Cookie", ownerCookies).expect(200);
    assert.equal(summary.body.data.overall.spentAmount, "140.50");
    assert.equal(summary.body.data.overall.weddingWideSpentAmount, "70.00");
    assert.equal(summary.body.data.overall.isOverBudget, true);
    assert.equal(summary.body.data.overall.overByAmount, "40.50");
    const event = summary.body.data.events.find((item: { eventId: string }) => item.eventId === bothEventId);
    assert.equal(event.spentAmount, "70.50");
    assert.equal(event.isOverBudget, true);
    assert.equal(event.overByAmount, "10.50");
  });

  it("supports scoped CRUD, filters, pagination, and strict unsupported-field rejection", async () => {
    const list = await request(app)
      .get(`/api/v1/weddings/${weddingId}/expenses?eventId=none&side=BRIDE&category=venue&page=1&limit=1`)
      .set("Cookie", ownerCookies).expect(200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.meta.total, 1);

    const updated = await write("patch", `/api/v1/weddings/${weddingId}/expenses/${expenseId}`)
      .send({ amount: "70.25", description: "Updated" }).expect(200);
    assert.equal(updated.body.data.amount, "70.25");
    assert.equal(updated.body.data.description, "Updated");

    await write("patch", `/api/v1/weddings/${weddingId}/expenses/${expenseId}`)
      .send({ eventId: groomEventId, side: "BRIDE" }).expect(400);
    await write("post", `/api/v1/weddings/${weddingId}/expenses`)
      .send({ name: "Unsupported", amount: "1.00", side: "BOTH", vendorId: crypto.randomUUID() }).expect(400);
    await request(app).get(`/api/v1/weddings/${otherWeddingId}/expenses/${expenseId}`).set("Cookie", otherCookies).expect(404);

    await write("delete", `/api/v1/weddings/${weddingId}/expenses/${expenseId}`).expect(204);
    await request(app).get(`/api/v1/weddings/${weddingId}/expenses/${expenseId}`).set("Cookie", ownerCookies).expect(404);
  });

  it("locks currency, validates overall budget lowering, and allows clearing it without changing Event budgets", async () => {
    const locked = await write("patch", `/api/v1/weddings/${weddingId}`).send({ currency: "SGD" }).expect(409);
    assert.equal(locked.body.error.code, "CURRENCY_CHANGE_LOCKED");

    const tooLow = await write("patch", `/api/v1/weddings/${weddingId}`).send({ budgetAmount: "99.99" }).expect(409);
    assert.equal(tooLow.body.error.code, "OVERALL_BUDGET_BELOW_EVENT_ALLOCATIONS");

    const cleared = await write("patch", `/api/v1/weddings/${weddingId}`).send({ budgetAmount: null }).expect(200);
    assert.equal(cleared.body.data.budgetAmount, null);
    const events = await request(app).get(`/api/v1/weddings/${weddingId}/events`).set("Cookie", ownerCookies).expect(200);
    assert.equal(events.body.data.find((event: { id: string }) => event.id === bothEventId).budgetAmount, "60.00");
  });

  it("rejects an Event Side change that would invalidate a linked Expense", async () => {
    await write("post", `/api/v1/weddings/${weddingId}/expenses`).send({
      name: "Groom linked", amount: "5.00", side: "GROOM", eventId: groomEventId,
    }).expect(201);
    const conflict = await write("patch", `/api/v1/weddings/${weddingId}/events/${groomEventId}`)
      .send({ side: "BRIDE" }).expect(409);
    assert.equal(conflict.body.error.code, "EVENT_SIDE_EXPENSE_CONFLICT");
  });
});
