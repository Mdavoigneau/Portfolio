/**
 * Small shared controls for the trend-following miniature, kept together so
 * every label, pill and tile focuses and reads the same way as the rest of
 * the page.
 */
import * as React from "react";
import { cn } from "@/lib/cn";

const FOCUS_RING =
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

export interface Segment {
  id: string;
  label: string;
}

/** The lens switcher across the top of the demo. */
export function Segmented({
  segments,
  value,
  onChange,
  ariaLabel,
}: {
  segments: ReadonlyArray<Segment>;
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="flex flex-wrap gap-1 rounded-xl border border-line bg-sunken p-1"
    >
      {segments.map((s) => {
        const selected = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(s.id)}
            className={cn(
              "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              FOCUS_RING,
              selected
                ? "bg-surface text-ink shadow-card"
                : "text-ink-2 hover:text-ink"
            )}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

/** A labelled numeric tile, mono value, used for score / slope / r² readouts. */
export function StatTile({
  label,
  value,
  tone = "ink",
  hint,
}: {
  label: string;
  value: string;
  tone?: "ink" | "pos" | "neg" | "muted";
  hint?: string;
}) {
  const valueTone =
    tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : tone === "muted" ? "text-ink-3" : "text-ink";
  return (
    <div className="rounded-lg border border-line bg-elevated px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{label}</div>
      <div className={cn("tnum mt-0.5 text-base font-semibold", valueTone)}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] leading-snug text-ink-3">{hint}</div>}
    </div>
  );
}

/** Selectable ticker pill for the signal lab. */
export function TickerPill({
  ticker,
  name,
  selected,
  onClick,
}: {
  ticker: string;
  name: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "flex items-baseline gap-1.5 rounded-full border px-3 py-1 transition-colors",
        FOCUS_RING,
        selected
          ? "border-brand bg-brand text-white"
          : "border-line-strong bg-surface text-ink-2 hover:border-brand-line hover:bg-brand-tint/40"
      )}
    >
      <span className="font-mono text-xs font-semibold">{ticker}</span>
      <span className={cn("text-[11px]", selected ? "text-white/80" : "text-ink-3")}>{name}</span>
    </button>
  );
}
