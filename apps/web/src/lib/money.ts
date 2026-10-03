import type { WeddingCurrency } from "@make-my-marriage/shared";

const currencySymbols: Record<WeddingCurrency, string> = {
  LKR: "LKR",
  USD: "$",
  AUD: "A$",
  SGD: "S$",
};

export function moneyToMinorUnits(value: string): bigint {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt((fraction + "00").slice(0, 2));
}

export function minorUnitsToMoney(value: bigint): string {
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  return `${negative ? "-" : ""}${absolute / BigInt(100)}.${String(absolute % BigInt(100)).padStart(2, "0")}`;
}

export function addMoney(left: string, right: string): string {
  return minorUnitsToMoney(moneyToMinorUnits(left) + moneyToMinorUnits(right));
}

export function isMoneyGreater(left: string, right: string): boolean {
  return moneyToMinorUnits(left) > moneyToMinorUnits(right);
}

export function moneyProgressPercent(spent: string, budget: string | null): number {
  if (!budget) return 0;
  const denominator = moneyToMinorUnits(budget);
  if (denominator === BigInt(0)) return moneyToMinorUnits(spent) > BigInt(0) ? 100 : 0;
  const percent = Number((moneyToMinorUnits(spent) * BigInt(100)) / denominator);
  return Math.max(0, Math.min(percent, 100));
}

export function formatMoney(value: string, currency: WeddingCurrency): string {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = "00"] = unsigned.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negative ? "−" : ""}${currencySymbols[currency]} ${grouped}.${(fraction + "00").slice(0, 2)}`;
}

export function suggestCurrency(locale?: string): WeddingCurrency {
  try {
    const region = new Intl.Locale(locale ?? (typeof navigator === "undefined" ? "en-LK" : navigator.language)).region;
    if (region === "US") return "USD";
    if (region === "AU") return "AUD";
    if (region === "SG") return "SGD";
  } catch {
    // Fall through to the product default.
  }
  return "LKR";
}
