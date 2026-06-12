import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, Play, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

/* A process explainer for the on-device SMSF document agent. The stage order,
   the NDJSON event names (research.plan.start, agent.tool_call, ...), the tool
   surface (list_docs, search_text, read_doc) and the corroboration discipline
   mirror production; the fund, its documents and every answer are invented. */

interface ToolCall {
  tool: "list_docs" | "search_text" | "read_doc";
  args: string;
  result: string;
}

interface Citation {
  doc: string;
  page: number;
}

interface Question {
  id: string;
  label: string;
  subtasks: string[];
  toolCalls: ToolCall[];
  corroboration: { tone: "pos" | "info"; text: string };
  answer: string;
  citations: Citation[];
  events: string[];
}

const QUESTIONS: readonly [Question, Question, Question] = [
  {
    id: "trustees",
    label: "Who are the current trustees, and has that changed since establishment?",
    subtasks: [
      "current trustee per the most recent deed instrument",
      "trustees named at establishment, for comparison",
    ],
    toolCalls: [
      {
        tool: "search_text",
        args: '{ "query": "trustee appointment", "fund": "coral-cove" }',
        result: "6 hits across Trust Deed 2014, Deed of Variation 2021",
      },
      {
        tool: "read_doc",
        args: '{ "doc": "trust-deed-2014", "pages": "3-4" }',
        result: "establishment trustees: Rana Patel, Lukas Meyer (individuals)",
      },
      {
        tool: "read_doc",
        args: '{ "doc": "deed-of-variation-2021", "pages": "1-2" }',
        result: "scanned instrument · OCR cache hit (content hash) · corporate trustee appointed",
      },
    ],
    corroboration: {
      tone: "pos",
      text: "change event corroborated by two independent instruments, so it is reported as a change",
    },
    answer:
      "The current trustee is Coral Cove Super Pty Ltd, a corporate trustee appointed by the Deed of Variation executed 18 May 2021. At establishment in 2014 the fund had two individual trustees, Rana Patel and Lukas Meyer, who became the directors of the corporate trustee at the changeover.",
    citations: [
      { doc: "Trust Deed 2014", page: 3 },
      { doc: "Deed of Variation 2021", page: 1 },
    ],
    events: [
      '{"event":"research.start","fund":"coral-cove","docs":14}',
      '{"event":"research.plan.start"}',
      '{"event":"research.subtask.start","idx":0}',
      '{"event":"agent.start","tools":["list_docs","search_text","read_doc"]}',
      '{"event":"agent.tool_call","name":"search_text"}',
      '{"event":"agent.tool_result","hits":6}',
      '{"event":"agent.tool_call","name":"read_doc","doc":"trust-deed-2014"}',
      '{"event":"research.subtask.start","idx":1}',
      '{"event":"agent.tool_call","name":"read_doc","doc":"deed-of-variation-2021"}',
      '{"event":"agent.tool_result","ocr_cache":"hit"}',
      '{"event":"research.synthesize.start","sub_answers":2}',
    ],
  },
  {
    id: "crypto",
    label: "What does the investment strategy say about cryptocurrency?",
    subtasks: ["digital-asset provisions in the current investment strategy"],
    toolCalls: [
      {
        tool: "search_text",
        args: '{ "query": "digital assets cryptocurrency", "fund": "coral-cove" }',
        result: "2 hits, both in Investment Strategy 2025",
      },
      {
        tool: "read_doc",
        args: '{ "doc": "investment-strategy-2025", "pages": "5" }',
        result: "digital assets permitted to 5% of fund value, exchange must be AUSTRAC-registered",
      },
    ],
    corroboration: {
      tone: "info",
      text: "single-source claim: no second document corroborates it, so the answer says exactly where it rests",
    },
    answer:
      "The 2025 investment strategy permits digital assets up to 5% of total fund value, provided holdings sit with an AUSTRAC-registered exchange and are valued monthly. This is the only document in the corpus that addresses cryptocurrency, so the position rests on that single source.",
    citations: [{ doc: "Investment Strategy 2025", page: 5 }],
    events: [
      '{"event":"research.start","fund":"coral-cove","docs":14}',
      '{"event":"research.plan.start"}',
      '{"event":"research.subtask.start","idx":0}',
      '{"event":"agent.start","tools":["list_docs","search_text","read_doc"]}',
      '{"event":"agent.tool_call","name":"search_text"}',
      '{"event":"agent.tool_result","hits":2}',
      '{"event":"agent.tool_call","name":"read_doc","doc":"investment-strategy-2025"}',
      '{"event":"research.synthesize.start","sub_answers":1}',
    ],
  },
  {
    id: "lease",
    label: "When does the commercial property lease expire, and what options remain?",
    subtasks: ["lease term and expiry", "renewal options exercised or remaining"],
    toolCalls: [
      {
        tool: "search_text",
        args: '{ "query": "term of lease expiry option", "fund": "coral-cove" }',
        result: "5 hits in Lease Agreement, 1 in Financial Statements FY2025",
      },
      {
        tool: "read_doc",
        args: '{ "doc": "lease-agreement", "pages": "2,7" }',
        result: "initial term 5 years to 31 Mar 2027, one 3-year option remaining",
      },
    ],
    corroboration: {
      tone: "pos",
      text: "expiry date cross-checked against the FY2025 financial statements note on lease commitments",
    },
    answer:
      "The lease over the Gosford warehouse runs to 31 March 2027. One three-year renewal option remains, exercisable no later than six months before expiry, which makes 30 September 2026 the practical decision date.",
    citations: [
      { doc: "Lease Agreement", page: 2 },
      { doc: "Lease Agreement", page: 7 },
      { doc: "Financial Statements FY2025", page: 11 },
    ],
    events: [
      '{"event":"research.start","fund":"coral-cove","docs":14}',
      '{"event":"research.plan.start"}',
      '{"event":"research.subtask.start","idx":0}',
      '{"event":"agent.start","tools":["list_docs","search_text","read_doc"]}',
      '{"event":"agent.tool_call","name":"search_text"}',
      '{"event":"agent.tool_result","hits":6}',
      '{"event":"agent.tool_call","name":"read_doc","doc":"lease-agreement"}',
      '{"event":"research.subtask.start","idx":1}',
      '{"event":"agent.tool_result","cross_check":"financial-statements-fy2025"}',
      '{"event":"research.synthesize.start","sub_answers":2}',
    ],
  },
];

interface Stage {
  name: string;
  detail: string;
  payload: (q: Question) => ReactNode;
}

const STAGES: readonly Stage[] = [
  {
    name: "Corpus ready",
    detail: "Rust extractor (smsf-tools): AcroForm fields plus manual BT/ET content-stream parsing",
    payload: () => (
      <span>
        14 synthetic documents indexed · 1 scanned deed went through the local vision-OCR fallback,
        cached by content hash, so re-runs never re-OCR
      </span>
    ),
  },
  {
    name: "Plan",
    detail: "the question splits into scoped subtasks (research.plan.start)",
    payload: (q) => (
      <ol className="m-0 list-decimal pl-4">
        {q.subtasks.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    ),
  },
  {
    name: "Agent loop",
    detail: "tool-scoped sub-agents over hybrid retrieval (dense vectors via local embeddings, fused top-k)",
    payload: (q) => (
      <div className="flex flex-col gap-1.5">
        {q.toolCalls.map((t, i) => (
          <div key={i}>
            <code className="break-all font-mono text-[11px] text-brand-700">
              {t.tool}({t.args})
            </code>
            <div className="text-ink-2">→ {t.result}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    name: "Corroborate",
    detail: "the discipline that prevents hallucinated change events: one source is a claim, two are a fact",
    payload: (q) => (
      <span className={q.corroboration.tone === "pos" ? "text-pos" : "text-ink-2"}>{q.corroboration.text}</span>
    ),
  },
  {
    name: "Synthesize",
    detail: "grounded answer assembled with citations as it streams (research.synthesize.start)",
    payload: () => <span>every claim cited to a document and page; the reader can check the agent's working</span>,
  },
];

const STAGE_MS = [500, 550, 900, 550, 600] as const;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  return <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">{children}</div>;
}

export default function SmsfAgentDemo() {
  const [questionId, setQuestionId] = useState<string>("trustees");
  const [doneCount, setDoneCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [typedLen, setTypedLen] = useState(0);

  const timer = useRef<number | null>(null);
  const typeTimer = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (typeTimer.current !== null) window.clearInterval(typeTimer.current);
    };
  }, []);

  const question = QUESTIONS.find((q) => q.id === questionId) ?? QUESTIONS[0];
  const finished = doneCount >= STAGES.length;
  /** events reveal proportionally to stage progress, like the production NDJSON stream */
  const eventsShown = Math.round((doneCount / STAGES.length) * question.events.length);

  function selectQuestion(id: string) {
    if (timer.current !== null) window.clearTimeout(timer.current);
    if (typeTimer.current !== null) window.clearInterval(typeTimer.current);
    setQuestionId(id);
    setDoneCount(0);
    setRunning(false);
    setTypedLen(0);
  }

  function run() {
    setTypedLen(0);
    if (prefersReducedMotion()) {
      setDoneCount(STAGES.length);
      setRunning(false);
      return;
    }
    setDoneCount(0);
    setRunning(true);
  }

  useEffect(() => {
    if (!running) return;
    if (doneCount >= STAGES.length) {
      setRunning(false);
      return;
    }
    timer.current = window.setTimeout(() => setDoneCount((c) => c + 1), STAGE_MS[doneCount] ?? 500);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [running, doneCount]);

  useEffect(() => {
    if (!finished) return;
    const full = question.answer.length;
    if (prefersReducedMotion()) {
      setTypedLen(full);
      return;
    }
    typeTimer.current = window.setInterval(() => {
      setTypedLen((l) => {
        const next = Math.min(full, l + 3);
        if (next >= full && typeTimer.current !== null) window.clearInterval(typeTimer.current);
        return next;
      });
    }, 16);
    return () => {
      if (typeTimer.current !== null) window.clearInterval(typeTimer.current);
    };
  }, [finished, question]);

  const typingDone = typedLen >= question.answer.length;

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ZoneLabel>1 · ask the Coral Cove fund's documents (all synthetic)</ZoneLabel>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/55 px-2.5 py-1 text-[11px] font-medium leading-none text-mint-deep">
          <ShieldCheck className="size-3" aria-hidden />
          fully on-device · nothing leaves the building
        </span>
      </div>
      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Question">
        {QUESTIONS.map((q) => {
          const selected = q.id === questionId;
          return (
            <button
              key={q.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => selectQuestion(q.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
                selected ? "border-brand-line bg-brand-tint/40 text-ink" : "border-line bg-elevated text-ink-2 hover:border-line-strong"
              )}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" onClick={run} disabled={running}>
          <Play aria-hidden />
          Run the agent
        </Button>
        <span className="text-xs text-ink-3">
          {running ? "replaying synthetic timings" : "each step streams to the browser within about a second in production"}
        </span>
      </div>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <ZoneLabel>2 · agent run</ZoneLabel>
          <ol aria-label="Agent stages" className="list-none p-0">
            {STAGES.map((stage, i) => {
              const status: "pending" | "running" | "done" =
                i < doneCount ? "done" : i === doneCount && running ? "running" : "pending";
              const last = i === STAGES.length - 1;
              return (
                <li key={stage.name} className={cn("relative pl-7", !last && "pb-4")}>
                  {!last && <span aria-hidden className="absolute left-[8.5px] top-[22px] h-[calc(100%-22px)] w-px bg-line" />}
                  <span className="absolute left-0 top-0.5">
                    <StageGlyph status={status} />
                  </span>
                  <div className={cn("text-sm font-medium", status === "pending" ? "text-ink-3" : "text-ink")}>
                    {stage.name}
                    <span className="sr-only"> {status}</span>
                  </div>
                  <div className="text-[11px] leading-snug text-ink-3">{stage.detail}</div>
                  {status === "done" && (
                    <div className="reveal mt-1.5 rounded-md bg-sunken/60 px-2.5 py-1.5 text-xs leading-snug text-ink-2">
                      {stage.payload(question)}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <ZoneLabel>3 · the NDJSON event stream (what the browser actually receives)</ZoneLabel>
            <pre className="m-0 max-h-44 overflow-auto rounded-lg bg-sunken p-3 font-mono text-[10px] leading-relaxed text-ink-2">
              {eventsShown === 0
                ? "waiting for a run"
                : question.events.slice(0, eventsShown).join("\n")}
              {running && "\n…"}
            </pre>
          </div>

          <div>
            <ZoneLabel>4 · grounded answer</ZoneLabel>
            {!finished ? (
              <div className="grid min-h-[120px] place-items-center rounded-lg border border-dashed border-line-strong bg-elevated/50 px-4 text-center text-xs text-ink-3">
                the cited answer appears here after a run
              </div>
            ) : (
              <div className="reveal rounded-lg border border-line bg-surface p-4 shadow-card">
                <p className="m-0 text-sm leading-relaxed text-ink">
                  {question.answer.slice(0, typedLen)}
                  {!typingDone && (
                    <span
                      aria-hidden
                      className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-[caret_1s_step-end_infinite] bg-brand"
                    />
                  )}
                </p>
                {typingDone && (
                  <div className="reveal mt-3 border-t border-line pt-2">
                    <div className="flex flex-wrap gap-1.5">
                      {question.citations.map((c, i) => (
                        <Fragment key={i}>
                          <span className="tnum inline-flex items-center rounded-md border border-line bg-elevated px-2 py-0.5 font-mono text-[10px] text-ink-2">
                            {c.doc} · p {c.page}
                          </span>
                        </Fragment>
                      ))}
                    </div>
                    <p className="tnum mt-2 font-mono text-[10px] text-ink-3">
                      local models via Ollama · Rust extraction · 0 bytes left this machine
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-3">
        the run is replayed from canned synthetic data in your browser, no model is called. the stage
        order, the event names, the tool surface (list_docs, search_text, read_doc) and the
        corroboration rule mirror the production system, which runs entirely on-device. the fund, its
        documents, the people and every answer are invented.
      </p>
    </div>
  );
}
