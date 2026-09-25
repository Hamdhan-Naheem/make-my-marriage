import { z } from "zod";
import { dateOnlySchema, type CreateEventRequest, type WeddingEvent, type WeddingManagementType, type WeddingSide } from "@make-my-marriage/shared";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const eventFormSchema = z.object({
  name: z.string().trim().min(1, "Enter an event name.").max(120, "Use 120 characters or fewer."),
  description: z.string().trim().max(1000, "Use 1,000 characters or fewer."),
  side: z.enum(["BRIDE", "GROOM", "BOTH"], { error: "Choose which side this event belongs to." }),
  eventDate: z.string().refine((value) => value === "" || dateOnlySchema.safeParse(value).success, "Enter a valid event date."),
  startTime: z.string().refine((value) => value === "" || timePattern.test(value), "Enter a valid start time."),
  endTime: z.string().refine((value) => value === "" || timePattern.test(value), "Enter a valid end time."),
  venueName: z.string().trim().max(160, "Use 160 characters or fewer."),
  address: z.string().trim().max(500, "Use 500 characters or fewer."),
  tasks: z.array(z.object({
    name: z.string().trim().min(1, "Enter a task name.").max(140, "Use 140 characters or fewer."),
    description: z.string().trim().max(1000, "Use 1,000 characters or fewer."),
    side: z.enum(["BRIDE", "GROOM", "BOTH"], { error: "Choose a Task Side." }),
    dueDate: z.string().refine((value) => value === "" || dateOnlySchema.safeParse(value).success, "Enter a valid due date."),
  }).strict()).max(50, "Add no more than 50 Tasks while creating an Event."),
}).strict().superRefine((value, context) => {
  if ((value.startTime || value.endTime) && !value.eventDate) {
    context.addIssue({ code: "custom", message: "Add an event date before adding times.", path: ["eventDate"] });
  }
  if (value.endTime && !value.startTime) {
    context.addIssue({ code: "custom", message: "Add a start time before adding an end time.", path: ["startTime"] });
  }
  if (value.startTime && value.endTime && value.endTime <= value.startTime) {
    context.addIssue({ code: "custom", message: "End time must be later than start time on the same day.", path: ["endTime"] });
  }
  value.tasks.forEach((task, index) => {
    if (value.side !== "BOTH" && task.side !== value.side) {
      context.addIssue({ code: "custom", message: `This Task must use ${value.side === "BRIDE" ? "Bride Side" : "Groom Side"}.`, path: ["tasks", index, "side"] });
    }
  });
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

export function eventSideForWedding(managementType: WeddingManagementType): WeddingSide | undefined {
  return managementType === "BRIDE_SIDE" ? "BRIDE" : managementType === "GROOM_SIDE" ? "GROOM" : undefined;
}

export function enforceWeddingEventSide(values: EventFormValues, managementType: WeddingManagementType): EventFormValues {
  const fixedSide = eventSideForWedding(managementType);
  return fixedSide ? { ...values, side: fixedSide } : values;
}

export function toEventRequest(values: EventFormValues): CreateEventRequest {
  return {
    name: values.name,
    description: values.description || null,
    side: values.side,
    eventDate: values.eventDate || null,
    startTime: values.startTime || null,
    endTime: values.endTime || null,
    venueName: values.venueName || null,
    address: values.address || null,
    ...(values.tasks.length > 0 ? { tasks: values.tasks.map((task) => ({ name: task.name, description: task.description || null, side: task.side, dueDate: task.dueDate || null })) } : {}),
  };
}

export function eventToFormValues(event: WeddingEvent): EventFormValues {
  return {
    name: event.name,
    description: event.description ?? "",
    side: event.side,
    eventDate: event.eventDate ?? "",
    startTime: event.startTime ?? "",
    endTime: event.endTime ?? "",
    venueName: event.venueName ?? "",
    address: event.address ?? "",
    tasks: [],
  };
}
