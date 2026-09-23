import { z } from "zod";

export const APP_NAME = "Make My Marriage";
export const API_BASE_PATH = "/api/v1";

export const healthResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    status: z.literal("ok"),
    service: z.literal("make-my-marriage-api"),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const weddingManagementTypeSchema = z.enum(["BRIDE_SIDE", "GROOM_SIDE", "JOINT"]);
export const weddingMemberRoleSchema = z.enum(["OWNER", "ADMIN", "FAMILY_MEMBER", "COLLABORATOR"]);
export const weddingSideSchema = z.enum(["BRIDE", "GROOM", "BOTH"]);

export const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date in YYYY-MM-DD format.").refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Use a valid calendar date.");

export function getSriLankaTodayDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export const futureWeddingDateSchema = dateOnlySchema.refine(
  (value) => value >= getSriLankaTodayDate(),
  "Wedding date must be today or a future date.",
);

export const createWeddingRequestSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a wedding workspace name.").max(120, "Use 120 characters or fewer."),
    brideName: z.string().trim().min(1, "Enter the bride's name.").max(100, "Use 100 characters or fewer."),
    groomName: z.string().trim().min(1, "Enter the groom's name.").max(100, "Use 100 characters or fewer."),
    managementType: weddingManagementTypeSchema,
    mainWeddingDate: futureWeddingDateSchema.nullable(),
    creatorSide: weddingSideSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const requiredSide = value.managementType === "BRIDE_SIDE"
      ? "BRIDE"
      : value.managementType === "GROOM_SIDE"
        ? "GROOM"
        : undefined;

    if (requiredSide && value.creatorSide !== requiredSide) {
      context.addIssue({
        code: "custom",
        message: `${value.managementType === "BRIDE_SIDE" ? "Bride Side" : "Groom Side"} weddings require the matching creator side.`,
        path: ["creatorSide"],
      });
    }
  });

export const weddingMemberContextSchema = z.object({
  role: weddingMemberRoleSchema,
  side: weddingSideSchema,
});

export const weddingWorkspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  brideName: z.string(),
  groomName: z.string(),
  managementType: weddingManagementTypeSchema,
  mainWeddingDate: dateOnlySchema.nullable(),
  member: weddingMemberContextSchema,
});

export const createWeddingResponseSchema = z.object({
  success: z.literal(true),
  data: weddingWorkspaceSchema,
});

export const weddingListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(weddingWorkspaceSchema),
});

export const weddingDetailResponseSchema = createWeddingResponseSchema;

export const updateWeddingRequestSchema = z.object({
  name: z.string().trim().min(1, "Enter a wedding workspace name.").max(120, "Use 120 characters or fewer.").optional(),
  brideName: z.string().trim().min(1, "Enter the bride's name.").max(100, "Use 100 characters or fewer.").optional(),
  groomName: z.string().trim().min(1, "Enter the groom's name.").max(100, "Use 100 characters or fewer.").optional(),
  mainWeddingDate: futureWeddingDateSchema.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, { message: "Provide at least one wedding field to update." });

const eventTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a valid time in HH:mm format.");

const eventWritableShape = {
  name: z.string().trim().min(1, "Enter an event name.").max(120, "Use 120 characters or fewer."),
  description: z.string().trim().max(1000, "Use 1,000 characters or fewer.").nullable().optional(),
  side: weddingSideSchema,
  eventDate: dateOnlySchema.nullable().optional(),
  startTime: eventTimeSchema.nullable().optional(),
  endTime: eventTimeSchema.nullable().optional(),
  venueName: z.string().trim().max(160, "Use 160 characters or fewer.").nullable().optional(),
  address: z.string().trim().max(500, "Use 500 characters or fewer.").nullable().optional(),
};

function validateEventSchedule(
  value: { eventDate?: string | null; startTime?: string | null; endTime?: string | null },
  context: z.RefinementCtx,
) {
  if ((value.startTime || value.endTime) && !value.eventDate) {
    context.addIssue({ code: "custom", message: "Add an event date before adding times.", path: ["eventDate"] });
  }
  if (value.endTime && !value.startTime) {
    context.addIssue({ code: "custom", message: "Add a start time before adding an end time.", path: ["startTime"] });
  }
  if (value.startTime && value.endTime && value.endTime <= value.startTime) {
    context.addIssue({ code: "custom", message: "End time must be later than start time on the same day.", path: ["endTime"] });
  }
}

export const createEventRequestSchema = z.object(eventWritableShape).strict().superRefine(validateEventSchedule);

export const updateEventRequestSchema = z.object(eventWritableShape).partial().strict().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Provide at least one event field to update." },
);

export const eventSchema = z.object({
  id: z.string().uuid(),
  weddingId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  side: weddingSideSchema,
  eventDate: dateOnlySchema.nullable(),
  startTime: eventTimeSchema.nullable(),
  endTime: eventTimeSchema.nullable(),
  venueName: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const eventResponseSchema = z.object({ success: z.literal(true), data: eventSchema });
export const eventListResponseSchema = z.object({ success: z.literal(true), data: z.array(eventSchema) });

export type CreateWeddingRequest = z.infer<typeof createWeddingRequestSchema>;
export type UpdateWeddingRequest = z.infer<typeof updateWeddingRequestSchema>;
export type CreateEventRequest = z.infer<typeof createEventRequestSchema>;
export type UpdateEventRequest = z.infer<typeof updateEventRequestSchema>;
export type WeddingEvent = z.infer<typeof eventSchema>;
export type WeddingManagementType = z.infer<typeof weddingManagementTypeSchema>;
export type WeddingMemberRole = z.infer<typeof weddingMemberRoleSchema>;
export type WeddingSide = z.infer<typeof weddingSideSchema>;
export type WeddingWorkspace = z.infer<typeof weddingWorkspaceSchema>;
