import { API_BASE_PATH, healthResponseSchema } from "@make-my-marriage/shared";

// Browser-side helper: Next.js forwards this same-origin URL to Express.
export async function getApiHealth() {
  const response = await fetch(`${API_BASE_PATH}/health`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`API health request failed (${response.status}).`);
  }

  return healthResponseSchema.parse(await response.json());
}
