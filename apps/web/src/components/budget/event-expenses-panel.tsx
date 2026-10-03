"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WeddingCurrency, WeddingEvent, WeddingExpense } from "@make-my-marriage/shared";
import { ExpenseDeleteDialog, ExpenseList } from "@/components/budget/expense-list";
import { deleteExpense, getBudgetSummary, listExpenses } from "@/lib/api";
import { formatMoney, moneyProgressPercent } from "@/lib/money";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";

export function EventExpensesPanel({ currency, event, weddingId }: { currency?: WeddingCurrency | null; event: WeddingEvent; weddingId: string }) {
  const returnTo = `/weddings/${weddingId}/events/${event.id}`;
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const [expenses, setExpenses] = useState<WeddingExpense[] | undefined>(currency ? undefined : []);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [position, setPosition] = useState<{ spentAmount: string; remainingAmount: string | null; isOverBudget: boolean | null; overByAmount: string | null }>();
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [candidate, setCandidate] = useState<WeddingExpense>();
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!currency) { setExpenses([]); return; }
    try {
      const [summary, result] = await Promise.all([
        getBudgetSummary(weddingId),
        listExpenses(weddingId, { eventId: event.id, page, limit: 20 }),
      ]);
      const eventPosition = summary.events.find((item) => item.eventId === event.id);
      setPosition(eventPosition);
      setExpenses(result.expenses);
      setMeta(result.meta);
      setError(undefined);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("Event financial details could not be loaded. Please try again.");
    }
  }, [currency, event.id, handleTerminalAuth, page, weddingId]);

  useEffect(() => {
    if (!currency) return;
    let active = true;
    Promise.all([
      getBudgetSummary(weddingId),
      listExpenses(weddingId, { eventId: event.id, page, limit: 20 }),
    ]).then(([summary, result]) => {
      if (!active) return;
      setPosition(summary.events.find((item) => item.eventId === event.id));
      setExpenses(result.expenses);
      setMeta(result.meta);
      setError(undefined);
    }).catch((requestError: unknown) => {
      if (active && !handleTerminalAuth(requestError)) setError("Event financial details could not be loaded. Please try again.");
    });
    return () => { active = false; };
  }, [currency, event.id, handleTerminalAuth, page, weddingId]);

  async function confirmDelete() {
    if (!candidate) return;
    setDeleting(true);
    try {
      await deleteExpense(weddingId, candidate.id);
      setNotice(`${candidate.name} was deleted.`);
      setCandidate(undefined);
      if (expenses?.length === 1 && page > 1) setPage((value) => value - 1);
      else await load();
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("The Expense could not be deleted. Please try again.");
    } finally { setDeleting(false); }
  }

  return <section aria-labelledby="event-expenses-title" className="mt-6 rounded-2xl border border-[#e8dfd8] bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Financials</p><h2 className="mt-2 text-lg font-bold text-[#671525]" id="event-expenses-title">Event Budget & Expenses</h2><p className="mt-1 text-sm text-[#665456]">Manage spending linked only to this Event.</p></div>{currency ? <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#852c3a] px-4 text-sm font-bold text-white hover:bg-[#671525] sm:w-auto" href={`/weddings/${weddingId}/expenses/new?eventId=${event.id}&returnTo=${encodeURIComponent(returnTo)}`}>+ Add Expense</Link> : <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9c9ca] px-4 text-sm font-bold text-[#852c3a]" href={`/weddings/${weddingId}/budget/settings`}>Set currency</Link>}</div>
    {!currency ? <p className="mt-5 rounded-xl bg-[#f6f3f2] p-4 text-sm text-[#665456]">Choose the Wedding currency before adding an Event budget or Expenses.</p> : null}
    {currency && !expenses && !error ? <p aria-live="polite" className="mt-5 rounded-xl bg-[#f6f3f2] px-4 py-6 text-center text-sm text-[#665456]">Loading Event financials…</p> : null}
    {error ? <div className="mt-5 rounded-xl border border-[#e5b7b8] bg-[#fff2f1] px-4 py-5 text-center"><p className="text-sm text-[#8b1f2d]" role="alert">{error}</p><button className="mt-3 min-h-11 rounded-lg bg-[#852c3a] px-4 text-xs font-bold text-white" onClick={() => void load()} type="button">Try again</button></div> : null}
    {currency && expenses && position ? <><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Event budget" value={event.budgetAmount ? formatMoney(event.budgetAmount, currency) : "Not set"} /><Metric label="Spent" value={formatMoney(position.spentAmount, currency)} /><Metric danger={position.isOverBudget === true} label={position.isOverBudget ? "Over budget by" : "Remaining"} value={position.isOverBudget ? formatMoney(position.overByAmount ?? "0.00", currency) : position.remainingAmount ? formatMoney(position.remainingAmount, currency) : "No Event limit"} /></div>{event.budgetAmount ? <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8dfd8]"><div className={`h-full rounded-full ${position.isOverBudget ? "bg-[#ba1a1a]" : "bg-[#852c3a]"}`} style={{ width: `${moneyProgressPercent(position.spentAmount, event.budgetAmount)}%` }} /></div> : null}{position.isOverBudget ? <p className="mt-3 rounded-xl bg-[#fff2f1] px-4 py-3 text-sm font-semibold text-[#93000a]">Warning only: this Event is over budget. Expenses remain editable.</p> : null}</> : null}
    {notice ? <p aria-live="polite" className="mt-5 rounded-xl bg-[#fff7f6] px-4 py-3 text-sm font-semibold text-[#671525]">{notice}</p> : null}
    {currency && expenses ? <div className="mt-5"><div className="mb-4 flex items-center justify-between gap-3"><h3 className="text-sm font-bold">Linked Expenses</h3><p className="text-xs font-semibold text-[#776566]">{meta.total} {meta.total === 1 ? "Expense" : "Expenses"}</p></div><ExpenseList currency={currency} emptyMessage="No Expenses are linked to this Event yet." events={[event]} expenses={expenses} onDelete={setCandidate} returnTo={returnTo} weddingId={weddingId} />{meta.totalPages > 1 ? <nav aria-label="Event Expense pages" className="mt-6 flex items-center justify-between"><button className="min-h-11 rounded-lg border border-[#d9c9ca] bg-white px-4 text-sm font-bold disabled:opacity-45" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button><span className="text-xs font-semibold text-[#776566]">Page {meta.page} of {meta.totalPages}</span><button className="min-h-11 rounded-lg border border-[#d9c9ca] bg-white px-4 text-sm font-bold disabled:opacity-45" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)} type="button">Next</button></nav> : null}</div> : null}
    <ExpenseDeleteDialog busy={deleting} expense={candidate} onCancel={() => setCandidate(undefined)} onConfirm={() => void confirmDelete()} />
  </section>;
}

function Metric({ danger, label, value }: { danger?: boolean; label: string; value: string }) { return <div className={`rounded-xl p-4 ${danger ? "bg-[#fff2f1]" : "bg-[#f6f3f2]"}`}><p className="text-xs font-bold uppercase tracking-wide text-[#776566]">{label}</p><p className={`mt-2 font-bold tabular-nums ${danger ? "text-[#a22531]" : "text-[#302526]"}`}>{value}</p></div>; }
