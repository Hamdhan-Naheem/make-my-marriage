import assert from "node:assert/strict";
import test from "node:test";
import type { WeddingEvent } from "@make-my-marriage/shared";
import { createTaskFormSchema, taskFormSchema, taskSidesFor } from "./task-schema";

const brideEvent: WeddingEvent = {
  id: crypto.randomUUID(), weddingId: crypto.randomUUID(), name: "Bride event", description: null, side: "BRIDE",
  eventDate: null, startTime: null, endTime: null, venueName: null, address: null,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
};

test("validates required Task fields and real calendar dates", () => {
  assert.equal(taskFormSchema.safeParse({ name: "Book venue", description: "", side: "BOTH", dueDate: "", eventId: "" }).success, true);
  assert.equal(taskFormSchema.safeParse({ name: "", description: "", side: "BOTH", dueDate: "2027-02-31", eventId: "" }).success, false);
});

test("derives approved Task Side choices", () => {
  assert.deepEqual(taskSidesFor("BRIDE_SIDE"), ["BRIDE"]);
  assert.deepEqual(taskSidesFor("GROOM_SIDE"), ["GROOM"]);
  assert.deepEqual(taskSidesFor("JOINT", "BRIDE"), ["BRIDE"]);
  assert.deepEqual(taskSidesFor("JOINT", "GROOM"), ["GROOM"]);
  assert.deepEqual(taskSidesFor("JOINT", "BOTH"), ["BRIDE", "GROOM", "BOTH"]);
});

test("rejects cross-wedding Event IDs and incompatible Event-linked sides", () => {
  const schema = createTaskFormSchema("JOINT", [brideEvent]);
  const base = { name: "Task", description: "", dueDate: "", side: "BRIDE" as const };
  assert.equal(schema.safeParse({ ...base, eventId: brideEvent.id }).success, true);
  assert.equal(schema.safeParse({ ...base, side: "BOTH", eventId: brideEvent.id }).success, false);
  assert.equal(schema.safeParse({ ...base, eventId: crypto.randomUUID() }).success, false);
});
