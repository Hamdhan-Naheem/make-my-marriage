"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { WeddingWorkspace } from "@make-my-marriage/shared";
import { BrandMark } from "@/components/brand/brand-mark";
import { ApiError, listWeddings } from "@/lib/api";
import { clearCurrentWeddingId, setCurrentWeddingId } from "@/lib/wedding-selection";

function managementLabel(type: WeddingWorkspace["managementType"]) {
  return type === "JOINT" ? "Joint Wedding" : type === "BRIDE_SIDE" ? "Bride Side" : "Groom Side";
}

export function WeddingEntry() {
  const router = useRouter();
  const [weddings, setWeddings] = useState<WeddingWorkspace[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    listWeddings()
      .then((items) => {
        if (!active) return;
        if (items.length === 0) {
          clearCurrentWeddingId();
          router.replace("/weddings/new");
          return;
        }
        setWeddings(items);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/login?returnTo=%2Fweddings");
          return;
        }
        setError("Your wedding workspaces could not be loaded. Please try again.");
      });
    return () => { active = false; };
  }, [router]);

  function openWedding(weddingId: string) {
    setCurrentWeddingId(weddingId);
    router.push(`/weddings/${weddingId}`);
  }

  if (!weddings && !error) return <CenteredStatus message="Finding your wedding workspaces…" />;
  if (error) return <CenteredStatus message={error} retry={() => window.location.reload()} />;

  return (
    <main className="min-h-dvh bg-[#fcf9f8] px-4 py-10 text-[#1b1c1c] sm:px-6 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><BrandMark /><Link className="text-sm font-bold text-[#671525] underline decoration-[#c47a68]/50 underline-offset-4" href="/account">My account</Link></div>
        <section className="mt-10 rounded-3xl border border-[#e8dfd8] bg-white p-5 shadow-[0_24px_56px_-36px_rgba(103,21,37,0.42)] sm:p-8" aria-labelledby="wedding-chooser-title">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#852c3a]">Wedding workspaces</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl" id="wedding-chooser-title">Choose a wedding to continue</h1>
              <p className="mt-3 text-sm leading-6 text-[#665456]">Your role and access are separate for every wedding workspace.</p>
            </div>
            <Link className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#852c3a] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#852c3a]/15 hover:bg-[#671525] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" href="/weddings/new">Create New Wedding</Link>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {weddings?.map((wedding) => (
              <button className="rounded-2xl border border-[#e0d4d1] bg-[#fcf9f8] p-5 text-left transition hover:border-[#c47a68] hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#852c3a]" key={wedding.id} onClick={() => openWedding(wedding.id)} type="button">
                <strong className="block text-base text-[#302526]">{wedding.name}</strong>
                <span className="mt-2 block text-sm text-[#665456]">{wedding.brideName} & {wedding.groomName}</span>
                <span className="mt-4 block text-xs font-bold uppercase tracking-wide text-[#852c3a]">{managementLabel(wedding.managementType)} · {wedding.member.role.replace("_", " ")}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function CenteredStatus({ message, retry }: { message: string; retry?: () => void }) {
  return <main className="flex min-h-dvh items-center justify-center bg-[#fcf9f8] px-4"><div className="max-w-md rounded-2xl border border-[#e8dfd8] bg-white p-6 text-center"><p aria-live="polite" className="text-sm text-[#665456]">{message}</p>{retry ? <button className="mt-4 rounded-lg bg-[#852c3a] px-4 py-2 text-sm font-bold text-white" onClick={retry} type="button">Try again</button> : null}</div></main>;
}
