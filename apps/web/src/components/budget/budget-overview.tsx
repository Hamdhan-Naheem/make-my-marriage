"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BudgetSummary, WeddingEvent, WeddingExpense, WeddingSide } from "@make-my-marriage/shared";
import type { BudgetWeddingContext } from "@/components/budget/budget-wedding-gate";
import { ExpenseDeleteDialog, ExpenseList } from "@/components/budget/expense-list";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { deleteExpense, getBudgetSummary, listEvents, listExpenses } from "@/lib/api";
import { formatMoney, moneyProgressPercent } from "@/lib/money";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";

type Filters = { eventId: string; side: "" | WeddingSide; category: string };

export function BudgetOverview({ context }: { context: BudgetWeddingContext }) {
  const { wedding, ownerName } = context;
  const returnTo = `/weddings/${wedding.id}/budget`;
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const [events, setEvents] = useState<WeddingEvent[]>();
  const [summary, setSummary] = useState<BudgetSummary>();
  const [expenses, setExpenses] = useState<WeddingExpense[]>();
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<Filters>({ eventId: "", side: "", category: "" });
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [deleteCandidate, setDeleteCandidate] = useState<WeddingExpense>();
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const eventData = await listEvents(wedding.id);
      setEvents(eventData);
      if (!wedding.currency) {
        setSummary(undefined);
        setExpenses([]);
        setError(undefined);
        return;
      }
      const [summaryData, expenseData] = await Promise.all([
        getBudgetSummary(wedding.id),
        listExpenses(wedding.id, {
          eventId: appliedFilters.eventId || undefined,
          side: appliedFilters.side || undefined,
          category: appliedFilters.category.trim() || undefined,
          page,
          limit: 20,
        }),
      ]);
      setSummary(summaryData);
      setExpenses(expenseData.expenses);
      setMeta(expenseData.meta);
      setError(undefined);
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("Budget and Expenses could not be loaded. Please try again.");
    }
  }, [appliedFilters, handleTerminalAuth, page, wedding.currency, wedding.id]);

  useEffect(() => {
    let active = true;
    listEvents(wedding.id)
      .then(async (eventData) => {
        if (!active) return;
        setEvents(eventData);
        if (!wedding.currency) {
          setExpenses([]);
          setError(undefined);
          return;
        }
        const [summaryData, expenseData] = await Promise.all([
          getBudgetSummary(wedding.id),
          listExpenses(wedding.id, {
            eventId: appliedFilters.eventId || undefined,
            side: appliedFilters.side || undefined,
            category: appliedFilters.category.trim() || undefined,
            page,
            limit: 20,
          }),
        ]);
        if (!active) return;
        setSummary(summaryData);
        setExpenses(expenseData.expenses);
        setMeta(expenseData.meta);
        setError(undefined);
      })
      .catch((requestError: unknown) => {
        if (active && !handleTerminalAuth(requestError)) setError("Budget and Expenses could not be loaded. Please try again.");
      });
    return () => { active = false; };
  }, [appliedFilters, handleTerminalAuth, page, wedding.currency, wedding.id]);

  async function confirmDelete() {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      await deleteExpense(wedding.id, deleteCandidate.id);
      setNotice(`${deleteCandidate.name} was deleted.`);
      setDeleteCandidate(undefined);
      if (expenses?.length === 1 && page > 1) setPage((value) => value - 1);
      else await load();
    } catch (requestError) {
      if (!handleTerminalAuth(requestError)) setError("The Expense could not be deleted. Please try again.");
    } finally { setDeleting(false); }
  }

  return <WeddingWorkspaceShell activeItem="Budget & Expenses" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
    <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Financial planning</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Budget & Expenses</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Track Wedding spending and Event allocations in one currency.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d9c9ca] bg-white px-4 text-sm font-bold text-[#852c3a] hover:bg-[#fff7f6]" href={`/weddings/${wedding.id}/budget/settings`}>Budget Settings</Link>{wedding.currency ? <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#852c3a] px-5 text-sm font-bold text-white hover:bg-[#671525]" href={`/weddings/${wedding.id}/expenses/new?returnTo=${encodeURIComponent(returnTo)}`}>+ Add Expense</Link> : null}</div></header>

      {!events && !error ? <StatusCard message="Loading Budget & Expenses…" /> : null}
      {error ? <StatusCard message={error} retry={() => void load()} /> : null}
      {events && !error && !wedding.currency ? <section className="mt-7 rounded-2xl border border-[#d9c9ca] bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Setup required</p><h2 className="mt-2 text-xl font-bold">Choose your Wedding currency</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#665456]">Select LKR, USD, AUD, or SGD before adding budgets or Expenses. You can change it freely until financial data exists.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#852c3a] px-5 text-sm font-bold text-white" href={`/weddings/${wedding.id}/budget/settings`}>Open Budget Settings</Link></section> : null}

      {events && summary && expenses && wedding.currency ? <>
        <section aria-labelledby="budget-summary-heading" className="mt-7 grid gap-4 md:grid-cols-3">
          <SummaryCard label="Overall budget" value={summary.overall.budgetAmount ? formatMoney(summary.overall.budgetAmount, summary.currency) : "Not set"} />
          <SummaryCard label="Total spent" value={formatMoney(summary.overall.spentAmount, summary.currency)} />
          <SummaryCard danger={summary.overall.isOverBudget === true} label={summary.overall.isOverBudget ? "Over budget by" : "Remaining"} value={summary.overall.isOverBudget ? formatMoney(summary.overall.overByAmount ?? "0.00", summary.currency) : summary.overall.remainingAmount ? formatMoney(summary.overall.remainingAmount, summary.currency) : "No overall limit"} />
        </section>
        <section className="mt-5 rounded-2xl border border-[#e8dfd8] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="budget-summary-heading">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold" id="budget-summary-heading">Overall Budget</h2><p className="mt-1 text-sm text-[#665456]">{formatMoney(summary.overall.allocatedEventBudgetAmount, summary.currency)} allocated to Events · {formatMoney(summary.overall.weddingWideSpentAmount, summary.currency)} Wedding-wide spending</p></div>{summary.overall.isOverBudget ? <span className="rounded-full bg-[#ffdad6] px-3 py-1 text-xs font-bold text-[#93000a]">Warning: spending is over budget</span> : null}</div>
          {summary.overall.budgetAmount ? <div className="mt-5"><div className="h-2 overflow-hidden rounded-full bg-[#e8dfd8]"><div className={`h-full rounded-full ${summary.overall.isOverBudget ? "bg-[#ba1a1a]" : "bg-[#852c3a]"}`} style={{ width: `${moneyProgressPercent(summary.overall.spentAmount, summary.overall.budgetAmount)}%` }} /></div><p className="mt-2 text-xs text-[#776566]">{summary.overall.unallocatedBudgetAmount !== null ? `${formatMoney(summary.overall.unallocatedBudgetAmount, summary.currency)} remains unallocated to Events.` : ""}</p></div> : <p className="mt-4 rounded-xl bg-[#f6f3f2] p-4 text-sm text-[#665456]">Expenses are tracked without an overall spending limit. Event budgets may still be set independently.</p>}
        </section>

        <section className="mt-6 rounded-2xl border border-[#e8dfd8] bg-white p-5 shadow-sm sm:p-6" aria-labelledby="event-allocations-heading"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Allocations</p><h2 className="mt-2 text-lg font-bold" id="event-allocations-heading">Event Budgets</h2></div><span className="text-xs font-semibold text-[#776566]">{summary.events.length} Events</span></div>{summary.events.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-[#d9c9ca] p-6 text-center text-sm text-[#665456]">No Events have been created yet.</p> : <ul className="mt-5 grid gap-3 md:grid-cols-2">{summary.events.map((event) => <li className="rounded-xl border border-[#eee6e2] bg-[#fcf9f8] p-4" key={event.eventId}><div className="flex items-start justify-between gap-3"><div><Link className="font-bold text-[#302526] hover:text-[#852c3a] hover:underline" href={`/weddings/${wedding.id}/events/${event.eventId}`}>{event.eventName}</Link><p className="mt-1 text-xs text-[#776566]">{event.budgetAmount ? `${formatMoney(event.spentAmount, summary.currency)} of ${formatMoney(event.budgetAmount, summary.currency)}` : `${formatMoney(event.spentAmount, summary.currency)} spent · No Event budget`}</p></div>{event.isOverBudget ? <span className="shrink-0 rounded-full bg-[#ffdad6] px-2.5 py-1 text-[0.68rem] font-bold text-[#93000a]">Over by {formatMoney(event.overByAmount ?? "0.00", summary.currency)}</span> : null}</div>{event.budgetAmount ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e8dfd8]"><div className={`h-full rounded-full ${event.isOverBudget ? "bg-[#ba1a1a]" : "bg-[#c47a68]"}`} style={{ width: `${moneyProgressPercent(event.spentAmount, event.budgetAmount)}%` }} /></div> : null}</li>)}</ul>}</section>

        <section className="mt-6" aria-labelledby="expenses-heading"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Records</p><h2 className="mt-2 text-xl font-bold" id="expenses-heading">Expenses</h2><p className="mt-1 text-sm text-[#665456]">{meta.total} {meta.total === 1 ? "Expense" : "Expenses"}</p></div></div>
          <form className="my-5 grid gap-3 rounded-2xl border border-[#e8dfd8] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={(event) => { event.preventDefault(); setPage(1); setAppliedFilters(filters); }}>
            <label className="text-xs font-bold text-[#554243]">Event<select className="mt-1.5 min-h-11 w-full rounded-lg border border-[#d9c9ca] bg-white px-3 text-sm font-normal" onChange={(event) => setFilters((value) => ({ ...value, eventId: event.target.value }))} value={filters.eventId}><option value="">All Expenses</option><option value="none">Wedding-wide only</option>{events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}</select></label>
            <label className="text-xs font-bold text-[#554243]">Side<select className="mt-1.5 min-h-11 w-full rounded-lg border border-[#d9c9ca] bg-white px-3 text-sm font-normal" onChange={(event) => setFilters((value) => ({ ...value, side: event.target.value as Filters["side"] }))} value={filters.side}><option value="">All sides</option><option value="BRIDE">Bride Side</option><option value="GROOM">Groom Side</option><option value="BOTH">Both Sides</option></select></label>
            <label className="text-xs font-bold text-[#554243]">Category<input className="mt-1.5 min-h-11 w-full rounded-lg border border-[#d9c9ca] bg-white px-3 text-sm font-normal" maxLength={100} onChange={(event) => setFilters((value) => ({ ...value, category: event.target.value }))} placeholder="Exact category" value={filters.category} /></label>
            <div className="flex items-end gap-2"><button className="min-h-11 flex-1 rounded-lg bg-[#852c3a] px-4 text-sm font-bold text-white" type="submit">Apply filters</button><button className="min-h-11 rounded-lg px-3 text-sm font-bold text-[#665456] hover:bg-[#f6f3f2]" onClick={() => { const clear: Filters = { eventId: "", side: "", category: "" }; setFilters(clear); setAppliedFilters(clear); setPage(1); }} type="button">Clear</button></div>
          </form>
          {notice ? <p aria-live="polite" className="mb-4 rounded-xl bg-[#fff7f6] px-4 py-3 text-sm font-semibold text-[#671525]">{notice}</p> : null}
          <ExpenseList currency={summary.currency} emptyMessage="No Expenses match these filters." events={events} expenses={expenses} onDelete={setDeleteCandidate} returnTo={returnTo} weddingId={wedding.id} />
          {meta.totalPages > 1 ? <nav aria-label="Expense pages" className="mt-6 flex items-center justify-between"><button className="min-h-11 rounded-lg border border-[#d9c9ca] bg-white px-4 text-sm font-bold disabled:opacity-45" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} type="button">Previous</button><span className="text-xs font-semibold text-[#776566]">Page {meta.page} of {meta.totalPages}</span><button className="min-h-11 rounded-lg border border-[#d9c9ca] bg-white px-4 text-sm font-bold disabled:opacity-45" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)} type="button">Next</button></nav> : null}
        </section>
      </> : null}
      <ExpenseDeleteDialog busy={deleting} expense={deleteCandidate} onCancel={() => setDeleteCandidate(undefined)} onConfirm={() => void confirmDelete()} />
    </main>
  </WeddingWorkspaceShell>;
}

function SummaryCard({ danger, label, value }: { danger?: boolean; label: string; value: string }) { return <article className={`rounded-2xl border bg-white p-5 shadow-sm ${danger ? "border-[#e5b7b8]" : "border-[#e8dfd8]"}`}><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#776566]">{label}</p><p className={`mt-3 text-xl font-bold tabular-nums sm:text-2xl ${danger ? "text-[#a22531]" : "text-[#302526]"}`}>{value}</p></article>; }
function StatusCard({ message, retry }: { message: string; retry?: () => void }) { return <section className="mt-7 rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center shadow-sm"><p aria-live="polite" className="text-sm text-[#665456]">{message}</p>{retry ? <button className="mt-4 min-h-11 rounded-lg bg-[#852c3a] px-4 text-sm font-bold text-white" onClick={retry} type="button">Try again</button> : null}</section>; }
