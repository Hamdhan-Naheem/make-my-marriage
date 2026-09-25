import type { TaskStatus, WeddingSide } from "@make-my-marriage/shared";
import { prisma } from "../../config/database.js";

export type TaskRecord = {
  id: string;
  weddingId: string;
  eventId: string | null;
  name: string;
  description: string | null;
  side: WeddingSide;
  dueDate: Date | null;
  status: TaskStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskWriteRecord = {
  weddingId: string;
  eventId: string | null;
  name: string;
  description: string | null;
  side: WeddingSide;
  dueDate: Date | null;
};

export type TaskUpdateRecord = Omit<TaskWriteRecord, "weddingId"> & {
  status: TaskStatus;
  completedAt: Date | null;
};

export type TaskListFilters = {
  status?: TaskStatus;
  side?: WeddingSide;
  eventId?: string;
  page: number;
  limit: number;
};

export interface TaskRepository {
  create(input: TaskWriteRecord & { createdByUserId: string }): Promise<TaskRecord>;
  list(weddingId: string, filters: TaskListFilters): Promise<{ records: TaskRecord[]; total: number }>;
  find(weddingId: string, taskId: string): Promise<TaskRecord | null>;
  findEventSide(weddingId: string, eventId: string): Promise<WeddingSide | null>;
  update(weddingId: string, taskId: string, input: TaskUpdateRecord): Promise<TaskRecord>;
  delete(weddingId: string, taskId: string): Promise<boolean>;
}

const taskSelection = {
  id: true,
  weddingId: true,
  eventId: true,
  name: true,
  description: true,
  side: true,
  dueDate: true,
  status: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class PrismaTaskRepository implements TaskRepository {
  async create(input: TaskWriteRecord & { createdByUserId: string }): Promise<TaskRecord> {
    return prisma.task.create({ data: input, select: taskSelection });
  }

  async list(weddingId: string, filters: TaskListFilters): Promise<{ records: TaskRecord[]; total: number }> {
    const { page, limit, ...filterValues } = filters;
    const where = { weddingId, ...filterValues };
    const [records, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: taskSelection,
      }),
      prisma.task.count({ where }),
    ]);
    return { records, total };
  }

  async find(weddingId: string, taskId: string): Promise<TaskRecord | null> {
    return prisma.task.findUnique({ where: { weddingId_id: { weddingId, id: taskId } }, select: taskSelection });
  }

  async findEventSide(weddingId: string, eventId: string): Promise<WeddingSide | null> {
    const event = await prisma.event.findUnique({
      where: { weddingId_id: { weddingId, id: eventId } },
      select: { side: true },
    });
    return event?.side ?? null;
  }

  async update(weddingId: string, taskId: string, input: TaskUpdateRecord): Promise<TaskRecord> {
    return prisma.task.update({
      where: { weddingId_id: { weddingId, id: taskId } },
      data: input,
      select: taskSelection,
    });
  }

  async delete(weddingId: string, taskId: string): Promise<boolean> {
    const result = await prisma.task.deleteMany({ where: { weddingId, id: taskId } });
    return result.count === 1;
  }
}
