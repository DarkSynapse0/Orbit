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
  type LucideIcon,
} from "lucide-react";

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
