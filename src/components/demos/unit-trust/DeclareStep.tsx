/* Step 1, the Registry's Distributions page: the April run as a draft, its
   eight-place rate, every holder's entitlement at the record date, and
   Declare, which books the payable. */

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { isZero, money } from "./dec";
import { f4, usd } from "./logic";
import { AMBER_TEXT, BTN, CalcRow, Figure, Panel, Pill, ResultLine, ROW, TABLE, TABLE_WRAP, TD, TDR, TH, THR } from "./controls";
import type { StepProps } from "./types";

export default function DeclareStep({ state, send, result, goTo }: StepProps) {
  const d = state.distribution;
  const nameOf = (id: string) => state.investors.find((i) => i.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-ink-2">
        What the Trust declares and pays to its own unitholders (Policy s.9), distinct from the income its
        underlying managers pay to the fund. Declaring books the payable; it is what makes the unit price fall
        from the ex-date without a published price ever being rewritten.
      </p>

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-medium text-ink">
            <span className="font-mono text-brand-700">{d.id}</span>: {d.periodStart} to {d.periodEnd}
          </div>
          <Pill tone={d.status === "Draft" ? "draft" : "done"}>{d.status}</Pill>
        </div>
        <div className="mt-2.5 grid gap-x-8 gap-y-3 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div>
            <CalcRow label="Amount distributed" value={usd(d.amount)} />
            <CalcRow op="÷" label={`Units on issue at ${d.recordDate}`} value={f4(d.unitsAtRecord)} />
            <CalcRow op="=" label="Distribution per unit, eight places" value={money(d.centsPerUnit, 8)} strong />
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <Figure label="Ex-distribution" value={d.exDate} hint="the price is reduced from here" />
            <Figure label="Record date" value={d.recordDate} hint="who holds units is entitled" />
            <Figure label="Payment date" value={d.paymentDate} />
            <Figure label="Equalisation" value="record date units" />
          </div>
        </div>
      </Panel>

      <div className={TABLE_WRAP}>
        <table className={TABLE}>
          <thead>
            <tr>
              <th scope="col" className={TH}>Investor</th>
              <th scope="col" className={THR}>Units at record date</th>
              <th scope="col" className={THR}>Entitlement</th>
              <th scope="col" className={TH}>Election</th>
            </tr>
          </thead>
          <tbody>
            {d.entitlements.map((e) => (
              <tr key={e.investorId} className={ROW}>
                <td className={TD}>
                  <span className="font-mono text-[11px] text-ink-3">{e.investorId}</span>{" "}
                  <span className="text-ink">{nameOf(e.investorId)}</span>
                </td>
                <td className={TDR}>{f4(e.unitsAtRecord)}</td>
                <td className={TDR}>
                  {usd(e.gross)}
                  {!isZero(e.roundingAdjustment) ? (
                    <div className={cn("text-[10.5px]", AMBER_TEXT)}>incl. {usd(e.roundingAdjustment)} rounding</div>
                  ) : null}
                </td>
                <td className={cn(TD, "text-ink-2")}>{e.choice === "reinvest" ? "Reinvest" : "Cash"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line-strong font-semibold">
              <td className={TD}>Total</td>
              <td className={TDR}>{f4(d.unitsAtRecord)}</td>
              <td className={TDR}>{usd(d.amount)}</td>
              <td className={TD} />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[11px] leading-relaxed text-ink-3">
        Each holder rounds to the cent, so the parts do not quite sum to the declared total. The residual goes, in
        full and on the record, to the single largest entitlement: the declared total is what leaves the bank.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button className={BTN} disabled={d.status !== "Draft"} onClick={() => send({ type: "declare" }, "declare")}>
          Declare {d.id}
        </Button>
        <span className="text-[11px] text-ink-3">A draft books nothing and moves no price. Review it, then declare.</span>
      </div>
      <ResultLine outcome={result("declare")} />

      {d.status !== "Draft" ? (
        <button
          type="button"
          onClick={() => goTo("strike")}
          className="inline-flex items-center gap-1 self-start text-xs font-medium text-brand-600 hover:underline"
        >
          Next: value and strike {state.valuation.date}
          <ArrowRight className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
