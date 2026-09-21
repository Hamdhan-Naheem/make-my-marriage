import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <AuthCard description="Welcome back. Continue to your wedding planning workspace when sign-in is connected." title="Log in to Make My Marriage"><LoginForm /></AuthCard>;
}
