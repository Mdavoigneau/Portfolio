import { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { SESSION, type LineKind } from "./session";

/* A terminal "taste" of the predecessor: before the government repair-incentive
   claims ran in a web app, they ran in this Python CLI, built fast under an
   emergency. This replays one Ecologic ticket end to end. The output and prompts
   are the real program's; the case (person, ticket, IMEI, amounts) is synthetic.
   See ./session.ts. Reduced-motion safe: the whole transcript shows at once. */

const HOLD: Record<LineKind, number> = {
  cmd: 280,
  out: 165,
  dim: 110,
  ok: 240,
  prompt: 360,
  blank: 90,
};

interface Step {
  li: number;
  cc: number;
  hold: number;
}

/** Cumulative reveal plan: each line appears, then a prompt's answer types in. */
function buildSteps(): Step[] {
  const steps: Step[] = [];
  SESSION.forEach((line, i) => {
    steps.push({ li: i, cc: 0, hold: HOLD[line.kind] });
    if (line.kind === "prompt" && line.answer) {
      for (let c = 1; c <= line.answer.length; c++) {
        steps.push({ li: i, cc: c, hold: 55 });
      }
      const last = steps[steps.length - 1];
      if (last) last.hold = 460; // beat after the answer lands
    }
  });
  return steps;
}

const KIND_CLASS: Record<LineKind, string> = {
  cmd: "text-emerald-300",
  out: "text-zinc-300",
  dim: "text-zinc-500",
  ok: "text-emerald-300",
  prompt: "text-zinc-300",
  blank: "",
};

export default function IrepTerminalDemo() {
  const steps = useMemo(buildSteps, []);
  const [reduced, setReduced] = useState(false);
  const [runToken, setRunToken] = useState(0);
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced) {
      setStep(steps.length - 1);
      return;
    }
    let i = 0;
    let timer: number;
    setStep(0);
    const tick = () => {
      const cur = steps[i];
      if (i >= steps.length - 1 || !cur) return;
      timer = window.setTimeout(() => {
        i += 1;
        setStep(i);
        tick();
      }, cur.hold);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [runToken, reduced, steps]);

  const current = steps[step] ?? steps[steps.length - 1] ?? { li: 0, cc: 0, hold: 0 };
  const { li, cc } = current;
  const running = step < steps.length - 1;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [step]);

  const visible = SESSION.slice(0, li + 1);

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-line bg-[#0b0e13] shadow-sm">
        <div className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-[#ff5f56]" aria-hidden="true" />
            <span className="size-3 rounded-full bg-[#ffbd2e]" aria-hidden="true" />
            <span className="size-3 rounded-full bg-[#27c93f]" aria-hidden="true" />
            <span className="ml-2 font-mono text-[11px] text-zinc-400">
              auto_ecologic_ecosystem.py · iRep
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRunToken((t) => t + 1)}
            disabled={running && !reduced}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] transition",
              running && !reduced
                ? "cursor-not-allowed border-white/10 text-zinc-500"
                : "border-white/15 text-zinc-300 hover:bg-white/10",
            )}
          >
            {running && !reduced ? (
              <>
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                running
              </>
            ) : (
              <>
                <Play className="size-3" />
                replay
              </>
            )}
          </button>
        </div>

        <div
          ref={scrollRef}
          className="max-h-[22rem] overflow-auto px-4 py-3 font-mono text-[11.5px] leading-[1.55] [scrollbar-width:thin]"
          aria-label="Terminal session"
        >
          {visible.map((line, idx) => {
            const isLast = idx === li;
            if (line.kind === "blank") {
              return <div key={idx} className="h-[0.7em]" aria-hidden="true" />;
            }
            const cursor =
              isLast ? (
                <span
                  className={cn(
                    "ml-px inline-block h-[1.05em] w-[0.5em] -translate-y-[0.06em] bg-zinc-300 align-middle",
                    running && !reduced && "animate-pulse",
                  )}
                  aria-hidden="true"
                />
              ) : null;

            if (line.kind === "cmd") {
              return (
                <div key={idx} className="whitespace-pre text-emerald-300">
                  <span className="text-zinc-500">$ </span>
                  {line.text}
                  {cursor}
                </div>
              );
            }

            if (line.kind === "prompt") {
              const typed = isLast ? (line.answer ?? "").slice(0, cc) : (line.answer ?? "");
              return (
                <div key={idx} className="whitespace-pre text-zinc-300">
                  {line.text}
                  <span className="font-semibold text-sky-300">{typed}</span>
                  {cursor}
                </div>
              );
            }

            return (
              <div key={idx} className={cn("whitespace-pre", KIND_CLASS[line.kind])}>
                {line.text}
                {cursor}
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 font-mono text-[10px] leading-relaxed text-ink-3">
        Faithful re-enactment of the original terminal tool. The program's output and prompts
        are verbatim from the source; the case (person, ticket, IMEI, amounts) is synthetic.
      </p>
    </div>
  );
}
