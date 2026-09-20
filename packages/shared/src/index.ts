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
