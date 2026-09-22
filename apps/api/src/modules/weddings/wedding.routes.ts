import { Router } from "express";
import { requireAuthentication } from "../auth/auth.middleware.js";
import { requireTrustedOrigin } from "../auth/csrf.js";
import { createWeddingController, getWeddingController, listWeddingsController } from "./wedding.controller.js";
import { loadActiveWeddingMembership } from "./wedding.middleware.js";

export const weddingRouter = Router();

weddingRouter.use(requireAuthentication);
weddingRouter.get("/", listWeddingsController);
weddingRouter.post("/", requireTrustedOrigin, createWeddingController);
weddingRouter.get("/:weddingId", loadActiveWeddingMembership, getWeddingController);

