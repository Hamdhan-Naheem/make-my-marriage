import { Router } from "express";
import { requireAuthentication } from "../auth/auth.middleware.js";
import { loadActiveWeddingMembership } from "../weddings/wedding.middleware.js";
import { getBudgetSummaryController } from "./budget.controller.js";
import { requireBudgetOwner } from "./budget.middleware.js";

export const budgetRouter = Router({ mergeParams: true });

budgetRouter.use(requireAuthentication, loadActiveWeddingMembership, requireBudgetOwner);
budgetRouter.get("/", getBudgetSummaryController);
