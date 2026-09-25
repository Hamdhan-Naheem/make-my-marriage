import { rateLimit } from "express-rate-limit";
import type { ErrorResponse } from "../../shared/http.js";

function createAuthenticationRateLimit(message: string, limit: number) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        error: { code: "RATE_LIMITED", message },
      } satisfies ErrorResponse);
    },
  });
}

export const loginRateLimit = createAuthenticationRateLimit(
  "Too many sign-in attempts. Please try again later.",
  10,
);

export const refreshRateLimit = createAuthenticationRateLimit(
  "Too many session refresh attempts. Please try again later.",
  60,
);
