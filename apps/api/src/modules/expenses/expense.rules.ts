import type { WeddingManagementType, WeddingSide } from "@make-my-marriage/shared";
import { RequestValidationError } from "../../shared/errors.js";

export function isSideAllowedForWedding(side: WeddingSide, managementType: WeddingManagementType): boolean {
  if (managementType === "BRIDE_SIDE") return side === "BRIDE";
  if (managementType === "GROOM_SIDE") return side === "GROOM";
  return true;
}

export function isSideAllowedForEvent(side: WeddingSide, eventSide: WeddingSide): boolean {
  return eventSide === "BOTH" || side === eventSide;
}

export function validateExpenseSide(
  side: WeddingSide,
  managementType: WeddingManagementType,
  eventSide?: WeddingSide,
) {
  if (!isSideAllowedForWedding(side, managementType)) {
    const required = managementType === "BRIDE_SIDE" ? "BRIDE" : "GROOM";
    throw new RequestValidationError({ side: [`${managementType === "BRIDE_SIDE" ? "Bride Side" : "Groom Side"} weddings require Expense Side ${required}.`] });
  }
  if (eventSide && !isSideAllowedForEvent(side, eventSide)) {
    throw new RequestValidationError({ side: [`Expense Side ${side} is not compatible with this ${eventSide} Event.`] });
  }
}
