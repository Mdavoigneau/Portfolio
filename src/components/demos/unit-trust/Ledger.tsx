/* The ledger under every step, organised around two questions. Where do the
   accounts stand: five balance tiles, with the ones the last entry moved
   lit, and the check that debits equal credits. What happened: one row per
   journal, debits left and credits right, newest first, with the intake
   brought forward folded into a single row. Then the append-only audit
   trail, and a panel that tries to rewrite history through the same store
   helpers the actions use. */

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { cmp, isPos, sum } from "./dec";
import { ACCOUNTS, trialBalance, usd, type AccountCode, type Journal, type JournalLine, type RewriteTarget } from "./logic";
import { BTN, FOCUS_RING, ResultLine, ROW, TABLE, TABLE_WRAP, TD, TDR, TH, THR } from "./controls";
import type { StepProps } from "./types";

const TAB_TRIGGER = cn(
  "-mb-px border-b-2 border-transparent px-2.5 pb-2 pt-1 text-xs font-medium text-ink-3 transition-colors hover:text-ink-2",
  "data-[state=active]:border-brand-600 data-[state=active]:text-brand-700",
  FOCUS_RING
);

function Balances({ journals }: { journals: ReadonlyArray<Journal> }) {
  const tb = trialBalance(journals);
  const dr = sum(tb.map((b) => b.debit));
  const cr = sum(tb.map((b) => b.credit));
  const balanced = cmp(dr, cr) === 0;
  const last = journals.filter((j) => !j.broughtForward).sort((a, b) => b.id - a.id)[0];
  const touched = new Set<AccountCode>(last?.lines.map((l) => l.account) ?? []);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-3">Account balances</span>
        <span className={cn("inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs font-semibold", balanced ? "text-pos" : "text-neg")}>
          {balanced ? <Check className="size-3.5" aria-hidden /> : null}
          {balanced ? "Balanced" : "Out of balance"}
          <span className="whitespace-nowrap font-mono text-[10.5px] font-normal text-ink-3">
            Dr {usd(dr)} = Cr {usd(cr)}
          </span>
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
        {tb.map((b) => {
          const debit = isPos(b.debit);
          const moved = debit || isPos(b.credit);
          const hot = touched.has(b.code);
          return (
            <li
              key={b.code}
              title={ACCOUNTS[b.code].name}
              className={cn(
                "rounded-lg border px-2.5 py-2 transition-colors duration-300 sm:px-3",
                hot ? "border-brand-line bg-brand-tint/60" : "border-line bg-surface"
              )}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="font-mono text-[10px] text-ink-3">{b.code}</span>
                {hot ? <span className="text-[9.5px] font-medium text-brand-700">last entry</span> : null}
              </div>
              <div className="text-[11.5px] leading-snug text-ink-2">{ACCOUNTS[b.code].short}</div>
              <div className="tnum mt-1 whitespace-nowrap font-mono text-[11px] font-semibold text-ink sm:text-[12.5px]">
                {moved ? (
                  <>
                    {usd(debit ? b.debit : b.credit)}{" "}
                    <span className="font-normal text-ink-3">{debit ? "Dr" : "Cr"}</span>
                  </>
                ) : (
                  <span className="font-normal text-ink-3">nil</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Account({ code }: { code: AccountCode }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-mono text-[10.5px] text-ink-3">{code}</span> {ACCOUNTS[code].short}
    </span>
  );
}

/** One side of an entry. A side with several lines names each amount. */
function Side({ lines, side }: { lines: ReadonlyArray<JournalLine>; side: "debit" | "credit" }) {
  const many = lines.length > 1;
  return (
    <div className="space-y-0.5">
      {lines.map((l) => (
        <div key={l.account} className="whitespace-nowrap">
          <Account code={l.account} />
          {many ? (
            <span className="ml-1.5 font-mono text-[10.5px] text-ink-3">{usd(side === "debit" ? l.debit : l.credit)}</span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function EntryRow({ j }: { j: Journal }) {
  const debits = j.lines.filter((l) => isPos(l.debit));
  const credits = j.lines.filter((l) => isPos(l.credit));
  const muted = j.broughtForward;
  return (
    <tr className={cn(ROW, muted ? "text-ink-3" : "text-ink-2")} title={j.description}>
      <td className={cn(TD, "whitespace-nowrap align-top font-mono text-[10.5px]")}>{j.date}</td>
      <td className={cn(TD, "align-top")}>
        <div className={cn("whitespace-nowrap", !muted && "text-ink")}>{j.event}</div>
        <div className="font-mono text-[10.5px] text-ink-3">{j.ref}</div>
      </td>
      <td className={cn(TD, "align-top")}>
        <Side lines={debits} side="debit" />
      </td>
      <td className={cn(TD, "align-top")}>
        <Side lines={credits} side="credit" />
      </td>
      <td className={cn(TDR, "whitespace-nowrap align-top font-mono text-[11px]", !muted && "text-ink")}>
        {usd(sum(debits.map((l) => l.debit)))}
      </td>
    </tr>
  );
}

function sides(journals: ReadonlyArray<Journal>, side: "debit" | "credit"): AccountCode[] {
  const codes = journals.flatMap((j) => j.lines.filter((l) => isPos(side === "debit" ? l.debit : l.credit)).map((l) => l.account));
  return [...new Set(codes)];
}

function Journals({ state }: Pick<StepProps, "state">) {
  const [openBf, setOpenBf] = React.useState(false);
  const session = state.journals.filter((j) => !j.broughtForward).sort((a, b) => b.id - a.id);
  const bf = state.journals.filter((j) => j.broughtForward).sort((a, b) => b.id - a.id);
  const bfDebit = sides(bf, "debit");
  const bfCredit = sides(bf, "credit");

  return (
    <div className="flex flex-col gap-3">
      <Balances journals={state.journals} />

      <div className={TABLE_WRAP}>
        <table className={cn(TABLE, "min-w-[40rem]")}>
          <thead>
            <tr>
              <th scope="col" className={TH}>Date</th>
              <th scope="col" className={TH}>Entry</th>
              <th scope="col" className={TH}>Debit</th>
              <th scope="col" className={TH}>Credit</th>
              <th scope="col" className={THR}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {session.length === 0 ? (
              <tr className={ROW}>
                <td colSpan={5} className="px-2.5 py-3 text-center text-[11px] text-ink-3">
                  Nothing posted this session yet: each step that moves money lands here.
                </td>
              </tr>
            ) : null}
            {session.map((j) => (
              <EntryRow key={j.id} j={j} />
            ))}
            {bf.length > 0 ? (
              <tr className={cn(ROW, "text-ink-3")}>
                <td className={cn(TD, "align-top font-mono text-[10.5px]")}>b/f</td>
                <td className={cn(TD, "align-top")}>
                  <button
                    type="button"
                    aria-expanded={openBf}
                    onClick={() => setOpenBf((o) => !o)}
                    className={cn("inline-flex items-center gap-1 whitespace-nowrap text-left text-ink-2 hover:text-ink", FOCUS_RING)}
                  >
                    <ChevronRight className={cn("size-3 shrink-0 transition-transform", openBf && "rotate-90")} aria-hidden />
                    {bf.length} applications received
                  </button>
                  <div className="pl-4 text-[10.5px]">brought forward</div>
                </td>
                <td className={cn(TD, "align-top")}>
                  {bfDebit.length === 1 && bfDebit[0] !== undefined ? <Account code={bfDebit[0]} /> : "various"}
                </td>
                <td className={cn(TD, "align-top")}>
                  {bfCredit.length === 1 && bfCredit[0] !== undefined ? <Account code={bfCredit[0]} /> : "various"}
                </td>
                <td className={cn(TDR, "whitespace-nowrap align-top font-mono text-[11px]")}>
                  {usd(sum(bf.flatMap((j) => j.lines.map((l) => l.debit))))}
                </td>
              </tr>
            ) : null}
            {openBf ? bf.map((j) => <EntryRow key={j.id} j={j} />) : null}
          </tbody>
        </table>
      </div>

      <p className="text-[10.5px] leading-snug text-ink-3">
        An entry that does not balance is refused before it exists. Watch 2100 clear as applications settle, and 2500
        net to nil once the run is paid. Hover an entry for the description production writes on it.
      </p>
    </div>
  );
}

function Audit({ state }: Pick<StepProps, "state">) {
  const rows = [...state.audit].sort((a, b) => b.seq - a.seq);
  return (
    <div className="max-h-72 overflow-y-auto rounded-lg border border-line bg-surface">
      <table className={TABLE}>
        <thead className="sticky top-0 bg-surface">
          <tr>
            <th scope="col" className={TH}>When</th>
            <th scope="col" className={TH}>Table · record</th>
            <th scope="col" className={TH}>Action</th>
            <th scope="col" className={TH}>By</th>
            <th scope="col" className={TH}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.seq} className={cn(ROW, a.broughtForward && "text-ink-3")}>
              <td className={cn(TD, "whitespace-nowrap font-mono text-[10.5px]")}>{a.time}</td>
              <td className={cn(TD, "font-mono text-[10.5px]")}>
                {a.table}
                <div className="text-ink-3">{a.record}</div>
              </td>
              <td className={cn(TD, "font-mono text-[10.5px]")}>{a.action}</td>
              <td className={cn(TD, "text-[11px]")}>{a.by}</td>
              <td className={cn(TD, "min-w-56 text-[11px] leading-snug")}>{a.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Rewrite({ state, send, result }: Pick<StepProps, "state" | "send" | "result">) {
  const unverifiedPending = state.txns.some((t) => {
    const inv = state.investors.find((i) => i.id === t.investorId);
    return t.status === "Pending" && inv !== undefined && !inv.wholesaleVerified;
  });
  const targets: Array<{ id: RewriteTarget; label: string; sql: string; show: boolean }> = [
    { id: "strike", label: "Change a struck price", sql: "UPDATE unit_price_history", show: true },
    { id: "journal", label: "Delete a journal", sql: "DELETE FROM journal_entries", show: true },
    { id: "audit", label: "Edit the audit trail", sql: "UPDATE audit_log", show: true },
    { id: "settled", label: "Edit a settled application", sql: "UPDATE transactions", show: true },
    {
      id: "raw-settle",
      label: "Settle an unverified application directly",
      sql: "UPDATE transactions SET status = 'Settled'",
      show: unverifiedPending,
    },
    { id: "line", label: "Edit a line of the struck valuation", sql: "UPDATE manual_valuation_lines", show: state.valuation.published },
    {
      id: "entitlement",
      label: "Change a paid entitlement",
      sql: "UPDATE distribution_entitlements",
      show: state.distribution.status === "Paid",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-ink-2">
        Production enforces these in the database, with BEFORE UPDATE and BEFORE DELETE triggers, so no code path can
        get round them: not a bug, not a maintenance script, not raw SQL. Here the store helpers every action writes
        through play that part, and refuse with the triggers&rsquo; own messages.
      </p>
      <ul className="flex flex-col gap-2">
        {targets
          .filter((t) => t.show)
          .map((t) => (
            <li key={t.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  className={BTN}
                  onClick={() => send({ type: "rewrite", target: t.id }, `rewrite:${t.id}`)}
                >
                  {t.label}
                </Button>
                <code className="font-mono text-[10.5px] text-ink-3">{t.sql}</code>
              </div>
              <ResultLine outcome={result(`rewrite:${t.id}`)} />
            </li>
          ))}
      </ul>
    </div>
  );
}

export default function Ledger({ state, send, result }: Pick<StepProps, "state" | "send" | "result">) {
  const session = state.journals.filter((j) => !j.broughtForward).length;
  return (
    <section aria-label="Ledger and audit trail" className="rounded-xl border border-line bg-elevated px-4 pb-4 pt-3">
      <Tabs.Root defaultValue="journals">
        <Tabs.List aria-label="Ledger views" className="mb-3 flex flex-wrap border-b border-line">
          <Tabs.Trigger value="journals" className={TAB_TRIGGER}>
            General ledger <span className="font-mono text-ink-3">({state.journals.length})</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="audit" className={TAB_TRIGGER}>
            Audit log <span className="font-mono text-ink-3">({state.audit.length})</span>
          </Tabs.Trigger>
          <Tabs.Trigger value="rewrite" className={TAB_TRIGGER}>
            Try to rewrite history
          </Tabs.Trigger>
          <span className="ml-auto hidden self-center pb-1.5 font-mono text-[10px] text-ink-3 sm:block">
            {session} posted this session
          </span>
        </Tabs.List>
        <Tabs.Content value="journals" className="outline-none">
          <Journals state={state} />
        </Tabs.Content>
        <Tabs.Content value="audit" className="outline-none">
          <Audit state={state} />
        </Tabs.Content>
        <Tabs.Content value="rewrite" className="outline-none">
          <Rewrite state={state} send={send} result={result} />
        </Tabs.Content>
      </Tabs.Root>
    </section>
  );
}
