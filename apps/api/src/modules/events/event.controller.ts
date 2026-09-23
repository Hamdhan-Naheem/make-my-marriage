import type { RequestHandler } from "express";
import type { SafeUser } from "../auth/auth.service.js";
import { getLoadedWedding } from "../weddings/wedding.middleware.js";
import { eventService } from "./event.dependencies.js";
import { parseCreateEventRequest, parseEventId, parseEventListSide, parseUpdateEventRequest } from "./event.schema.js";

export const createEventController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    const user = res.locals["authUser"] as SafeUser;
    const event = await eventService.create(wedding.id, wedding.managementType, user.id, parseCreateEventRequest(req.body));
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

export const listEventsController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    res.status(200).json({ success: true, data: await eventService.list(wedding.id, parseEventListSide(req.query)) });
  } catch (error) {
    next(error);
  }
};

export const getEventController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    res.status(200).json({ success: true, data: await eventService.get(wedding.id, parseEventId(req.params)) });
  } catch (error) {
    next(error);
  }
};

export const updateEventController: RequestHandler = async (req, res, next) => {
  try {
    const wedding = getLoadedWedding(res.locals);
    const event = await eventService.update(wedding.id, parseEventId(req.params), wedding.managementType, parseUpdateEventRequest(req.body));
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};
