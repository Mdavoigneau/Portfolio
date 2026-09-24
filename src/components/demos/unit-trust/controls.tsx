/* Shared atoms for the unit-trust miniature: table cell classes, the mono
   result line every action renders, status pills and the step switcher. */

import * as React from "react";
import { Check, CircleSlash, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Outcome } from "./logic";

export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";
export const REVEAL = "motion-safe:[animation:reveal_0.45s_var(--ease-out-soft)_both]";

export const TH = "px-2.5 py-2 text-left font-mono text-[9px] font-normal uppercase tracking-[0.12em] text-ink-3";
export const THR = cn(TH, "text-right");
export const TD = "px-2.5 py-2 align-middle";
export const TDR = cn(TD, "tnum text-right");
export const TABLE = "w-full border-collapse text-xs";
export const TABLE_WRAP = "overflow-x-auto rounded-lg border border-line bg-surface";
export const ROW = "border-t border-line";

export const BTN = "h-8 px-3 text-xs";

/** The series gold, darkened for text so it keeps AA contrast on white. */
export const AMBER_TEXT = "text-[color-mix(in_srgb,var(--color-series-2)_65%,black)]";

export const fieldClass = cn(
  "h-8 w-24 rounded-md border border-line-strong bg-surface px-2 text-right font-mono text-xs text-ink tnum",
  FOCUS_RING
);

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3", className)}>{children}</div>
  );
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-line bg-elevated px-4 py-3.5", className)}>{children}</div>;
}

/** The one line every action renders: green on success, red on refusal, and
    a trigger abort set apart, because that refusal came from the database. */
export function ResultLine({ outcome }: { outcome: Outcome | undefined }) {
  if (outcome === undefined) return null;
  if (outcome.ok) {
    return (
      <div role="status" className={cn("flex items-start gap-1.5 font-mono text-[11px] leading-relaxed text-pos", REVEAL)}>
        <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>{outcome.message}</span>
      </div>
    );
  }
  return (
    <div role="status" className={cn("flex items-start gap-1.5 font-mono text-[11px] leading-relaxed text-neg", REVEAL)}>
      {outcome.trigger ? (
        <CircleSlash className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      ) : (
        <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      )}
      <span>
        {outcome.trigger ? <span className="font-semibold">RAISE(ABORT) </span> : null}
        {outcome.message}
        <span className="text-ink-3"> · refused, nothing written</span>
      </span>
    </div>
  );
}

type PillTone = "draft" | "done" | "pending" | "blocked" | "brand";

const PILL: Record<PillTone, string> = {
  draft: "bg-sunken text-ink-2",
  done: "bg-pos/10 text-pos",
  pending: "border border-line-strong text-ink-2",
  blocked: "bg-neg/10 text-neg",
  brand: "bg-brand-tint text-brand-700",
};

export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-medium leading-none",
        PILL[tone]
      )}
    >
      {children}
    </span>
  );
}

/** A labelled figure, mono value. */
export function Figure({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3">{label}</div>
      <div className="tnum mt-0.5 truncate text-[13px] font-semibold text-ink">{value}</div>
      {hint ? <div className="mt-0.5 text-[11px] leading-snug text-ink-3">{hint}</div> : null}
    </div>
  );
}

/** A row of a worked calculation: the operator, the label, the figure. */
export function CalcRow({
  op,
  label,
  value,
  strong = false,
  muted = false,
}: {
  op?: string;
  label: React.ReactNode;
  value: React.ReactNode;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-2 py-1 text-xs",
        strong ? "border-t border-line-strong pt-1.5 font-semibold text-ink" : muted ? "text-ink-3" : "text-ink-2"
      )}
    >
      <span className="w-4 shrink-0 text-center font-mono text-ink-3">{op ?? ""}</span>
      <span className="min-w-0 flex-1">{label}</span>
      <span className="tnum shrink-0 text-right font-mono">{value}</span>
    </div>
  );
}

export interface StepDef {
  id: string;
  label: string;
  done: boolean;
}

/** The four steps of the cycle; a tick marks each one already done. */
export function StepTabs({
  steps,
  value,
  onChange,
}: {
  steps: ReadonlyArray<StepDef>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Month-end steps" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-sunken p-1 sm:grid-cols-4">
      {steps.map((s, i) => {
        const selected = s.id === value;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(s.id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
              FOCUS_RING,
              selected ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink"
            )}
          >
            <span
              className={cn(
                "grid size-4 shrink-0 place-items-center rounded-full font-mono text-[9px]",
                s.done ? "bg-pos text-white" : selected ? "bg-brand-tint text-brand-700" : "bg-surface text-ink-3"
              )}
              aria-hidden
            >
              {s.done ? <Check className="size-2.5" strokeWidth={3} /> : i + 1}
            </span>
            {s.label}
            {s.done ? <span className="sr-only">(done)</span> : null}
          </button>
        );
      })}
    </div>
  );
}
