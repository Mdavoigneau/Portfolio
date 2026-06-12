/* Accent-driven primitives and the single question renderer. Every control
   reads its colour from --demo-accent so the white-label switcher restyles
   the whole form by swapping one CSS custom property. */

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { type AnswerValue } from "./config";
import { type ExpandedQuestion } from "./logic";

export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

// Soft-warning surface, derived from the design system's gold series token.
export const WARN_TEXT = {
  color: "color-mix(in srgb, var(--color-series-2) 62%, var(--color-ink))",
};
export const WARN_BOX = {
  borderColor: "color-mix(in srgb, var(--color-series-2) 45%, transparent)",
  backgroundColor: "color-mix(in srgb, var(--color-series-2) 8%, transparent)",
};

export function AccentButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-white shadow-card transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px",
        FOCUS_RING
      )}
      style={{ background: "var(--demo-accent)" }}
    >
      {children}
    </button>
  );
}

export function AccentLink({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string | undefined;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-sm font-medium underline-offset-4 hover:underline", FOCUS_RING, className)}
      style={{ color: "var(--demo-accent)" }}
    >
      {children}
    </button>
  );
}

interface PillProps {
  selected: boolean;
  bg: string;
  onClick: () => void;
  className?: string | undefined;
  pillRef?: ((el: HTMLElement | null) => void) | undefined;
  children: React.ReactNode;
}

export function Pill({ selected, bg, onClick, className, pillRef, children }: PillProps) {
  return (
    <button
      type="button"
      ref={pillRef}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border text-xs font-medium transition-colors duration-150",
        FOCUS_RING,
        selected ? "border-transparent text-white" : "border-line-strong bg-surface text-ink-2 hover:bg-sunken",
        className
      )}
      style={selected ? { background: bg } : undefined}
    >
      {children}
    </button>
  );
}

function FieldError({ id, error }: { id: string; error: string | undefined }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-neg">
      {error}
    </p>
  );
}

function HelpText({ help }: { help: string | undefined }) {
  if (!help) return null;
  return <p className="mt-1.5 text-xs leading-relaxed text-ink-3">{help}</p>;
}

export interface QuestionFieldProps {
  q: ExpandedQuestion;
  value: AnswerValue | undefined;
  error: string | undefined;
  onChange: (v: AnswerValue) => void;
  register: (id: string) => (el: HTMLElement | null) => void;
}

/** Renders one expanded question. The same component serves every step;
    which fields exist is entirely the config's business. */
export function QuestionField({ q, value, error, onChange, register }: QuestionFieldProps) {
  const inputId = `smsf-${q.id}`;
  const labelId = `${inputId}-label`;
  const errorId = `${inputId}-error`;
  const optional = !q.required && (
    <span className="ml-1.5 text-xs font-normal text-ink-3">optional</span>
  );

  if (q.type === "single_choice" || q.type === "multi_choice" || q.type === "yes_no") {
    const opts: readonly { value: string; label: string }[] =
      q.type === "yes_no"
        ? [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]
        : (q.options ?? []).map((o) => ({ value: o, label: o }));
    const selectedOf = (opt: string) =>
      q.type === "multi_choice" ? Array.isArray(value) && value.includes(opt) : value === opt;
    return (
      <div>
        <div id={labelId} className="mb-1.5 text-sm font-medium text-ink">
          {q.label}
          {optional}
        </div>
        <div
          role="group"
          aria-labelledby={labelId}
          aria-describedby={error ? errorId : undefined}
          className="flex flex-wrap gap-2"
        >
          {opts.length === 0 && (
            <p className="text-sm italic text-ink-3">no options yet, they appear once answered elsewhere</p>
          )}
          {opts.map((opt, i) => {
            const selected = selectedOf(opt.value);
            return (
              <Pill
                key={opt.value}
                selected={selected}
                bg="var(--demo-accent)"
                className="px-3 py-1.5"
                pillRef={i === 0 ? register(q.id) : undefined}
                onClick={() => {
                  if (q.type !== "multi_choice") return onChange(opt.value);
                  const cur = Array.isArray(value) ? value : [];
                  onChange(selected ? cur.filter((o) => o !== opt.value) : [...cur, opt.value]);
                }}
              >
                {selected && <Check className="size-3" aria-hidden />}
                {opt.label}
              </Pill>
            );
          })}
        </div>
        <HelpText help={q.help} />
        <FieldError id={errorId} error={error} />
      </div>
    );
  }

  const isCode = q.format === "tfn" || q.format === "directorId";
  const isNumber = q.type === "number";
  return (
    <div className={cn(isNumber ? "max-w-[10rem]" : "max-w-md")}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink">
        {q.label}
        {optional}
      </label>
      <input
        id={inputId}
        ref={register(q.id)}
        type={q.type === "email" ? "email" : isNumber ? "number" : q.type === "phone" ? "tel" : "text"}
        inputMode={isNumber || isCode ? "numeric" : undefined}
        min={q.min}
        max={q.max}
        value={typeof value === "string" ? value : ""}
        placeholder={q.placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3/70",
          FOCUS_RING,
          (isCode || isNumber) && "tnum font-mono",
          error ? "border-neg" : "border-line-strong"
        )}
      />
      <HelpText help={q.help} />
      <FieldError id={errorId} error={error} />
    </div>
  );
}
