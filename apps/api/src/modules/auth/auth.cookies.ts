import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
} from "./auth.constants.js";
import type { TokenPair } from "./tokens.js";

const secure = env.NODE_ENV === "production";

const commonCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure,
};

export function setAuthenticationCookies(res: Response, tokens: TokenPair, sessionExpiresAt: Date) {
  res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
    ...commonCookieOptions,
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    path: "/",
  });
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
    ...commonCookieOptions,
    expires: sessionExpiresAt,
    path: "/api/v1/auth",
  });
}

export function clearAuthenticationCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, { ...commonCookieOptions, path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...commonCookieOptions, path: "/api/v1/auth" });
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
}
