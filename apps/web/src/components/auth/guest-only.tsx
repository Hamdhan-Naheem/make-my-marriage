"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAppSelector } from "@/store/hooks";

export function GuestOnly({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status === "authenticated") router.replace("/account");
  }, [router, status]);

  if (status !== "guest") {
    return <p aria-live="polite" className="mx-auto max-w-md text-center text-sm text-[#665456]">Checking your session&hellip;</p>;
  }

  return children;
}
