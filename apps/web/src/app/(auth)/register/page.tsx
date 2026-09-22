import { AuthCard } from "@/components/auth/auth-card";
import { GuestOnly } from "@/components/auth/guest-only";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <GuestOnly><AuthCard description="Create your Make My Marriage account, then verify your email before signing in." notice="For privacy, the response is the same when an email address is already registered." title="Create your account"><RegisterForm /></AuthCard></GuestOnly>;
}
