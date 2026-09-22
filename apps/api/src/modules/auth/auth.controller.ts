import type { RequestHandler } from "express";
import {
  parseLoginRequest,
  parseRegisterRequest,
  parseResendVerificationRequest,
  parseVerifyEmailRequest,
} from "./auth.schema.js";
import type { SafeUser } from "./auth.service.js";
import { clearAuthenticationCookies, readCookie, setAuthenticationCookies } from "./auth.cookies.js";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./auth.constants.js";
import { authService } from "./auth.dependencies.js";
import { AuthenticationRequiredError } from "../../shared/errors.js";

export const registerController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseRegisterRequest(req.body);
    await authService.register(input);

    res.status(202).json({
      success: true,
      data: {
        message: "If this email can be registered, use the verification message to continue. If it does not arrive, request a new link.",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmailController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseVerifyEmailRequest(req.body);
    await authService.verifyEmail(input.token);
    res.status(200).json({ success: true, data: { message: "Email verified successfully." } });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationController: RequestHandler = async (req, res, next) => {
  try {
    const input = parseResendVerificationRequest(req.body);
    await authService.resendVerification(input.email);
    res.status(200).json({
      success: true,
      data: { message: "If the account exists and still requires verification, a verification email has been sent." },
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
