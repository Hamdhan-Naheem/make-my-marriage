import { createDatabaseRateLimit } from "./database-rate-limit.js";

export const registrationRateLimit = createDatabaseRateLimit({
  scope: "registration",
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: "Too many registration attempts. Please try again later.",
});
