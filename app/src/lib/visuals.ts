// Consistent icons + semantic tones for transactions and activity, so every row
// reads at a glance. One icon style (lucide), one tone vocabulary.
import {
  Coffee,
  Car,
  ShoppingBag,
  ShoppingBasket,
  Receipt,
  CircleDollarSign,
  Zap,
  Target,
  Trash2,
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  Wallet,
  LogIn,
  type LucideIcon,
} from "lucide-react";
import type { ActivityKind } from "./activity";

// Spending category -> icon. Falls back to a receipt for anything uncategorized.
const CATEGORY_ICON: Record<string, LucideIcon> = {
  Groceries: ShoppingBasket,
  Dining: Coffee,
  Transport: Car,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Other: CircleDollarSign,
};

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON[category] ?? CircleDollarSign;
}

// A transaction row's icon: the auto-invest "Zap" when it was deposited, else its category.
export function txnIcon(t: { category: string; deposited?: boolean }): LucideIcon {
  return t.deposited ? Zap : categoryIcon(t.category);
}

// Semantic tone -> icon container classes (bg + fg). Keep money-in on primary,
// spends neutral, out on destructive.
export type Tone = "primary" | "neutral" | "destructive" | "muted";
export const TONE_ICON: Record<Tone, string> = {
  primary: "bg-[var(--primary-soft)] text-[var(--primary-strong)]",
  neutral: "bg-[var(--surface)] text-[var(--muted)]",
  destructive: "bg-[var(--destructive-soft)] text-[var(--destructive)]",
  muted: "bg-transparent text-[var(--faint)]",
};

// App-activity events (deposits, goals, wallet…) -> icon + coarse category for filtering.
export const ACTIVITY_ICON: Record<ActivityKind, LucideIcon> = {
  goal_create: Target,
  goal_allocate: Target,
  goal_empty: Target,
  goal_delete: Trash2,
  deposit: ArrowDownToLine,
  withdraw: ArrowUpFromLine,
  faucet: Coins,
  wallet_connect: Wallet,
  wallet_disconnect: Wallet,
  sign_in: LogIn,
};

export type HistoryCategory = "spending" | "deposits" | "withdrawals" | "goals" | "wallet";

export function activityCategory(kind: ActivityKind): HistoryCategory {
  if (kind === "deposit" || kind === "faucet") return "deposits";
  if (kind === "withdraw") return "withdrawals";
  if (kind.startsWith("goal")) return "goals";
  return "wallet";
}
