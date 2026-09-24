import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RequestValidationError } from "../src/shared/errors.js";
import { parseCreateTaskRequest, parseTaskId, parseTaskListFilters, parseUpdateTaskRequest } from "../src/modules/tasks/task.schema.js";

describe("Task request validation", () => {
  it("accepts the approved create and update fields", () => {
    assert.deepEqual(parseCreateTaskRequest({ name: "Book venue", side: "BOTH" }), { name: "Book venue", side: "BOTH" });
    assert.deepEqual(parseUpdateTaskRequest({ status: "COMPLETED", eventId: null, dueDate: null }), { status: "COMPLETED", eventId: null, dueDate: null });
  });

  it("rejects impossible dates, empty updates, and unsupported fields", () => {
    assert.throws(() => parseCreateTaskRequest({ name: "Task", side: "BRIDE", dueDate: "2027-02-31" }), RequestValidationError);
    assert.throws(() => parseCreateTaskRequest({ name: "Task", side: "BRIDE", priority: "HIGH" }), RequestValidationError);
    assert.throws(() => parseUpdateTaskRequest({}), RequestValidationError);
  });

  it("validates identifiers and list filters", () => {
    const taskId = crypto.randomUUID();
    assert.equal(parseTaskId({ weddingId: crypto.randomUUID(), taskId }), taskId);
    assert.deepEqual(parseTaskListFilters({ status: "TO_DO", side: "GROOM", eventId: crypto.randomUUID() }).status, "TO_DO");
    assert.deepEqual(parseTaskListFilters({}), { page: 1, limit: 20 });
    assert.throws(() => parseTaskListFilters({ limit: "101" }), RequestValidationError);
    assert.throws(() => parseTaskListFilters({ reminder: "today" }), RequestValidationError);
  });
});
