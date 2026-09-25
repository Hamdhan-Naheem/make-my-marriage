import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailView } from "@/components/auth/verify-email-view";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const value = (await searchParams).token;
  const token = typeof value === "string" ? value : undefined;
  return <AuthCard description="We are checking your secure verification link." title="Verify your email"><VerifyEmailView token={token} /></AuthCard>;
}
