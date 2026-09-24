import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui Button, variants tuned to Orbit's dark theme (pills, white primary, dark outline).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[background,transform,box-shadow,color] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080c] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-white text-neutral-950 font-semibold shadow-lg shadow-black/30 hover:shadow-xl hover:shadow-white/10 focus-visible:ring-white/70",
        outline:
          "border border-white/[0.14] bg-white/[0.03] text-neutral-100 backdrop-blur-sm hover:bg-white/[0.08] focus-visible:ring-white/40",
        ghost: "text-neutral-300 hover:bg-white/[0.06] hover:text-white focus-visible:ring-white/40",
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
