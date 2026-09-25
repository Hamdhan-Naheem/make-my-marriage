import { createDatabaseRateLimit } from "./database-rate-limit.js";

function verificationRateLimit(scope: string, message: string, limit: number) {
  return createDatabaseRateLimit({
    scope,
    windowMs: 15 * 60 * 1000,
    limit,
    message,
  });
}

export const verifyEmailRateLimit = verificationRateLimit(
  "verify-email",
  "Too many verification attempts. Please try again later.",
  20,
);

export const resendVerificationRateLimit = verificationRateLimit(
  "resend-verification",
  "Too many verification-email requests. Please try again later.",
  5,
);
