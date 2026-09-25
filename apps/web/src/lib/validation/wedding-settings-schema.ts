import { futureWeddingDateSchema } from "@make-my-marriage/shared";
import { z } from "zod";

export const weddingSettingsSchema = z.object({
  name: z.string().trim().min(1, "Enter a wedding workspace name.").max(120, "Use 120 characters or fewer."),
  brideName: z.string().trim().min(1, "Enter the bride's name.").max(100, "Use 100 characters or fewer."),
  groomName: z.string().trim().min(1, "Enter the groom's name.").max(100, "Use 100 characters or fewer."),
  mainWeddingDate: z.union([z.literal(""), futureWeddingDateSchema]),
});

export type WeddingSettingsValues = z.infer<typeof weddingSettingsSchema>;
