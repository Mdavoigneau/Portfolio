/* Step 2, Portfolio → Holdings: the monthly manual valuation. One mark is
   still outstanding; the NAV calculation is shown line by line; Publish
   strikes the immutable price. Once struck, the page reads the stored strike,
   never a recompute, so its units stay the strike's own. */

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { isZero, mul, money } from "./dec";
import {
  draftSnapshot,
  f4,
  f6,
  latestStrike,
  price4,
  unpricedValuationReason,
  usd,
  type Snapshot,
} from "./logic";
import { OUTSTANDING_MARK } from "./data";
import {
  AMBER_TEXT,
  BTN,
  CalcRow,
  Panel,
  Pill,
  ResultLine,
  ROW,
  SectionLabel,
  TABLE,
  TABLE_WRAP,
  TD,
  TDR,
  TH,
  THR,
  fieldClass,
} from "./controls";
import type { StepProps } from "./types";

export default function StrikeStep({ state, send, result, goTo }: StepProps) {
  const v = state.valuation;
  const struck = v.published ? state.strikes.find((s) => s.date === v.date) ?? null : null;
  const snap: Snapshot | null = struck ?? draftSnapshot(state);
  const blocked = unpricedValuationReason(v);
  const [mark, setMark] = React.useState("");
  const dist = state.distribution;
  const history = [...state.strikes].sort((a, b) => b.date.localeCompare(a.date));
  const previous = latestStrike(state.strikes.filter((s) => s.date < v.date));

  function submitMark(event: React.FormEvent) {
    event.preventDefault();
    const out = send({ type: "set_mark", ticker: OUTSTANDING_MARK.ticker, price: mark }, "mark");
    if (out.ok) setMark("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-ink">
          Manual monthly valuation <span className="text-ink-3">as at</span>{" "}
          <span className="font-mono">{v.date}</span>
        </div>
        {v.published ? <Pill tone="done">Published &amp; immutable</Pill> : <Pill tone="draft">Computed, not yet published</Pill>}
      </div>

      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th scope="col" className={TH}>Ticker</th>
              <th scope="col" className={TH}>Underlying fund</th>
              <th scope="col" className={THR}>Units</th>
              <th scope="col" className={THR}>Price</th>
              <th scope="col" className={THR}>Value (units × price)</th>
            </tr>
          </thead>
          <tbody>
            {v.lines.map((l) => {
              const price = l.price !== null && !isZero(l.price) ? l.price : null;
              const unpriced = price === null;
              return (
                <tr key={l.ticker} className={ROW}>
                  <td className={cn(TD, "font-mono font-semibold text-brand-700")}>{l.ticker}</td>
                  <td className={cn(TD, "text-ink-2")}>{l.name}</td>
                  <td className={TDR}>{f4(l.units)}</td>
                  <td className={TDR}>
                    {unpriced && !v.published ? (
                      <form onSubmit={submitMark} className="flex items-center justify-end gap-1.5">
                        <label htmlFor="ut-mark" className="sr-only">
                          Mark for {l.ticker}
                        </label>
                        <input
                          id="ut-mark"
                          inputMode="decimal"
                          placeholder="no price"
                          value={mark}
                          onChange={(e) => setMark(e.target.value)}
                          className={fieldClass}
                        />
                        <Button type="submit" variant="outline" className={BTN}>
                          Enter
                        </Button>
                      </form>
                    ) : price === null ? (
                      <span className="text-ink-3">no price</span>
                    ) : (
                      money(price, 4)
                    )}
                  </td>
                  <td className={TDR}>
                    {price === null ? <span className={AMBER_TEXT}>not in NAV</span> : usd(mul(l.units, price))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!v.published && blocked !== null ? (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-2">
          <span>
            The manager&rsquo;s {OUTSTANDING_MARK.ticker} statement has arrived, marking it at{" "}
            <span className="font-mono">${OUTSTANDING_MARK.price}</span>.
          </span>
          <Button
            variant="outline"
            className={BTN}
            onClick={() => setMark(OUTSTANDING_MARK.price)}
          >
            Use the manager&rsquo;s mark
          </Button>
        </div>
      ) : null}
      <ResultLine outcome={result("mark")} />

      <div className="grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Panel>
          <SectionLabel>NAV calculation · as at {v.date}</SectionLabel>
          {snap === null ? (
            <p className="text-xs text-ink-3">No units on issue as at {v.date}.</p>
          ) : (
            <>
              <CalcRow
                label={
                  blocked !== null ? (
                    <>
                      Positions value, Σ (units × price){" "}
                      <span className={AMBER_TEXT}>without {OUTSTANDING_MARK.ticker}</span>
                    </>
                  ) : (
                    "Positions value, Σ (units × price)"
                  )
                }
                value={usd(snap.totalEquities)}
              />
              <CalcRow op="+" label="Cash at bank" value={usd(snap.totalCash)} />
              <CalcRow
                op="−"
                label={
                  <>
                    Distribution payable{" "}
                    <span className="text-ink-3">
                      {isZero(snap.liabilities)
                        ? `(${dist.id} ${dist.status === "Draft" ? "is a draft: nothing payable" : "not a liability here"})`
                        : `(${dist.id}, ex ${dist.exDate})`}
                    </span>
                  </>
                }
                value={isZero(snap.liabilities) ? usd(snap.liabilities) : `(${usd(snap.liabilities)})`}
              />
              <CalcRow op="=" label="Net asset value" value={usd(snap.nav)} strong />
              <CalcRow op="÷" label={`Units on issue as at ${v.date}`} value={f4(snap.unitsOnIssue)} />
              <CalcRow op="=" label="Unit price, internal (six places)" value={f6(snap.unitPrice)} />
              <CalcRow
                op="="
                label={v.published ? "NAV unit price, published (four places)" : "NAV unit price (four places), as Publish would strike it"}
                value={price4(snap.navUnitPrice)}
                strong
              />
              <CalcRow label="Application price (no buy spread)" value={price4(snap.applicationPrice)} muted />
              <CalcRow label="Redemption price (0.25% sell spread)" value={price4(snap.redemptionPrice)} muted />
            </>
          )}
        </Panel>

        <div className="flex flex-col gap-2.5">
          <Panel>
            <SectionLabel>Price history</SectionLabel>
            <table className={TABLE}>
              <thead>
                <tr>
                  <th scope="col" className={cn(TH, "px-0")}>Date</th>
                  <th scope="col" className={THR}>NAV</th>
                  <th scope="col" className={cn(THR, "pr-0")}>Unit price</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.date} className={cn(ROW, s.date === v.date && "bg-mint/40")}>
                    <td className={cn(TD, "px-0 font-mono")}>{s.date}</td>
                    <td className={TDR}>{usd(s.nav)}</td>
                    <td className={cn(TDR, "pr-0 font-semibold")}>{price4(s.navUnitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previous !== null && snap !== null && blocked === null ? (
              <p className="mt-2 text-[11px] leading-snug text-ink-3">
                Against {previous.date}: {price4(previous.navUnitPrice)} to {price4(snap.navUnitPrice)}
                {isZero(snap.liabilities) ? "." : `, after the ${money(dist.centsPerUnit, 8)} a unit ${dist.id} takes out.`}
              </p>
            ) : null}
          </Panel>

          {!v.published ? (
            <>
              {dist.status === "Draft" ? (
                <p className="text-[11px] leading-relaxed text-ink-2">
                  <span className="font-medium text-ink">Order matters.</span> {dist.id} goes ex on {dist.exDate},
                  before this valuation date. Strike now, while it is still a draft, and the price keeps the{" "}
                  {usd(dist.amount)} April&rsquo;s holders are owed; the strike is immutable, so {dist.id} could then
                  never be declared (Policy s.9.2).
                </p>
              ) : null}
              <Button
                className={cn(BTN, "self-start")}
                disabled={blocked !== null}
                onClick={() => send({ type: "publish" }, "publish")}
              >
                Publish price as at {v.date}
              </Button>
              {blocked !== null ? (
                <p className="text-[11px] leading-relaxed text-neg">Cannot publish: {blocked}</p>
              ) : (
                <p className="text-[11px] text-ink-3">Strikes the immutable price. Corrections go through the Pricing Error Register.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-[11px] leading-relaxed text-ink-2">
                The price as at {v.date} is struck. Every page, application and settlement now reads this row; the
                only way to change it is a logged pricing error.
              </p>
              <Button
                variant="outline"
                className={cn(BTN, "self-start")}
                onClick={() => send({ type: "rewrite", target: "strike" }, "rewrite:strike-inline")}
              >
                Try to edit the struck price
              </Button>
            </>
          )}
          <ResultLine outcome={result("publish")} />
          <ResultLine outcome={result("rewrite:strike-inline")} />
        </div>
      </div>

      {v.published ? (
        <button
          type="button"
          onClick={() => goTo("settle")}
          className="inline-flex items-center gap-1 self-start text-xs font-medium text-brand-600 hover:underline"
        >
          Next: settle the applications waiting on this price
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
