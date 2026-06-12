/* One form step, rendered live from the expanded config. Step-level
   questions come first, then a card per active member slot with that
   member's m{n}_* questions and nested b{k}_* beneficiary blocks. The
   grouping reads the member/beneficiary tags the expansion attached, so
   this renderer never hard-codes a field. */

import * as React from "react";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { MAX_BENEFICIARIES, MAX_MEMBER_SLOTS, type Answers, type AnswerValue, type StepConfig } from "./config";
import { isVisible, memberName, type ExpandedQuestion } from "./logic";
import { AccentButton, FOCUS_RING, QuestionField, WARN_BOX, WARN_TEXT } from "./fields";

export interface StepFormProps {
  step: StepConfig;
  expanded: readonly ExpandedQuestion[];
  answers: Answers;
  errors: Record<string, string>;
  slots: number;
  warning: string | null;
  /** Increments each time Next is blocked by a warning; keys the checkbox
      focus so live message updates while typing never steal focus. */
  warnNonce: number;
  warnAck: boolean;
  onAckChange: (v: boolean) => void;
  onAnswer: (id: string, v: AnswerValue) => void;
  onAddMember: () => void;
  onRemoveMember: () => void;
  onBack: () => void;
  onNext: () => void;
  backDisabled: boolean;
  nextLabel: string;
  register: (id: string) => (el: HTMLElement | null) => void;
}

export function StepForm(props: StepFormProps) {
  const { step, expanded, answers, errors, slots, warning, warnAck } = props;
  const ackRef = React.useRef<HTMLInputElement>(null);

  const { warnNonce } = props;
  React.useEffect(() => {
    if (warnNonce > 0) ackRef.current?.focus();
  }, [warnNonce]);

  const visible = expanded.filter((q) => isVisible(q.visibleIf, answers));
  const stepLevel = visible.filter((q) => q.member === undefined);
  const memberNumbers: number[] = [];
  for (const q of visible) {
    if (q.member !== undefined && !memberNumbers.includes(q.member)) memberNumbers.push(q.member);
  }

  const field = (q: ExpandedQuestion) => (
    <QuestionField
      key={q.id}
      q={q}
      value={answers[q.id]}
      error={errors[q.id]}
      onChange={(v) => props.onAnswer(q.id, v)}
      register={props.register}
    />
  );

  return (
    <div>
      <div className="mb-4">
        <h3 className="font-serif text-lg text-ink">{step.title}</h3>
        {step.subtitle && <p className="mt-0.5 text-sm text-ink-2">{step.subtitle}</p>}
      </div>

      <div className="flex flex-col gap-4">
        {stepLevel.map(field)}

        {memberNumbers.map((n) => {
          const main = visible.filter((q) => q.member === n && q.beneficiary === undefined);
          const name = memberName(n, answers);
          return (
            <section key={n} className="rounded-lg border border-line bg-elevated px-4 py-3">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h4 className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Member {n}</h4>
                {name !== "" && <span className="truncate text-xs text-ink-2">{name}</span>}
              </div>
              <div className="flex flex-col gap-4">
                {main.map(field)}
                {Array.from({ length: MAX_BENEFICIARIES }, (_, i) => i + 1).map((k) => {
                  const block = visible.filter((q) => q.member === n && q.beneficiary === k);
                  if (block.length === 0) return null;
                  return (
                    <div key={k} className="border-l-2 border-line-strong pl-3 sm:pl-4">
                      <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                        Beneficiary {k}
                      </div>
                      <div className="flex flex-col gap-4">{block.map(field)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {step.memberControls && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={props.onAddMember} disabled={slots >= MAX_MEMBER_SLOTS}>
              <Plus aria-hidden />
              Add member
            </Button>
            <Button variant="outline" size="sm" onClick={props.onRemoveMember} disabled={slots <= 1}>
              <Minus aria-hidden />
              Remove last member
            </Button>
            <span className="tnum font-mono text-[10px] text-ink-3">
              {slots} of {MAX_MEMBER_SLOTS} member slots
            </span>
          </div>
        )}
      </div>

      {warning && (
        <div className="mt-4 rounded-lg border px-3.5 py-3" style={WARN_BOX} role="alert">
          <p className="flex items-start gap-2 text-[13px]" style={WARN_TEXT}>
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {warning}
          </p>
          <label className="mt-2 flex items-center gap-2 text-[13px]" style={WARN_TEXT}>
            <input
              ref={ackRef}
              type="checkbox"
              checked={warnAck}
              onChange={(e) => props.onAckChange(e.target.checked)}
              className={cn("size-3.5 rounded-sm", FOCUS_RING)}
              style={{ accentColor: "var(--demo-accent)" }}
            />
            acknowledge and continue anyway
          </label>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <Button variant="outline" size="sm" onClick={props.onBack} disabled={props.backDisabled}>
          Back
        </Button>
        <AccentButton onClick={props.onNext}>{props.nextLabel}</AccentButton>
      </div>
    </div>
  );
}
