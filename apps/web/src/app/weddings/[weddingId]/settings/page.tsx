import type { Metadata } from "next";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { WeddingSettings } from "@/components/weddings/wedding-settings";

export const metadata: Metadata = { title: "Wedding settings | Make My Marriage" };

export default async function WeddingSettingsPage({ params }: { params: Promise<{ weddingId: string }> }) {
  const { weddingId } = await params;
  const returnTo = `/weddings/${weddingId}/settings`;
  return <AuthenticatedOnly returnTo={returnTo}><WeddingSettings weddingId={weddingId} /></AuthenticatedOnly>;
}
