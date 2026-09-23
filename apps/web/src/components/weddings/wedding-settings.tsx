"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { WeddingWorkspace } from "@make-my-marriage/shared";
import { WeddingWorkspaceShell, formatManagementType } from "@/components/weddings/dashboard/wedding-workspace-shell";
import { ApiError, getWedding, updateWedding } from "@/lib/api";
import { useTerminalAuthRedirect } from "@/lib/use-terminal-auth-redirect";
import { weddingSettingsSchema, type WeddingSettingsValues } from "@/lib/validation/wedding-settings-schema";
import { useAppSelector } from "@/store/hooks";

const fieldClass = "mt-1.5 w-full rounded-lg border border-transparent bg-[#f6f3f2] px-3.5 py-2.5 text-sm text-[#302526] transition placeholder:text-[#998889] focus:border-[#852c3a] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#852c3a]/20";
const fieldNames = ["name", "brideName", "groomName", "mainWeddingDate"] as const;

export function WeddingSettings({ weddingId }: { weddingId: string }) {
  const user = useAppSelector((state) => state.auth.user);
  const returnTo = `/weddings/${weddingId}/settings`;
  const handleTerminalAuth = useTerminalAuthRedirect(returnTo);
  const [requestState, setRequestState] = useState<{ weddingId: string; wedding?: WeddingWorkspace; error?: string }>({ weddingId });
  const wedding = requestState.weddingId === weddingId ? requestState.wedding : undefined;
  const error = requestState.weddingId === weddingId ? requestState.error : undefined;

  useEffect(() => {
    let active = true;
    getWedding(weddingId)
      .then((result) => { if (active) setRequestState({ weddingId, wedding: result }); })
      .catch((requestError: unknown) => {
        if (!active || handleTerminalAuth(requestError)) return;
        setRequestState({ weddingId, error: "Wedding Settings could not be loaded. Please try again." });
      });
    return () => { active = false; };
  }, [handleTerminalAuth, weddingId]);

  if (!user || !wedding) return <SettingsStatus error={error} />;
  const ownerName = [user.firstName, user.lastName].filter(Boolean).join(" ");

  if (wedding.member.role !== "OWNER") {
    return <WeddingWorkspaceShell activeItem="Settings" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}><main className="mx-auto max-w-3xl px-4 py-12 sm:px-6"><section className="rounded-2xl border border-[#e8dfd8] bg-white p-7 text-center shadow-sm"><h1 className="text-2xl font-bold">Owner access is required</h1><p className="mt-3 text-sm text-[#665456]">Only an active Owner can update Wedding Settings.</p></section></main></WeddingWorkspaceShell>;
  }

  return <WeddingSettingsForm key={`${wedding.name}-${wedding.brideName}-${wedding.groomName}-${wedding.mainWeddingDate}`} ownerName={ownerName} wedding={wedding} onUpdated={(updated) => setRequestState({ weddingId, wedding: updated })} />;
}

function WeddingSettingsForm({ onUpdated, ownerName, wedding }: { onUpdated: (wedding: WeddingWorkspace) => void; ownerName: string; wedding: WeddingWorkspace }) {
  const handleTerminalAuth = useTerminalAuthRedirect(`/weddings/${wedding.id}/settings`);
  const [status, setStatus] = useState<string>();
  const { formState: { errors, isSubmitting }, handleSubmit, register, setError } = useForm<WeddingSettingsValues>({
    resolver: zodResolver(weddingSettingsSchema),
    defaultValues: { name: wedding.name, brideName: wedding.brideName, groomName: wedding.groomName, mainWeddingDate: wedding.mainWeddingDate ?? "" },
  });

  const submit = handleSubmit(async (values) => {
    setStatus(undefined);
    try {
      const updated = await updateWedding(wedding.id, { ...values, mainWeddingDate: values.mainWeddingDate || null });
      onUpdated(updated);
      setStatus("Wedding Settings saved.");
    } catch (error) {
      if (handleTerminalAuth(error)) return;
      if (error instanceof ApiError && error.fields) {
        for (const [field, messages] of Object.entries(error.fields)) {
          if (fieldNames.includes(field as typeof fieldNames[number]) && messages[0]) setError(field as typeof fieldNames[number], { type: "server", message: messages[0] });
        }
      }
      setStatus(error instanceof ApiError ? error.message : "Wedding Settings could not be saved. Please try again.");
    }
  });

  return <WeddingWorkspaceShell activeItem="Settings" data={{ weddingId: wedding.id, workspaceName: wedding.name, managementType: wedding.managementType, memberSide: wedding.member.side, memberRole: wedding.member.role, ownerName }}>
    <main className="mx-auto max-w-4xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <Link className="inline-flex rounded-lg px-2 py-1 text-sm font-bold text-[#852c3a] hover:bg-[#f4e8e5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#852c3a]" href={`/weddings/${wedding.id}`}>← Back to Dashboard</Link>
      <div className="mb-7 mt-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Wedding workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Wedding Settings</h1><p className="mt-2 text-sm leading-6 text-[#665456]">Update the wedding details used throughout this workspace.</p></div>
      <form className="rounded-2xl border border-[#eee6e2] bg-white p-5 shadow-sm sm:p-7" noValidate onChange={() => setStatus(undefined)} onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field error={errors.name?.message} id="wedding-name" label="Wedding workspace name" wide><input className={fieldClass} id="wedding-name" maxLength={120} {...register("name")} /></Field>
          <Field error={errors.brideName?.message} id="bride-name" label="Bride name"><input className={fieldClass} id="bride-name" maxLength={100} {...register("brideName")} /></Field>
          <Field error={errors.groomName?.message} id="groom-name" label="Groom name"><input className={fieldClass} id="groom-name" maxLength={100} {...register("groomName")} /></Field>
          <Field error={errors.mainWeddingDate?.message} id="main-wedding-date" label="Main wedding date" optional><input className={fieldClass} id="main-wedding-date" type="date" {...register("mainWeddingDate")} /><span className="mt-1.5 block text-xs text-[#776566]">Leave this empty if the date is undecided.</span></Field>
          <div className="sm:col-span-2"><label className="text-sm font-semibold text-[#302526]" htmlFor="management-type">Wedding management type</label><input className="mt-1.5 w-full rounded-lg border-0 bg-[#eeeae8] px-3.5 py-2.5 text-sm font-semibold text-[#665456]" id="management-type" readOnly value={formatManagementType(wedding.managementType)} /><p className="mt-1.5 text-xs text-[#776566]">Wedding type cannot be changed in this milestone.</p></div>
        </div>
        {status ? <p className="mt-6 rounded-xl border border-[#d9c9ca] bg-[#f8f2f0] px-4 py-3 text-sm text-[#671525]" role="status">{status}</p> : null}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Link className="rounded-xl px-5 py-3 text-center text-sm font-bold text-[#554243] hover:bg-[#f6f3f2]" href={`/weddings/${wedding.id}`}>Cancel</Link><button className="rounded-xl bg-[#852c3a] px-6 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70" disabled={isSubmitting} type="submit">{isSubmitting ? "Saving…" : "Save Wedding Settings"}</button></div>
      </form>
    </main>
  </WeddingWorkspaceShell>;
}

function Field({ children, error, id, label, optional, wide }: { children: React.ReactNode; error?: string; id: string; label: string; optional?: boolean; wide?: boolean }) {
  return <label className={wide ? "sm:col-span-2" : ""} htmlFor={id}><span className="text-sm font-semibold text-[#302526]">{label}{optional ? <span className="ml-1 font-normal text-[#776566]">(Optional)</span> : <span className="ml-1 text-[#852c3a]">*</span>}</span>{children}{error ? <span className="mt-1.5 block text-xs font-semibold text-[#a22531]" role="alert">{error}</span> : null}</label>;
}

function SettingsStatus({ error }: { error?: string }) {
  return <main className="flex min-h-dvh items-center justify-center bg-[#fcf9f8] px-4"><div className="rounded-2xl border border-[#e8dfd8] bg-white p-7 text-center shadow-sm"><p aria-live="polite" className="text-sm text-[#665456]">{error ?? "Loading Wedding Settings…"}</p>{error ? <button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white" onClick={() => window.location.reload()} type="button">Try again</button> : null}</div></main>;
}
