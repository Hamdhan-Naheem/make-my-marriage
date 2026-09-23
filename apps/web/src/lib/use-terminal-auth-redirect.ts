"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { signedOut } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";

export function useTerminalAuthRedirect(returnTo: string) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  return useCallback((error: unknown): boolean => {
    if (!(error instanceof ApiError) || error.status !== 401) return false;
    dispatch(signedOut());
    router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    return true;
  }, [dispatch, returnTo, router]);
}
