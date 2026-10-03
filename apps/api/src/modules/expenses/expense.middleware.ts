import type { RequestHandler } from "express";
import { ExpensesOwnerAccessRequiredError } from "../../shared/errors.js";
import { getLoadedWedding } from "../weddings/wedding.middleware.js";

export const requireExpenseOwner: RequestHandler = (_req, res, next) => {
  if (getLoadedWedding(res.locals).member.role !== "OWNER") {
    next(new ExpensesOwnerAccessRequiredError());
    return;
  }
  next();
};
