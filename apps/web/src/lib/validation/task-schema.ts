import { z } from "zod";
import {
  dateOnlySchema,
  type CreateTaskRequest,
  type WeddingEvent,
  type WeddingManagementType,
  type WeddingSide,
  type WeddingTask,
} from "@make-my-marriage/shared";

const taskFormShape = {
  name: z.string().trim().min(1, "Enter a task name.").max(140, "Use 140 characters or fewer."),
  description: z.string().trim().max(1000, "Use 1,000 characters or fewer."),
  side: z.enum(["BRIDE", "GROOM", "BOTH"], { error: "Choose which side this task belongs to." }),
  dueDate: z.string().refine((value) => value === "" || dateOnlySchema.safeParse(value).success, "Enter a valid due date."),
  eventId: z.string(),
};

export const taskFormSchema = z.object(taskFormShape).strict();
export type TaskFormValues = z.infer<typeof taskFormSchema>;

export function taskSidesFor(
  managementType: WeddingManagementType,
  eventSide?: WeddingSide,
): WeddingSide[] {
  if (managementType === "BRIDE_SIDE") return ["BRIDE"];
  if (managementType === "GROOM_SIDE") return ["GROOM"];
  if (eventSide === "BRIDE") return ["BRIDE"];
  if (eventSide === "GROOM") return ["GROOM"];
  return ["BRIDE", "GROOM", "BOTH"];
}

export function createTaskFormSchema(managementType: WeddingManagementType, events: WeddingEvent[]) {
  return taskFormSchema.superRefine((value, context) => {
    const event = value.eventId ? events.find((item) => item.id === value.eventId) : undefined;
    if (value.eventId && !event) {
      context.addIssue({ code: "custom", message: "Choose an Event from this Wedding.", path: ["eventId"] });
      return;
    }
    if (!taskSidesFor(managementType, event?.side).includes(value.side)) {
      context.addIssue({ code: "custom", message: "Choose a Task Side that matches the selected Event.", path: ["side"] });
    }
  });
}

export function toTaskRequest(values: TaskFormValues): CreateTaskRequest {
  return {
    name: values.name,
    description: values.description || null,
    side: values.side,
    dueDate: values.dueDate || null,
    eventId: values.eventId || null,
  };
}

export function taskToFormValues(task: WeddingTask): TaskFormValues {
  return {
    name: task.name,
    description: task.description ?? "",
    side: task.side,
    dueDate: task.dueDate ?? "",
    eventId: task.eventId ?? "",
  };
}
