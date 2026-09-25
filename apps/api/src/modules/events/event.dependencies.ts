import { PrismaEventRepository } from "./event.repository.js";
import { EventService } from "./event.service.js";

export const eventService = new EventService(new PrismaEventRepository());
