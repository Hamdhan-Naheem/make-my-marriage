import type { HealthResponse } from "@make-my-marriage/shared";

export function getHealth(): HealthResponse {
  return {
    success: true,
    data: { status: "ok", service: "make-my-marriage-api" },
  };
}
