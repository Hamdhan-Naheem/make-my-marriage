import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RequestValidationError } from "../src/shared/errors.js";
import { parseCreateEventRequest, parseEventId, parseEventListSide, parseUpdateEventRequest } from "../src/modules/events/event.schema.js";

const validEvent = {
  name: "Nikah",
  description: "Family ceremony",
  side: "BOTH",
  eventDate: "2028-02-29",
  startTime: "10:00",
  endTime: "12:00",
  venueName: "Celebration Hall",
  address: "Colombo",
};

describe("event request validation", () => {
  it("accepts scheduled and unscheduled Events", () => {
    assert.equal(parseCreateEventRequest(validEvent).eventDate, "2028-02-29");
    assert.deepEqual(parseCreateEventRequest({ name: "Family Dinner", side: "BRIDE" }), { name: "Family Dinner", side: "BRIDE" });
  });

  it("rejects impossible dates, invalid schedules, and unsupported fields", () => {
    for (const body of [
      { ...validEvent, eventDate: "2027-02-31" },
      { ...validEvent, eventDate: null },
      { ...validEvent, startTime: null, endTime: "12:00" },
      { ...validEvent, endTime: "09:00" },
      { ...validEvent, budgetAmount: 1000 },
    ]) assert.throws(() => parseCreateEventRequest(body), RequestValidationError);
  });

  it("accepts non-empty partial updates and validates IDs and filters", () => {
    assert.deepEqual(parseUpdateEventRequest({ venueName: null }), { venueName: null });
    assert.throws(() => parseUpdateEventRequest({}), RequestValidationError);
    assert.equal(parseEventListSide({ side: "GROOM" }), "GROOM");
    assert.equal(parseEventId({ weddingId: crypto.randomUUID(), eventId: crypto.randomUUID() }).length, 36);
  });
});
