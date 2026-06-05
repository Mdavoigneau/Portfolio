/**
 * Synthetic data for the live demos.
 *
 * Everything here is generated or fictional. No client data, holdings, NAVs or
 * identifiers from any real mandate appear on this page, by design. The
 * tickers below are public instruments used purely to make a sample model
 * portfolio read realistically.
 */

/** Deterministic PRNG (mulberry32) so the demos render identically every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number): number {
  // Box–Muller
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface NavPoint {
  /** months since inception */
  t: number;
  label: string;
  /** strategy index, base 100 */
  nav: number;
  /** benchmark index, base 100 */
  bench: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function monthLabel(startYear: number, startMonth: number, i: number): string {
  const m = (startMonth + i) % 12;
  const y = startYear + Math.floor((startMonth + i) / 12);
  return `${MONTHS[m]} '${String(y).slice(2)}`;
}

/**
 * A plausible long-horizon NAV curve with a trend-following profile: the
 * benchmark is the market; the strategy tracks it with a little alpha and,
 * crucially, de-risks through bear regimes, so it compounds ahead of the
 * benchmark with materially shallower drawdowns. (Mirrors the real
 * trend-following research project: better CAGR, far better max drawdown.)
 */
export function buildNavSeries(): NavPoint[] {
  const rng = mulberry32(2026);
  const n = 84; // 7 years monthly, ending current
  const out: NavPoint[] = [];
  let nav = 100;
  let bench = 100;

  const inBear = (i: number) => (i >= 19 && i <= 23) || (i >= 55 && i <= 60);

  for (let i = 0; i < n; i++) {
    const bear = inBear(i);
    // The market (benchmark): modest drift normally, sharp losses in bears.
    const marketRet = bear
      ? -0.052 + gaussian(rng) * 0.032
      : 0.0102 + gaussian(rng) * 0.025;

    // The strategy: +alpha, beta ~0.9 normally but cut to ~0.45 in bears
    // (the trend filter pulls exposure down before the worst of it).
    const alpha = 0.0022;
    const beta = bear ? 0.45 : 0.9;
    const stratRet = alpha + beta * marketRet;

    nav *= 1 + stratRet;
    bench *= 1 + marketRet;
    out.push({
      t: i,
      label: monthLabel(2019, 6, i),
      nav: Math.round(nav * 100) / 100,
      bench: Math.round(bench * 100) / 100,
    });
  }
  return out;
}

export const NAV_SERIES: NavPoint[] = buildNavSeries();

/** Annualised geometric return from an index series, base 100. */
export function cagr(series: NavPoint[], key: "nav" | "bench"): number {
  const first = series[0]?.[key] ?? 100;
  const last = series[series.length - 1]?.[key] ?? 100;
  const years = (series.length - 1) / 12;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

/** Maximum peak-to-trough drawdown (%, negative). */
export function maxDrawdown(series: NavPoint[], key: "nav" | "bench"): number {
  let peak = -Infinity;
  let mdd = 0;
  for (const p of series) {
    peak = Math.max(peak, p[key]);
    mdd = Math.min(mdd, p[key] / peak - 1);
  }
  return mdd * 100;
}

// ── Sample model portfolio ──────────────────────────────────────────────────

export interface Holding {
  ticker: string;
  name: string;
  sector: string;
  weightPct: number;
  marketValue: number;
  dayChangePct: number;
  /** contribution to portfolio return this period, in % points */
  contribPct: number;
  /** short price trend for the row sparkline */
  spark: number[];
}

function buildSpark(seed: number, up: boolean): number[] {
  const rng = mulberry32(seed);
  const pts: number[] = [];
  let v = 100;
  for (let i = 0; i < 24; i++) {
    v *= 1 + (up ? 0.004 : -0.003) + gaussian(rng) * 0.013;
    pts.push(Math.round(v * 100) / 100);
  }
  return pts;
}

/** A sample multi-asset model portfolio: public instruments, synthetic weights. */
export const HOLDINGS: Holding[] = [
  { ticker: "CBA", name: "Commonwealth Bank", sector: "Financials", weightPct: 9.4, marketValue: 1_184_220, dayChangePct: 0.62, contribPct: 0.058, spark: buildSpark(11, true) },
  { ticker: "BHP", name: "BHP Group", sector: "Materials", weightPct: 8.1, marketValue: 1_020_640, dayChangePct: -1.04, contribPct: -0.084, spark: buildSpark(22, false) },
  { ticker: "CSL", name: "CSL Limited", sector: "Health Care", weightPct: 7.6, marketValue: 957_360, dayChangePct: 1.38, contribPct: 0.105, spark: buildSpark(33, true) },
  { ticker: "NAB", name: "National Australia Bank", sector: "Financials", weightPct: 6.2, marketValue: 781_020, dayChangePct: 0.21, contribPct: 0.013, spark: buildSpark(44, true) },
  { ticker: "MQG", name: "Macquarie Group", sector: "Financials", weightPct: 5.8, marketValue: 730_640, dayChangePct: 2.07, contribPct: 0.120, spark: buildSpark(55, true) },
  { ticker: "WES", name: "Wesfarmers", sector: "Cons. Disc.", weightPct: 5.1, marketValue: 642_540, dayChangePct: -0.33, contribPct: -0.017, spark: buildSpark(66, false) },
  { ticker: "GMG", name: "Goodman Group", sector: "Real Estate", weightPct: 4.7, marketValue: 592_060, dayChangePct: 0.94, contribPct: 0.044, spark: buildSpark(77, true) },
  { ticker: "WDS", name: "Woodside Energy", sector: "Energy", weightPct: 4.2, marketValue: 529_140, dayChangePct: -2.18, contribPct: -0.092, spark: buildSpark(88, false) },
  { ticker: "TLS", name: "Telstra Group", sector: "Comm. Services", weightPct: 3.6, marketValue: 453_480, dayChangePct: 0.08, contribPct: 0.003, spark: buildSpark(99, true) },
  { ticker: "VGS", name: "Vanguard Intl Shares ETF", sector: "Global Equity", weightPct: 12.3, marketValue: 1_549_290, dayChangePct: 0.41, contribPct: 0.050, spark: buildSpark(111, true) },
];

export const PORTFOLIO_TOTAL = HOLDINGS.reduce((s, h) => s + h.marketValue, 0);
