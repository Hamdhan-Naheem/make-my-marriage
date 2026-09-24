import type { WeddingManagementType, WeddingSide } from "@make-my-marriage/shared";

export function isSideAllowedForWedding(side: WeddingSide, managementType: WeddingManagementType): boolean {
  if (managementType === "BRIDE_SIDE") return side === "BRIDE";
  if (managementType === "GROOM_SIDE") return side === "GROOM";
  return true;
}

export function isTaskSideAllowedForEvent(taskSide: WeddingSide, eventSide: WeddingSide): boolean {
  if (eventSide === "BRIDE") return taskSide === "BRIDE";
  if (eventSide === "GROOM") return taskSide === "GROOM";
  return true;
}
