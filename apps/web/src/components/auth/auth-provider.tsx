"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Provider } from "react-redux";
import { loadCurrentUser } from "@/lib/auth-session";
import { authenticated, signedOut } from "@/store/auth-slice";
import { makeStore, type AppStore } from "@/store/store";

type AuthProviderProps = { children: ReactNode };

export function AuthProvider({ children }: AuthProviderProps) {
  const storeRef = useRef<AppStore | null>(null);
  const store = storeRef.current ??= makeStore();

  useEffect(() => {
    let active = true;

    loadCurrentUser()
      .then((user) => {
        if (active) storeRef.current?.dispatch(authenticated(user));
      })
      .catch(() => {
        if (active) storeRef.current?.dispatch(signedOut());
      });

    return () => {
      active = false;
    };
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
