import type { RequestHandler } from "express";
import { parseLoginRequest, parseRegisterRequest } from "./auth.schema.js";
import type { SafeUser } from "./auth.service.js";
import { clearAuthenticationCookies, readCookie, setAuthenticationCookies } from "./auth.cookies.js";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./auth.constants.js";
import { authService } from "./auth.dependencies.js";
import { AuthenticationRequiredError } from "../../shared/errors.js";

export const registerController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseRegisterRequest(req.body);
    await authService.register(input);

    res.status(201).json({
      success: true,
      data: {
        message: "Account created. Email verification is required before sign-in.",
        verification: {
          required: true,
          emailSent: false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const loginController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseLoginRequest(req.body);
    const result = await authService.login(input, req.get("user-agent"));
    setAuthenticationCookies(res, result.tokens, result.sessionExpiresAt);

    res.status(200).json({ success: true, data: { user: result.user } });
  } catch (error) {
    next(error);
  }
};

export const meController: RequestHandler = (_req, res) => {
  res.status(200).json({ success: true, data: res.locals["authUser"] as SafeUser });
};

export const refreshController: RequestHandler = async (req, res, next) => {
  try {
    const result = await authService.refresh(readCookie(req, REFRESH_COOKIE_NAME));
    setAuthenticationCookies(res, result.tokens, result.sessionExpiresAt);
    res.status(200).json({ success: true });
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) clearAuthenticationCookies(res);
    next(error);
  }
};

export const logoutController: RequestHandler = async (req, res, next) => {
  try {
    await authService.logout(
      readCookie(req, ACCESS_COOKIE_NAME),
      readCookie(req, REFRESH_COOKIE_NAME),
    );
    clearAuthenticationCookies(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
