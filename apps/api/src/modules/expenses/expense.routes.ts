import { Router } from "express";
import { requireAuthentication } from "../auth/auth.middleware.js";
import { requireTrustedOrigin } from "../auth/csrf.js";
import { loadActiveWeddingMembership } from "../weddings/wedding.middleware.js";
import {
  createExpenseController,
  deleteExpenseController,
  getExpenseController,
  listExpensesController,
  updateExpenseController,
} from "./expense.controller.js";
import { requireExpenseOwner } from "./expense.middleware.js";

export const expenseRouter = Router({ mergeParams: true });

expenseRouter.use(requireAuthentication, loadActiveWeddingMembership, requireExpenseOwner);
expenseRouter.get("/", listExpensesController);
expenseRouter.post("/", requireTrustedOrigin, createExpenseController);
expenseRouter.get("/:expenseId", getExpenseController);
expenseRouter.patch("/:expenseId", requireTrustedOrigin, updateExpenseController);
expenseRouter.delete("/:expenseId", requireTrustedOrigin, deleteExpenseController);
