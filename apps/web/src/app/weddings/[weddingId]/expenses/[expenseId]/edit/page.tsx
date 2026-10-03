import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { BudgetWeddingGate } from "@/components/budget/budget-wedding-gate";

export const metadata: Metadata = { title: "Edit Expense | Make My Marriage" };

export default async function EditExpensePage({ params, searchParams }: { params: Promise<{ weddingId: string; expenseId: string }>; searchParams: Promise<{ returnTo?: string }> }) {
  const { weddingId, expenseId } = await params;
  const query = await searchParams;
  const returnTo = `/weddings/${weddingId}/expenses/${expenseId}/edit`;
  return <AuthenticatedOnly returnTo={returnTo}><BudgetWeddingGate expenseId={expenseId} navigationReturnTo={query.returnTo} returnTo={returnTo} view="edit" weddingId={weddingId} /></AuthenticatedOnly>;
}
