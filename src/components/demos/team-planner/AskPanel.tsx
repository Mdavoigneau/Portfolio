/* The persistent "Ask in plain English" panel below the tabs. Four scripted chips, each
   staged the way production surfaces a model turn: the typed tool call, the validator's
   verdict, then the outcome. Mutations go through the exact same send() as the forms,
   so a chip's booking shows up on the Resources tab and Mei's afternoon on Team day. */

import * as React from "react";
import { CornerDownRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { TODAY, type PlanningDay, type PlannerState } from "./data";
import { describeOutcome, formatCall, validate, type Action, type Outcome, type Validation } from "./logic";
import { FOCUS_RING, REVEAL, ValidationLine } from "./controls";

interface Preset {
  id: string;
  label: string;
  /** Builds the action; the who-is-in chip reads whichever day is selected. */
  build: (selectedDateIso: string) => Action;
}

const PRESETS: readonly Preset[] = [
  {
    id: "book-ok",
    label: "Book Boardroom A from 14:00 to 15:00",
    build: () => ({
      type: "book_resource",
      args: { resource: "boardroom-a", date: TODAY.iso, from: "14:00", to: "15:00", bookedBy: "you" },
    }),
  },
  {
    id: "wfh",
    label: "Set Mei to work from home this afternoon",
    build: () => ({
      type: "set_day_status",
      args: { member: "mei", date: TODAY.iso, location: "home", from: "13:00", note: "Set via plain-English tool call" },
    }),
  },
  {
    id: "who",
    label: "Who is in the office right now?",
    build: (selectedDateIso) => ({ type: "get_team_at", args: { date: selectedDateIso, at: "11:20" } }),
  },
  {
    id: "book-bad",
    label: "Book Boardroom A from 14:30 to 14:00",
    build: () => ({
      type: "book_resource",
      args: { resource: "boardroom-a", date: TODAY.iso, from: "14:30", to: "14:00", bookedBy: "you" },
    }),
  },
];

interface RunState {
  presetId: string;
  action: Action;
  stage: 1 | 2 | 3;
  validation: Validation;
  outcome: Outcome | null;
}

const OUTCOME_TONE: Record<Outcome["tone"], string> = { pos: "text-pos", neg: "text-neg", info: "text-ink-2" };

interface AskPanelProps {
  state: PlannerState;
  day: PlanningDay;
  send: (action: Action) => Validation;
  onReset: () => void;
}

export default function AskPanel({ state, day, send, onReset }: AskPanelProps) {
  const [run, setRun] = React.useState<RunState | null>(null);

  const timersRef = React.useRef<number[]>([]);
  const clearTimers = React.useCallback(() => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  }, []);
  React.useEffect(() => clearTimers, [clearTimers]);

  function runPreset(p: Preset) {
    clearTimers();
    const action = p.build(day.iso);
    const validation = validate(action, state);
    const outcome = validation.ok ? describeOutcome(action, state) : null;

    setRun({ presetId: p.id, action, stage: 1, validation, outcome: null });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timersRef.current.push(
      window.setTimeout(() => setRun((r) => (r && r.presetId === p.id ? { ...r, stage: 2 } : r)), reduce ? 0 : 450),
      window.setTimeout(() => {
        if (validation.ok) send(action);
        setRun((r) => (r && r.presetId === p.id ? { ...r, stage: 3, outcome } : r));
      }, reduce ? 0 : 950)
    );
  }

  return (
    <section className="rounded-lg border border-line bg-elevated px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="eyebrow">Ask in plain English</div>
        <button
          type="button"
          onClick={onReset}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-ink-3 transition-colors hover:bg-sunken hover:text-ink-2",
            FOCUS_RING
          )}
        >
          <RotateCcw className="size-3" aria-hidden /> reset
        </button>
      </div>
      <p className="mb-2.5 mt-1 text-xs text-ink-3">
        four canned prompts; each becomes a typed tool call, validated before any state changes, and lands on the tab it names
      </p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => runPreset(p)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-left text-xs leading-snug transition-colors",
              run?.presetId === p.id
                ? "border-brand-line bg-brand-tint text-brand-700"
                : "border-line-strong bg-surface text-ink-2 hover:border-brand-line hover:bg-brand-tint/40",
              FOCUS_RING
            )}
          >
            &ldquo;{p.label}&rdquo;
          </button>
        ))}
      </div>

      {run && (
        <div className="mt-3 space-y-2" aria-live="polite">
          <pre
            className={cn(
              "overflow-x-auto rounded-lg border border-line bg-sunken/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-2",
              REVEAL
            )}
          >
            {formatCall(run.action)}
          </pre>
          {run.stage >= 2 && <ValidationLine result={run.validation} />}
          {run.stage >= 3 && run.outcome && (
            <div className={cn("flex items-start gap-1.5 text-xs tnum", OUTCOME_TONE[run.outcome.tone], REVEAL)}>
              <CornerDownRight className="mt-0.5 size-3.5 shrink-0 text-ink-3" aria-hidden />
              <span>{run.outcome.text}</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
