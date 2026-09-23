import { Router } from "express";
import { requireAuthentication } from "../auth/auth.middleware.js";
import { requireTrustedOrigin } from "../auth/csrf.js";
import { loadActiveWeddingMembership } from "../weddings/wedding.middleware.js";
import { createEventController, getEventController, listEventsController, updateEventController } from "./event.controller.js";
import { requireEventOwner } from "./event.middleware.js";

export const eventRouter = Router({ mergeParams: true });

eventRouter.use(requireAuthentication, loadActiveWeddingMembership, requireEventOwner);
eventRouter.get("/", listEventsController);
eventRouter.post("/", requireTrustedOrigin, createEventController);
eventRouter.get("/:eventId", getEventController);
eventRouter.patch("/:eventId", requireTrustedOrigin, updateEventController);
