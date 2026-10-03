"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeddingEvent } from "@make-my-marriage/shared";
import type { BudgetWeddingContext } from "@/components/budget/budget-wedding-gate";
import { ExpenseForm } from "@/components/budget/expense-form";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { createExpense, listEvents } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { toExpenseRequest, type ExpenseFormValues } from "@/lib/validation/expense-schema";

export function ExpenseCreateScreen({ context, initialEventId, navigationReturnTo }: { context: BudgetWeddingContext; initialEventId?: string; navigationReturnTo?: string }) {
  const router = useRouter();
  const { wedding, ownerName } = context;
  const fallback = `/weddings/${wedding.id}/budget`;
  const backPath = navigationReturnTo?.startsWith(`/weddings/${wedding.id}/`) ? navigationReturnTo : fallback;
  const handleTerminalAuth = useTerminalAuthRedirect(`/weddings/${wedding.id}/expenses/new`);
  const [events, setEvents] = useState<WeddingEvent[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    listEvents(wedding.id).then((result) => { if (active) setEvents(result); }).catch((requestError: unknown) => { if (active && !handleTerminalAuth(requestError)) setError("Events could not be loaded. Please try again."); });
    return () => { active = false; };
  }, [handleTerminalAuth, wedding.id]);

  async function submit(values: ExpenseFormValues) {
    try {
      await createExpense(wedding.id, toExpenseRequest(values));
      router.push(backPath);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) throw requestError;
    }
  }

  return <WeddingWorkspaceShell activeItem="Budget & Expenses" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
    <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8"><button className="min-h-11 rounded-lg px-2 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5]" onClick={() => router.push(backPath)} type="button">← Back</button><div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Expense record</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Add Expense</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Record a Wedding-wide or Event-specific Expense. Exceeding a budget shows a warning and does not block saving.</p></div>
      {!wedding.currency ? <section className="rounded-2xl border border-[#d9c9ca] bg-white p-7 text-center"><h2 className="text-xl font-bold">Choose a Wedding currency first</h2><button className="mt-5 min-h-11 rounded-xl bg-[#852c3a] px-5 text-sm font-bold text-white" onClick={() => router.push(`/weddings/${wedding.id}/budget/settings`)} type="button">Open Budget Settings</button></section> : !events && !error ? <Status message="Loading Expense form…" /> : error ? <Status message={error} retry={() => window.location.reload()} /> : events ? <ExpenseForm currency={wedding.currency} events={events} initialEventId={events.some((event) => event.id === initialEventId) ? initialEventId : undefined} managementType={wedding.managementType} mode="create" onCancel={() => router.push(backPath)} onSubmit={submit} /> : null}
    </main>
  </WeddingWorkspaceShell>;
}

function Status({ message, retry }: { message: string; retry?: () => void }) { return <section className="rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center"><p aria-live="polite" className="text-sm text-[#665456]">{message}</p>{retry ? <button className="mt-4 min-h-11 rounded-lg bg-[#852c3a] px-4 text-sm font-bold text-white" onClick={retry} type="button">Try again</button> : null}</section>; }
