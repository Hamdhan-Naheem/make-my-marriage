import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { CsrfValidationError } from "../../shared/errors.js";

export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  if (req.get("origin") !== env.WEB_ORIGIN) {
    next(new CsrfValidationError());
    return;
  }

  next();
};
