/**
 * Pure maths for the trend-following miniature. No React imports.
 * Every function mirrors a production formula from the research system
 * (src/trendfollow/signals.py, strategy.py, metrics.py); only the price
 * data fed in is synthetic. The point of the demo is that the numbers on
 * screen are computed live by these functions, not hard-coded.
 */

/* ------------------------------ regression -------------------------------- */

export interface LinReg {
  /** least-squares slope over (x = 0..n-1, y) */
  slope: number;
  intercept: number;
  /** Pearson correlation of the fit; r² is the goodness-of-fit weight */
  r: number;
}

/**
 * Ordinary least squares of `ys` against the day index 0..n-1, returning
 * slope, intercept and the correlation r. Production fits this over
 * log-prices (scipy.stats.linregress); we do the same in plain TS so the
 * regression line and the score are the demo's own arithmetic.
 */
export function linregress(ys: ReadonlyArray<number>): LinReg | null {
  const n = ys.length;
  if (n < 2) return null;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0,
    sumY2 = 0;
  ys.forEach((y, i) => {
    sumX += i;
    sumY += y;
    sumXY += i * y;
    sumX2 += i * i;
    sumY2 += y * y;
  });
  const den = n * sumX2 - sumX * sumX;
  if (den === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / den;
  const intercept = (sumY - slope * sumX) / n;
  const rDen = Math.sqrt(den * (n * sumY2 - sumY * sumY));
  const r = rDen === 0 ? 0 : (n * sumXY - sumX * sumY) / rDen;
  return { slope, intercept, r };
}

/* ----------------------------- Clenow score -------------------------------- */

/** Trading days per year, the annualisation factor in the score. */
export const TRADING_DAYS = 252;

export interface Score {
  /** the log-price least-squares fit over the score window */
  fit: LinReg;
  /** daily log-price slope b */
  slopePerDay: number;
  /** exp(b · 252) − 1: the implied annualised return of the trend */
  annualised: number;
  /** r², how cleanly price tracks the line (the smoothness weight) */
  r2: number;
  /** Clenow momentum score = annualised × r² */
  score: number;
}

/**
 * Clenow momentum score over the trailing `window` of a price series.
 *
 *     fit  log(price) = a + b · day   (least squares)
 *     score = ( exp(b · 252) − 1 ) × r²
 *
 * Production: signals.annualized_log_slope. Slope alone rewards anything that
 * ran up, including a single straight-line gap; multiplying by r² penalises
 * noisy trends and rewards smooth, persistent ones. That product is the whole
 * idea: ride trends, not gappy lottery tickets.
 */
export function clenowScore(prices: ReadonlyArray<number>, window = 90): Score | null {
  const w = prices.slice(-window);
  const logs = w.map((p) => Math.log(p));
  const fit = linregress(logs);
  if (!fit) return null;
  const annualised = Math.exp(fit.slope * TRADING_DAYS) - 1;
  const r2 = fit.r * fit.r;
  return { fit, slopePerDay: fit.slope, annualised, r2, score: annualised * r2 };
}

/* -------------------------------- filters ---------------------------------- */

/** Simple moving average of the trailing `window` closes. */
export function sma(prices: ReadonlyArray<number>, window: number): number {
  const w = prices.slice(-window);
  return w.reduce((a, b) => a + b, 0) / w.length;
}

/**
 * Hard trend filter (signals.above_ma): a name below its 100-day SMA has a
 * broken trend and is disqualified no matter how good its past regression
 * looks. This is the exit rule doing the work, not the selection rule.
 */
export function aboveMA(prices: ReadonlyArray<number>, window = 100): boolean {
  const last = prices[prices.length - 1];
  if (last === undefined) return false;
  return last > sma(prices, window);
}

/**
 * Largest single-day move over the trailing `window` (signals.max_gap).
 * A move past `threshold` (15%) means an earnings shock or M&A pop: the price
 * violates the smoothness the regression rests on, so the name is un-trade-able
 * for our horizon and gets disqualified.
 */
export function recentMaxGap(prices: ReadonlyArray<number>, window = 90): number {
  const w = prices.slice(-(window + 1));
  let max = 0;
  for (let i = 1; i < w.length; i++) {
    const cur = w[i];
    const prev = w[i - 1];
    if (cur === undefined || prev === undefined || prev === 0) continue;
    const move = Math.abs(cur / prev - 1);
    if (move > max) max = move;
  }
  return max;
}

export const GAP_THRESHOLD = 0.15;

export interface Verdict {
  score: Score;
  aboveMA: boolean;
  maxGap: number;
  gapped: boolean;
  /** passes every filter and so survives into the ranking */
  qualifies: boolean;
  /** the first reason it was disqualified, for the UI */
  reason: "below 100d MA" | ">15% gap in 90d" | null;
}

/** Run the full per-stock pipeline: score, then both hard filters. */
export function evaluate(prices: ReadonlyArray<number>, scoreWindow = 90): Verdict | null {
  const score = clenowScore(prices, scoreWindow);
  if (!score) return null;
  const above = aboveMA(prices, 100);
  const maxGap = recentMaxGap(prices, 90);
  const gapped = maxGap > GAP_THRESHOLD;
  const qualifies = above && !gapped;
  const reason = !above ? "below 100d MA" : gapped ? ">15% gap in 90d" : null;
  return { score, aboveMA: above, maxGap, gapped, qualifies, reason };
}

/* ------------------------------ regime gate -------------------------------- */

/**
 * Map a regime probability ∈ [0,1] to gross exposure (strategy.regime_exposure).
 *
 *     prob ≤ low   → 0   (fully cash)
 *     prob ≥ high  → 1   (fully invested)
 *     in between   → linear
 *
 * The tuned production config uses low=0, high=1, i.e. exposure = the raw
 * probability: it de-risks smoothly through ambiguous regimes instead of the
 * binary on/off of a 200d-MA filter. The rest of the book sits in cash.
 */
export function regimeExposure(prob: number, low = 0, high = 1): number {
  if (high === low) return prob > low ? 1 : 0;
  return Math.min(1, Math.max(0, (prob - low) / (high - low)));
}

/** The binary 200d-MA filter this replaced: cash below the line, full above. */
export function binaryExposure(prob: number): number {
  return prob >= 0.5 ? 1 : 0;
}

/* -------------------------------- metrics ---------------------------------- */

/**
 * Compound annual growth rate over a series of (year, value) points
 * (metrics.cagr): (end / start) ^ (1 / years) − 1.
 */
export function cagr(points: ReadonlyArray<{ year: number; value: number }>): number {
  const a = points[0];
  const b = points[points.length - 1];
  if (!a || !b) return 0;
  const years = b.year - a.year;
  if (years <= 0 || a.value <= 0) return 0;
  return Math.pow(b.value / a.value, 1 / years) - 1;
}

/**
 * Worst peak-to-trough decline of an equity series (metrics.max_drawdown),
 * returned as a negative fraction. This is the number the whole exit-on-break
 * thesis is really arguing about, so it is worth computing exactly.
 */
export function maxDrawdown(values: ReadonlyArray<number>): number {
  let peak = -Infinity;
  let worst = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    const dd = v / peak - 1;
    if (dd < worst) worst = dd;
  }
  return worst;
}

/* ------------------------------- formatting -------------------------------- */

export const pct = (v: number, dp = 1) => `${(v * 100).toFixed(dp)}%`;
export const signedPct = (v: number, dp = 1) => `${v >= 0 ? "+" : ""}${(v * 100).toFixed(dp)}%`;
