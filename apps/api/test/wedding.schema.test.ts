import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getSriLankaTodayDate } from "@make-my-marriage/shared";
import { RequestValidationError } from "../src/shared/errors.js";
import { parseCreateWeddingRequest, parseUpdateWeddingRequest, parseWeddingId } from "../src/modules/weddings/wedding.schema.js";

const validRequest = {
  name: "  Ahamed & Fathima Wedding  ",
  brideName: "  Fathima  ",
  groomName: "  Ahamed  ",
  managementType: "JOINT",
  mainWeddingDate: null,
  creatorSide: "BOTH",
};

describe("wedding request validation", () => {
  it("trims names and accepts an undecided wedding date", () => {
    assert.deepEqual(parseCreateWeddingRequest(validRequest), {
      ...validRequest,
      name: "Ahamed & Fathima Wedding",
      brideName: "Fathima",
      groomName: "Ahamed",
    });
  });

  it("accepts only real calendar dates that are today or later", () => {
    const today = getSriLankaTodayDate();
    const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterday = yesterdayDate.toISOString().slice(0, 10);

    assert.equal(parseCreateWeddingRequest({ ...validRequest, mainWeddingDate: today }).mainWeddingDate, today);
    assert.throws(() => parseCreateWeddingRequest({ ...validRequest, mainWeddingDate: "2027-02-30" }), RequestValidationError);
    assert.throws(() => parseCreateWeddingRequest({ ...validRequest, mainWeddingDate: yesterday }), RequestValidationError);
  });

  it("enforces creator side for single-side weddings", () => {
    assert.equal(parseCreateWeddingRequest({ ...validRequest, managementType: "BRIDE_SIDE", creatorSide: "BRIDE" }).creatorSide, "BRIDE");
    assert.equal(parseCreateWeddingRequest({ ...validRequest, managementType: "GROOM_SIDE", creatorSide: "GROOM" }).creatorSide, "GROOM");
    assert.throws(() => parseCreateWeddingRequest({ ...validRequest, managementType: "BRIDE_SIDE", creatorSide: "GROOM" }), RequestValidationError);
  });

  it("accepts all approved Joint creator sides", () => {
    for (const creatorSide of ["BRIDE", "GROOM", "BOTH"] as const) {
      assert.equal(parseCreateWeddingRequest({ ...validRequest, creatorSide }).creatorSide, creatorSide);
    }
  });

  it("rejects financial and other unknown properties", () => {
    assert.throws(
      () => parseCreateWeddingRequest({ ...validRequest, budgetAmount: 5_000_000, currency: "LKR" }),
      (error) => error instanceof RequestValidationError && error.fields?._form?.[0] === "Request contains unsupported fields.",
    );
  });

  it("validates wedding IDs", () => {
    assert.equal(parseWeddingId({ weddingId: "11111111-1111-4111-8111-111111111111" }), "11111111-1111-4111-8111-111111111111");
    assert.throws(() => parseWeddingId({ weddingId: "not-a-uuid" }), RequestValidationError);
  });

  it("validates Owner-editable settings and rejects management type changes", () => {
    assert.deepEqual(parseUpdateWeddingRequest({ name: "  Updated Wedding  ", mainWeddingDate: null }), { name: "Updated Wedding", mainWeddingDate: null });
    assert.throws(() => parseUpdateWeddingRequest({}), RequestValidationError);
    assert.throws(() => parseUpdateWeddingRequest({ managementType: "BRIDE_SIDE" }), RequestValidationError);
    assert.throws(() => parseUpdateWeddingRequest({ mainWeddingDate: "2027-02-30" }), RequestValidationError);
  });
});
