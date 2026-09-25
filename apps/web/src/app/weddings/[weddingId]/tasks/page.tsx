import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { TaskWeddingGate } from "@/components/tasks/task-wedding-gate";

export const metadata: Metadata = { title: "Task Planner | Make My Marriage" };

export default async function TasksPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = await params;
  const returnTo = `/weddings/${weddingId}/tasks`;
  return <AuthenticatedOnly returnTo={returnTo}><TaskWeddingGate returnTo={returnTo} view="overview" weddingId={weddingId} /></AuthenticatedOnly>;
}
