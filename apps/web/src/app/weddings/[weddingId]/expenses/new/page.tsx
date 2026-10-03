import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { BudgetWeddingGate } from "@/components/budget/budget-wedding-gate";

export const metadata: Metadata = { title: "Add Expense | Make My Marriage" };

export default async function AddExpensePage({ params, searchParams }: { params: Promise<{ weddingId: string }>; searchParams: Promise<{ eventId?: string; returnTo?: string }> }) {
  const { weddingId } = await params;
  const query = await searchParams;
  const returnTo = `/weddings/${weddingId}/expenses/new`;
  return <AuthenticatedOnly returnTo={returnTo}><BudgetWeddingGate initialEventId={query.eventId} navigationReturnTo={query.returnTo} returnTo={returnTo} view="create" weddingId={weddingId} /></AuthenticatedOnly>;
}
