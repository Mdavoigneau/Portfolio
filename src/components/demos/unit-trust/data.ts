/**
 * The synthetic fund the miniature runs on. Everything is invented: the fund,
 * its underlying managers, every investor and every bank detail (BSBs use the
 * unallocated 999- prefix). The shape is production's: a monthly-priced
 * wholesale income fund whose manager marks arrive in arrears.
 *
 * The day is 2026-06-12 (the page's fixed date). The April distribution is a
 * draft, the 2026-05-29 valuation is waiting on one outstanding mark, and four
 * applications sit unpriced: three received in May, one in June.
 */

import { ZERO, dec, div, type Dec } from "./dec";
import {
  AMIT_ALL,
  computeEntitlements,
  usd,
  type AmitSplit,
  type AuditRow,
  type Distribution,
  type FundState,
  type Investor,
  type Journal,
  type Strike,
  type Txn,
} from "./logic";

export const FUND_NAME = "Tallowwood Wholesale Income Fund";
export const BUSINESS_DATE = "2026-06-12";

/** The mark still outstanding in the draft, as the manager reported it. */
export const OUTSTANDING_MARK = { ticker: "KCP", price: "1.1318" } as const;

function investor(
  id: string,
  name: string,
  election: Investor["election"],
  bsb: string,
  account: string,
  accountName = name,
  wholesaleVerified = true
): Investor {
  return {
    id,
    name,
    amlVerified: true,
    amlEvidence: `KYC-${id.slice(3)}`,
    wholesaleVerified,
    wholesaleEvidence: wholesaleVerified ? `WSC-${id.slice(3)}` : "",
    election,
    bsb,
    account,
    accountName,
  };
}

const INVESTORS: Investor[] = [
  investor("INV001", "Carrington Family Trust", "paid", "999-014", "10442871"),
  investor("INV002", "Yarrow Street Pty Ltd", "reinvest", "999-022", "20815530"),
  investor("INV003", "Mistral Holdings Pty Ltd", "paid", "999-031", "31176024"),
  investor("INV004", "E & R Castellano Super Fund", "reinvest", "999-047", "40963318"),
  // No bank details on file: the payment file warns and carries on without them.
  investor("INV005", "Pembury Investments Trust", "paid", "", ""),
  investor("INV006", "Saskia Achterberg", "paid", "999-058", "58201497", "S Achterberg"),
  investor("INV007", "Greyhaven Capital Pty Ltd", "paid", "999-063", "63055712"),
  // Wholesale evidence not yet on file: settlement refuses until it is.
  investor("INV008", "Oduya Family Super Fund", "reinvest", "999-071", "71430986", undefined, false),
  investor("INV009", "Tamsin Holloway", "reinvest", "999-085", "85117263", "T Holloway"),
  investor("INV010", "Birchgrove Endowment Trust", "paid", "999-092", "92678140"),
];

/** A settled application, its units derived the way settlement derives them:
    amount ÷ application price, four places, half-up. */
function settled(id: string, investorId: string, amount: string, pricingDate: string, price: string): Txn {
  const p = dec(price);
  return {
    id,
    investorId,
    status: "Settled",
    amount: dec(amount),
    receivedDate: null,
    pricingDate,
    unitPrice: p,
    navUnitPrice: p,
    units: div(dec(amount), p, 4),
    signedForm: true,
    reinvestmentOf: null,
  };
}

function pending(id: string, investorId: string, amount: string, receivedDate: string, signedForm: boolean): Txn {
  return {
    id,
    investorId,
    status: "Pending",
    amount: dec(amount),
    receivedDate,
    pricingDate: null,
    unitPrice: null,
    navUnitPrice: null,
    units: null,
    signedForm,
    reinvestmentOf: null,
  };
}

const TXNS: Txn[] = [
  settled("TXN000101", "INV001", "2000000.00", "2026-01-30", "1.0000"),
  settled("TXN000102", "INV002", "2400000.00", "2026-01-30", "1.0000"),
  settled("TXN000103", "INV003", "2250000.00", "2026-01-30", "1.0000"),
  settled("TXN000104", "INV004", "1250000.00", "2026-02-27", "1.0046"),
  settled("TXN000105", "INV005", "1600000.00", "2026-02-27", "1.0046"),
  settled("TXN000106", "INV001", "1500000.00", "2026-03-31", "1.0112"),
  settled("TXN000107", "INV006", "820000.00", "2026-03-31", "1.0112"),
  settled("TXN000108", "INV004", "900000.00", "2026-03-31", "1.0112"),
  settled("TXN000109", "INV002", "600000.00", "2026-04-30", "1.0187"),
  pending("TXN000110", "INV007", "250000.00", "2026-05-05", true),
  pending("TXN000111", "INV008", "500000.00", "2026-05-14", true),
  pending("TXN000112", "INV009", "150000.00", "2026-05-27", false),
  pending("TXN000113", "INV010", "300000.00", "2026-06-02", true),
];

/** Published strikes on file, each over the units settled before its date. */
function strike(
  date: string,
  cash: string,
  equities: string,
  nav: string,
  units: string,
  unitPrice: string,
  navUnitPrice: string,
  redemption: string
): Strike {
  const d = (s: string): Dec => dec(s);
  return {
    date,
    totalCash: d(cash),
    totalEquities: d(equities),
    totalAssets: d(nav),
    liabilities: ZERO,
    nav: d(nav),
    unitsOnIssue: d(units),
    unitPrice: d(unitPrice),
    navUnitPrice: d(navUnitPrice),
    applicationPrice: d(navUnitPrice),
    redemptionPrice: d(redemption),
  };
}

const STRIKES: Strike[] = [
  strike("2026-02-27", "412508.33", "6268081.67", "6680590.00", "6650000.0000", "1.004600", "1.0046", "1.0021"),
  strike("2026-03-31", "528316.07", "9064887.80", "9593203.87", "9486950.0299", "1.011200", "1.0112", "1.0087"),
  strike("2026-04-30", "604917.52", "12303320.99", "12908238.51", "12671285.4729", "1.018700", "1.0187", "1.0162"),
];

const DIST_AMOUNT = dec("61250.00");
const ENTITLEMENTS = computeEntitlements(TXNS, INVESTORS, DIST_AMOUNT, "2026-04-30");

const DISTRIBUTION: Distribution = {
  id: "DIS0001",
  periodStart: "2026-04-01",
  periodEnd: "2026-04-30",
  exDate: "2026-05-01",
  recordDate: "2026-04-30",
  paymentDate: "2026-06-15",
  amount: DIST_AMOUNT,
  unitsAtRecord: ENTITLEMENTS.unitsAtRecord,
  centsPerUnit: ENTITLEMENTS.centsPerUnit,
  status: "Draft",
  entitlements: ENTITLEMENTS.rows,
  amit: null,
};

/** The characters the underlying managers' tax statements report for April,
    arriving after the run is paid. The cash-bearing ones total the amount. */
export const APRIL_POOL: AmitSplit = (() => {
  const reported: Partial<Record<string, string>> = {
    interest: "47318.65",
    other_income: "9204.11",
    capital_gains_discounted: "3542.87",
    tax_deferred: "1184.37",
  };
  const pool = {} as AmitSplit;
  for (const name of AMIT_ALL) pool[name] = dec(reported[name] ?? "0.00");
  return pool;
})();

/** Intake already posted these: application money in, pending allotment. */
const JOURNALS: Journal[] = TXNS.filter((t) => t.status === "Pending").map((t, i) => ({
  id: i + 1,
  date: t.receivedDate ?? BUSINESS_DATE,
  event: "Application received",
  ref: t.id,
  description: `Application ${t.id} received, pending allotment (${usd(t.amount)})`,
  lines: [
    { account: "1000", debit: t.amount, credit: ZERO },
    { account: "2100", debit: ZERO, credit: t.amount },
  ],
  broughtForward: true,
}));

const AUDIT: AuditRow[] = TXNS.filter((t) => t.status === "Pending").map((t, i) => ({
  seq: i + 1,
  time: t.receivedDate ?? BUSINESS_DATE,
  table: "transactions",
  record: t.id,
  action: "INSERT",
  by: "operator",
  notes: `Application ${usd(t.amount)}: captured unpriced (received ${t.receivedDate}); units and price assigned at settlement`,
  broughtForward: true,
}));

export const INITIAL_STATE: FundState = {
  fundName: FUND_NAME,
  businessDate: BUSINESS_DATE,
  buySpread: ZERO,
  sellSpread: dec("0.0025"),
  clockMinutes: 11 * 60 + 20,
  strikes: STRIKES,
  valuation: {
    date: "2026-05-29",
    cash: dec("659128.70"),
    published: false,
    lines: [
      { ticker: "HSL", name: "Heathcote Senior Loans Trust", units: dec("3420000"), price: dec("1.0418") },
      { ticker: "MRD", name: "Marram Real Estate Debt Fund", units: dec("2380000"), price: dec("1.0766") },
      { ticker: "TAB", name: "Tidewell Asset-Backed Fund", units: dec("3610000"), price: dec("0.9985") },
      { ticker: "KCP", name: "Kerrison Credit Partners", units: dec("1720000"), price: null },
      { ticker: "BLN", name: "Bellbird Notes 2029", units: dec("12800"), price: dec("100.95") },
    ],
  },
  investors: INVESTORS,
  txns: TXNS,
  distribution: DISTRIBUTION,
  journals: JOURNALS,
  audit: AUDIT,
};
