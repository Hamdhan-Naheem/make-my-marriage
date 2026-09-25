import {
  futureWeddingDateSchema,
  weddingManagementTypeSchema,
  weddingSideSchema,
  type WeddingManagementType as SharedWeddingManagementType,
  type WeddingSide,
} from "@make-my-marriage/shared";
import { z } from "zod";

export const weddingManagementTypes = ["BRIDE_SIDE", "GROOM_SIDE", "JOINT"] as const;
export const weddingCreatorSides = ["BRIDE", "GROOM", "BOTH"] as const;

export const weddingOnboardingSchema = z
  .object({
    managementType: weddingManagementTypeSchema,
    creatorSide: weddingSideSchema,
    brideName: z.string().trim().min(1, "Enter the bride's name.").max(100, "Use 100 characters or fewer."),
    groomName: z.string().trim().min(1, "Enter the groom's name.").max(100, "Use 100 characters or fewer."),
    workspaceName: z.string().trim().min(1, "Enter a wedding workspace name.").max(120, "Use 120 characters or fewer."),
    mainWeddingDate: z.union([z.literal(""), futureWeddingDateSchema]),
  })
  .superRefine((value, context) => {
    const expectedSide = value.managementType === "BRIDE_SIDE"
      ? "BRIDE"
      : value.managementType === "GROOM_SIDE"
        ? "GROOM"
        : undefined;

    if (expectedSide && value.creatorSide !== expectedSide) {
      context.addIssue({
        code: "custom",
        message: `The creator side must be ${expectedSide.toLowerCase()} for this wedding type.`,
        path: ["creatorSide"],
      });
    }
  });

export type WeddingOnboardingValues = z.infer<typeof weddingOnboardingSchema>;
export type WeddingManagementType = SharedWeddingManagementType;
export type WeddingCreatorSide = WeddingSide;
