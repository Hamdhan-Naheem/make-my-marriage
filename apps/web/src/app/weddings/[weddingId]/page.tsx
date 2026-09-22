import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { WeddingDashboard } from "@/components/weddings/wedding-dashboard";

export const metadata: Metadata = { title: "Wedding dashboard | Make My Marriage" };

export default async function WeddingDashboardPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = await params;
  return <AuthenticatedOnly returnTo={`/weddings/${weddingId}`}><WeddingDashboard weddingId={weddingId} /></AuthenticatedOnly>;
}

