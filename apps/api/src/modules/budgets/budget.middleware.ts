import type { RequestHandler } from "express";
import { BudgetOwnerAccessRequiredError } from "../../shared/errors.js";
import { getLoadedWedding } from "../weddings/wedding.middleware.js";

export const requireBudgetOwner: RequestHandler = (_req, res, next) => {
  if (getLoadedWedding(res.locals).member.role !== "OWNER") {
    next(new BudgetOwnerAccessRequiredError());
    return;
  }
  next();
};
