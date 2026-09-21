import { AccountView } from "@/components/auth/account-view";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { AuthCard } from "@/components/auth/auth-card";

export default function AccountPage() {
  return <AuthenticatedOnly><AuthCard description="Your secure session is active. Wedding workspace features will be added in a later milestone." title="Welcome to Make My Marriage"><AccountView /></AuthCard></AuthenticatedOnly>;
}
