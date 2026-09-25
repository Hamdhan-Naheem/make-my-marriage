import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  resendVerificationController,
  verifyEmailController,
} from "./auth.controller.js";
import { requireAuthentication } from "./auth.middleware.js";
import { loginRateLimit, refreshRateLimit } from "./authentication-rate-limit.js";
import { requireTrustedOrigin } from "./csrf.js";
import { registrationRateLimit } from "./registration-rate-limit.js";
import { resendVerificationRateLimit, verifyEmailRateLimit } from "./verification-rate-limit.js";

export const authRouter = Router();

authRouter.post("/register", registrationRateLimit, registerController);
authRouter.post("/verify-email", verifyEmailRateLimit, verifyEmailController);
authRouter.post("/resend-verification", resendVerificationRateLimit, resendVerificationController);
authRouter.post("/login", loginRateLimit, requireTrustedOrigin, loginController);
authRouter.get("/me", requireAuthentication, meController);
authRouter.post("/refresh", refreshRateLimit, requireTrustedOrigin, refreshController);
authRouter.post("/logout", requireTrustedOrigin, logoutController);
