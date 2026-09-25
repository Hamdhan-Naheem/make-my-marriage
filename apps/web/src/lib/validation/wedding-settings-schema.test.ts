import assert from "node:assert/strict";
import test from "node:test";
import { getSriLankaTodayDate } from "@make-my-marriage/shared";
import { weddingSettingsSchema } from "./wedding-settings-schema";

const validSettings = { name: "My Wedding", brideName: "Bride", groomName: "Groom", mainWeddingDate: "" };

test("accepts an undecided date and trims wedding names", () => {
  assert.deepEqual(weddingSettingsSchema.parse({ ...validSettings, name: "  My Wedding  " }), validSettings);
});

test("accepts today or a future date and rejects impossible or past dates", () => {
  const today = getSriLankaTodayDate();
  const yesterdayDate = new Date(`${today}T00:00:00.000Z`);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  assert.equal(weddingSettingsSchema.safeParse({ ...validSettings, mainWeddingDate: today }).success, true);
  assert.equal(weddingSettingsSchema.safeParse({ ...validSettings, mainWeddingDate: "2027-02-30" }).success, false);
  assert.equal(weddingSettingsSchema.safeParse({ ...validSettings, mainWeddingDate: yesterdayDate.toISOString().slice(0, 10) }).success, false);
});
