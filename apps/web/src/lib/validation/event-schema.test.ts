import assert from "node:assert/strict";
import test from "node:test";
import { eventFormSchema, eventSideForWedding, enforceWeddingEventSide, type EventFormValues } from "./event-schema";

const validEvent: EventFormValues = {
  name: "Nikah ceremony",
  description: "",
  side: "BOTH",
  eventDate: "2027-01-20",
  startTime: "10:00",
  endTime: "13:30",
  venueName: "",
  address: "",
};

test("accepts a date without times and fully unscheduled events", () => {
  assert.equal(eventFormSchema.safeParse({ ...validEvent, startTime: "", endTime: "" }).success, true);
  assert.equal(eventFormSchema.safeParse({ ...validEvent, eventDate: "", startTime: "", endTime: "" }).success, true);
});

test("accepts real calendar dates and rejects impossible dates", () => {
  assert.equal(eventFormSchema.safeParse({ ...validEvent, eventDate: "2028-02-29" }).success, true);
  assert.equal(eventFormSchema.safeParse({ ...validEvent, eventDate: "2027-02-29" }).success, false);
  assert.equal(eventFormSchema.safeParse({ ...validEvent, eventDate: "2027-02-31" }).success, false);
});

test("rejects times without a date", () => {
  const result = eventFormSchema.safeParse({ ...validEvent, eventDate: "" });
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.issues.some((issue) => issue.path[0] === "eventDate"), true);
});

test("requires a start time before an end time", () => {
  const result = eventFormSchema.safeParse({ ...validEvent, startTime: "" });
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.issues.some((issue) => issue.path[0] === "startTime"), true);
});

test("enforces same-day end time ordering", () => {
  const result = eventFormSchema.safeParse({ ...validEvent, endTime: "09:59" });
  assert.equal(result.success, false);
  if (!result.success) assert.equal(result.error.issues.some((issue) => issue.path[0] === "endTime"), true);
});

test("maps fixed wedding types to their required Event side", () => {
  assert.equal(eventSideForWedding("BRIDE_SIDE"), "BRIDE");
  assert.equal(eventSideForWedding("GROOM_SIDE"), "GROOM");
  assert.equal(eventSideForWedding("JOINT"), undefined);
  assert.equal(enforceWeddingEventSide(validEvent, "BRIDE_SIDE").side, "BRIDE");
  assert.equal(enforceWeddingEventSide(validEvent, "GROOM_SIDE").side, "GROOM");
});
