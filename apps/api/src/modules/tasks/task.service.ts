import type {
  CreateTaskRequest,
  UpdateTaskRequest,
  WeddingManagementType,
  WeddingTask,
  WeddingSide,
} from "@make-my-marriage/shared";
import { EventNotFoundError, RequestValidationError, TaskNotFoundError } from "../../shared/errors.js";
import type { TaskRecord, TaskRepository, TaskUpdateRecord, TaskWriteRecord, TaskListFilters } from "./task.repository.js";
import { isSideAllowedForWedding, isTaskSideAllowedForEvent } from "./task.rules.js";

function parseDateOnly(value: string | null | undefined): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function toTask(record: TaskRecord): WeddingTask {
  return {
    ...record,
    dueDate: record.dueDate?.toISOString().slice(0, 10) ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function taskWriteRecord(weddingId: string, value: {
  eventId?: string | null;
  name: string;
  description?: string | null;
  side: WeddingSide;
  dueDate?: string | null;
}): TaskWriteRecord {
  return {
    weddingId,
    eventId: value.eventId ?? null,
    name: value.name,
    description: value.description || null,
    side: value.side,
    dueDate: parseDateOnly(value.dueDate),
  };
}

function validateWeddingSide(side: WeddingSide, managementType: WeddingManagementType) {
  if (!isSideAllowedForWedding(side, managementType)) {
    const required = managementType === "BRIDE_SIDE" ? "BRIDE" : "GROOM";
    throw new RequestValidationError({ side: [`${managementType === "BRIDE_SIDE" ? "Bride Side" : "Groom Side"} weddings require Task Side ${required}.`] });
  }
}

export class TaskService {
  constructor(private readonly repository: TaskRepository) {}

  private async validateSideAndEvent(
    weddingId: string,
    managementType: WeddingManagementType,
    side: WeddingSide,
    eventId: string | null,
  ) {
    validateWeddingSide(side, managementType);
    if (!eventId) return;
    const eventSide = await this.repository.findEventSide(weddingId, eventId);
    if (!eventSide) throw new EventNotFoundError();
    if (!isTaskSideAllowedForEvent(side, eventSide)) {
      throw new RequestValidationError({ side: [`Task Side ${side} is not compatible with this ${eventSide} Event.`] });
    }
  }

  async create(weddingId: string, managementType: WeddingManagementType, userId: string, input: CreateTaskRequest): Promise<WeddingTask> {
    await this.validateSideAndEvent(weddingId, managementType, input.side, input.eventId ?? null);
    return toTask(await this.repository.create({ ...taskWriteRecord(weddingId, input), createdByUserId: userId }));
  }

  async list(weddingId: string, filters: TaskListFilters) {
    const { records, total } = await this.repository.list(weddingId, filters);
    return {
      tasks: records.map(toTask),
      meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
    };
  }

  async get(weddingId: string, taskId: string): Promise<WeddingTask> {
    const task = await this.repository.find(weddingId, taskId);
    if (!task) throw new TaskNotFoundError();
    return toTask(task);
  }

  async update(
    weddingId: string,
    taskId: string,
    managementType: WeddingManagementType,
    input: UpdateTaskRequest,
  ): Promise<WeddingTask> {
    const current = await this.repository.find(weddingId, taskId);
    if (!current) throw new TaskNotFoundError();
    const currentTask = toTask(current);
    const merged = {
      name: input.name ?? currentTask.name,
      description: input.description === undefined ? currentTask.description : input.description,
      side: input.side ?? currentTask.side,
      dueDate: input.dueDate === undefined ? currentTask.dueDate : input.dueDate,
      eventId: input.eventId === undefined ? currentTask.eventId : input.eventId,
      status: input.status ?? currentTask.status,
    };
    await this.validateSideAndEvent(weddingId, managementType, merged.side, merged.eventId);

    let completedAt = current.completedAt;
    if (merged.status !== current.status) completedAt = merged.status === "COMPLETED" ? new Date() : null;
    const update: TaskUpdateRecord = {
      eventId: merged.eventId,
      name: merged.name,
      description: merged.description || null,
      side: merged.side,
      dueDate: parseDateOnly(merged.dueDate),
      status: merged.status,
      completedAt,
    };
    return toTask(await this.repository.update(weddingId, taskId, update));
  }

  async delete(weddingId: string, taskId: string): Promise<void> {
    if (!(await this.repository.delete(weddingId, taskId))) throw new TaskNotFoundError();
  }
}
