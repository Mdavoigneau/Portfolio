/* Step 3, Registry → Applications & Redemptions. Each pending application
   resolves to the first strike on or after the day its money was received;
   Settle runs the production gates in order, and the database's own check
   stands behind the service's. */

import * as React from "react";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { div, dec, fmt, isPos, mul, sum, ZERO } from "./dec";
import { captureCounterfactual, f4, price4, settlementQuote, usd, type Txn } from "./logic";
import { BTN, Panel, Pill, ResultLine, ROW, SectionLabel, TABLE, TABLE_WRAP, TD, TDR, TH, THR } from "./controls";
import type { StepProps } from "./types";

function CheckChip({ ok, label, fix }: { ok: boolean; label: string; fix?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
          ok ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg"
        )}
      >
        {ok ? <Check className="size-2.5" strokeWidth={3} aria-hidden /> : <X className="size-2.5" strokeWidth={3} aria-hidden />}
        {label}
        <span className="sr-only">{ok ? "on file" : "missing"}</span>
      </span>
      {!ok ? fix : null}
    </span>
  );
}

export default function SettleStep({ state, send, result, goTo }: StepProps) {
  const cycle = state.txns.filter((t) => t.receivedDate !== null && t.reinvestmentOf === null);
  const reinvested = state.txns.filter((t) => t.reinvestmentOf !== null);
  const earlier = state.txns.length - cycle.length - reinvested.length;
  const inv = (t: Txn) => state.investors.find((i) => i.id === t.investorId);
  const published = state.valuation.published;

  const counterfactuals = cycle.flatMap((t) => {
    const c = captureCounterfactual(state, t);
    return c !== null ? [c] : [];
  });
  const moved = sum(counterfactuals.map((c) => c.valueMoved));
  const extra = sum(counterfactuals.map((c) => c.extraUnits));
  const mayStrike = state.strikes.find((s) => s.date === state.valuation.date);
  const movedBp = mayStrike !== undefined && isPos(moved) ? div(mul(moved, dec("10000")), mayStrike.nav, 1) : ZERO;
  const unpricedJune = cycle.find((t) => t.status === "Pending" && settlementQuote(state, t) === null && published);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-ink-2">
        Forward pricing (Policy s.5.2): an application takes the price struck for the first valuation date on or
        after the day its money was received, not whatever price was on file when the form was keyed. Until that
        price exists, it waits unpriced.
      </p>

      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th scope="col" className={TH}>Application</th>
              <th scope="col" className={TH}>Investor</th>
              <th scope="col" className={THR}>Amount</th>
              <th scope="col" className={THR}>Price</th>
              <th scope="col" className={THR}>Units</th>
              <th scope="col" className={TH}>Checks</th>
              <th scope="col" className={cn(TH, "text-right")}>
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {cycle.map((t) => {
              const i = inv(t);
              const quote = settlementQuote(state, t);
              const settled = t.status === "Settled";
              const outcome = result(`row:${t.id}`);
              return (
                <React.Fragment key={t.id}>
                  <tr className={ROW}>
                    <td className={TD}>
                      <div className="font-mono text-[11px] font-semibold text-ink">{t.id}</div>
                      <div className="whitespace-nowrap text-[10.5px] text-ink-3">received {t.receivedDate}</div>
                    </td>
                    <td className={cn(TD, "max-w-40 text-ink")}>{i?.name ?? t.investorId}</td>
                    <td className={TDR}>{usd(t.amount)}</td>
                    <td className={TDR}>
                      {settled && t.unitPrice !== null ? (
                        <>
                          <div className="font-semibold">{price4(t.unitPrice)}</div>
                          <div className="whitespace-nowrap text-[10.5px] text-ink-3">{t.pricingDate} strike</div>
                        </>
                      ) : quote !== null ? (
                        <>
                          <div>{price4(quote.unitPrice)}</div>
                          <div className="whitespace-nowrap text-[10.5px] text-ink-3">resolves to {quote.pricingDate}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-ink-2">unpriced</div>
                          <div className="text-[10.5px] text-ink-3">awaiting the next valuation</div>
                        </>
                      )}
                    </td>
                    <td className={TDR}>
                      {settled && t.units !== null ? (
                        <span className="font-semibold">{f4(t.units)}</span>
                      ) : quote !== null ? (
                        <span className="text-ink-3">{f4(quote.units)}</span>
                      ) : (
                        <span className="text-ink-3">-</span>
                      )}
                    </td>
                    <td className={TD}>
                      {settled ? (
                        <span className="text-[10.5px] text-ink-3">all on file</span>
                      ) : (
                        <div className="flex flex-col items-start gap-1">
                          <CheckChip ok={i?.amlVerified ?? false} label="AML/KYC" />
                          <CheckChip
                            ok={i?.wholesaleVerified ?? false}
                            label="Wholesale"
                            fix={
                              <button
                                type="button"
                                className="text-[10.5px] font-medium text-brand-600 hover:underline"
                                onClick={() => send({ type: "record_wholesale", investorId: t.investorId }, `row:${t.id}`)}
                              >
                                record evidence
                              </button>
                            }
                          />
                          <CheckChip
                            ok={t.signedForm}
                            label="Signed form"
                            fix={
                              <button
                                type="button"
                                className="text-[10.5px] font-medium text-brand-600 hover:underline"
                                onClick={() => send({ type: "attach_form", txnId: t.id }, `row:${t.id}`)}
                              >
                                attach
                              </button>
                            }
                          />
                        </div>
                      )}
                    </td>
                    <td className={cn(TD, "text-right")}>
                      {settled ? (
                        <Pill tone="done">Settled</Pill>
                      ) : (
                        <Button className={BTN} onClick={() => send({ type: "settle", txnId: t.id }, `row:${t.id}`)}>
                          Settle
                        </Button>
                      )}
                    </td>
                  </tr>
                  {outcome !== undefined ? (
                    <tr>
                      <td colSpan={7} className="px-2.5 pb-2.5">
                        <ResultLine outcome={outcome} />
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
            {reinvested.map((t) => (
              <tr key={t.id} className={cn(ROW, "text-ink-3")}>
                <td className={TD}>
                  <div className="font-mono text-[11px] font-semibold text-ink-2">{t.id}</div>
                  <div className="whitespace-nowrap text-[10.5px]">reinvestment, {t.reinvestmentOf}</div>
                </td>
                <td className={cn(TD, "text-ink-2")}>{inv(t)?.name ?? t.investorId}</td>
                <td className={TDR}>{usd(t.amount)}</td>
                <td className={TDR}>
                  {t.unitPrice !== null ? price4(t.unitPrice) : "-"}
                  <div className="whitespace-nowrap text-[10.5px]">{t.pricingDate} strike</div>
                </td>
                <td className={TDR}>{t.units !== null ? f4(t.units) : "-"}</td>
                <td className={cn(TD, "text-[10.5px]")}>issued by the run</td>
                <td className={cn(TD, "text-right")}>
                  <Pill tone="done">Settled</Pill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-ink-3">
        {earlier} earlier applications settled at the January to April strikes are on the register but not shown.
        The gates run in production&rsquo;s order: evidence first, then the signed form, then a price.
      </p>

      <Panel>
        <SectionLabel>What the receipt date protects</SectionLabel>
        {!published ? (
          <p className="text-xs leading-relaxed text-ink-2">
            The three May applications resolve to the {state.valuation.date} strike, which is not struck yet, so
            nothing can settle. Publish it in step 2 and each takes that one price, whenever in May its money
            arrived.
          </p>
        ) : (
          <div className="space-y-2 text-xs leading-relaxed text-ink-2">
            <p>
              <span className="font-medium text-ink">Priced at capture</span> (the original behaviour), the three May
              applications would have taken the {counterfactuals[0]?.captureDate} price of{" "}
              {counterfactuals[0] !== undefined ? price4(counterfactuals[0].capturePrice) : ""}, a valuation point
              before their money reached the fund:{" "}
              <span className="font-mono tnum text-ink">{f4(extra)}</span> more units, worth{" "}
              <span className="font-mono tnum text-ink">{usd(moved)}</span> ({fmt(movedBp, 1)} bp of NAV), taken from the holders already in the fund.
            </p>
            {unpricedJune !== undefined ? (
              <p>
                <span className="font-medium text-ink">Priced at the latest strike</span> (the interim fix),{" "}
                {unpricedJune.id}, received {unpricedJune.receivedDate}, would settle today at{" "}
                {state.valuation.date}&rsquo;s price, struck before its money arrived. The receipt-date rule holds it
                for the June valuation instead.
              </p>
            ) : null}
          </div>
        )}
      </Panel>

      {state.distribution.status === "Declared" && published ? (
        <button
          type="button"
          onClick={() => goTo("pay")}
          className="inline-flex items-center gap-1 self-start text-xs font-medium text-brand-600 hover:underline"
        >
          Next: pay {state.distribution.id}
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
