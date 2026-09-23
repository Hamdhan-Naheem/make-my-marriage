import type {
  CreateEventRequest,
  UpdateEventRequest,
  WeddingManagementType,
  WeddingEvent,
  WeddingSide,
} from "@make-my-marriage/shared";
import { EventNotFoundError, RequestValidationError } from "../../shared/errors.js";
import type { EventRecord, EventRepository, EventWriteRecord } from "./event.repository.js";

function parseDateOnly(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function parseTime(value: string | null | undefined): Date | null {
  return value ? new Date(`1970-01-01T${value}:00.000Z`) : null;
}

function formatTime(value: Date | null): string | null {
  return value?.toISOString().slice(11, 16) ?? null;
}

function toEvent(record: EventRecord): WeddingEvent {
  return {
    ...record,
    eventDate: record.eventDate?.toISOString().slice(0, 10) ?? null,
    startTime: formatTime(record.startTime),
    endTime: formatTime(record.endTime),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function requiredSide(managementType: WeddingManagementType): WeddingSide | undefined {
  return managementType === "BRIDE_SIDE" ? "BRIDE" : managementType === "GROOM_SIDE" ? "GROOM" : undefined;
}

function validateSide(side: WeddingSide, managementType: WeddingManagementType) {
  const required = requiredSide(managementType);
  if (required && side !== required) {
    throw new RequestValidationError({ side: [`${managementType === "BRIDE_SIDE" ? "Bride Side" : "Groom Side"} weddings require Event Side ${required}.`] });
  }
}

function validateSchedule(value: { eventDate: string | null; startTime: string | null; endTime: string | null }) {
  if ((value.startTime || value.endTime) && !value.eventDate) {
    throw new RequestValidationError({ eventDate: ["Add an event date before adding times."] });
  }
  if (value.endTime && !value.startTime) {
    throw new RequestValidationError({ startTime: ["Add a start time before adding an end time."] });
  }
  if (value.startTime && value.endTime && value.endTime <= value.startTime) {
    throw new RequestValidationError({ endTime: ["End time must be later than start time on the same day."] });
  }
}

function toWriteRecord(weddingId: string, value: {
  name: string;
  description?: string | null;
  side: WeddingSide;
  eventDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  venueName?: string | null;
  address?: string | null;
}): EventWriteRecord {
  return {
    weddingId,
    name: value.name,
    description: value.description || null,
    side: value.side,
    eventDate: parseDateOnly(value.eventDate),
    startTime: parseTime(value.startTime),
    endTime: parseTime(value.endTime),
    venueName: value.venueName || null,
    address: value.address || null,
  };
}

export class EventService {
  constructor(private readonly repository: EventRepository) {}

  async create(weddingId: string, managementType: WeddingManagementType, userId: string, input: CreateEventRequest): Promise<WeddingEvent> {
    validateSide(input.side, managementType);
    const schedule = { eventDate: input.eventDate ?? null, startTime: input.startTime ?? null, endTime: input.endTime ?? null };
    validateSchedule(schedule);
    return toEvent(await this.repository.create({ ...toWriteRecord(weddingId, input), createdByUserId: userId }));
  }

  async list(weddingId: string, side?: WeddingSide): Promise<WeddingEvent[]> {
    return (await this.repository.list(weddingId, side)).map(toEvent);
  }

  async get(weddingId: string, eventId: string): Promise<WeddingEvent> {
    const event = await this.repository.find(weddingId, eventId);
    if (!event) throw new EventNotFoundError();
    return toEvent(event);
  }

  async update(weddingId: string, eventId: string, managementType: WeddingManagementType, input: UpdateEventRequest): Promise<WeddingEvent> {
    const current = await this.repository.find(weddingId, eventId);
    if (!current) throw new EventNotFoundError();
    const currentEvent = toEvent(current);
    const merged = {
      name: input.name ?? currentEvent.name,
      description: input.description === undefined ? currentEvent.description : input.description,
      side: input.side ?? currentEvent.side,
      eventDate: input.eventDate === undefined ? currentEvent.eventDate : input.eventDate,
      startTime: input.startTime === undefined ? currentEvent.startTime : input.startTime,
      endTime: input.endTime === undefined ? currentEvent.endTime : input.endTime,
      venueName: input.venueName === undefined ? currentEvent.venueName : input.venueName,
      address: input.address === undefined ? currentEvent.address : input.address,
    };
    validateSide(merged.side, managementType);
    validateSchedule(merged);
    return toEvent(await this.repository.update(weddingId, eventId, toWriteRecord(weddingId, merged)));
  }
}
