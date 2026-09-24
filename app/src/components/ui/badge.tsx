import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui Badge, tuned for Orbit's dark theme (pill chips).
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border text-[12px] font-medium transition-colors [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "border-white/[0.1] bg-white/[0.04] px-3 py-1 text-neutral-300 backdrop-blur-sm",
        accent: "border-blue-400/20 bg-blue-400/10 px-3 py-1 text-blue-200",
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
