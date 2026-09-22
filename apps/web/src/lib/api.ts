import {
  API_BASE_PATH,
  createWeddingResponseSchema,
  healthResponseSchema,
  weddingDetailResponseSchema,
  weddingListResponseSchema,
  type CreateWeddingRequest,
  type WeddingWorkspace,
} from "@make-my-marriage/shared";

export type SafeUser = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
};

type ApiErrorBody = {
  success?: false;
  error?: {
    code?: string;
    message?: string;
    fields?: Record<string, string[]>;
  };
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let body: ApiErrorBody | undefined;
  try {
    body = await response.json() as ApiErrorBody;
  } catch {
    // Use the safe fallback below for non-JSON proxy or server errors.
  }

  return new ApiError(
    response.status,
    body?.error?.code ?? "REQUEST_FAILED",
    body?.error?.message ?? "The request could not be completed. Please try again.",
    body?.error?.fields,
  );
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_PATH}${path}`, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
}

// Browser-side helper: Next.js forwards this same-origin URL to Express.
export async function getApiHealth() {
  const response = await fetch(`${API_BASE_PATH}/health`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`API health request failed (${response.status}).`);
  }

  return healthResponseSchema.parse(await response.json());
}

export async function registerAccount(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<string> {
  const response = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) throw await parseError(response);
  const body = await response.json() as { data: { message: string } };
  return body.data.message;
}

export async function verifyEmail(token: string): Promise<string> {
  const response = await request("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw await parseError(response);
  const body = await response.json() as { data: { message: string } };
  return body.data.message;
}

export async function resendVerification(email: string): Promise<string> {
  const response = await request("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw await parseError(response);
  const body = await response.json() as { data: { message: string } };
  return body.data.message;
}

export async function login(input: { email: string; password: string }): Promise<SafeUser> {
  const response = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  if (!response.ok) throw await parseError(response);
  const body = await response.json() as { data: { user: SafeUser } };
  return body.data.user;
}

let refreshInFlight: Promise<boolean> | undefined;

async function refreshOnce(): Promise<boolean> {
  refreshInFlight ??= request("/auth/refresh", { method: "POST" })
    .then((response) => response.ok || response.status === 409)
    .finally(() => {
      refreshInFlight = undefined;
    });

  return refreshInFlight;
}

async function authenticatedRequest(path: string, init?: RequestInit): Promise<Response> {
  let response = await request(path, init);
  if (response.status === 401 && await refreshOnce()) response = await request(path, init);
  return response;
}

export async function getCurrentUser(): Promise<SafeUser> {
  const response = await authenticatedRequest("/auth/me");

  if (!response.ok) throw await parseError(response);
  const body = await response.json() as { data: SafeUser };
  return body.data;
}

export async function logout(): Promise<void> {
  const response = await request("/auth/logout", { method: "POST" });
  if (!response.ok) throw await parseError(response);
}

export async function createWedding(input: CreateWeddingRequest): Promise<WeddingWorkspace> {
  const response = await authenticatedRequest("/weddings", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) throw await parseError(response);
  return createWeddingResponseSchema.parse(await response.json()).data;
}

export async function listWeddings(): Promise<WeddingWorkspace[]> {
  const response = await authenticatedRequest("/weddings");
  if (!response.ok) throw await parseError(response);
  return weddingListResponseSchema.parse(await response.json()).data;
}

export async function getWedding(weddingId: string): Promise<WeddingWorkspace> {
  const response = await authenticatedRequest(`/weddings/${encodeURIComponent(weddingId)}`);
  if (!response.ok) throw await parseError(response);
  return weddingDetailResponseSchema.parse(await response.json()).data;
}
