import { AuthCard } from "@/components/auth/auth-card";
import { GuestOnly } from "@/components/auth/guest-only";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <GuestOnly><AuthCard description="Welcome back. Sign in to continue to your Make My Marriage account." notice="Email verification is required before you can sign in." title="Log in to Make My Marriage"><LoginForm /></AuthCard></GuestOnly>;
}
