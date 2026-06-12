import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, FileImage, FileText, Play, UserCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* A process explainer for the AI marketing-compliance reviewer. The phase
   names (extracting, reviewing, saving, notifying), the severity model, the
   citation format and the two-stage approval chain mirror production; every
   marketing piece and finding below is invented for the demo. */

type Severity = "minor" | "critical";
type Source = "library" | "general knowledge";

interface Finding {
  severity: Severity;
  description: string;
  citation: string;
  fix: string;
  source: Source;
}

interface Piece {
  id: string;
  title: string;
  kind: "html" | "image";
  kindLabel: string;
  /** the marketing copy as submitted (or as OCR reads it off the tile) */
  copy: string;
  extractNote: string;
  findings: Finding[];
}

const PIECES: readonly [Piece, Piece] = [
  {
    id: "spring-email",
    title: "Spring offer email · Market Edge newsletter",
    kind: "html",
    kindLabel: "HTML email",
    copy:
      "MARKET EDGE · SPRING OFFER\nJoin for $59/month*. Our model portfolio returned 24.1% last year. The first 100 new members also receive a bonus strategy session.\n[ Join Market Edge ]\n*Renews at $79/month unless cancelled. General advice only; consider your circumstances.",
    extractNote: "HTML body parsed and flattened · 412 characters · shown back for human verification before any approval",
    findings: [
      {
        severity: "critical",
        description:
          "The email promotes a financial advice subscription but never identifies the AFS licensee: no legal name, ABN or AFSL number anywhere in the piece.",
        citation: "ASIC RG 234 (identification of promoter / issuer) · standard AFS licensee disclosure practice",
        fix: "Add an issuer line ('Issued by [licensee legal name] ABN xx xxx xxx xxx, AFSL xxxxxx') adjacent to the offer.",
        source: "general knowledge",
      },
      {
        severity: "critical",
        description:
          "'Returned 24.1% last year' is a past-performance claim with no warning that past performance is not indicative of future performance, and no period or basis for the figure.",
        citation: "ASIC RG 53 · RG 234.59 (past performance in promotional material)",
        fix: "Pair the figure with the required past-performance warning at equal prominence, and state the measurement period and basis.",
        source: "library",
      },
      {
        severity: "critical",
        description:
          "The $59 headline price renews at $79, disclosed only in a footnote. The headline gives an unrealistic impression of the ongoing cost of the service.",
        citation: "RG 234.47 (caution with 'from' qualifiers) · RG 234.54 (fees must give a realistic impression of overall cost)",
        fix: "State the $79 renewal price with prominence equal to the $59 headline, next to it rather than in a footnote.",
        source: "library",
      },
      {
        severity: "minor",
        description:
          "The general advice warning sits in small type below the call-to-action button, so it lacks sufficient prominence on first viewing.",
        citation: "RG 234.48 (warnings and disclaimers must have sufficient prominence)",
        fix: "Move the warning above the 'Join Market Edge' button and lift its size relative to the promotional copy.",
        source: "library",
      },
      {
        severity: "minor",
        description:
          "'First 100 new members' pairs scarcity with a bonus session as an inducement to take up an advice service; the internal checklist treats bonus-style inducements as an aggressive technique to avoid.",
        citation: "internal advertising checklist (inducements and urgency)",
        fix: "Remove the member cap, or separate the session offer from the subscription decision.",
        source: "library",
      },
    ],
  },
  {
    id: "webinar-tile",
    title: "Webinar promo · social tile (image)",
    kind: "image",
    kindLabel: "PNG tile · vision OCR",
    copy:
      "NAVIGATING RATE CUTS\nA live webinar with our senior strategist\nThu 25 Jun · 12:30pm AEST · limited seats\n[ Reserve a seat ]",
    extractNote: "image routed through vision OCR · 4 text blocks recovered · shown back for human verification",
    findings: [
      {
        severity: "critical",
        description:
          "The tile carries no general advice warning at all. The warning must appear in the advertisement itself; a disclaimer on the landing page after the click is not sufficient.",
        citation: "RG 234.48 · RG 234.49 (a correction on another page is generally insufficient)",
        fix: "Add the general advice warning to the tile itself, legible at feed size.",
        source: "library",
      },
      {
        severity: "minor",
        description:
          "'Limited seats' manufactures urgency for what is promotional financial content; the internal checklist flags urgency devices unless the limit is real and substantiated.",
        citation: "internal advertising checklist (urgency devices)",
        fix: "Drop 'limited seats' or substantiate the actual capacity.",
        source: "library",
      },
    ],
  },
];

interface Phase {
  name: string;
  detail: string;
  durLabel: string;
  animMs: number;
  payload: ReactNode;
}

const clampAnim = (ms: number) => Math.min(950, Math.max(420, ms));

function buildPhases(piece: Piece): Phase[] {
  const criticals = piece.findings.filter((f) => f.severity === "critical").length;
  const minors = piece.findings.length - criticals;
  return [
    {
      name: "Extract",
      detail: piece.kind === "image" ? "vision OCR for image submissions; PDF, DOCX and HTML are parsed directly" : "PDF, DOCX, HTML parsed directly; images route through vision OCR",
      durLabel: piece.kind === "image" ? "6.1 s" : "1.8 s",
      animMs: clampAnim(700),
      payload: <span>{piece.extractNote}</span>,
    },
    {
      name: "AI review",
      detail: "Claude, against a legislation library held in an ephemeral prompt cache (RG 234, RG 53, internal checklist)",
      durLabel: "39 s",
      animMs: clampAnim(950),
      payload: (
        <span>
          {piece.findings.length} issues proposed: <span className="font-medium text-neg">{criticals} critical</span>,{" "}
          {minors} minor · each carries a citation and a suggested fix
        </span>
      ),
    },
    {
      name: "Save",
      detail: "issues persisted against the submission, review timing logged",
      durLabel: "0.1 s",
      animMs: clampAnim(420),
      payload: <span>submission status: ai_pending → ai_reviewed</span>,
    },
    {
      name: "Notify",
      detail: "SES email to the submitter and the first approval stage",
      durLabel: "0.9 s",
      animMs: clampAnim(600),
      payload: <span>nothing publishes from here: the review is a first pass for the humans below</span>,
    },
  ];
}

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge size="sm" variant={severity === "critical" ? "neg" : "outline"} className="shrink-0 uppercase tracking-wide">
      {severity}
    </Badge>
  );
}

function PhaseGlyph({ status }: { status: "pending" | "running" | "done" }) {
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
  return <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">{children}</div>;
}

const STAGE_TEAMS = ["Marketing", "Compliance"] as const;

export default function ComplianceReviewerDemo() {
  const [pieceId, setPieceId] = useState<string>("spring-email");
  const [doneCount, setDoneCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [approvedStages, setApprovedStages] = useState(0);

  const timer = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const piece = PIECES.find((p) => p.id === pieceId) ?? PIECES[0];
  const phases = buildPhases(piece);
  const finished = doneCount >= phases.length;

  function selectPiece(id: string) {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setPieceId(id);
    setDoneCount(0);
    setRunning(false);
    setApprovedStages(0);
  }

  function run() {
    setApprovedStages(0);
    if (prefersReducedMotion()) {
      setDoneCount(phases.length);
      setRunning(false);
      return;
    }
    setDoneCount(0);
    setRunning(true);
  }

  useEffect(() => {
    if (!running) return;
    if (doneCount >= phases.length) {
      setRunning(false);
      return;
    }
    const ms = phases[doneCount]?.animMs ?? 500;
    timer.current = window.setTimeout(() => setDoneCount((c) => c + 1), ms);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [running, doneCount, phases]);

  return (
    <div className="w-full">
      <ZoneLabel>1 · pick a marketing piece (both invented)</ZoneLabel>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Marketing piece">
        {PIECES.map((p) => {
          const selected = p.id === pieceId;
          const Icon = p.kind === "image" ? FileImage : FileText;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => selectPiece(p.id)}
              className={cn(
                "min-w-0 rounded-lg border px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                selected ? "border-brand-line bg-brand-tint/40" : "border-line bg-elevated hover:border-line-strong"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-3.5 shrink-0 text-ink-3" aria-hidden />
                <span className="truncate text-sm font-medium text-ink">{p.title}</span>
              </span>
              <span className="mt-0.5 block font-mono text-[10px] text-ink-3">{p.kindLabel}</span>
              <span className="mt-1.5 block whitespace-pre-line border-l-2 border-line pl-2 text-[11px] leading-snug text-ink-2">
                {p.copy}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={run} disabled={running}>
          <Play aria-hidden />
          Submit for review
        </Button>
        <span className="text-xs text-ink-3">
          {running ? "replaying synthetic timings (the real review takes ~39 s)" : "4 phases, replayed in your browser"}
        </span>
      </div>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
        <div>
          <ZoneLabel>2 · pipeline</ZoneLabel>
          <ol aria-label="Review phases" className="list-none p-0">
            {phases.map((phase, i) => {
              const status: "pending" | "running" | "done" =
                i < doneCount ? "done" : i === doneCount && running ? "running" : "pending";
              const last = i === phases.length - 1;
              return (
                <li key={phase.name} className={cn("relative pl-7", !last && "pb-4")}>
                  {!last && <span aria-hidden className="absolute left-[8.5px] top-[22px] h-[calc(100%-22px)] w-px bg-line" />}
                  <span className="absolute left-0 top-0.5">
                    <PhaseGlyph status={status} />
                  </span>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className={cn("text-sm font-medium", status === "pending" ? "text-ink-3" : "text-ink")}>
                      {phase.name}
                    </span>
                    <span className="sr-only">{status}</span>
                    {status === "done" && (
                      <span className="reveal tnum rounded bg-sunken px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
                        {phase.durLabel} in production
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] leading-snug text-ink-3">{phase.detail}</div>
                  {status === "done" && (
                    <div className="reveal mt-1.5 rounded-md bg-sunken/60 px-2.5 py-1.5 text-xs leading-snug text-ink-2">
                      {phase.payload}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>

          {finished && (
            <div className="reveal mt-2 rounded-lg border border-line bg-elevated px-3.5 py-3">
              <ZoneLabel>approval chain · the humans</ZoneLabel>
              <div className="flex flex-col gap-2">
                {STAGE_TEAMS.map((team, i) => {
                  const state = i < approvedStages ? "approved" : i === approvedStages ? "active" : "waiting";
                  return (
                    <div key={team} className="flex flex-wrap items-center gap-2">
                      <span className="tnum font-mono text-[10px] text-ink-3">stage {i + 1}</span>
                      <span className="text-sm font-medium text-ink">{team}</span>
                      {state === "approved" ? (
                        <Badge size="sm" variant="pos">
                          approved
                        </Badge>
                      ) : state === "active" ? (
                        <button
                          type="button"
                          onClick={() => setApprovedStages((s) => s + 1)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-brand-line bg-brand-tint px-2.5 py-1 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-tint/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                        >
                          <UserCheck className="size-3" aria-hidden />
                          approve as {team}
                        </button>
                      ) : (
                        <Badge size="sm" variant="neutral">
                          waiting
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] leading-snug text-ink-3">
                {approvedStages >= STAGE_TEAMS.length
                  ? "submission approved: every release carries two human sign-offs on top of the AI pass"
                  : "the model proposes, a human always approves; nothing ships on the AI's word alone"}
              </p>
            </div>
          )}
        </div>

        <div>
          <ZoneLabel>3 · proposed findings</ZoneLabel>
          {!finished ? (
            <div className="grid min-h-[180px] place-items-center rounded-lg border border-dashed border-line-strong bg-elevated/50 px-4 text-center text-xs text-ink-3">
              the AI first-pass findings appear here after a run
            </div>
          ) : (
            <ul className="reveal flex list-none flex-col gap-2 p-0">
              {piece.findings.map((f, i) => (
                <li key={i} className="rounded-lg border border-line bg-surface p-3 shadow-card">
                  <div className="flex items-start gap-2">
                    <SeverityBadge severity={f.severity} />
                    <p className="text-xs leading-snug text-ink">{f.description}</p>
                  </div>
                  <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-brand-700">{f.citation}</p>
                  <p className="mt-1 text-[11px] leading-snug text-ink-2">
                    <span className="font-medium">suggested fix:</span> {f.fix}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-ink-3">source · {f.source}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-3">
        the review is replayed from canned synthetic data in your browser, no model is called. the phase
        order, the minor/critical issue model, the citation-plus-fix format and the two-stage human
        approval chain mirror production; both marketing pieces and every finding are invented, and only
        the legislation references (RG 234, RG 53) are real public documents.
      </p>
    </div>
  );
}
