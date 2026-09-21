import { rateLimit } from "express-rate-limit";
import type { ErrorResponse } from "../../shared/http.js";

export const registrationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many registration attempts. Please try again later.",
      },
    } satisfies ErrorResponse);
  },
});
