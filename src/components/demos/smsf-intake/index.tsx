/* SMSF intake demo, root component: state wiring and composition only.
   Flow: channel chooser > steps rendered from the expanded config >
   review > done. The form logic lives in logic.ts, the config in config.ts. */

import * as React from "react";
import { ArrowRight, Braces, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  BRANDS,
  CHANNELS,
  STEPS,
  type Answers,
  type AnswerValue,
  type Brand,
  type Channel,
} from "./config";
import {
  expandStep,
  memberSlots,
  softWarningFor,
  validateStep,
  visibleStepsOf,
  withMemberOnePrefill,
  withoutMemberAnswers,
} from "./logic";
import { AccentLink, FOCUS_RING, Pill } from "./fields";
import { StepForm } from "./StepForm";
import { Review } from "./Review";

export default function SmsfIntakeDemo() {
  const [brand, setBrand] = React.useState<Brand>(BRANDS[0]);
  const [channel, setChannel] = React.useState<Channel | null>(null);
  const [answers, setAnswers] = React.useState<Answers>({});
  const [rawPos, setRawPos] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [warnShown, setWarnShown] = React.useState(false);
  const [warnNonce, setWarnNonce] = React.useState(0);
  const [warnAck, setWarnAck] = React.useState(false);
  const [showConfig, setShowConfig] = React.useState(false);
  const [saveState, setSaveState] = React.useState<"idle" | "pending" | "saved">("idle");

  const fieldRefs = React.useRef(new Map<string, HTMLElement>());
  const saveTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, []);

  // Renderer, validator and review all derive from the same expanded config.
  const slots = memberSlots(answers);
  const visibleSteps = React.useMemo(() => visibleStepsOf(STEPS, answers), [answers]);
  const pos = Math.min(rawPos, visibleSteps.length);
  const total = visibleSteps.length + 1; // review counts as the last step
  const onReview = pos === visibleSteps.length;
  const step = onReview ? null : (visibleSteps[pos] ?? null);
  const expanded = React.useMemo(
    () => (step ? expandStep(step, slots, answers) : null),
    [step, slots, answers]
  );
  const hasCompanyStep = visibleSteps.some((s) => s.id === "company-details");
  // The warning recomputes live, so filling the blanks dismisses it.
  const warning = warnShown && expanded ? softWarningFor(expanded, answers) : null;

  function register(id: string) {
    return (el: HTMLElement | null) => {
      if (el) fieldRefs.current.set(id, el);
      else fieldRefs.current.delete(id);
    };
  }

  function touchSave() {
    setSaveState("pending");
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaveState("saved"), 500);
  }

  function setAnswer(id: string, value: AnswerValue) {
    setAnswers((a) => ({ ...a, [id]: value }));
    setErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    touchSave();
  }

  function addMember() {
    setAnswer("member_slots", String(slots + 1));
  }

  function removeMember() {
    if (slots <= 1) return;
    setAnswers((a) => withoutMemberAnswers({ ...a, member_slots: String(slots - 1) }, slots));
    touchSave();
  }

  function goTo(i: number) {
    setWarnAck(false); // each step's soft warning needs its own acknowledgement
    setRawPos(i);
    setErrors({});
    setWarnShown(false);
  }

  function handleNext() {
    if (!step || !expanded) return;
    const errs = validateStep(expanded, answers);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const firstBad = expanded.find((q) => errs[q.id] !== undefined);
      if (firstBad) fieldRefs.current.get(firstBad.id)?.focus();
      return;
    }
    if (softWarningFor(expanded, answers) !== null && !warnAck) {
      setWarnShown(true); // first Next blocks; the acknowledged second proceeds
      setWarnNonce((n) => n + 1);
      return;
    }
    if (step.id === "about-you") setAnswers((a) => withMemberOnePrefill(a));
    goTo(pos + 1);
  }

  function reset() {
    setChannel(null);
    setAnswers({});
    setRawPos(0);
    setDone(false);
    setErrors({});
    setWarnShown(false);
    setWarnAck(false);
    setSaveState("idle");
  }

  const saveLabel = saveState === "saved" ? "saved · just now" : saveState === "pending" ? "saving" : "autosave on";
  const configView = onReview
    ? visibleSteps.map((s) => ({ step: s.id, questions: expandStep(s, slots, answers) }))
    : { step: step?.id, questions: expanded };

  return (
    <div className="w-full" style={{ "--demo-accent": brand.accent } as React.CSSProperties}>
      {/* Brand mark + white-label switcher */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <div className="eyebrow" style={{ color: "var(--demo-accent)" }}>SMSF intake</div>
          <div className="font-serif text-xl leading-tight text-ink">{brand.name}</div>
          <span className="mt-1 block h-0.5 w-10 rounded-full transition-colors duration-300" style={{ background: "var(--demo-accent)" }} aria-hidden />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">White-label theme:</span>
          {BRANDS.map((b) => {
            const active = b.id === brand.id;
            return (
              <Pill key={b.id} selected={active} bg={b.accent} className="px-3 py-1" onClick={() => setBrand(b)}>
                <span className="size-2 rounded-full" style={{ background: active ? b.accent2 : b.accent }} aria-hidden />
                {b.name}
              </Pill>
            );
          })}
        </div>
      </div>

      {/* Progress: step count is recomputed from VISIBLE steps every render */}
      {channel && !done && (
        <div className="mb-3">
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="flex items-baseline gap-2">
              <span className="rounded-sm border border-line bg-sunken px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-2">
                {channel.id}
              </span>
              <span aria-live="polite" className="tnum font-mono text-[11px] text-ink-2">
                Step {pos + 1} of {total}
                {onReview && " · review"}
                {hasCompanyStep && !onReview && <span className="text-ink-3"> · config added a step</span>}
              </span>
            </span>
            <span aria-live="polite" className="font-mono text-[10px] text-ink-3">{saveLabel}</span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full transition-[width,background-color] duration-300"
              style={{ width: `${((pos + 1) / total) * 100}%`, background: "var(--demo-accent)" }}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
        {channel === null ? (
          /* Channel chooser: same questions per channel, different pricing and routing */
          <div>
            <h3 className="font-serif text-lg text-ink">Start an application</h3>
            <p className="mt-0.5 text-sm text-ink-2">
              Choose how you are applying. The questions are identical; pricing, routing and contacts differ by channel.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {CHANNELS.map((ch) => (
                <button
                  type="button"
                  key={ch.id}
                  onClick={() => setChannel(ch)}
                  className={cn(
                    "flex flex-col rounded-lg border border-line bg-elevated px-4 py-3 text-left transition-colors duration-150 hover:border-line-strong",
                    FOCUS_RING
                  )}
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{ch.id}</span>
                  <span className="mt-1 text-sm font-medium text-ink">{ch.title}</span>
                  <span className="mt-1 text-xs leading-relaxed text-ink-2">{ch.blurb}</span>
                  <span className="mt-3 flex flex-col gap-1 border-t border-line pt-2.5">
                    {ch.pricing.map((p) => (
                      <span key={p.label} className="flex items-baseline justify-between gap-3">
                        <span className="text-xs text-ink-3">{p.label}</span>
                        <span className="tnum font-mono text-xs text-ink">{p.amount}</span>
                      </span>
                    ))}
                  </span>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--demo-accent)" }}>
                    Start
                    <ArrowRight className="size-3" aria-hidden />
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 font-mono text-[10px] text-ink-3">indicative pricing only</p>
          </div>
        ) : done ? (
          /* Success state, contact routed by channel */
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="mb-3 size-8" style={{ color: "var(--demo-accent)" }} aria-hidden />
            <h3 className="font-serif text-xl text-ink">Application submitted</h3>
            <p className="mt-1.5 max-w-md text-sm text-ink-2">
              The team reviews your answers and emails your fund establishment documents within two business days.
            </p>
            <div className="mt-4 flex flex-col gap-1 rounded-lg border border-line bg-elevated px-4 py-2.5 font-mono text-xs text-ink-2">
              <span>questions · {channel.mailbox}@{brand.domain}</span>
              <span className="tnum">phone · {channel.phone}</span>
            </div>
            <AccentLink onClick={reset} className="mt-4 text-sm">start over</AccentLink>
          </div>
        ) : onReview ? (
          <Review
            steps={visibleSteps}
            answers={answers}
            slots={slots}
            onEdit={goTo}
            onBack={() => goTo(visibleSteps.length - 1)}
            onSubmit={() => setDone(true)}
          />
        ) : step && expanded ? (
          <StepForm
            step={step}
            expanded={expanded}
            answers={answers}
            errors={errors}
            slots={slots}
            warning={warning}
            warnNonce={warnNonce}
            warnAck={warnAck}
            onAckChange={setWarnAck}
            onAnswer={setAnswer}
            onAddMember={addMember}
            onRemoveMember={removeMember}
            onBack={() => goTo(pos - 1)}
            onNext={handleNext}
            backDisabled={pos === 0}
            nextLabel={pos === visibleSteps.length - 1 ? "Review" : "Next"}
            register={register}
          />
        ) : null}
      </div>

      {/* The expanded config itself, shown live */}
      {channel && !done && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={() => setShowConfig((s) => !s)}>
            <Braces aria-hidden />
            {showConfig ? "hide the config" : "show the config"}
          </Button>
          {showConfig && (
            <div className="mt-2">
              <pre className="max-h-52 overflow-auto rounded-lg bg-sunken p-3 font-mono text-[11px] leading-relaxed text-ink-2">
                {JSON.stringify(configView, null, 2)}
              </pre>
              <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-ink-3">
                {onReview ? "every visible step, expanded, as the review screen walks it. " : "the live expanded definition of this step. "}
                member questions are declared once as a template and expanded to m1_*, m2_* ids for the
                active slots (b1_, b2_ for beneficiaries). the renderer, the validator and the review
                screen all walk this same expanded list, so they cannot drift.
              </p>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-3">
        A miniature of the production intake: the typed config, the member-template expansion and the
        validators are the real architecture. In production the two channels (advisers and individuals)
        are isolated at the schema level and answers are AES-256-GCM encrypted at rest. The autosave
        indicator only simulates the production debounce, nothing leaves this page. Pricing figures are
        invented round placeholders. Every name, brand and figure here is synthetic.
      </p>
    </div>
  );
}
