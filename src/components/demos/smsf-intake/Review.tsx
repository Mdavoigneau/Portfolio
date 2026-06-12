/* The review screen walks the SAME expanded config the renderer and the
   validator walked: one card per visible step with an Edit link, member
   answers separated by small-caps Member headers (production review screen
   detail), arrays as comma lists, blanks as "not provided", figures and ids
   in tabular mono. */

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { type Answers, type StepConfig } from "./config";
import { expandStep, formatAnswer, isMonoAnswer, isVisible, type ExpandedQuestion } from "./logic";
import { AccentButton, AccentLink } from "./fields";

export interface ReviewProps {
  steps: readonly StepConfig[];
  answers: Answers;
  slots: number;
  onEdit: (stepIndex: number) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function Row({ q, answers }: { q: ExpandedQuestion; answers: Answers }) {
  const formatted = formatAnswer(q, answers[q.id]);
  const label = q.beneficiary === undefined ? q.label : `Beneficiary ${q.beneficiary} · ${q.label.toLowerCase()}`;
  return (
    <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-[200px_1fr]">
      <dt className="text-xs leading-relaxed text-ink-3">{label}</dt>
      <dd
        className={cn(
          "m-0 text-sm",
          formatted === null ? "italic text-ink-3" : "text-ink",
          formatted !== null && isMonoAnswer(q) && "tnum font-mono text-[13px]"
        )}
      >
        {formatted ?? "not provided"}
      </dd>
    </div>
  );
}

export function Review({ steps, answers, slots, onEdit, onBack, onSubmit }: ReviewProps) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-serif text-lg text-ink">Review your application</h3>
        <p className="mt-0.5 text-sm text-ink-2">Check everything before you submit.</p>
      </div>
      <div className="flex flex-col gap-3">
        {steps.map((s, i) => {
          const visible = expandStep(s, slots, answers).filter((q) => isVisible(q.visibleIf, answers));
          const stepLevel = visible.filter((q) => q.member === undefined);
          const memberNumbers: number[] = [];
          for (const q of visible) {
            if (q.member !== undefined && !memberNumbers.includes(q.member)) memberNumbers.push(q.member);
          }
          return (
            <section key={s.id} className="rounded-lg border border-line bg-elevated px-4 py-3">
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <h4 className="text-sm font-medium text-ink">{s.title}</h4>
                <AccentLink onClick={() => onEdit(i)} className="text-xs">
                  Edit
                </AccentLink>
              </div>
              <dl className="flex flex-col gap-1.5">
                {stepLevel.map((q) => (
                  <Row key={q.id} q={q} answers={answers} />
                ))}
                {memberNumbers.map((n) => (
                  <div key={n} className="flex flex-col gap-1.5">
                    <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                      Member {n}
                    </div>
                    {visible
                      .filter((q) => q.member === n)
                      .map((q) => (
                        <Row key={q.id} q={q} answers={answers} />
                      ))}
                  </div>
                ))}
              </dl>
            </section>
          );
        })}
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          Back
        </Button>
        <AccentButton onClick={onSubmit}>Submit application</AccentButton>
      </div>
    </div>
  );
}
