import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TaskService } from "../src/modules/tasks/task.service.js";
import type { TaskListFilters, TaskRecord, TaskRepository, TaskUpdateRecord, TaskWriteRecord } from "../src/modules/tasks/task.repository.js";
import { EventNotFoundError, RequestValidationError, TaskNotFoundError } from "../src/shared/errors.js";

const baseTask: TaskRecord = {
  id: crypto.randomUUID(),
  weddingId: crypto.randomUUID(),
  eventId: null,
  name: "Book venue",
  description: null,
  side: "BOTH",
  dueDate: null,
  status: "TO_DO",
  completedAt: null,
  createdAt: new Date("2026-09-24T00:00:00.000Z"),
  updatedAt: new Date("2026-09-24T00:00:00.000Z"),
};

class FakeTaskRepository implements TaskRepository {
  record: TaskRecord | null = baseTask;
  eventSide: "BRIDE" | "GROOM" | "BOTH" | null = "BOTH";
  lastFilters?: TaskListFilters;
  async create(input: TaskWriteRecord & { createdByUserId: string }) { return { ...baseTask, ...input }; }
  async list(_weddingId: string, filters: TaskListFilters) { this.lastFilters = filters; return { records: this.record ? [this.record] : [], total: this.record ? 1 : 0 }; }
  async find() { return this.record; }
  async findEventSide() { return this.eventSide; }
  async update(_weddingId: string, _taskId: string, input: TaskUpdateRecord) { return { ...baseTask, ...input, updatedAt: new Date() }; }
  async delete() { return this.record !== null; }
}

describe("TaskService", () => {
  it("enforces wedding and linked Event side rules", async () => {
    const repository = new FakeTaskRepository();
    const service = new TaskService(repository);
    await assert.rejects(() => service.create(baseTask.weddingId, "BRIDE_SIDE", crypto.randomUUID(), { name: "Wrong", side: "GROOM" }), RequestValidationError);
    repository.eventSide = "BRIDE";
    await assert.rejects(() => service.create(baseTask.weddingId, "JOINT", crypto.randomUUID(), { name: "Wrong", side: "BOTH", eventId: crypto.randomUUID() }), RequestValidationError);
    repository.eventSide = null;
    await assert.rejects(() => service.create(baseTask.weddingId, "JOINT", crypto.randomUUID(), { name: "Missing Event", side: "BRIDE", eventId: crypto.randomUUID() }), EventNotFoundError);
  });

  it("records completion and clears it when reopening", async () => {
    const repository = new FakeTaskRepository();
    const service = new TaskService(repository);
    const completed = await service.update(baseTask.weddingId, baseTask.id, "JOINT", { status: "COMPLETED" });
    assert.equal(completed.status, "COMPLETED");
    assert.ok(completed.completedAt);
    repository.record = { ...baseTask, status: "COMPLETED", completedAt: new Date() };
    const reopened = await service.update(baseTask.weddingId, baseTask.id, "JOINT", { status: "TO_DO" });
    assert.equal(reopened.completedAt, null);
  });

  it("uses wedding-scoped not-found behavior", async () => {
    const repository = new FakeTaskRepository();
    repository.record = null;
    const service = new TaskService(repository);
    await assert.rejects(() => service.get(baseTask.weddingId, baseTask.id), TaskNotFoundError);
    await assert.rejects(() => service.delete(baseTask.weddingId, baseTask.id), TaskNotFoundError);
  });
});
