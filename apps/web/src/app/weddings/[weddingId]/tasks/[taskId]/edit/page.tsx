import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { TaskWeddingGate } from "@/components/tasks/task-wedding-gate";

export const metadata: Metadata = { title: "Edit task | Make My Marriage" };

export default async function EditTaskPage({ params, searchParams }: { params: Promise<{ weddingId: string; taskId: string }>; searchParams: Promise<{ returnTo?: string }> }) {
  const { weddingId, taskId } = await params;
  const query = await searchParams;
  const returnTo = `/weddings/${weddingId}/tasks/${taskId}/edit`;
  const safeNavigationReturn = query.returnTo?.startsWith(`/weddings/${weddingId}/`) ? query.returnTo : undefined;
  return <AuthenticatedOnly returnTo={returnTo}><TaskWeddingGate navigationReturnTo={safeNavigationReturn} returnTo={returnTo} taskId={taskId} view="edit" weddingId={weddingId} /></AuthenticatedOnly>;
}
