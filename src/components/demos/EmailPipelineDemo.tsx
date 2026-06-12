import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, Play } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

/* ── Synthetic data: invented constituents, generic office, example domains ── */

interface Exemplar {
  caseId: string;
  score: number;
  subject: string;
}

interface BaseEmail {
  id: string;
  fromName: string;
  fromAddr: string;
  subject: string;
  routedTo: string;
  body: string;
}

interface DraftEmail extends BaseEmail {
  mode: "draft";
  exemplars: Exemplar[];
  reply: string;
  tokensIn: string;
  tokensOut: string;
}

interface DiaryEmail extends BaseEmail {
  mode: "diary";
  diary: { who: string; what: string; when: string; where: string; contact: string };
}

type DemoEmail = DraftEmail | DiaryEmail;

const EMAILS: readonly [DemoEmail, DemoEmail, DemoEmail] = [
  {
    id: "pothole",
    mode: "draft",
    fromName: "Marcus Webb",
    fromAddr: "marcus.webb@example.com",
    subject: "Pothole on Carlton Street is getting dangerous",
    routedTo: "ai+draft@office.example",
    body: "Hi, the pothole on Carlton Street between the bakery and the lights has gotten much worse over winter. A cyclist came off near it last week. Can the office raise it with Council?",
    exemplars: [
      { caseId: "58901", score: 0.718, subject: "Pothole repair request, Station Road" },
      { caseId: "61247", score: 0.694, subject: "Damaged kerb outside the primary school" },
      { caseId: "60338", score: 0.671, subject: "Road resurfacing timeline enquiry" },
    ],
    reply:
      "Hi Marcus\n\nThanks for getting in touch about the pothole on Carlton Street. A hazard like that, especially with a cyclist already coming off, is exactly the kind of thing we want to hear about. We will raise it with Council's works team this week and ask for an urgent inspection of that stretch.\n\nWe will let you know as soon as we hear back. Thanks again for flagging it.\n\nKind regards\nElectorate Office",
    tokensIn: "4,123",
    tokensOut: "87",
  },
  {
    id: "fair",
    mode: "diary",
    fromName: "Megan Liu",
    fromAddr: "megan.liu@example.com",
    subject: "Invitation: Foreshore Winter Fair opening, Sat 27 June",
    routedTo: "ai+diary@office.example",
    body: "We would love the Member to open this year's winter fair and say a few words at 10am. Stalls run all day at the Foreshore Pavilion. Happy to send a run sheet closer to the date.",
    diary: {
      who: "Foreshore Residents Association",
      what: "Opening of the annual winter fair: brief welcome remarks (about five minutes), then meet local stallholders.",
      when: "Saturday 27 June 2026, 10:00am",
      where: "Foreshore Pavilion, 14 Esplanade Road, Harbourview NSW 2099",
      contact: "Megan Liu, 0400 555 218, megan.liu@example.com",
    },
  },
  {
    id: "scooter",
    mode: "draft",
    fromName: "Daniel Okafor",
    fromAddr: "daniel.okafor@example.com",
    subject: "Where does the Member stand on the e-scooter trial?",
    routedTo: "ai+draft@office.example",
    body: "Quick question before the community meeting on Thursday: does the Member support extending the shared e-scooter trial? I ride one to the station most days and would like to know the office's position.",
    exemplars: [
      { caseId: "62114", score: 0.703, subject: "E-scooter trial safety concerns" },
      { caseId: "59876", score: 0.668, subject: "Active transport strategy question" },
      { caseId: "61902", score: 0.641, subject: "Bike lane consultation feedback" },
    ],
    reply:
      "Hi Daniel\n\nThanks for your question ahead of Thursday's meeting. The Member supports extending the shared e-scooter trial, provided it keeps the current safeguards: capped speeds near the foreshore, designated parking, and regular safety data shared with Council. We have asked Transport for the latest trial figures and are happy to pass them on once they arrive.\n\nSee you Thursday.\n\nKind regards\nElectorate Office",
    tokensIn: "3,866",
    tokensOut: "82",
  },
];

/* ── Pipeline stages (synthetic timings; animation clamped for legibility) ── */

interface Stage {
  name: string;
  detail: string;
  durLabel: string;
  animMs: number;
  payload: ReactNode;
}

function clampAnim(ms: number): number {
  return Math.min(900, Math.max(420, ms));
}

function buildStages(email: DemoEmail): Stage[] {
  const isDraft = email.mode === "draft";
  return [
    {
      name: "Poll inbox",
      detail: "Gmail via domain-wide delegation, every minute",
      durLabel: "412 ms",
      animMs: clampAnim(412),
      payload: <span>1 new message</span>,
    },
    {
      name: "Route by tag",
      detail: "+draft / +diary plus-addressing",
      durLabel: "31 ms",
      animMs: clampAnim(31),
      payload: (
        <span>
          handler: <span className="font-mono text-brand-700">{isDraft ? "draft_reply" : "diary_extract"}</span>{" "}
          (matched <span className="font-mono">{isDraft ? "ai+draft" : "ai+diary"}</span>)
        </span>
      ),
    },
    {
      name: "Embed and retrieve",
      detail: isDraft
        ? "voyage embeddings, 1024-dim, cosine, K=6 over a 2,284-pair corpus of historic replies"
        : "no retrieval in diary mode",
      durLabel: isDraft ? "187 ms" : "2 ms",
      animMs: clampAnim(isDraft ? 187 : 2),
      payload: isDraft ? (
        <div>
          <div className="text-ink-2">top 3 of K=6 nearest historic pairs:</div>
          <div className="mt-1 grid grid-cols-[auto_auto_minmax(0,1fr)] gap-x-3 gap-y-0.5">
            {email.exemplars.map((ex) => (
              <Fragment key={ex.caseId}>
                <span className="font-mono text-ink-3">#{ex.caseId}</span>
                <span className="tnum font-mono text-brand-700">{ex.score.toFixed(3)}</span>
                <span className="truncate text-ink-2">{ex.subject}</span>
              </Fragment>
            ))}
          </div>
        </div>
      ) : (
        <span>skipped: extraction needs no exemplars</span>
      ),
    },
    isDraft
      ? {
          name: "Draft with Claude",
          detail: "claude-sonnet-4-6, exemplars in context, max 800 tokens",
          durLabel: "1,402 ms",
          animMs: clampAnim(1402),
          payload: <span>reply drafted in the office voice: {email.tokensOut} tokens out</span>,
        }
      : {
          name: "Extract diary fields",
          detail: "claude-sonnet-4-6, structured output",
          durLabel: "1,118 ms",
          animMs: clampAnim(1118),
          payload: <span>five fields extracted: who, what, when, where, contact</span>,
        },
    {
      name: "Place in Gmail",
      detail: "label and file on the original thread",
      durLabel: "226 ms",
      animMs: clampAnim(226),
      payload: isDraft ? (
        <span>draft saved to the thread for a staffer to review and send; nothing is auto-sent</span>
      ) : (
        <span>summary filed on the thread for the diary manager; nothing is auto-sent</span>
      ),
    },
  ];
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ── Small pieces ── */

function StageGlyph({ status }: { status: "pending" | "running" | "done" }) {
  if (status === "done") {
    return (
      <span className="grid size-[18px] place-items-center rounded-full bg-brand">
        <Check className="size-3 text-white" strokeWidth={3} />
      </span>
    );
  }
  if (status === "running") {
    return (
      <span className="grid size-[18px] place-items-center rounded-full border-2 border-brand">
        <span className="size-1.5 animate-pulse rounded-full bg-brand" />
      </span>
    );
  }
  return <span className="block size-[18px] rounded-full border border-line-strong bg-surface" />;
}

function ZoneLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">{children}</div>
  );
}

/* ── Demo ── */

type Phase = "idle" | "running" | "done";

export default function EmailPipelineDemo() {
  const [selectedId, setSelectedId] = useState<string>("pothole");
  const [phase, setPhase] = useState<Phase>("idle");
  const [doneCount, setDoneCount] = useState(0);
  const [typedLen, setTypedLen] = useState(0);
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const email = EMAILS.find((e) => e.id === selectedId) ?? EMAILS[0];
  const stages = useMemo(() => buildStages(email), [email]);

  function selectEmail(id: string) {
    setSelectedId(id);
    setPhase("idle");
    setDoneCount(0);
    setTypedLen(0);
  }

  function run() {
    setTypedLen(0);
    if (prefersReducedMotion()) {
      setDoneCount(stages.length);
      setPhase("done");
    } else {
      setDoneCount(0);
      setPhase("running");
    }
  }

  useEffect(() => {
    if (phase !== "running") return;
    if (doneCount >= stages.length) {
      setPhase("done");
      return;
    }
    const stage = stages[doneCount];
    if (!stage) return;
    const t = window.setTimeout(() => setDoneCount((c) => c + 1), stage.animMs);
    return () => window.clearTimeout(t);
  }, [phase, doneCount, stages]);

  useEffect(() => {
    if (phase !== "done" || email.mode !== "draft") return;
    const full = email.reply.length;
    if (prefersReducedMotion()) {
      setTypedLen(full);
      return;
    }
    const t = window.setInterval(() => {
      setTypedLen((l) => {
        const next = Math.min(full, l + 3);
        if (next >= full) window.clearInterval(t);
        return next;
      });
    }, 18);
    return () => window.clearInterval(t);
  }, [phase, email]);

  function onRadioKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const dir =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (dir === 0) return;
    e.preventDefault();
    const next = (index + dir + EMAILS.length) % EMAILS.length;
    const target = EMAILS[next];
    if (!target) return;
    selectEmail(target.id);
    radioRefs.current[next]?.focus();
  }

  const typingDone = email.mode === "draft" ? typedLen >= email.reply.length : true;

  return (
    <div className="w-full">
      <ZoneLabel>1 · pick a constituent email</ZoneLabel>
      <div role="radiogroup" aria-label="Constituent email" className="grid gap-2 sm:grid-cols-3">
        {EMAILS.map((em, i) => {
          const selected = em.id === selectedId;
          return (
            <button
              key={em.id}
              ref={(el) => {
                radioRefs.current[i] = el;
              }}
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectEmail(em.id)}
              onKeyDown={(e) => onRadioKeyDown(e, i)}
              className={cn(
                "min-w-0 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                selected
                  ? "border-brand-line bg-brand-tint/40"
                  : "border-line bg-elevated hover:border-line-strong"
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "grid size-3 shrink-0 place-items-center rounded-full border",
                    selected ? "border-brand" : "border-line-strong"
                  )}
                >
                  {selected && <span className="size-1.5 rounded-full bg-brand" />}
                </span>
                <span className="truncate text-sm font-medium text-ink">{em.fromName}</span>
              </span>
              <span className="mt-0.5 block truncate font-mono text-[10px] text-ink-3">
                {em.fromAddr}
              </span>
              <span className="mt-1 block truncate text-xs font-medium text-ink-2">
                {em.subject}
              </span>
              <span className="mt-0.5 block truncate font-mono text-[10px] text-brand-700">
                fwd → {em.routedTo}
              </span>
              <span className="mt-1 line-clamp-3 block text-xs leading-snug text-ink-2">
                {em.body}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={run} disabled={phase === "running"}>
          <Play aria-hidden />
          Run the pipeline
        </Button>
        <span className="text-xs text-ink-3">
          {phase === "running" ? "replaying synthetic timings" : "5 stages, replayed in your browser"}
        </span>
      </div>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
        <div>
          <ZoneLabel>2 · pipeline</ZoneLabel>
          <ol aria-label="Pipeline stages" className="list-none p-0">
            {stages.map((stage, i) => {
              const status: "pending" | "running" | "done" =
                i < doneCount ? "done" : i === doneCount && phase === "running" ? "running" : "pending";
              const last = i === stages.length - 1;
              return (
                <li key={stage.name} className={cn("relative pl-7", !last && "pb-4")}>
                  {!last && (
                    <span
                      aria-hidden
                      className="absolute left-[8.5px] top-[22px] h-[calc(100%-22px)] w-px bg-line"
                    />
                  )}
                  <span className="absolute left-0 top-0.5">
                    <StageGlyph status={status} />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        status === "pending" ? "text-ink-3" : "text-ink"
                      )}
                    >
                      {stage.name}
                    </span>
                    <span className="sr-only">{status}</span>
                    {status === "done" && (
                      <span className="reveal tnum rounded bg-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
                        {stage.durLabel}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] leading-snug text-ink-3">{stage.detail}</div>
                  {status === "done" && (
                    <div className="reveal mt-1.5 rounded-md bg-sunken/60 px-2.5 py-1.5 text-xs leading-snug text-ink-2">
                      {stage.payload}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div>
          <ZoneLabel>3 · result</ZoneLabel>
          {phase !== "done" ? (
            <div className="grid min-h-[160px] place-items-center rounded-lg border border-dashed border-line-strong bg-elevated/50 px-4 text-center text-xs text-ink-3">
              {email.mode === "draft"
                ? "the drafted reply appears here after a run"
                : "the extracted diary fields appear here after a run"}
            </div>
          ) : email.mode === "draft" ? (
            <div className="reveal rounded-lg border border-line bg-surface p-4 shadow-card">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                Drafted reply · awaiting human review
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                {email.reply.slice(0, typedLen)}
                {!typingDone && (
                  <span
                    aria-hidden
                    className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-[caret_1s_step-end_infinite] bg-brand"
                  />
                )}
              </p>
              {typingDone && (
                <div className="reveal mt-3 border-t border-line pt-2">
                  <p className="font-mono text-[10px] italic leading-relaxed text-ink-3">
                    Drafted by AI from these past replies:{" "}
                    {email.exemplars.map((ex, i) => (
                      <Fragment key={ex.caseId}>
                        {i > 0 && " · "}
                        <span className="tnum">
                          #{ex.caseId} ({ex.score.toFixed(3)})
                        </span>
                      </Fragment>
                    ))}
                  </p>
                  <p className="tnum mt-1 font-mono text-[10px] text-ink-3">
                    claude-sonnet-4-6 · in {email.tokensIn} tok · out {email.tokensOut} tok · K=6 ·
                    voyage 1024-dim
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="reveal rounded-lg border border-line bg-surface p-4 shadow-card">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                Diary extraction · for the diary manager
              </div>
              <dl className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
                {(
                  [
                    ["Who", email.diary.who],
                    ["What", email.diary.what],
                    ["When", email.diary.when],
                    ["Where", email.diary.where],
                    ["Contact", email.diary.contact],
                  ] as const
                ).map(([label, value]) => (
                  <Fragment key={label}>
                    <dt className="pt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                      {label}
                    </dt>
                    <dd className="m-0 leading-snug text-ink">{value}</dd>
                  </Fragment>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-3">
        the pipeline is replayed from canned synthetic data in your browser, no model is called;
        stage order, retrieval parameters, the audit footer and the human-review handoff mirror the
        production system.
      </p>
    </div>
  );
}
