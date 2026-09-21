import type { ErrorRequestHandler } from "express";
import { AppError } from "../shared/errors.js";
import type { ErrorResponse } from "../shared/http.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (res.headersSent) {
    _next(error);
    return;
  }

  const malformedJson = error instanceof SyntaxError && "type" in error && error.type === "entity.parse.failed";
  const payloadTooLarge = error instanceof Error && "type" in error && error.type === "entity.too.large";

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    } satisfies ErrorResponse);
    return;
  }

  if (!malformedJson && !payloadTooLarge) {
    console.error("Unhandled API request error");
  }

  const statusCode = malformedJson ? 400 : payloadTooLarge ? 413 : 500;
  const code = malformedJson ? "INVALID_JSON" : payloadTooLarge ? "PAYLOAD_TOO_LARGE" : "INTERNAL_SERVER_ERROR";
  const message = malformedJson
    ? "Request body must contain valid JSON."
    : payloadTooLarge
      ? "Request body is too large."
      : "An unexpected error occurred.";

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  } satisfies ErrorResponse);
};
