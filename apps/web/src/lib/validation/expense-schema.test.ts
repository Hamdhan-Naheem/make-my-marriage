import assert from "node:assert/strict";
import test from "node:test";
import { allowedExpenseSides, expenseFormSchema } from "./expense-schema";

const validExpense = {
  name: "Ceremony flowers",
  description: "",
  amount: "50.50",
  side: "BOTH" as const,
  expenseDate: "",
  category: "",
  eventId: "",
};

test("validates exact positive Expense amounts and optional fields", () => {
  assert.equal(expenseFormSchema.safeParse(validExpense).success, true);
  assert.equal(expenseFormSchema.safeParse({ ...validExpense, amount: "0.50" }).success, true);
  assert.equal(expenseFormSchema.safeParse({ ...validExpense, amount: "0" }).success, false);
  assert.equal(expenseFormSchema.safeParse({ ...validExpense, amount: "50.505" }).success, false);
  assert.equal(expenseFormSchema.safeParse({ ...validExpense, expenseDate: "2027-02-30" }).success, false);
});

test("derives Wedding and Event compatible Expense sides", () => {
  assert.deepEqual(allowedExpenseSides("BRIDE_SIDE"), ["BRIDE"]);
  assert.deepEqual(allowedExpenseSides("GROOM_SIDE"), ["GROOM"]);
  assert.deepEqual(allowedExpenseSides("JOINT", "BRIDE"), ["BRIDE"]);
  assert.deepEqual(allowedExpenseSides("JOINT", "GROOM"), ["GROOM"]);
  assert.deepEqual(allowedExpenseSides("JOINT", "BOTH"), ["BRIDE", "GROOM", "BOTH"]);
  assert.deepEqual(allowedExpenseSides("JOINT"), ["BRIDE", "GROOM", "BOTH"]);
});
