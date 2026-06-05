import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium leading-none",
  {
    variants: {
      variant: {
        mint: "bg-mint/55 text-mint-deep",
        brand: "bg-brand-tint text-brand-700",
        neutral: "bg-sunken text-ink-2",
        outline: "border border-line-strong text-ink-2",
        pos: "bg-pos/10 text-pos",
        neg: "bg-neg/10 text-neg",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.6875rem]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

/** A monospace "tech chip" used to list a stack, for the JD reader's eye. */
export const TechChip = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border border-line bg-elevated px-2 py-0.5 font-mono text-[0.6875rem] tracking-tight text-ink-2",
        className
      )}
      {...props}
    />
  )
);
TechChip.displayName = "TechChip";
