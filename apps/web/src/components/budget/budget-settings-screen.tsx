"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { BudgetSummary } from "@make-my-marriage/shared";
import type { BudgetWeddingContext } from "@/components/budget/budget-wedding-gate";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { ApiError, getBudgetSummary, listExpenses, updateWedding } from "@/lib/api";
import { formatMoney, isMoneyGreater, suggestCurrency } from "@/lib/money";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { budgetSettingsSchema, type BudgetSettingsValues } from "@/lib/validation/budget-schema";

const fieldClass = "mt-1.5 min-h-11 w-full rounded-lg border border-transparent bg-[#f6f3f2] px-3.5 text-sm text-[#302526] focus:border-[#852c3a] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#852c3a]/20 disabled:cursor-not-allowed disabled:bg-[#eae7e7] disabled:text-[#776566]";

export function BudgetSettingsScreen({ context }: { context: BudgetWeddingContext }) {
  const { wedding, ownerName } = context;
  const returnTo = `/weddings/${wedding.id}/budget/settings`;
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const [summary, setSummary] = useState<BudgetSummary>();
  const [expenseCount, setExpenseCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(wedding.currency));
  const [loadError, setLoadError] = useState<string>();

  useEffect(() => {
    if (!wedding.currency) return;
    let active = true;
    Promise.all([getBudgetSummary(wedding.id), listExpenses(wedding.id, { page: 1, limit: 1 })])
      .then(([budget, expenses]) => { if (active) { setSummary(budget); setExpenseCount(expenses.meta.total); setLoading(false); } })
      .catch((error: unknown) => { if (active && !handleTerminalAuth(error)) { setLoadError("Budget Settings could not be loaded. Please try again."); setLoading(false); } });
    return () => { active = false; };
  }, [handleTerminalAuth, wedding.currency, wedding.id]);

  const currencyLocked = Boolean(wedding.budgetAmount !== null && wedding.budgetAmount !== undefined)
    || Boolean(summary?.events.some((event) => event.budgetAmount !== null))
    || expenseCount > 0;

  return <WeddingWorkspaceShell activeItem="Budget & Expenses" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
    <main className="mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <Link className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5]" href={`/weddings/${wedding.id}/budget`}>← Back to Budget & Expenses</Link>
      <div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Financial settings</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Wedding Budget Settings</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Choose one Wedding currency and optionally set an overall spending limit.</p></div>
      {loading ? <Status message="Loading Budget Settings…" /> : loadError ? <Status message={loadError} retry={() => window.location.reload()} /> : <BudgetSettingsForm context={context} currencyLocked={currencyLocked} summary={summary} />}
    </main>
  </WeddingWorkspaceShell>;
}

function BudgetSettingsForm({ context, currencyLocked, summary }: { context: BudgetWeddingContext; currencyLocked: boolean; summary?: BudgetSummary }) {
  const router = useRouter();
  const { wedding } = context;
  const handleTerminalAuth = useTerminalAuthRedirect(`/weddings/${wedding.id}/budget/settings`);
  const [status, setStatus] = useState<string>();
  const { formState: { errors, isSubmitting }, handleSubmit, register, setError, setValue } = useForm<BudgetSettingsValues>({
    resolver: zodResolver(budgetSettingsSchema),
    defaultValues: { currency: wedding.currency ?? "LKR", budgetAmount: wedding.budgetAmount ?? "" },
  });
  const allocatedAmount = summary?.overall.allocatedEventBudgetAmount ?? "0.00";

  useEffect(() => {
    if (!wedding.currency) setValue("currency", suggestCurrency());
  }, [setValue, wedding.currency]);

  const submit = handleSubmit(async (values) => {
    setStatus(undefined);
    if (values.budgetAmount && isMoneyGreater(allocatedAmount, values.budgetAmount)) {
      setError("budgetAmount", { type: "validate", message: `Enter at least ${formatMoney(allocatedAmount, values.currency)} to cover current Event allocations, or clear the overall budget.` });
      return;
    }
    try {
      await updateWedding(wedding.id, { currency: values.currency, budgetAmount: values.budgetAmount || null });
      router.push(`/weddings/${wedding.id}/budget`);
    } catch (error) {
      if (handleTerminalAuth(error)) return;
      if (error instanceof ApiError && error.fields) {
        if (error.fields.currency?.[0]) setError("currency", { type: "server", message: error.fields.currency[0] });
        if (error.fields.budgetAmount?.[0]) setError("budgetAmount", { type: "server", message: error.fields.budgetAmount[0] });
      }
      setStatus(error instanceof ApiError ? error.message : "Budget Settings could not be saved. Please try again.");
    }
  });

  return <form className="rounded-2xl border border-[#eee6e2] bg-white p-5 shadow-sm sm:p-7" noValidate onChange={() => setStatus(undefined)} onSubmit={submit}>
    <div className="grid gap-6">
      <div><label className="text-sm font-semibold text-[#302526]" htmlFor="wedding-currency">Wedding currency <span className="text-[#852c3a]">*</span></label>{currencyLocked ? <><input type="hidden" {...register("currency")} /><div aria-describedby="currency-lock-help" aria-readonly="true" className={fieldClass} id="wedding-currency" role="textbox">{wedding.currency}</div></> : <select aria-describedby="currency-help" aria-invalid={Boolean(errors.currency)} className={fieldClass} id="wedding-currency" {...register("currency")}><option value="LKR">LKR — Sri Lankan Rupee</option><option value="USD">USD — US Dollar</option><option value="AUD">AUD — Australian Dollar</option><option value="SGD">SGD — Singapore Dollar</option></select>}{errors.currency ? <p className="mt-1.5 text-xs font-semibold text-[#a22531]" role="alert">{errors.currency.message}</p> : <p className="mt-1.5 text-xs leading-5 text-[#776566]" id={currencyLocked ? "currency-lock-help" : "currency-help"}>{currencyLocked ? "Currency is locked because this Wedding has a budget, Event budget, or Expense." : "Suggested from your browser region. You can choose another supported currency before saving."}</p>}</div>
      <div><label className="text-sm font-semibold text-[#302526]" htmlFor="overall-budget">Overall Wedding budget <span className="font-normal text-[#776566]">(Optional)</span></label><input aria-invalid={Boolean(errors.budgetAmount)} className={fieldClass} id="overall-budget" inputMode="decimal" placeholder="0.00" {...register("budgetAmount")} />{errors.budgetAmount ? <p className="mt-1.5 text-xs font-semibold text-[#a22531]" role="alert">{errors.budgetAmount.message}</p> : <p className="mt-1.5 text-xs leading-5 text-[#776566]">Use up to 2 decimal places. Leave empty to track spending without an overall limit.</p>}</div>
      <div className="rounded-xl border border-[#d9c9ca] bg-[#f8f2f0] p-4"><p className="text-sm font-bold text-[#671525]">Current Event allocations</p><p className="mt-1 text-lg font-bold tabular-nums">{formatMoney(allocatedAmount, wedding.currency ?? "LKR")}</p><p className="mt-2 text-xs leading-5 text-[#665456]">An overall budget cannot be lower than this amount. Clearing it is allowed and preserves every Event budget and Expense.</p></div>
    </div>
    {status ? <p className="mt-6 rounded-xl border border-[#e5b7b8] bg-[#fff2f1] px-4 py-3 text-sm text-[#8b1f2d]" role="alert">{status}</p> : null}
    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link className="inline-flex min-h-12 items-center justify-center rounded-xl px-5 text-sm font-bold text-[#554243] hover:bg-[#f6f3f2]" href={`/weddings/${wedding.id}/budget`}>Cancel</Link><button className="min-h-12 rounded-xl bg-[#852c3a] px-6 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70" disabled={isSubmitting} type="submit">{isSubmitting ? "Saving…" : "Save Budget Settings"}</button></div>
  </form>;
}

function Status({ message, retry }: { message: string; retry?: () => void }) { return <section className="rounded-2xl border border-[#e8dfd8] bg-white p-8 text-center"><p aria-live="polite" className="text-sm text-[#665456]">{message}</p>{retry ? <button className="mt-4 min-h-11 rounded-lg bg-[#852c3a] px-4 text-sm font-bold text-white" onClick={retry} type="button">Try again</button> : null}</section>; }
