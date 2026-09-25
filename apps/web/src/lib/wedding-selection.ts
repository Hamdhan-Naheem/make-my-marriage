const CURRENT_WEDDING_KEY = "make-my-marriage.current-wedding-id";

export function getCurrentWeddingId(): string | null {
  return window.localStorage.getItem(CURRENT_WEDDING_KEY);
}

export function setCurrentWeddingId(weddingId: string): void {
  window.localStorage.setItem(CURRENT_WEDDING_KEY, weddingId);
}

export function clearCurrentWeddingId(): void {
  window.localStorage.removeItem(CURRENT_WEDDING_KEY);
}

