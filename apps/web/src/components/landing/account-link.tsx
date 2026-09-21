"use client";

import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

type AccountLinkProps = {
  className?: string;
  href: "/login" | "/register";
  label: string;
};

export function AccountLink({ className = "", href, label }: AccountLinkProps) {
  const status = useAppSelector((state) => state.auth.status);

  if (status === "checking") {
    return <span aria-hidden="true" className={`h-10 w-40 animate-pulse rounded-lg bg-[#e8dfd8] ${className}`} />;
  }

  return <Link className={`rounded-lg px-4 py-2 text-sm font-semibold ${className}`} href={status === "authenticated" ? "/account" : href}>{status === "authenticated" ? "My Account" : label}</Link>;
}
