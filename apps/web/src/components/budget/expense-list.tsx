"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import type { WeddingCurrency, WeddingEvent, WeddingExpense } from "@make-my-marriage/shared";
import { formatMoney } from "@/lib/money";

export function ExpenseList({ currency, emptyMessage, events, expenses, onDelete, returnTo, weddingId }: {
  currency: WeddingCurrency;
  emptyMessage: string;
  events: WeddingEvent[];
  expenses: WeddingExpense[];
  onDelete: (expense: WeddingExpense) => void;
  returnTo: string;
  weddingId: string;
}) {
  const eventNames = new Map(events.map((event) => [event.id, event.name]));
  if (expenses.length === 0) return <div className="rounded-xl border border-dashed border-[#d9c9ca] bg-[#fcf9f8] px-5 py-10 text-center text-sm text-[#665456]">{emptyMessage}</div>;
  return <ul className="divide-y divide-[#eee6e2] overflow-hidden rounded-xl border border-[#e8dfd8] bg-white">
    {expenses.map((expense) => (
      <li className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5" key={expense.id}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-bold text-[#302526]">{expense.name}</h3><Badge>{sideLabel(expense.side)}</Badge>{expense.category ? <Badge tone="muted">{expense.category}</Badge> : null}</div>
          <p className="mt-2 text-sm text-[#665456]">{expense.eventId ? eventNames.get(expense.eventId) ?? "Linked Event" : "Wedding-wide"}{expense.expenseDate ? ` · ${formatExpenseDate(expense.expenseDate)}` : ""}</p>
          {expense.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#776566]">{expense.description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:flex-col sm:items-end">
          <p className="text-lg font-bold tabular-nums text-[#671525]">{formatMoney(expense.amount, currency)}</p>
          <div className="flex gap-2">
            <Link className="inline-flex min-h-11 items-center rounded-lg border border-[#d9c9ca] px-3 text-sm font-bold text-[#852c3a] hover:bg-[#fff7f6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" href={`/weddings/${weddingId}/expenses/${expense.id}/edit?returnTo=${encodeURIComponent(returnTo)}`}>Edit</Link>
            <button className="min-h-11 rounded-lg px-3 text-sm font-bold text-[#a22531] hover:bg-[#fff2f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a22531]" onClick={() => onDelete(expense)} type="button">Delete</button>
          </div>
        </div>
      </li>
    ))}
  </ul>;
}

export function ExpenseDeleteDialog({ busy, expense, onCancel, onConfirm }: { busy: boolean; expense?: WeddingExpense; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expense && !dialog.open) dialog.showModal();
    if (!expense && dialog.open) dialog.close();
  }, [expense]);
  return <dialog aria-labelledby="delete-expense-title" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#e8dfd8] bg-white p-0 text-[#1b1c1c] shadow-2xl backdrop:bg-black/35" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }} ref={dialogRef}>
    <div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a22531]">Delete Expense</p><h2 className="mt-2 text-xl font-bold" id="delete-expense-title">Delete {expense?.name}?</h2><p className="mt-3 text-sm leading-6 text-[#665456]">This permanently removes the Expense. Wedding and Event budgets will remain unchanged.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button className="min-h-11 rounded-xl px-4 text-sm font-bold text-[#554243] hover:bg-[#f6f3f2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" disabled={busy} onClick={onCancel} type="button">Cancel</button><button className="min-h-11 rounded-xl bg-[#a22531] px-4 text-sm font-bold text-white hover:bg-[#7f1824] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#a22531] disabled:opacity-60" disabled={busy} onClick={onConfirm} type="button">{busy ? "Deleting…" : "Delete Expense"}</button></div></div>
  </dialog>;
}

export function formatExpenseDate(value: string) {
  return new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function sideLabel(side: WeddingExpense["side"]) {
  return side === "BOTH" ? "Both Sides" : side === "BRIDE" ? "Bride Side" : "Groom Side";
}

function Badge({ children, tone = "side" }: { children: ReactNode; tone?: "side" | "muted" }) {
  return <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold ${tone === "side" ? "bg-[#ffdad2] text-[#703628]" : "bg-[#eae7e7] text-[#665456]"}`}>{children}</span>;
}
