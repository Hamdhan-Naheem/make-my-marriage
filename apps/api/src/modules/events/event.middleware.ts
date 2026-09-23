import type { RequestHandler } from "express";
import { EventsOwnerAccessRequiredError } from "../../shared/errors.js";
import { getLoadedWedding } from "../weddings/wedding.middleware.js";

export const requireEventOwner: RequestHandler = (_req, res, next) => {
  if (getLoadedWedding(res.locals).member.role !== "OWNER") {
    next(new EventsOwnerAccessRequiredError());
    return;
  }
  next();
};
