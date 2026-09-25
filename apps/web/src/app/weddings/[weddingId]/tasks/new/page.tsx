import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { TaskWeddingGate } from "@/components/tasks/task-wedding-gate";

export const metadata: Metadata = { title: "Create task | Make My Marriage" };

export default async function CreateTaskPage({ params, searchParams }: { params: Promise<{ weddingId: string }>; searchParams: Promise<{ eventId?: string; returnTo?: string }> }) {
  const { weddingId } = await params;
  const query = await searchParams;
  const returnTo = `/weddings/${weddingId}/tasks/new`;
  const safeNavigationReturn = query.returnTo?.startsWith(`/weddings/${weddingId}/`) ? query.returnTo : undefined;
  return <AuthenticatedOnly returnTo={returnTo}><TaskWeddingGate initialEventId={query.eventId} navigationReturnTo={safeNavigationReturn} returnTo={returnTo} view="create" weddingId={weddingId} /></AuthenticatedOnly>;
}
