/* Shared presentational atoms for the planner demo: tone styling for timeline segments,
   the form field idiom, and the mono validation line that every dispatch path renders. */

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { type Tone } from "./data";
import { type Validation } from "./logic";

export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

export const REVEAL = "motion-safe:[animation:reveal_0.45s_var(--ease-out-soft)_both]";

/** Production EVENT_TONE_STYLES, mapped onto the portfolio palette: desk teal, home a
    dashed teal, away the gold series hue, leave the brick negative. */
export const TONE_STYLE: Record<Tone, { label: string; seg: string; segStyle?: React.CSSProperties }> = {
  desk: { label: "At desk", seg: "border-brand-line bg-brand-tint text-brand-700" },
  home: { label: "Home", seg: "border-dashed border-brand-600/60 bg-surface text-brand-700" },
  away: {
    label: "Away",
    seg: "",
    segStyle: {
      borderColor: "color-mix(in srgb, var(--color-series-2) 55%, transparent)",
      backgroundColor: "color-mix(in srgb, var(--color-series-2) 14%, transparent)",
      color: "color-mix(in srgb, var(--color-series-2) 70%, black)",
    },
  },
  leave: { label: "Leave", seg: "border-neg/35 bg-neg/10 text-neg" },
};

export function ToneChip({ tone }: { tone: Tone }) {
  const t = TONE_STYLE[tone];
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-none", t.seg)}
      style={t.segStyle}
    >
      {t.label}
    </span>
  );
}

export const fieldClass = cn(
  "h-8 rounded-md border border-line-strong bg-surface px-2 text-xs text-ink",
  FOCUS_RING
);

export const microLabelClass = "mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-3";

export const panelClass = "rounded-lg border border-line bg-elevated px-4 py-3";

export const sectionLabelClass = "mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3";

/** One line, rendered identically by the manual forms and the plain-English panel:
    green mono on schema ok, red mono `path: message` on rejection. */
export function ValidationLine({ result, okText = "schema ok" }: { result: Validation; okText?: string }) {
  if (result.ok) {
    return (
      <div className={cn("flex items-center gap-1.5 font-mono text-[11px] text-pos", REVEAL)}>
        <Check className="size-3.5 shrink-0" aria-hidden /> {okText}
      </div>
    );
  }
  return (
    <div className={cn("flex items-start gap-1.5 font-mono text-[11px] text-neg", REVEAL)}>
      <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        {result.path}: {result.message} · rejected, no state change
      </span>
    </div>
  );
}
