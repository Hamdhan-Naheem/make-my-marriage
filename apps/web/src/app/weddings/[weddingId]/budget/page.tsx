import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { BudgetWeddingGate } from "@/components/budget/budget-wedding-gate";

export const metadata: Metadata = { title: "Budget & Expenses | Make My Marriage" };

export default async function BudgetPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = await params;
  const returnTo = `/weddings/${weddingId}/budget`;
  return <AuthenticatedOnly returnTo={returnTo}><BudgetWeddingGate returnTo={returnTo} view="overview" weddingId={weddingId} /></AuthenticatedOnly>;
}
