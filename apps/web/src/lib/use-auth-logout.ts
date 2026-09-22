"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/lib/api";
import { signedOut } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";

export function useAuthLogout() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string>();

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(undefined);
    try {
      await logout();
      dispatch(signedOut());
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("Logout could not be completed. Please try again.");
      setIsLoggingOut(false);
    }
  }

  return { handleLogout, isLoggingOut, logoutError };
}
