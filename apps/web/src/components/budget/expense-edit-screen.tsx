"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeddingEvent, WeddingExpense } from "@make-my-marriage/shared";
import type { BudgetWeddingContext } from "@/components/budget/budget-wedding-gate";
import { ExpenseForm } from "@/components/budget/expense-form";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { ApiError, getExpense, listEvents, updateExpense } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { expenseToFormValues, toExpenseRequest, type ExpenseFormValues } from "@/lib/validation/expense-schema";

export function ExpenseEditScreen({ context, expenseId, navigationReturnTo }: { context: BudgetWeddingContext; expenseId: string; navigationReturnTo?: string }) {
  const router = useRouter();
  const { wedding, ownerName } = context;
  const fallback = `/weddings/${wedding.id}/budget`;
  const backPath = navigationReturnTo?.startsWith(`/weddings/${wedding.id}/`) ? navigationReturnTo : fallback;
  const handleTerminalAuth = useTerminalAuthRedirect(`/weddings/${wedding.id}/expenses/${expenseId}/edit`);
  const [data, setData] = useState<{ expense: WeddingExpense; events: WeddingEvent[] }>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    Promise.all([getExpense(wedding.id, expenseId), listEvents(wedding.id)])
      .then(([expense, events]) => { if (active) setData({ expense, events }); })
      .catch((requestError: unknown) => {
        if (!active || handleTerminalAuth(requestError)) return;
        setError(requestError instanceof ApiError && requestError.status === 404 ? "This Expense was not found in the selected wedding." : "The Expense could not be loaded. Please try again.");
      });
    return () => { active = false; };
  }, [expenseId, handleTerminalAuth, wedding.id]);

  async function submit(values: ExpenseFormValues) {
    try {
      await updateExpense(wedding.id, expenseId, toExpenseRequest(values));
      router.push(backPath);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) throw requestError;
    }
  }

  return <WeddingWorkspaceShell activeItem="Budget & Expenses" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8"><button className="min-h-11 rounded-lg px-2 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5]" onClick={() => router.push(backPath)} type="button">← Back</button><div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Expense record</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Edit Expense</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Update the record while keeping its Wedding and Event side rules intact.</p></div>
      {!data && !error ? <Status message="Loading Expense…" /> : error ? <Status message={error} retry={() => window.location.reload()} /> : data && wedding.currency ? <ExpenseForm currency={wedding.currency} events={data.events} initialValues={expenseToFormValues(data.expense)} managementType={wedding.managementType} mode="edit" onCancel={() => router.push(backPath)} onSubmit={submit} /> : null}
    </main>
  </WeddingWorkspaceShell>;
}

function Status({ message, retry }: { message: string; retry?: () => void }) { return <section className="rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center"><p aria-live="polite" className="text-sm text-[#665456]">{message}</p>{retry ? <button className="mt-4 min-h-11 rounded-lg bg-[#852c3a] px-4 text-sm font-bold text-white" onClick={retry} type="button">Try again</button> : null}</section>; }
