import * as React from "react";
import { cn } from "@/lib/cn";

export function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-6", className)} {...props} />
  );
}

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  /** faint mint wash on alternating sections */
  wash?: boolean;
  /** hairline rule at the top of the section */
  divider?: boolean;
}

export function Section({
  className,
  id,
  wash = false,
  divider = true,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-16 py-20 md:py-28",
        divider && "border-t border-line/70",
        wash && "bg-mint/[0.18]",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("eyebrow", className)} {...props} />;
}

export interface SectionHeadProps {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  className?: string;
}

export function SectionHead({ eyebrow, title, lead, className }: SectionHeadProps) {
  return (
    <div className={cn("max-w-3xl", className)}>
      {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
      <h2 className="text-3xl tracking-tight text-ink md:text-4xl">{title}</h2>
      {lead ? (
        <p className="mt-4 text-lg leading-relaxed text-ink-2 md:text-xl">{lead}</p>
      ) : null}
    </div>
  );
}
