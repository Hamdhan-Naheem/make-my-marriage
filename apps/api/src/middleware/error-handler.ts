import type { ErrorRequestHandler } from "express";
import type { ErrorResponse } from "../shared/http.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (res.headersSent) {
    _next(error);
    return;
  }

  const malformedJson = error instanceof SyntaxError && "type" in error && error.type === "entity.parse.failed";

  if (!malformedJson) {
    console.error("Unhandled API request error");
  }

  res.status(malformedJson ? 400 : 500).json({
    success: false,
    error: {
      code: malformedJson ? "INVALID_JSON" : "INTERNAL_SERVER_ERROR",
      message: malformedJson ? "Request body must contain valid JSON." : "An unexpected error occurred.",
    },
  } satisfies ErrorResponse);
};
