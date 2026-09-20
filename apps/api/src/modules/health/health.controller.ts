import type { RequestHandler } from "express";
import { getHealth } from "./health.service.js";

export const healthController: RequestHandler = (_req, res) => {
  res.status(200).json(getHealth());
};
