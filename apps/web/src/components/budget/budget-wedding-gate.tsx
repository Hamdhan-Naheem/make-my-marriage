"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { WeddingWorkspace } from "@make-my-marriage/shared";
import { BudgetOverview } from "@/components/budget/budget-overview";
import { BudgetSettingsScreen } from "@/components/budget/budget-settings-screen";
import { ExpenseCreateScreen } from "@/components/budget/expense-create-screen";
import { ExpenseEditScreen } from "@/components/budget/expense-edit-screen";
import { WeddingWorkspaceShell } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { ApiError, getWedding } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { clearCurrentWeddingId, setCurrentWeddingId } from "@/lib/wedding-selection";
import { useAppSelector } from "@/store/hooks";

export type BudgetWeddingContext = { wedding: WeddingWorkspace; ownerName: string };

type Props = { returnTo: string; weddingId: string } & (
  | { view: "overview" | "settings"; expenseId?: never; initialEventId?: never; navigationReturnTo?: never }
  | { view: "create"; expenseId?: never; initialEventId?: string; navigationReturnTo?: string }
  | { view: "edit"; expenseId: string; initialEventId?: never; navigationReturnTo?: string }
);

export function BudgetWeddingGate({ expenseId, initialEventId, navigationReturnTo, returnTo, view, weddingId }: Props) {
  const router = useRouter();
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const user = useAppSelector((state) => state.auth.user);
  const [requestState, setRequestState] = useState<{ weddingId: string; wedding?: WeddingWorkspace; error?: string }>({ weddingId });
  const wedding = requestState.weddingId === weddingId ? requestState.wedding : undefined;
  const error = requestState.weddingId === weddingId ? requestState.error : undefined;

  useEffect(() => {
    let active = true;
    getWedding(weddingId).then((result) => {
      if (!active) return;
      setCurrentWeddingId(result.id);
      setRequestState({ weddingId, wedding: result });
    }).catch((requestError: unknown) => {
      if (!active) return;
      if (requestError instanceof ApiError && requestError.status === 404) { clearCurrentWeddingId(); router.replace("/weddings"); return; }
      if (handleTerminalAuth(requestError)) return;
      setRequestState({ weddingId, error: "This wedding workspace could not be loaded. Please try again." });
    });
    return () => { active = false; };
  }, [handleTerminalAuth, router, weddingId]);

  if (!user || !wedding) return <CenteredStatus error={error} />;
  const ownerName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (wedding.member.role !== "OWNER") return <WeddingWorkspaceShell activeItem="Budget & Expenses" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}><main className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><section className="rounded-2xl border border-[#e8dfd8] bg-white p-7 text-center shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Financial access</p><h1 className="mt-2 text-2xl font-bold">Owner access is required</h1><p className="mt-3 text-sm leading-6 text-[#665456]">Only an active Owner can view or manage budgets and Expenses in this milestone.</p></section></main></WeddingWorkspaceShell>;

  const context = { wedding, ownerName };
  if (view === "overview") return <BudgetOverview context={context} />;
  if (view === "settings") return <BudgetSettingsScreen context={context} />;
  if (view === "create") return <ExpenseCreateScreen context={context} initialEventId={initialEventId} navigationReturnTo={navigationReturnTo} />;
  return expenseId ? <ExpenseEditScreen context={context} expenseId={expenseId} navigationReturnTo={navigationReturnTo} /> : null;
}

function CenteredStatus({ error }: { error?: string }) { return <main className="flex min-h-dvh items-center justify-center bg-[#fcf9f8] px-4"><div className="w-full max-w-md rounded-2xl border border-[#e8dfd8] bg-white p-6 text-center shadow-sm"><div aria-hidden="true" className="mx-auto size-10 animate-pulse rounded-full bg-[#f4e8e5]" /><p aria-live="polite" className="mt-4 text-sm text-[#665456]">{error ?? "Loading Budget & Expenses…"}</p>{error ? <button className="mt-4 min-h-11 rounded-lg bg-[#852c3a] px-4 text-sm font-bold text-white" onClick={() => window.location.reload()} type="button">Try again</button> : null}</div></main>; }
