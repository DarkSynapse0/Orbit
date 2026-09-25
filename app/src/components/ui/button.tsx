import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui Button, variants for both themes (pills). Primary flips: dark ink on light, white on dark.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background,transform,box-shadow,color] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-900 text-white font-semibold shadow-sm shadow-black/10 hover:bg-neutral-800 focus-visible:ring-neutral-900/40 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100 dark:focus-visible:ring-white/70",
        outline:
          "border border-black/[0.12] bg-white text-neutral-900 hover:bg-black/[0.03] focus-visible:ring-neutral-900/30 dark:border-white/[0.14] dark:bg-white/[0.03] dark:text-neutral-100 dark:hover:bg-white/[0.08] dark:focus-visible:ring-white/40",
        ghost: "text-neutral-600 hover:bg-black/[0.05] hover:text-neutral-900 focus-visible:ring-neutral-900/30 dark:text-neutral-300 dark:hover:bg-white/[0.06] dark:hover:text-white",
      },
      size: {
        default: "h-11 px-6",
        lg: "h-12 px-7 text-[15px]",
        sm: "h-9 px-4 text-[13px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
