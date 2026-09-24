/**
 * The unit-trust miniature's domain: a TypeScript port of the production
 * fund-administration rules (Flask + SQLAlchemy + SQLite), as pure functions
 * over one in-memory register. No React here.
 *
 * Production names are kept for everything ported, so the two read side by
 * side: computeSnapshot is FundSnapshot, strikeForReceipt is
 * _strike_for_receipt, settle is settle_transaction, attributeAmit is
 * _attribute_amit. Refusals carry the production wording. What the database
 * enforces with a trigger, the store helpers below enforce whoever calls them,
 * with the trigger's own RAISE text.
 */

import {
  ZERO,
  add,
  cmp,
  dec,
  div,
  fmt,
  fromCents,
  isPos,
  isZero,
  money,
  mul,
  quantize,
  sub,
  sum,
  toCents,
  type Dec,
} from "./dec";

export type Iso = string; // "2026-05-29"; ISO dates compare as strings
export type Election = "paid" | "reinvest";
export type TxnStatus = "Pending" | "Settled" | "Rejected" | "Cancelled";

export interface Investor {
  id: string;
  name: string;
  amlVerified: boolean;
  amlEvidence: string;
  wholesaleVerified: boolean;
  wholesaleEvidence: string;
  election: Election;
  bsb: string;
  account: string;
  accountName: string;
}

/** One application on the register. The demo has no redemption intake,
    which matches production (there is no redemption intake route yet). */
export interface Txn {
  id: string;
  investorId: string;
  status: TxnStatus;
  amount: Dec;
  receivedDate: Iso | null;
  pricingDate: Iso | null;
  unitPrice: Dec | null;
  navUnitPrice: Dec | null;
  units: Dec | null;
  signedForm: boolean;
  /** set on the settled Application a distribution reinvestment issues */
  reinvestmentOf: string | null;
}

/** A published strike (unit_price_history): append-only once written. */
export interface Strike extends Snapshot {
  date: Iso;
}

export interface ValuationLine {
  ticker: string;
  name: string;
  units: Dec;
  price: Dec | null;
}

export interface Valuation {
  date: Iso;
  cash: Dec;
  lines: ValuationLine[];
  published: boolean;
}

export const AMIT_CASH = [
  ["franked", "Franked dividends"],
  ["unfranked", "Unfranked dividends"],
  ["interest", "Interest"],
  ["other_income", "Other Australian income"],
  ["capital_gains_discounted", "Capital gains (discount method)"],
  ["capital_gains_other", "Capital gains (other method)"],
  ["cgt_concession", "CGT concession amount"],
  ["foreign_income", "Foreign income"],
  ["tax_deferred", "Tax-deferred / tax-free"],
] as const;
export const AMIT_GROSS_UPS = [
  ["franking_credits", "Franking credits"],
  ["foreign_tax_offset", "Foreign income tax offset"],
] as const;
export type AmitName = (typeof AMIT_CASH)[number][0] | (typeof AMIT_GROSS_UPS)[number][0];
export const AMIT_ALL: ReadonlyArray<AmitName> = [...AMIT_CASH, ...AMIT_GROSS_UPS].map(([n]) => n);
export type AmitSplit = Record<AmitName, Dec>;

export interface Entitlement {
  investorId: string;
  unitsAtRecord: Dec;
  gross: Dec;
  roundingAdjustment: Dec;
  choice: Election;
  reinvestedUnits: Dec | null;
  reinvestPrice: Dec | null;
  paidAmount: Dec | null;
  reinvestTxnId: string | null;
  amit: AmitSplit | null;
}

export interface Distribution {
  id: string;
  periodStart: Iso;
  periodEnd: Iso;
  exDate: Iso;
  recordDate: Iso;
  paymentDate: Iso;
  amount: Dec;
  unitsAtRecord: Dec;
  centsPerUnit: Dec;
  status: "Draft" | "Declared" | "Paid";
  entitlements: Entitlement[];
  amit: AmitSplit | null;
}

/** The slice of the standard chart of accounts this cycle posts to. */
export const ACCOUNTS = {
  "1000": { name: "Cash at Bank", short: "Cash at bank", normal: "Dr" },
  "2100": { name: "Application Money Pending Allotment", short: "Application money", normal: "Cr" },
  "2500": { name: "Distribution Payable", short: "Distribution payable", normal: "Cr" },
  "3000": { name: "Unit Capital", short: "Unit capital", normal: "Cr" },
  "3300": { name: "Distributions Declared", short: "Distributions declared", normal: "Dr" },
} as const;
export type AccountCode = keyof typeof ACCOUNTS;

export interface JournalLine {
  account: AccountCode;
  debit: Dec;
  credit: Dec;
}

export interface Journal {
  id: number;
  date: Iso;
  /** what happened, in a word or two, and the record it happened to */
  event: string;
  ref: string;
  /** the description production writes on the journal */
  description: string;
  lines: JournalLine[];
  /** posted before this session opened */
  broughtForward: boolean;
}

export interface AuditRow {
  seq: number;
  time: string;
  table: string;
  record: string;
  action: string;
  by: string;
  notes: string;
  broughtForward: boolean;
}

export interface FundState {
  fundName: string;
  businessDate: Iso;
  buySpread: Dec;
  sellSpread: Dec;
  clockMinutes: number;
  strikes: Strike[];
  valuation: Valuation;
  investors: Investor[];
  txns: Txn[];
  distribution: Distribution;
  journals: Journal[];
  audit: AuditRow[];
}

export const ACTOR = "you";

/* ── Formatting the production way ──────────────────────────────────────── */

export const f2 = (d: Dec) => fmt(d, 2);
export const f4 = (d: Dec) => fmt(d, 4);
export const f6 = (d: Dec) => fmt(d, 6);
export const f8 = (d: Dec) => fmt(d, 8);
export const usd = (d: Dec) => money(d);
export const price4 = (d: Dec) => money(d, 4);

/* ── Triggers ────────────────────────────────────────────────────────────── */

/** The triggers' RAISE text, verbatim except that an em-dash is set as a
    colon (the page carries no dashes; the database text does). */
export const TRIGGER = {
  appendOnly: (table: string, verb: "UPDATE" | "DELETE") =>
    `${table} is append-only (Corporations Act 2001 s.286): ${verb} not permitted`,
  terminal: "terminal transactions are immutable",
  settlementCompliance: "AML/KYC and wholesale evidence required before settlement",
  publishedLines: "published manual valuation lines are immutable",
  paidEntitlements:
    "entitlements of a paid distribution are immutable in their economics: only the AMIT attribution may still be recorded",
} as const;

/** A statement the database refused. Nothing is written. */
export class TriggerAbort extends Error {}

const TERMINAL: ReadonlyArray<TxnStatus> = ["Settled", "Rejected", "Cancelled"];

/** UPDATE transactions: transactions_terminal_no_update plus
    transactions_settlement_compliance, applied to every write. */
export function updateTxn(state: FundState, id: string, patch: Partial<Txn>): Txn[] {
  return state.txns.map((t) => {
    if (t.id !== id) return t;
    if (TERMINAL.includes(t.status)) throw new TriggerAbort(TRIGGER.terminal);
    const next = { ...t, ...patch };
    if (t.status === "Pending" && next.status === "Settled") {
      const inv = state.investors.find((i) => i.id === t.investorId);
      const evidenced =
        inv !== undefined &&
        inv.amlVerified &&
        inv.amlEvidence.trim().length > 0 &&
        inv.wholesaleVerified &&
        inv.wholesaleEvidence.trim().length > 0;
      if (!evidenced) throw new TriggerAbort(TRIGGER.settlementCompliance);
    }
    return next;
  });
}

/** UPDATE / DELETE on an append-only table: always refused. */
export function rewriteAppendOnly(table: string, verb: "UPDATE" | "DELETE"): never {
  throw new TriggerAbort(TRIGGER.appendOnly(table, verb));
}

/** UPDATE manual_valuation_lines: frozen once their valuation is struck. */
export function updateValuationLine(v: Valuation, ticker: string, price: Dec): Valuation {
  if (v.published) throw new TriggerAbort(TRIGGER.publishedLines);
  return { ...v, lines: v.lines.map((l) => (l.ticker === ticker ? { ...l, price } : l)) };
}

const ECONOMIC_FIELDS: ReadonlyArray<keyof Entitlement> = [
  "unitsAtRecord", "gross", "roundingAdjustment", "choice",
  "reinvestedUnits", "reinvestPrice", "paidAmount",
];

/** UPDATE distribution_entitlements: a paid run is frozen in its economics
    and still takes its AMIT characters (0024 narrowed the trigger to this). */
export function updateEntitlement(
  dist: Distribution,
  investorId: string,
  patch: Partial<Entitlement>
): Distribution {
  if (dist.status === "Paid" && ECONOMIC_FIELDS.some((f) => f in patch)) {
    throw new TriggerAbort(TRIGGER.paidEntitlements);
  }
  return {
    ...dist,
    entitlements: dist.entitlements.map((e) => (e.investorId === investorId ? { ...e, ...patch } : e)),
  };
}

/* ── The ledger and the audit trail (both append-only) ──────────────────── */

/** post_journal: refuses anything that does not balance, before it exists. */
export function postJournal(
  journals: ReadonlyArray<Journal>,
  date: Iso,
  entry: { event: string; ref: string; description: string },
  lines: ReadonlyArray<[AccountCode, Dec, Dec]>
): Journal[] {
  if (lines.length === 0) throw new Error("Journal must have at least one line.");
  const dr = sum(lines.map(([, d]) => d));
  const cr = sum(lines.map(([, , c]) => c));
  if (cmp(dr, cr) !== 0) throw new Error(`Journal does not balance: debits $${f2(dr)} != credits $${f2(cr)}`);
  if (isZero(dr)) throw new Error("Journal has zero value.");
  for (const [code, d, c] of lines) {
    if (isPos(d) === isPos(c)) throw new Error(`Line for ${code} must have exactly one of debit or credit > 0.`);
  }
  const id = journals.reduce((m, j) => Math.max(m, j.id), 0) + 1;
  return [
    ...journals,
    {
      id,
      date,
      ...entry,
      lines: lines.map(([account, debit, credit]) => ({ account, debit, credit })),
      broughtForward: false,
    },
  ];
}

function clock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** write_audit, with the demo's fixed clock ticking a minute per entry. */
function writeAudit(state: FundState, table: string, record: string, action: string, notes: string): FundState {
  const seq = state.audit.reduce((m, a) => Math.max(m, a.seq), 0) + 1;
  return {
    ...state,
    clockMinutes: state.clockMinutes + 1,
    audit: [
      ...state.audit,
      { seq, time: clock(state.clockMinutes), table, record, action, by: ACTOR, notes, broughtForward: false },
    ],
  };
}

export interface AccountBalance {
  code: AccountCode;
  debit: Dec;
  credit: Dec;
}

/** Net movement per account across the journals shown: must net to zero. */
export function trialBalance(journals: ReadonlyArray<Journal>): AccountBalance[] {
  const codes = Object.keys(ACCOUNTS) as AccountCode[];
  return codes.map((code) => {
    const lines = journals.flatMap((j) => j.lines).filter((l) => l.account === code);
    const net = sub(sum(lines.map((l) => l.debit)), sum(lines.map((l) => l.credit)));
    return isPos(net)
      ? { code, debit: net, credit: ZERO }
      : { code, debit: ZERO, credit: sub(ZERO, net) };
  });
}

/* ── Pricing ─────────────────────────────────────────────────────────────── */

export interface Snapshot {
  totalCash: Dec;
  totalEquities: Dec;
  totalAssets: Dec;
  liabilities: Dec;
  nav: Dec;
  unitsOnIssue: Dec;
  /** internal working price, six places (Policy s.7.2) */
  unitPrice: Dec;
  /** published NAV unit price, four places (Policy s.7.2) */
  navUnitPrice: Dec;
  applicationPrice: Dec;
  redemptionPrice: Dec;
}

const ONE = dec("1");

/** FundSnapshot. The published price is rounded twice, NAV ÷ units to six
    places and then to four, and the spreads apply to the four-place figure,
    exactly as production does it. */
export function computeSnapshot(input: {
  cash: Dec;
  lines: ReadonlyArray<{ units: Dec; price: Dec }>;
  liabilities: Dec;
  unitsOnIssue: Dec;
  buySpread: Dec;
  sellSpread: Dec;
}): Snapshot {
  if (isZero(input.unitsOnIssue)) throw new Error("Units on issue cannot be zero");
  const totalEquities = sum(input.lines.map((l) => mul(l.units, l.price)));
  const totalAssets = add(input.cash, totalEquities);
  const nav = sub(totalAssets, input.liabilities);
  const unitPrice = div(nav, input.unitsOnIssue, 6);
  const navUnitPrice = quantize(unitPrice, 4);
  return {
    totalCash: input.cash,
    totalEquities,
    totalAssets,
    liabilities: input.liabilities,
    nav,
    unitsOnIssue: input.unitsOnIssue,
    unitPrice,
    navUnitPrice,
    applicationPrice: quantize(mul(navUnitPrice, add(ONE, input.buySpread)), 4),
    redemptionPrice: quantize(mul(navUnitPrice, sub(ONE, input.sellSpread)), 4),
  };
}

/** get_units_on_issue: derived from the settled register, never stored. With
    asOf, only transactions priced on or before it, so a strike is never
    diluted by settlements whose cash is not in that valuation. */
export function unitsOnIssue(txns: ReadonlyArray<Txn>, asOf?: Iso): Dec {
  return sum(
    txns
      .filter((t) => t.status === "Settled" && t.units !== null)
      .filter((t) => asOf === undefined || (t.pricingDate !== null && t.pricingDate <= asOf))
      .map((t) => t.units ?? ZERO)
  );
}

/** units_by_holder: the per-holder form of the same rule. */
export function unitsByHolder(txns: ReadonlyArray<Txn>, asOf: Iso): Map<string, Dec> {
  const out = new Map<string, Dec>();
  for (const t of txns) {
    if (t.status !== "Settled" || t.units === null || t.pricingDate === null || t.pricingDate > asOf) continue;
    out.set(t.investorId, add(out.get(t.investorId) ?? ZERO, t.units));
  }
  for (const [k, v] of out) if (!isPos(v)) out.delete(k);
  return out;
}

/** distribution_payable: a Declared distribution is a liability of every
    valuation from its ex-date on (Policy s.9.2). */
export function distributionPayable(dist: Distribution, asOf?: Iso): Dec {
  if (dist.status !== "Declared") return ZERO;
  if (asOf !== undefined && dist.exDate > asOf) return ZERO;
  return dist.amount;
}

/** unpriced_positions: a zero price is not a price. */
export function unpricedPositions(v: Valuation): ValuationLine[] {
  return v.lines.filter((l) => isPos(l.units) && (l.price === null || isZero(l.price)));
}

/** unpriced_valuation_reason, one definition for the banner, the disabled
    Publish control and publish's own refusal. The production text goes on to
    name the custodian feed; this fund's marks are typed, so that sentence is
    left out. */
export function unpricedValuationReason(v: Valuation): string | null {
  const missing = unpricedPositions(v);
  if (missing.length === 0) return null;
  const n = missing.length;
  const shown = missing.slice(0, 5).map((l) => l.ticker).join(", ");
  const more = n > 5 ? ` and ${n - 5} more` : "";
  return (
    `${n} position${n !== 1 ? "s" : ""} in the ${v.date} valuation ${n !== 1 ? "have" : "has"} ` +
    `no price (${shown}${more}). Publishing now would strike a NAV that leaves ` +
    `${n !== 1 ? "them" : "it"} out entirely.`
  );
}

/** The live snapshot of the draft: what Publish would strike right now. */
export function draftSnapshot(state: FundState): Snapshot | null {
  const v = state.valuation;
  const units = unitsOnIssue(state.txns, v.date);
  if (!isPos(units)) return null;
  return computeSnapshot({
    cash: v.cash,
    lines: v.lines.map((l) => ({ units: l.units, price: l.price ?? ZERO })),
    liabilities: distributionPayable(state.distribution, v.date),
    unitsOnIssue: units,
    buySpread: state.buySpread,
    sellSpread: state.sellSpread,
  });
}

/* ── Forward pricing ─────────────────────────────────────────────────────── */

function byDate(strikes: ReadonlyArray<Strike>): Strike[] {
  return [...strikes].sort((a, b) => a.date.localeCompare(b.date));
}

export function latestStrike(strikes: ReadonlyArray<Strike>): Strike | null {
  return byDate(strikes).at(-1) ?? null;
}

/** _strike_for_receipt: the FIRST strike published for a valuation date on
    or after receipt (Policy s.5.2). None yet means the application waits,
    unpriced. With no receipt date on file, the latest strike, which is the
    behaviour kept for rows captured before receipt dates were recorded. */
export function strikeForReceipt(strikes: ReadonlyArray<Strike>, received: Iso | null): Strike | null {
  const sorted = byDate(strikes);
  if (received === null) return sorted.at(-1) ?? null;
  return sorted.find((s) => s.date >= received) ?? null;
}

export interface SettlementQuote {
  pricingDate: Iso;
  unitPrice: Dec;
  navUnitPrice: Dec;
  units: Dec;
}

/** settlement_quote: one function behind the dialog preview and the
    settlement itself, so what is confirmed is what gets written. */
export function settlementQuote(state: FundState, txn: Txn): SettlementQuote | null {
  if (txn.status !== "Pending") return null;
  const strike = strikeForReceipt(state.strikes, txn.receivedDate);
  if (strike === null) return null;
  return {
    pricingDate: strike.date,
    unitPrice: strike.applicationPrice,
    navUnitPrice: strike.navUnitPrice,
    units: div(txn.amount, strike.applicationPrice, 4),
  };
}

export function unpricedSettlementReason(txn: Txn, quote: SettlementQuote | null): string | null {
  if (quote !== null || txn.pricingDate !== null) return null;
  return (
    `Transaction ${txn.id} cannot be settled yet. It was captured unpriced, and no unit price ` +
    `has been published for a valuation date on or after it was received (${txn.receivedDate}). ` +
    `Under forward pricing (Policy s.5.2) it takes the first such price; publish that valuation ` +
    `and settle then.`
  );
}

/** The explainer: what pricing at capture (the behaviour receipt-date pricing
    replaced) would have issued, against the strike the rule actually binds.
    Extra units are value moved from existing holders. */
export function captureCounterfactual(
  state: FundState,
  txn: Txn
): { capturePrice: Dec; captureDate: Iso; captureUnits: Dec; boundUnits: Dec; extraUnits: Dec; valueMoved: Dec } | null {
  if (txn.receivedDate === null) return null;
  const received = txn.receivedDate;
  const bound = strikeForReceipt(state.strikes, received);
  const onFile = byDate(state.strikes).filter((s) => s.date < received).at(-1);
  if (bound === null || onFile === undefined) return null;
  const boundUnits = div(txn.amount, bound.applicationPrice, 4);
  const captureUnits = div(txn.amount, onFile.applicationPrice, 4);
  const extraUnits = sub(captureUnits, boundUnits);
  return {
    capturePrice: onFile.applicationPrice,
    captureDate: onFile.date,
    captureUnits,
    boundUnits,
    extraUnits,
    valueMoved: quantize(mul(extraUnits, bound.navUnitPrice), 2),
  };
}

/* ── Distributions ──────────────────────────────────────────────────────── */

/** compute_distribution_entitlements: eight-place rate, each holder rounded
    to cents, and the residual assigned in full to the single largest
    entitlement and recorded there, never spread silently. */
export function computeEntitlements(
  txns: ReadonlyArray<Txn>,
  investors: ReadonlyArray<Investor>,
  amount: Dec,
  recordDate: Iso
): { unitsAtRecord: Dec; centsPerUnit: Dec; rows: Entitlement[] } {
  const holdings = unitsByHolder(txns, recordDate);
  const unitsAtRecord = sum([...holdings.values()]);
  const centsPerUnit = div(amount, unitsAtRecord, 8);
  const rows: Entitlement[] = [...holdings].map(([investorId, units]) => ({
    investorId,
    unitsAtRecord: units,
    gross: quantize(mul(units, centsPerUnit), 2),
    roundingAdjustment: ZERO,
    choice: investors.find((i) => i.id === investorId)?.election ?? "reinvest",
    reinvestedUnits: null,
    reinvestPrice: null,
    paidAmount: null,
    reinvestTxnId: null,
    amit: null,
  }));
  const residual = sub(amount, sum(rows.map((r) => r.gross)));
  if (!isZero(residual)) {
    const largest = [...rows].sort((a, b) => cmp(b.gross, a.gross) || b.investorId.localeCompare(a.investorId))[0];
    if (largest) {
      largest.gross = add(largest.gross, residual);
      largest.roundingAdjustment = residual;
    }
  }
  rows.sort((a, b) => a.investorId.localeCompare(b.investorId));
  return { unitsAtRecord, centsPerUnit, rows };
}

/** _attribute_amit: both reconciliations at once. Whole cents; each character
    by largest remainder (its column is exact by construction), then the row
    errors, which sum to zero, repaired by moving single cents of a character
    from one member to another, a transfer that cannot disturb its column. */
export function attributeAmit(
  total: Dec,
  pool: AmitSplit,
  ents: ReadonlyArray<Pick<Entitlement, "investorId" | "gross">>
): Map<string, AmitSplit> {
  const order = [...ents].sort((a, b) => cmp(b.gross, a.gross) || a.investorId.localeCompare(b.investorId));
  const totalCents = toCents(total);
  const weights = order.map((e) => toCents(e.gross));
  const allocated = {} as Record<AmitName, bigint[]>;

  for (const name of AMIT_ALL) {
    const p = toCents(pool[name]);
    if (p === 0n || totalCents === 0n) {
      allocated[name] = weights.map(() => 0n);
      continue;
    }
    const exact = weights.map((w) => p * w);
    const shares = exact.map((v) => v / totalCents);
    const byRemainder = order
      .map((_, i) => i)
      .sort((i, j) => {
        const ri = (exact[i] ?? 0n) % totalCents;
        const rj = (exact[j] ?? 0n) % totalCents;
        return ri > rj ? -1 : ri < rj ? 1 : i - j;
      });
    let left = p - shares.reduce((a, b) => a + b, 0n);
    for (const i of byRemainder) {
      if (left <= 0n) break;
      shares[i] = (shares[i] ?? 0n) + 1n;
      left -= 1n;
    }
    allocated[name] = shares;
  }

  // Row repair, cash-bearing characters only.
  const cashNames = AMIT_CASH.map(([n]) => n);
  const cell = (n: AmitName, i: number) => allocated[n][i] ?? 0n;
  if (cashNames.some((n) => allocated[n].some((v) => v !== 0n))) {
    const errors = order.map((_, i) => cashNames.reduce((s, n) => s + cell(n, i), 0n) - (weights[i] ?? 0n));
    const donors = errors.flatMap((e, i) => (e > 0n ? [i] : []));
    const takers = errors.flatMap((e, i) => (e < 0n ? [i] : []));
    for (const donor of donors) {
      while ((errors[donor] ?? 0n) > 0n && takers.length > 0) {
        const taker = takers[0] ?? 0;
        let moved = false;
        for (const n of cashNames) {
          if (cell(n, donor) > 0n) {
            allocated[n][donor] = cell(n, donor) - 1n;
            allocated[n][taker] = cell(n, taker) + 1n;
            errors[donor] = (errors[donor] ?? 0n) - 1n;
            errors[taker] = (errors[taker] ?? 0n) + 1n;
            moved = true;
            break;
          }
        }
        if (errors[taker] === 0n) takers.shift();
        if (!moved) break;
      }
    }
  }

  const out = new Map<string, AmitSplit>();
  order.forEach((e, i) => {
    const split = {} as AmitSplit;
    for (const n of AMIT_ALL) split[n] = fromCents(cell(n, i));
    out.set(e.investorId, split);
  });
  return out;
}

/** What rounding each member's share on its own gives: every column still
    adds up, but members' characters stop adding back to their own cash. */
export function naiveAmit(
  total: Dec,
  pool: AmitSplit,
  ents: ReadonlyArray<Pick<Entitlement, "investorId" | "gross">>
): Map<string, AmitSplit> {
  const out = new Map<string, AmitSplit>();
  for (const e of ents) {
    const split = {} as AmitSplit;
    for (const n of AMIT_ALL) split[n] = div(mul(pool[n], e.gross), total, 2);
    out.set(e.investorId, split);
  }
  return out;
}

export function cashTotal(split: AmitSplit): Dec {
  return sum(AMIT_CASH.map(([n]) => split[n]));
}

/* ── The ABA payment file ───────────────────────────────────────────────── */

export const ABA_RECORD_LENGTH = 120;
/** Synthetic institution mnemonic; production writes the paying bank's. */
const ABA_BANK = "BNK";

function abaField(value: string, width: number, numeric = false): string {
  const text = (numeric ? value.replace(/\D/g, "") : value).slice(0, width);
  return numeric ? text.padStart(width, "0") : text.padEnd(width, " ");
}

const abaCents = (amount: Dec) => quantize(mul(amount, dec("100")), 0).u.toString();

function ddmmyy(iso: Iso): string {
  return `${iso.slice(8, 10)}${iso.slice(5, 7)}${iso.slice(2, 4)}`;
}

/** _distribution_bank_defect, shared by the election register and the file. */
export function bankDefect(inv: Investor | undefined): string | null {
  if (inv === undefined || inv.bsb.replace(/\D/g, "").length !== 6) return "no BSB on file";
  if (inv.account.trim().length === 0) return "no account number on file";
  return null;
}

/** distribution_payment_file: the cash half only, fixed 120-character
    records, asserted on generation because a bank rejects the whole file on
    one malformed record. A holder with missing bank details is warned, not
    fatal: the rest of the file still goes. */
export function paymentFile(state: FundState): { lines: string[]; warnings: string[]; total: Dec } {
  const dist = state.distribution;
  const warnings: string[] = [];
  const details: string[] = [];
  let total = ZERO;
  const ents = [...dist.entitlements].sort((a, b) => a.investorId.localeCompare(b.investorId));
  for (const ent of ents) {
    if (ent.choice !== "paid" || !isPos(ent.gross)) continue;
    const inv = state.investors.find((i) => i.id === ent.investorId);
    const defect = bankDefect(inv);
    if (defect !== null || inv === undefined) {
      warnings.push(`${ent.investorId}: ${usd(ent.gross)} omitted: ${defect ?? "no BSB on file"}.`);
      continue;
    }
    const digits = inv.bsb.replace(/\D/g, "");
    total = add(total, ent.gross);
    details.push(
      "1" +
        `${digits.slice(0, 3)}-${digits.slice(3)}` +
        abaField(inv.account.trim(), 9) +
        " " + // withholding indicator
        "50" + // transaction code: credit
        abaField(abaCents(ent.gross), 10, true) +
        abaField(inv.accountName.trim(), 32) +
        abaField(dist.id, 18) +
        abaField("", 7, true) + // trace BSB
        abaField("", 9) + // trace account
        abaField(state.fundName.slice(0, 16), 16) +
        abaField("", 8, true) // withholding tax
    );
  }
  const header =
    "0" +
    abaField("", 17) +
    "01" +
    abaField(ABA_BANK, 3) +
    abaField("", 7) +
    abaField(state.fundName.slice(0, 26), 26) +
    abaField("", 6, true) +
    abaField(`DIST ${ddmmyy(dist.periodStart)}`, 12) +
    abaField(ddmmyy(dist.paymentDate), 6) +
    abaField("", 40);
  const trailer =
    "7" +
    "999-999" +
    abaField("", 12) +
    abaField(abaCents(total), 10, true) + // net
    abaField(abaCents(total), 10, true) + // credit
    abaField("0", 10, true) + // debit
    abaField("", 24) +
    abaField(String(details.length), 6, true) +
    abaField("", 40);
  const lines = [header, ...details, trailer];
  const bad = lines.flatMap((l, i) => (l.length !== ABA_RECORD_LENGTH ? [i] : []));
  if (bad.length > 0) {
    throw new Error(`ABA record(s) ${bad.join(", ")} are not ${ABA_RECORD_LENGTH} characters.`);
  }
  return { lines, warnings, total };
}

/* ── Actions ────────────────────────────────────────────────────────────── */

export type RewriteTarget = "strike" | "settled" | "journal" | "audit" | "raw-settle" | "line" | "entitlement";

export type Action =
  | { type: "declare" }
  | { type: "set_mark"; ticker: string; price: string }
  | { type: "publish" }
  | { type: "record_wholesale"; investorId: string }
  | { type: "attach_form"; txnId: string }
  | { type: "settle"; txnId: string }
  | { type: "pay" }
  | { type: "characterise"; pool: AmitSplit }
  | { type: "rewrite"; target: RewriteTarget };

export type Outcome =
  | { ok: true; state: FundState; message: string }
  | { ok: false; message: string; trigger: boolean };

const done = (state: FundState, message: string): Outcome => ({ ok: true, state, message });
const refuse = (message: string): Outcome => ({ ok: false, message, trigger: false });

/** Runs an action to completion or not at all: a refusal returns no state,
    and a trigger abort anywhere inside unwinds the whole action. */
export function run(state: FundState, action: Action): Outcome {
  try {
    return apply(state, action);
  } catch (err) {
    if (err instanceof TriggerAbort) return { ok: false, message: err.message, trigger: true };
    return refuse(err instanceof Error ? err.message : String(err));
  }
}

function apply(state: FundState, action: Action): Outcome {
  switch (action.type) {
    case "declare":
      return declareDistribution(state);
    case "set_mark":
      return setMark(state, action.ticker, action.price);
    case "publish":
      return publishManualPrice(state);
    case "record_wholesale":
      return recordWholesale(state, action.investorId);
    case "attach_form":
      return attachSignedForm(state, action.txnId);
    case "settle":
      return settleTransaction(state, action.txnId);
    case "pay":
      return payDistribution(state);
    case "characterise":
      return characteriseDistribution(state, action.pool);
    case "rewrite":
      return rewrite(state, action.target);
  }
}

/** declare_distribution: bind a Draft by booking the payable, so s.9.2's
    price reduction falls out of the next strike. Refused behind a price
    already struck on or after the ex-date. */
function declareDistribution(state: FundState): Outcome {
  const dist = state.distribution;
  if (dist.status !== "Draft") {
    return refuse(`${dist.id} is ${dist.status}, not Draft. Only a Draft can be declared.`);
  }
  const strikeAfter = byDate(state.strikes).find((s) => s.date >= dist.exDate);
  if (strikeAfter !== undefined) {
    return refuse(
      `${dist.id} cannot be declared with an ex-date of ${dist.exDate}: a unit price is already ` +
        `published for ${strikeAfter.date}, which is on or after it. That price was struck without ` +
        `this distribution as a liability and is immutable (FSC 17), so declaring now would leave a ` +
        `published price the Policy says should have been lower (s.9.2). Move the ex-date after ` +
        `${strikeAfter.date}, or correct the strike through the Pricing Error Register.`
    );
  }
  const journals = postJournal(
    state.journals,
    dist.exDate,
    {
      event: "Distribution declared",
      ref: dist.id,
      description: `Distribution ${dist.id} declared for ${dist.periodStart} to ${dist.periodEnd} (${usd(dist.amount)})`,
    },
    [
      ["3300", dist.amount, ZERO],
      ["2500", ZERO, dist.amount],
    ]
  );
  let next: FundState = { ...state, journals, distribution: { ...dist, status: "Declared" } };
  next = writeAudit(
    next,
    "distributions",
    dist.id,
    "STATUS_CHANGE",
    `Declared: ${usd(dist.amount)} payable, ${f8(dist.centsPerUnit)}/unit. The NAV unit price is ` +
      `reduced by this from ${dist.exDate} (Policy s.9.2).`
  );
  return done(next, `Declared. ${usd(dist.amount)} is now a liability of every valuation from ${dist.exDate}.`);
}

function setMark(state: FundState, ticker: string, text: string): Outcome {
  const cleaned = text.trim();
  if (!/^\d{1,5}(\.\d{1,6})?$/.test(cleaned)) {
    return refuse("Enter the mark as a price, up to six decimal places.");
  }
  const price = dec(cleaned);
  if (!isPos(price)) return refuse("A zero price is not a price.");
  const valuation = updateValuationLine(state.valuation, ticker, price);
  const next = writeAudit(
    { ...state, valuation },
    "manual_valuation_lines",
    `${state.valuation.date} ${ticker}`,
    "UPDATE",
    `Mark entered: ${money(price, 4)} (draft valuation, not yet struck).`
  );
  return done(next, `${ticker} marked at ${money(price, 4)}.`);
}

/** publish_manual_price: strike the valuation as an immutable price, with
    units on issue AS AT the valuation date and the declared payable already
    netted out of NAV. */
function publishManualPrice(state: FundState): Outcome {
  const v = state.valuation;
  if (v.published) return done(state, `The ${v.date} price is already published.`);
  const blocked = unpricedValuationReason(v);
  if (blocked !== null) return refuse(`Cannot publish: ${blocked}`);
  const snap = draftSnapshot(state);
  if (snap === null) return refuse(`Cannot publish: the fund has no units on issue as at ${v.date}.`);
  if (!isPos(snap.nav)) return refuse("Cannot publish: NAV is not positive (check the valuation inputs).");
  if (!isPos(snap.navUnitPrice)) return refuse("Cannot publish: the unit price rounds to zero.");
  let next: FundState = {
    ...state,
    strikes: [...state.strikes, { date: v.date, ...snap }],
    valuation: { ...v, published: true },
  };
  next = writeAudit(next, "unit_price_history", v.date, "PRICE_STRIKE", `Manual price published as at ${v.date}.`);
  return done(next, `Published and immutable: ${price4(snap.navUnitPrice)} as at ${v.date}.`);
}

function recordWholesale(state: FundState, investorId: string): Outcome {
  const inv = state.investors.find((i) => i.id === investorId);
  if (inv === undefined) return refuse(`Investor ${investorId} does not belong to this fund.`);
  if (inv.wholesaleVerified) return done(state, `${inv.name} is already verified as wholesale.`);
  const reference = `WSC-${investorId.slice(3)}-2026`;
  let next: FundState = {
    ...state,
    investors: state.investors.map((i) =>
      i.id === investorId ? { ...i, wholesaleVerified: true, wholesaleEvidence: reference } : i
    ),
  };
  next = writeAudit(
    next,
    "investors",
    investorId,
    "UPDATE",
    `Wholesale status verified (s.761GA): accountant's certificate on file, ref ${reference}.`
  );
  return done(next, `Wholesale evidence recorded for ${inv.name} (ref ${reference}).`);
}

function attachSignedForm(state: FundState, txnId: string): Outcome {
  const txn = state.txns.find((t) => t.id === txnId);
  if (txn === undefined) return refuse(`Transaction ${txnId} does not belong to this fund.`);
  if (txn.signedForm) return done(state, "The signed form is already on file.");
  let next: FundState = { ...state, txns: updateTxn(state, txnId, { signedForm: true }) };
  next = writeAudit(next, "application_documents", txnId, "INSERT", "Signed application form filed (PDF, hash recorded).");
  return done(next, `Signed form filed against ${txnId}.`);
}

/** settle_transaction: the production gate order (status, then AML/KYC and
    wholesale evidence, then the signed form, then a price), and the price
    bound in the same compare-and-swap that flips the status. */
function settleTransaction(state: FundState, txnId: string): Outcome {
  const txn = state.txns.find((t) => t.id === txnId);
  if (txn === undefined) return refuse(`Transaction ${txnId} does not belong to this fund.`);
  if (txn.status !== "Pending") {
    return refuse(`Transaction ${txnId} cannot be settled. Current status: ${txn.status}.`);
  }
  const inv = state.investors.find((i) => i.id === txn.investorId);
  if (
    inv === undefined ||
    !inv.amlVerified ||
    inv.amlEvidence.trim() === "" ||
    !inv.wholesaleVerified ||
    inv.wholesaleEvidence.trim() === ""
  ) {
    return refuse("AML/KYC and wholesale eligibility evidence must be verified before settlement.");
  }
  if (!txn.signedForm) {
    return refuse(
      `Transaction ${txnId} cannot be settled. Upload the investor's signed application form first ` +
        `(use the Settle button to attach it).`
    );
  }
  const quote = settlementQuote(state, txn);
  const unpriced = unpricedSettlementReason(txn, quote);
  if (unpriced !== null) return refuse(unpriced);
  if (quote === null) return refuse(`Transaction ${txnId} has no strike to settle against.`);

  const txns = updateTxn(state, txnId, {
    status: "Settled",
    pricingDate: quote.pricingDate,
    unitPrice: quote.unitPrice,
    navUnitPrice: quote.navUnitPrice,
    units: quote.units,
  });
  const journals = postJournal(
    state.journals,
    state.businessDate,
    {
      event: "Units allotted",
      ref: txnId,
      description: `Application ${txnId} allotted: ${usd(txn.amount)} → ${f4(quote.units)} units @ ${price4(quote.unitPrice)}`,
    },
    [
      ["2100", txn.amount, ZERO],
      ["3000", ZERO, txn.amount],
    ]
  );
  const next = writeAudit(
    { ...state, txns, journals },
    "transactions",
    txnId,
    "STATUS_CHANGE",
    `Settled, priced at the ${quote.pricingDate} strike (forward pricing, Policy s.5.2): captured ` +
      `unpriced on ${txn.receivedDate}, allotted ${f4(quote.units)} units @ ${price4(quote.unitPrice)}`
  );
  return done(next, `Settled: ${f4(quote.units)} units @ ${price4(quote.unitPrice)}, the ${quote.pricingDate} strike.`);
}

/** pay_distribution: reinvest at the first strike on or after the ex-date
    (the resolver intake uses, so the paths cannot drift), pay the rest, and
    clear the payable in one balanced journal. */
function payDistribution(state: FundState): Outcome {
  const dist = state.distribution;
  if (dist.status !== "Declared") {
    return refuse(`${dist.id} is ${dist.status}. Only a Declared distribution can be paid.`);
  }
  const reinvesting = dist.entitlements.filter((e) => e.choice === "reinvest" && isPos(e.gross));
  const strike = reinvesting.length > 0 ? strikeForReceipt(state.strikes, dist.exDate) : null;
  if (reinvesting.length > 0 && strike === null) {
    return refuse(
      `${dist.id} cannot be paid yet: ${reinvesting.length} entitlement(s) are set to reinvest, and no ` +
        `unit price has been published for a valuation date on or after the ex-date (${dist.exDate}). ` +
        `Publish that valuation first: reinvested units must be issued at the post-distribution price ` +
        `(Policy s.9.2).`
    );
  }

  let txns = [...state.txns];
  let nextId = txns.reduce((m, t) => Math.max(m, Number(t.id.slice(3))), 0);
  let cash = ZERO;
  let reinvested = ZERO;
  const auditNotes: Array<[string, string]> = [];
  const entitlements = dist.entitlements.map((e) => {
    if (!isPos(e.gross)) return { ...e, paidAmount: ZERO };
    if (e.choice === "reinvest" && strike !== null) {
      const units = div(e.gross, strike.applicationPrice, 4);
      nextId += 1;
      const id = `TXN${String(nextId).padStart(6, "0")}`;
      // Born Settled, so its id is fixed before the insert: the terminal
      // trigger would refuse the rename the Pending intake path relies on.
      txns = [
        ...txns,
        {
          id,
          investorId: e.investorId,
          status: "Settled",
          amount: e.gross,
          receivedDate: dist.exDate,
          pricingDate: strike.date,
          unitPrice: strike.applicationPrice,
          navUnitPrice: strike.navUnitPrice,
          units,
          signedForm: true,
          reinvestmentOf: dist.id,
        },
      ];
      reinvested = add(reinvested, e.gross);
      auditNotes.push([id, `Reinvested ${f4(units)} units @ ${price4(strike.applicationPrice)} from ${dist.id}.`]);
      return { ...e, reinvestedUnits: units, reinvestPrice: strike.applicationPrice, reinvestTxnId: id };
    }
    cash = add(cash, e.gross);
    return { ...e, paidAmount: e.gross };
  });

  const lines: Array<[AccountCode, Dec, Dec]> = [["2500", dist.amount, ZERO]];
  if (isPos(cash)) lines.push(["1000", ZERO, cash]);
  if (isPos(reinvested)) lines.push(["3000", ZERO, reinvested]);
  const journals = postJournal(
    state.journals,
    dist.paymentDate,
    {
      event: "Distribution paid",
      ref: dist.id,
      description: `Distribution ${dist.id} paid: ${usd(cash)} cash, ${usd(reinvested)} reinvested`,
    },
    lines
  );

  let next: FundState = { ...state, txns, journals, distribution: { ...dist, entitlements, status: "Paid" } };
  for (const [id, note] of auditNotes) next = writeAudit(next, "transactions", id, "INSERT", note);
  const paidCount = entitlements.filter((e) => e.choice === "paid").length;
  next = writeAudit(
    next,
    "distributions",
    dist.id,
    "STATUS_CHANGE",
    `Paid: ${usd(cash)} cash to ${paidCount} holder(s), ${usd(reinvested)} reinvested for ` +
      `${reinvesting.length}${strike !== null ? ` at the ${strike.date} strike` : ""}.`
  );
  return done(next, `Paid: ${usd(cash)} cash, ${usd(reinvested)} reinvested at ${strike !== null ? price4(strike.applicationPrice) : "no price"}.`);
}

/** characterise_distribution: record the AMIT characters and attribute them.
    Allowed after payment, because managers report the tax breakdown in
    arrears; the cash-bearing characters must total the amount distributed. */
function characteriseDistribution(state: FundState, pool: AmitSplit): Outcome {
  const dist = state.distribution;
  if (dist.status === "Draft") return refuse(`${dist.id} is a Draft. Declare it before recording its characters.`);
  const cash = cashTotal(pool);
  if (cmp(cash, dist.amount) !== 0) {
    return refuse(
      `The AMIT components total ${usd(cash)}, which does not equal the ${usd(dist.amount)} being ` +
        `distributed (out by ${usd(sub(cash, dist.amount))}).`
    );
  }
  const split = attributeAmit(dist.amount, pool, dist.entitlements);
  let d: Distribution = { ...dist, amit: pool };
  for (const e of dist.entitlements) d = updateEntitlement(d, e.investorId, { amit: split.get(e.investorId) ?? null });
  const next = writeAudit(
    { ...state, distribution: d },
    "distributions",
    dist.id,
    "UPDATE",
    `AMIT characters recorded and attributed to ${dist.entitlements.length} members.`
  );
  return done(next, `Attributed across ${dist.entitlements.length} members; every character and every member reconciles.`);
}

/** The panel that tries to rewrite history, one raw write per target. Each
    goes through the same store helpers every action uses. */
function rewrite(state: FundState, target: RewriteTarget): Outcome {
  switch (target) {
    case "strike":
      return rewriteAppendOnly("unit_price_history", "UPDATE");
    case "journal":
      return rewriteAppendOnly("journal_entries", "DELETE");
    case "audit":
      return rewriteAppendOnly("audit_log", "UPDATE");
    case "settled": {
      const settled = state.txns.find((t) => t.status === "Settled");
      if (settled === undefined) return refuse("No settled transaction to try.");
      updateTxn(state, settled.id, { amount: dec("1") });
      return refuse("unreachable");
    }
    case "raw-settle": {
      const unverified = state.txns.find((t) => {
        const inv = state.investors.find((i) => i.id === t.investorId);
        return t.status === "Pending" && inv !== undefined && !inv.wholesaleVerified;
      });
      if (unverified === undefined) return refuse("No unverified application left to force.");
      updateTxn(state, unverified.id, { status: "Settled" });
      return refuse("unreachable");
    }
    case "line": {
      const first = state.valuation.lines[0];
      if (first === undefined) return refuse("No valuation line to try.");
      updateValuationLine(state.valuation, first.ticker, dec("1"));
      return refuse(`The ${state.valuation.date} valuation is still a draft, so its lines are editable.`);
    }
    case "entitlement": {
      const first = state.distribution.entitlements[0];
      if (first === undefined) return refuse("No entitlement to try.");
      updateEntitlement(state.distribution, first.investorId, { gross: dec("1") });
      return refuse(`${state.distribution.id} is not paid yet, so its entitlements are still a working set.`);
    }
  }
}
