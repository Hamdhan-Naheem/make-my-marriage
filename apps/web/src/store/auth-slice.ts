import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SafeUser } from "@/lib/api";

type AuthState =
  | { status: "checking"; user: null }
  | { status: "guest"; user: null }
  | { status: "authenticated"; user: SafeUser };

const initialState: AuthState = { status: "checking", user: null };

const authSlice = createSlice({
  name: "auth",
  initialState: initialState as AuthState,
  reducers: {
    authenticated(_state, action: PayloadAction<SafeUser>): AuthState {
      return { status: "authenticated", user: action.payload };
    },
    signedOut(): AuthState {
      return { status: "guest", user: null };
    },
  },
});

export const { authenticated, signedOut } = authSlice.actions;
export const authReducer = authSlice.reducer;
