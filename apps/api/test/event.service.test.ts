import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { WeddingSide } from "@make-my-marriage/shared";
import { EventService } from "../src/modules/events/event.service.js";
import type { EventRecord, EventRepository, EventWriteRecord } from "../src/modules/events/event.repository.js";
import { RequestValidationError } from "../src/shared/errors.js";

const baseRecord: EventRecord = {
  id: crypto.randomUUID(),
  weddingId: crypto.randomUUID(),
  name: "Ceremony",
  description: null,
  side: "BOTH",
  eventDate: new Date("2027-01-20T00:00:00.000Z"),
  startTime: new Date("1970-01-01T10:00:00.000Z"),
  endTime: new Date("1970-01-01T12:00:00.000Z"),
  venueName: null,
  address: null,
  createdAt: new Date("2026-09-23T00:00:00.000Z"),
  updatedAt: new Date("2026-09-23T00:00:00.000Z"),
};

class FakeEventRepository implements EventRepository {
  record: EventRecord | null = baseRecord;
  incompatibleTasks = false;
  createdTasks: unknown[] = [];
  lastScope?: { weddingId: string; eventId: string };
  async create(input: EventWriteRecord & { createdByUserId: string }, tasks: unknown[] = []) { this.createdTasks = tasks; return { ...baseRecord, ...input }; }
  async list(_weddingId: string, _side?: WeddingSide) { return this.record ? [this.record] : []; }
  async find(weddingId: string, eventId: string) { this.lastScope = { weddingId, eventId }; return this.record; }
  async update(weddingId: string, eventId: string, input: EventWriteRecord) {
    this.lastScope = { weddingId, eventId };
    return { ...baseRecord, ...input, weddingId };
  }
  async hasIncompatibleTasks() { return this.incompatibleTasks; }
}

describe("EventService", () => {
  it("enforces single-side wedding rules", async () => {
    const service = new EventService(new FakeEventRepository());
    await assert.rejects(() => service.create(baseRecord.weddingId, "BRIDE_SIDE", crypto.randomUUID(), { name: "Wrong side", side: "GROOM" }), RequestValidationError);
    const created = await service.create(baseRecord.weddingId, "BRIDE_SIDE", crypto.randomUUID(), { name: "Bride event", side: "BRIDE" });
    assert.equal(created.side, "BRIDE");
  });

  it("validates partial updates against the complete saved schedule", async () => {
    const repository = new FakeEventRepository();
    const service = new EventService(repository);
    await assert.rejects(() => service.update(baseRecord.weddingId, baseRecord.id, "JOINT", { eventDate: null }), RequestValidationError);
    const updated = await service.update(baseRecord.weddingId, baseRecord.id, "JOINT", { name: "Updated ceremony" });
    assert.equal(updated.name, "Updated ceremony");
    assert.deepEqual(repository.lastScope, { weddingId: baseRecord.weddingId, eventId: baseRecord.id });
  });

  it("creates compatible draft Tasks atomically through the repository", async () => {
    const repository = new FakeEventRepository();
    const service = new EventService(repository);
    await service.create(baseRecord.weddingId, "JOINT", crypto.randomUUID(), {
      name: "Joint event",
      side: "BOTH",
      tasks: [{ name: "Bride task", side: "BRIDE" }, { name: "Shared task", side: "BOTH", dueDate: "2027-01-10" }],
    });
    assert.equal(repository.createdTasks.length, 2);
    await assert.rejects(() => service.create(baseRecord.weddingId, "JOINT", crypto.randomUUID(), {
      name: "Bride event",
      side: "BRIDE",
      tasks: [{ name: "Wrong task", side: "GROOM" }],
    }), RequestValidationError);
  });

  it("rejects an Event Side change while linked Tasks are incompatible", async () => {
    const repository = new FakeEventRepository();
    repository.incompatibleTasks = true;
    const service = new EventService(repository);
    await assert.rejects(
      () => service.update(baseRecord.weddingId, baseRecord.id, "JOINT", { side: "BRIDE" }),
      (error: unknown) => error instanceof Error && error.name === "EventSideTaskConflictError",
    );
  });
});
