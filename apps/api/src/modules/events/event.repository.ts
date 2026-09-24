import type { WeddingSide } from "@make-my-marriage/shared";
import { prisma } from "../../config/database.js";

export type EventRecord = {
  id: string;
  weddingId: string;
  name: string;
  description: string | null;
  side: WeddingSide;
  eventDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  venueName: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EventWriteRecord = Omit<EventRecord, "id" | "createdAt" | "updatedAt">;

export type EventDraftTaskWriteRecord = {
  name: string;
  description: string | null;
  side: WeddingSide;
  dueDate: Date | null;
};

export interface EventRepository {
  create(input: EventWriteRecord & { createdByUserId: string }, tasks?: EventDraftTaskWriteRecord[]): Promise<EventRecord>;
  list(weddingId: string, side?: WeddingSide): Promise<EventRecord[]>;
  find(weddingId: string, eventId: string): Promise<EventRecord | null>;
  update(weddingId: string, eventId: string, input: EventWriteRecord): Promise<EventRecord>;
  hasIncompatibleTasks(weddingId: string, eventId: string, side: WeddingSide): Promise<boolean>;
}

const eventSelection = {
  id: true,
  weddingId: true,
  name: true,
  description: true,
  side: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  venueName: true,
  address: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class PrismaEventRepository implements EventRepository {
  async create(input: EventWriteRecord & { createdByUserId: string }, tasks: EventDraftTaskWriteRecord[] = []): Promise<EventRecord> {
    return prisma.$transaction(async (transaction) => {
      const event = await transaction.event.create({ data: input, select: eventSelection });
      if (tasks.length > 0) {
        await transaction.task.createMany({
          data: tasks.map((task) => ({
            ...task,
            weddingId: input.weddingId,
            eventId: event.id,
            createdByUserId: input.createdByUserId,
          })),
        });
      }
      return event;
    });
  }

  async list(weddingId: string, side?: WeddingSide): Promise<EventRecord[]> {
    return prisma.event.findMany({
      where: { weddingId, ...(side ? { side } : {}) },
      orderBy: [{ eventDate: "asc" }, { startTime: "asc" }, { createdAt: "asc" }],
      select: eventSelection,
    });
  }

  async find(weddingId: string, eventId: string): Promise<EventRecord | null> {
    return prisma.event.findUnique({ where: { weddingId_id: { weddingId, id: eventId } }, select: eventSelection });
  }

  async update(weddingId: string, eventId: string, input: EventWriteRecord): Promise<EventRecord> {
    return prisma.event.update({
      where: { weddingId_id: { weddingId, id: eventId } },
      data: input,
      select: eventSelection,
    });
  }

  async hasIncompatibleTasks(weddingId: string, eventId: string, side: WeddingSide): Promise<boolean> {
    if (side === "BOTH") return false;
    return (await prisma.task.count({ where: { weddingId, eventId, side: { not: side } } })) > 0;
  }
}
