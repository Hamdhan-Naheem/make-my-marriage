import { getCurrentUser, type SafeUser } from "./api";

let currentUserRequest: Promise<SafeUser> | undefined;

export function loadCurrentUser(): Promise<SafeUser> {
  currentUserRequest ??= getCurrentUser().finally(() => {
    currentUserRequest = undefined;
  });

  return currentUserRequest;
}
