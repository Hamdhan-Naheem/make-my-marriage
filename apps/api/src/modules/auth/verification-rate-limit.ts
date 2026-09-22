import { rateLimit } from "express-rate-limit";
import type { ErrorResponse } from "../../shared/http.js";

function verificationRateLimit(message: string, limit: number) {
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

export const verifyEmailRateLimit = verificationRateLimit(
  "Too many verification attempts. Please try again later.",
  20,
);

export const resendVerificationRateLimit = verificationRateLimit(
  "Too many verification-email requests. Please try again later.",
  5,
);
