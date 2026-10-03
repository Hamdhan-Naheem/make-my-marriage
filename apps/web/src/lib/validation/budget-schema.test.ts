import assert from "node:assert/strict";
import test from "node:test";
import { addMoney, formatMoney, isMoneyGreater, moneyProgressPercent } from "../money";
import { budgetSettingsSchema } from "./budget-schema";

test("validates supported currencies and optional exact overall budgets", () => {
  assert.equal(budgetSettingsSchema.safeParse({ currency: "LKR", budgetAmount: "" }).success, true);
  assert.equal(budgetSettingsSchema.safeParse({ currency: "USD", budgetAmount: "5000.25" }).success, true);
  assert.equal(budgetSettingsSchema.safeParse({ currency: "EUR", budgetAmount: "5000.25" }).success, false);
  assert.equal(budgetSettingsSchema.safeParse({ currency: "AUD", budgetAmount: "1,000" }).success, false);
});

test("handles display and allocation checks without floating-point arithmetic", () => {
  assert.equal(addMoney("0.10", "0.20"), "0.30");
  assert.equal(isMoneyGreater("100.01", "100.00"), true);
  assert.equal(formatMoney("1234567.50", "LKR"), "LKR 1,234,567.50");
  assert.equal(moneyProgressPercent("75.00", "100.00"), 75);
});
