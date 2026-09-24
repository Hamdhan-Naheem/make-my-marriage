import type { RequestHandler } from "express";
import { TasksOwnerAccessRequiredError } from "../../shared/errors.js";
import { getLoadedWedding } from "../weddings/wedding.middleware.js";

export const requireTaskOwner: RequestHandler = (_req, res, next) => {
  if (getLoadedWedding(res.locals).member.role !== "OWNER") {
    next(new TasksOwnerAccessRequiredError());
    return;
  }
  next();
};
