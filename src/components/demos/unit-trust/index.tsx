/**
 * Wholesale unit-trust administration, as one month-end on a synthetic fund:
 *   declare the distribution → value and strike → settle → pay
 * Every action is an Action dispatched through logic.run(), which either
 * completes or refuses and writes nothing, the way the production services
 * and triggers behave. The steps can be taken in any order, and the wrong
 * order is refused exactly as production refuses it.
 *
 * ./logic.ts ports the production rules; ./dec.ts is the exact decimal they
 * run on; ./data.ts is the invented fund.
 */

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sum } from "./dec";
import { INITIAL_STATE } from "./data";
import {
  distributionPayable,
  f4,
  latestStrike,
  price4,
  run,
  settlementQuote,
  unitsOnIssue,
  usd,
  type Action,
  type FundState,
  type Outcome,
} from "./logic";
import { BTN, Figure, StepTabs, type StepDef } from "./controls";
import DeclareStep from "./DeclareStep";
import StrikeStep from "./StrikeStep";
import SettleStep from "./SettleStep";
import PayStep from "./PayStep";
import Ledger from "./Ledger";
import type { StepId, StepProps } from "./types";

function steps(state: FundState): StepDef[] {
  const pendingPriced = state.txns.some((t) => t.status === "Pending" && settlementQuote(state, t) !== null);
  return [
    { id: "declare", label: "Declare", done: state.distribution.status !== "Draft" },
    { id: "strike", label: "Value & strike", done: state.valuation.published },
    { id: "settle", label: "Settle", done: state.valuation.published && !pendingPriced },
    { id: "pay", label: "Pay", done: state.distribution.status === "Paid" },
  ];
}

export default function UnitTrustDemo() {
  const [state, setState] = React.useState<FundState>(INITIAL_STATE);
  const [step, setStep] = React.useState<StepId>("declare");
  const [results, setResults] = React.useState<Record<string, Outcome>>({});
  const [resetKey, setResetKey] = React.useState(0);

  /** The one dispatch path: every control sends an Action and renders the
      outcome under itself, keyed so the latest result replaces the last. */
  const send = React.useCallback(
    (action: Action, key: string): Outcome => {
      const out = run(state, action);
      if (out.ok) setState(out.state);
      setResults((r) => ({ ...r, [key]: out }));
      return out;
    },
    [state]
  );

  function reset() {
    setState(INITIAL_STATE);
    setResults({});
    setStep("declare");
    setResetKey((k) => k + 1);
  }

  const props: StepProps = {
    state,
    send,
    result: (key) => results[key],
    goTo: setStep,
  };
  const latest = latestStrike(state.strikes);
  const appMoney = sum(state.txns.filter((t) => t.status === "Pending").map((t) => t.amount));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-serif text-lg leading-tight text-ink">{state.fundName}</div>
          <div className="mt-0.5 font-mono text-[10.5px] text-ink-3">
            Business date {state.businessDate} · monthly manual valuation · 0.25% sell spread
          </div>
        </div>
        <Button variant="ghost" className={BTN} onClick={reset}>
          <RotateCcw aria-hidden />
          Reset the month
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-line bg-surface px-4 py-3 md:grid-cols-4">
        <Figure label="Units on issue" value={f4(unitsOnIssue(state.txns))} hint="derived from the register" />
        <Figure
          label="Latest strike"
          value={latest !== null ? price4(latest.navUnitPrice) : "none"}
          hint={latest !== null ? `as at ${latest.date}` : undefined}
        />
        <Figure label="Distribution payable" value={usd(distributionPayable(state.distribution))} hint="a liability of the NAV" />
        <Figure label="Application money" value={usd(appMoney)} hint="received, not yet allotted" />
      </div>

      <StepTabs steps={steps(state)} value={step} onChange={(id) => setStep(id as StepId)} />

      <div key={`${step}-${resetKey}`} className="min-h-[18rem]">
        {step === "declare" ? <DeclareStep {...props} /> : null}
        {step === "strike" ? <StrikeStep {...props} /> : null}
        {step === "settle" ? <SettleStep {...props} /> : null}
        {step === "pay" ? <PayStep {...props} /> : null}
      </div>

      <Ledger key={`ledger-${resetKey}`} state={state} send={send} result={props.result} />

      <p className="font-mono text-[11px] leading-relaxed text-ink-3">
        Synthetic fund, managers, investors and bank details throughout, with the day fixed at 2026-06-12. The
        rules are ported from the production code, not imitated: the price snapshot and its two roundings, forward
        pricing off the receipt date, the settlement gates in production&rsquo;s order, entitlements with the
        recorded rounding residual, reinvestment at the first strike on or after the ex-date, the ABA writer and the
        AMIT allocation. All of it runs in exact decimal arithmetic and was checked figure for figure against the
        production functions&rsquo; own output. Refusals carry production&rsquo;s wording. Left out: unit classes and
        fee accrual, investor forms and documents, and SQLite itself, whose triggers the store helpers stand in for.
      </p>
    </div>
  );
}
