import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui Badge, tuned for Orbit's light theme (pill chips).
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border text-[12px] font-medium transition-colors [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-[var(--muted)]",
        accent: "border-[var(--accent-soft)] bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent-strong)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
