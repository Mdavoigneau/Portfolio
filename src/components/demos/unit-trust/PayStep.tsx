/* Step 4, the payment run: reinvestment at the first strike on or after the
   ex-date, the cash half as an ABA bank file, and the AMIT attribution once
   the managers' tax statements arrive, reconciled by character and by
   member at once. */

import * as React from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ZERO, cmp, fmt, isZero, sub, sum } from "./dec";
import {
  AMIT_CASH,
  ABA_RECORD_LENGTH,
  cashTotal,
  f4,
  naiveAmit,
  paymentFile,
  price4,
  strikeForReceipt,
  usd,
  type AmitName,
  type AmitSplit,
} from "./logic";
import { APRIL_POOL } from "./data";
import { BTN, Panel, Pill, ResultLine, ROW, SectionLabel, TABLE, TABLE_WRAP, TD, TDR, TH, THR, FOCUS_RING } from "./controls";
import type { StepProps } from "./types";

const SHORT: Partial<Record<AmitName, string>> = {
  interest: "Interest",
  other_income: "Other Aus. income",
  capital_gains_discounted: "Capital gains (disc.)",
  tax_deferred: "Tax-deferred",
};

function Precondition({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5 text-xs text-ink-2">
      {ok ? (
        <Check className="mt-0.5 size-3.5 shrink-0 text-pos" aria-hidden />
      ) : (
        <X className="mt-0.5 size-3.5 shrink-0 text-neg" aria-hidden />
      )}
      <span>
        {children}
        <span className="sr-only">{ok ? " (met)" : " (not met)"}</span>
      </span>
    </li>
  );
}

function AmitPanel({ state, send, result }: Pick<StepProps, "state" | "send" | "result">) {
  const d = state.distribution;
  const [basis, setBasis] = React.useState<"production" | "naive">("production");
  const characterised = d.amit !== null;
  const names = AMIT_CASH.map(([n]) => n).filter((n) => !isZero(APRIL_POOL[n]));
  const naive = naiveAmit(d.amount, APRIL_POOL, d.entitlements);
  const rowSplit = (investorId: string): AmitSplit | null =>
    basis === "naive" ? naive.get(investorId) ?? null : d.entitlements.find((e) => e.investorId === investorId)?.amit ?? null;
  const broken = d.entitlements.filter((e) => {
    const s = naive.get(e.investorId);
    return s !== undefined && cmp(cashTotal(s), e.gross) !== 0;
  }).length;

  return (
    <Panel>
      <SectionLabel>AMIT characters (Div 276)</SectionLabel>
      <p className="text-xs leading-relaxed text-ink-2">
        The managers&rsquo; tax statements for April arrive after the run is paid, the normal order, so a paid run
        stays open for its characters while its economics are frozen. The nine cash-bearing characters must total
        the {usd(d.amount)} distributed:
      </p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-ink-2">
        {names.map((n) => (
          <span key={n}>
            {AMIT_CASH.find(([k]) => k === n)?.[1]} <span className="text-ink">{usd(APRIL_POOL[n])}</span>
          </span>
        ))}
        <span>
          = <span className="text-ink">{usd(cashTotal(APRIL_POOL))}</span>
        </span>
      </div>

      {!characterised ? (
        <div className="mt-3 flex flex-col gap-2">
          <Button className={cn(BTN, "self-start")} onClick={() => send({ type: "characterise", pool: APRIL_POOL }, "amit")}>
            Record and attribute
          </Button>
          <ResultLine outcome={result("amit")} />
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-2.5">
          <ResultLine outcome={result("amit")} />
          <div role="radiogroup" aria-label="Allocation basis" className="flex flex-wrap gap-1">
            {(
              [
                ["production", "Production: largest remainder, then cent transfers"],
                ["naive", "Round each share on its own"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={basis === id}
                onClick={() => setBasis(id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  FOCUS_RING,
                  basis === id
                    ? "border-brand bg-brand text-white"
                    : "border-line-strong bg-surface text-ink-2 hover:border-brand-line"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={TABLE_WRAP}>
            <table className={TABLE}>
              <thead>
                <tr>
                  <th scope="col" className={TH}>Member</th>
                  {names.map((n) => (
                    <th key={n} scope="col" className={THR}>
                      {SHORT[n] ?? n}
                    </th>
                  ))}
                  <th scope="col" className={THR}>Σ characters</th>
                  <th scope="col" className={THR}>Cash</th>
                  <th scope="col" className={TH}>
                    <span className="sr-only">Reconciles</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.entitlements.map((e) => {
                  const split = rowSplit(e.investorId);
                  const total = split !== null ? cashTotal(split) : null;
                  const ok = total !== null && cmp(total, e.gross) === 0;
                  return (
                    <tr key={e.investorId} className={cn(ROW, !ok && "bg-neg/[0.06]")}>
                      <td className={cn(TD, "font-mono text-[11px]")}>{e.investorId}</td>
                      {names.map((n) => (
                        <td key={n} className={TDR}>
                          {split !== null ? usd(split[n]) : "-"}
                        </td>
                      ))}
                      <td className={cn(TDR, !ok && "font-semibold text-neg")}>{total !== null ? usd(total) : "-"}</td>
                      <td className={TDR}>{usd(e.gross)}</td>
                      <td className={cn(TD, "w-6")}>
                        {ok ? (
                          <Check className="size-3.5 text-pos" aria-label="reconciles" />
                        ) : (
                          <span className="font-mono text-[10.5px] text-neg">
                            {total !== null ? fmt(sub(total, e.gross), 2, { sign: true }) : ""}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-line-strong font-semibold">
                  <td className={TD}>Pool</td>
                  {names.map((n) => {
                    const col = sum(d.entitlements.map((e) => rowSplit(e.investorId)?.[n] ?? ZERO));
                    return (
                      <td key={n} className={TDR}>
                        {usd(col)}
                      </td>
                    );
                  })}
                  <td className={TDR}>
                    {usd(sum(d.entitlements.map((e) => {
                      const split = rowSplit(e.investorId);
                      return split !== null ? cashTotal(split) : ZERO;
                    })))}
                  </td>
                  <td className={TDR}>{usd(sum(d.entitlements.map((e) => e.gross)))}</td>
                  <td className={TD} />
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="text-[11px] leading-relaxed text-ink-3">
            {basis === "production"
              ? "Both reconciliations hold at once: each column adds to what the trust attributed (the legal one), and each member's characters add back to the cash that member received."
              : `Rounding each share on its own keeps the columns right here and breaks ${broken} of ${d.entitlements.length} members: their characters no longer add back to their own cash, on a statement that prints both.`}
          </p>
        </div>
      )}
    </Panel>
  );
}

export default function PayStep({ state, send, result }: StepProps) {
  const d = state.distribution;
  const exStrike = strikeForReceipt(state.strikes, d.exDate);
  const paid = d.status === "Paid";
  const file = paid ? paymentFile(state) : null;
  const nameOf = (id: string) => state.investors.find((i) => i.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-ink-2">
        Reinvested entitlements become units at the first price struck on or after the ex-date, the same rule an
        application received that day follows, so the two paths cannot drift apart. The cash half goes out as a bank
        payment file.
      </p>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <ul className="space-y-1">
          <Precondition ok={d.status !== "Draft"}>
            {d.id} declared, payable booked {d.status === "Draft" ? "(step 1)" : ""}
          </Precondition>
          <Precondition ok={exStrike !== null}>
            A price struck on or after the ex-date ({d.exDate}):{" "}
            {exStrike !== null ? (
              <span className="font-mono">
                {exStrike.date} at {price4(exStrike.applicationPrice)}
              </span>
            ) : (
              "none yet (step 2)"
            )}
          </Precondition>
        </ul>
        {paid ? (
          <Pill tone="done">Paid</Pill>
        ) : (
          <Button className={BTN} onClick={() => send({ type: "pay" }, "pay")}>
            Run the payment
          </Button>
        )}
      </div>
      <ResultLine outcome={result("pay")} />

      {paid ? (
        <>
          <div className={TABLE_WRAP}>
            <table className={TABLE}>
              <thead>
                <tr>
                  <th scope="col" className={TH}>Investor</th>
                  <th scope="col" className={TH}>Election</th>
                  <th scope="col" className={THR}>Entitlement</th>
                  <th scope="col" className={THR}>Units reinvested</th>
                  <th scope="col" className={THR}>Paid</th>
                </tr>
              </thead>
              <tbody>
                {d.entitlements.map((e) => (
                  <tr key={e.investorId} className={ROW}>
                    <td className={TD}>
                      <span className="font-mono text-[11px] text-ink-3">{e.investorId}</span>{" "}
                      <span className="text-ink">{nameOf(e.investorId)}</span>
                    </td>
                    <td className={cn(TD, "text-ink-2")}>{e.choice === "reinvest" ? "Reinvest" : "Cash"}</td>
                    <td className={TDR}>{usd(e.gross)}</td>
                    <td className={TDR}>
                      {e.reinvestedUnits !== null && e.reinvestPrice !== null ? (
                        <>
                          {f4(e.reinvestedUnits)}
                          <div className="text-[10.5px] text-ink-3">
                            @ {price4(e.reinvestPrice)} · {e.reinvestTxnId}
                          </div>
                        </>
                      ) : (
                        <span className="text-ink-3">-</span>
                      )}
                    </td>
                    <td className={TDR}>{e.paidAmount !== null && e.choice === "paid" ? usd(e.paidAmount) : <span className="text-ink-3">-</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {file !== null ? (
            <Panel>
              <SectionLabel>
                Payment file (ABA) · cash half only · {file.lines.length - 2} credits, {usd(file.total)}
              </SectionLabel>
              <div className="overflow-x-auto rounded-md border border-line bg-surface">
                <pre className="w-max px-3 py-2 font-mono text-[10px] leading-[1.7] text-ink-2">
                  {file.lines.map((line, i) => (
                    <div key={i}>{line.replace(/ /g, "·")}</div>
                  ))}
                </pre>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-3">
                Header, one credit per paid holder, trailer: every record exactly {ABA_RECORD_LENGTH} characters
                (spaces shown as dots), asserted as the file is written, because a bank rejects the whole file over
                one malformed record. Written by hand rather than taken as a dependency: the format is forty lines.
              </p>
              {file.warnings.map((w) => (
                <p key={w} className="mt-1.5 font-mono text-[11px] text-neg">
                  {w} <span className="text-ink-3">Warned, not fatal: the rest of the file still goes.</span>
                </p>
              ))}
            </Panel>
          ) : null}

          <AmitPanel state={state} send={send} result={result} />
        </>
      ) : null}
    </div>
  );
}
