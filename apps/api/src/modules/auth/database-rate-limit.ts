import { createHash } from "node:crypto";
import type { Request, RequestHandler } from "express";
import { prisma } from "../../config/database.js";
import type { ErrorResponse } from "../../shared/http.js";

type DatabaseRateLimitOptions = {
  scope: string;
  message: string;
  limit: number;
  windowMs: number;
};

type RateLimitRow = {
  count: number;
  resetAt: Date;
};

function clientIdentity(req: Request): string {
  const vercelAddress = process.env["VERCEL"]
    ? req.get("x-vercel-forwarded-for")?.split(",", 1)[0]?.trim()
    : undefined;
  const address = vercelAddress || req.ip || req.socket.remoteAddress || "unknown";
  const localProcessScope = process.env["VERCEL"] ? "" : `${process.pid}:`;
  return `${localProcessScope}${address}`;
}

export function createDatabaseRateLimit(options: DatabaseRateLimitOptions): RequestHandler {
  return async (req, res, next) => {
    try {
      const key = createHash("sha256")
        .update(`${options.scope}:${clientIdentity(req)}`)
        .digest("hex");
      const resetAt = new Date(Date.now() + options.windowMs);
      const rows = await prisma.$queryRaw<RateLimitRow[]>`
        INSERT INTO "auth_rate_limit_buckets" ("key", "count", "reset_at", "updated_at")
        VALUES (${key}, 1, ${resetAt}, CURRENT_TIMESTAMP)
        ON CONFLICT ("key") DO UPDATE SET
          "count" = CASE
            WHEN "auth_rate_limit_buckets"."reset_at" <= CURRENT_TIMESTAMP THEN 1
            ELSE "auth_rate_limit_buckets"."count" + 1
          END,
          "reset_at" = CASE
            WHEN "auth_rate_limit_buckets"."reset_at" <= CURRENT_TIMESTAMP THEN EXCLUDED."reset_at"
            ELSE "auth_rate_limit_buckets"."reset_at"
          END,
          "updated_at" = CURRENT_TIMESTAMP
        RETURNING "count", "reset_at" AS "resetAt"
      `;
      const bucket = rows[0];
      if (!bucket) throw new Error("Rate-limit bucket update returned no row.");

      const remaining = Math.max(0, options.limit - bucket.count);
      const resetSeconds = Math.max(0, Math.ceil((bucket.resetAt.getTime() - Date.now()) / 1000));
      res.setHeader("RateLimit-Policy", `${options.limit};w=${Math.ceil(options.windowMs / 1000)}`);
      res.setHeader("RateLimit", `limit=${options.limit}, remaining=${remaining}, reset=${resetSeconds}`);

      if (bucket.count > options.limit) {
        res.setHeader("Retry-After", resetSeconds);
        res.status(429).json({
          success: false,
          error: { code: "RATE_LIMITED", message: options.message },
        } satisfies ErrorResponse);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
