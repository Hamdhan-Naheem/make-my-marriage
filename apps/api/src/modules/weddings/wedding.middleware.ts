import type { RequestHandler } from "express";
import type { WeddingWorkspace } from "@make-my-marriage/shared";
import type { SafeUser } from "../auth/auth.service.js";
import { weddingService } from "./wedding.dependencies.js";
import { parseWeddingId } from "./wedding.schema.js";
import { WeddingOwnerAccessRequiredError } from "../../shared/errors.js";

export const loadActiveWeddingMembership: RequestHandler = async (req, res, next) => {
  try {
    const user = res.locals["authUser"] as SafeUser;
    const weddingId = parseWeddingId(req.params);
    res.locals["weddingWorkspace"] = await weddingService.getForActiveMember(weddingId, user.id);
    next();
  } catch (error) {
    next(error);
  }
};

export function getLoadedWedding(resLocals: Record<string, unknown>): WeddingWorkspace {
  return resLocals["weddingWorkspace"] as WeddingWorkspace;
}

export const requireWeddingOwner: RequestHandler = (_req, res, next) => {
  if (getLoadedWedding(res.locals).member.role !== "OWNER") {
    next(new WeddingOwnerAccessRequiredError());
    return;
  }
  next();
};
