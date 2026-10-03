import type { RequestHandler } from "express";
import { getLoadedWedding } from "../weddings/wedding.middleware.js";
import { budgetService } from "./budget.dependencies.js";

export const getBudgetSummaryController: RequestHandler = async (_req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    res.status(200).json({ success: true, data: await budgetService.summarize(wedding.id) });
  } catch (error) {
    next(error);
  }
};
