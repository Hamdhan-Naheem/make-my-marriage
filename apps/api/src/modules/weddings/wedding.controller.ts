import type { RequestHandler } from "express";
import type { SafeUser } from "../auth/auth.service.js";
import { weddingService } from "./wedding.dependencies.js";
import { getLoadedWedding } from "./wedding.middleware.js";
import { parseCreateWeddingRequest } from "./wedding.schema.js";

export const createWeddingController: RequestHandler = async (req, res, next) => {
  try {
    const user = res.locals["authUser"] as SafeUser;
    const wedding = await weddingService.create(user.id, parseCreateWeddingRequest(req.body));
    res.status(201).json({ success: true, data: wedding });
  } catch (error) {
    next(error);
  }
};

export const listWeddingsController: RequestHandler = async (_req, res, next) => {
  try {
    const user = res.locals["authUser"] as SafeUser;
    res.status(200).json({ success: true, data: await weddingService.list(user.id) });
  } catch (error) {
    next(error);
  }
};

export const getWeddingController: RequestHandler = (_req, res) => {
  res.status(200).json({ success: true, data: getLoadedWedding(res.locals) });
};

