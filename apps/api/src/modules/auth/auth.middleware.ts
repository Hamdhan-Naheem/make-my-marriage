import type { RequestHandler } from "express";
import { ACCESS_COOKIE_NAME } from "./auth.constants.js";
import { readCookie } from "./auth.cookies.js";
import { authService } from "./auth.dependencies.js";

export const requireAuthentication: RequestHandler = async (req, res, next) => {
  try {
    res.locals["authUser"] = await authService.authenticate(readCookie(req, ACCESS_COOKIE_NAME));
    next();
  } catch (error) {
    next(error);
  }
};
