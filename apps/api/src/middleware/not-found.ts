import type { RequestHandler } from "express";
import type { ErrorResponse } from "../shared/http.js";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found." },
  } satisfies ErrorResponse);
};
