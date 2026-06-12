/**
 * Small shared controls used by both screens. Kept together so every pill
 * and label on the demo looks and focuses the same way.
 */
import * as React from "react";
import { cn } from "@/lib/cn";

export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

/** Mono section kicker, the page-wide label idiom. */
export function SectionLabel(props: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

/**
 * Toggle pill. Disabled pills keep the production hint: a title explaining
 * that no listings exist for the combination.
 */
export function Pill(props: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { selected, onClick, children } = props;
  const disabled = props.disabled ?? false;
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-disabled={disabled || undefined}
      title={disabled ? "no listings for this combination" : undefined}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        FOCUS_RING,
        selected
          ? "border-brand bg-brand text-white"
          : "border-line-strong bg-surface text-ink-2 hover:border-brand-line hover:bg-brand-tint/40",
        disabled &&
          "cursor-not-allowed border-line bg-sunken text-ink-3 opacity-60 hover:border-line hover:bg-sunken"
      )}
    >
      {children}
    </button>
  );
}
