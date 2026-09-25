import { createDatabaseRateLimit } from "./database-rate-limit.js";

function createAuthenticationRateLimit(scope: string, message: string, limit: number) {
  return createDatabaseRateLimit({
    scope,
    windowMs: 15 * 60 * 1000,
    limit,
    message,
  });
}

export const loginRateLimit = createAuthenticationRateLimit(
  "login",
  "Too many sign-in attempts. Please try again later.",
  10,
);

export const refreshRateLimit = createAuthenticationRateLimit(
  "refresh",
  "Too many session refresh attempts. Please try again later.",
  60,
);
