import { AccountView } from "@/components/auth/account-view";
import { AuthenticatedOnly } from "@/components/auth/authenticated-only";
import { AuthCard } from "@/components/auth/auth-card";

export default function AccountPage() {
  return <AuthenticatedOnly><AuthCard description="View your account details or continue to your wedding workspaces." title="Your Make My Marriage account"><AccountView /></AuthCard></AuthenticatedOnly>;
}
