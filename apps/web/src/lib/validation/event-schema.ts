import { z } from "zod";
import { dateOnlySchema, type WeddingManagementType, type WeddingSide } from "@make-my-marriage/shared";

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
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

export function eventSideForWedding(managementType: WeddingManagementType): WeddingSide | undefined {
  return managementType === "BRIDE_SIDE" ? "BRIDE" : managementType === "GROOM_SIDE" ? "GROOM" : undefined;
}

export function enforceWeddingEventSide(values: EventFormValues, managementType: WeddingManagementType): EventFormValues {
  const fixedSide = eventSideForWedding(managementType);
  return fixedSide ? { ...values, side: fixedSide } : values;
}
