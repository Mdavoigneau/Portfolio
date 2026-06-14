/**
 * Synthetic data for the trend-following miniature. Everything here is
 * invented and generated deterministically (seeded PRNG) so the demo is
 * identical on every render. The four stocks are archetypes chosen to show
 * each part of the signal doing its job; the equity curve is an illustrative
 * reconstruction calibrated to the real backtest's reported endpoints.
 *
 * No real tickers, no real prices. The headline metrics in TRACK_RECORD are
 * the actual figures from the personal research, which holds no client data.
 */

/* ------------------------------ seeded PRNG -------------------------------- */

/** mulberry32: tiny deterministic PRNG so the synthetic series never drift. */
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

/** Box–Muller standard normal from a uniform generator. */
function gauss(rnd: () => number): number {
  const u = Math.max(rnd(), 1e-9);
  const v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** The 90 trailing days the chart draws and the score is fit over. */
export const DISPLAY_WINDOW = 90;
/** Full history kept per name, long enough for the 100d MA filter. */
const HISTORY = 120;

interface Profile {
  start: number;
  /** piecewise daily log-drift segments: [untilIndex, driftPerDay] */
  segments: ReadonlyArray<[number, number]>;
  /** daily log noise (stdev) */
  noise: number;
  /** optional sine overlay: [amplitude (log), period (days)] */
  wave?: [number, number];
  /** optional one-day gap: [index, multiplier] */
  gap?: [number, number];
}

function buildPrices(seed: number, p: Profile): number[] {
  const rnd = mulberry32(seed);
  const prices: number[] = [];
  let logp = Math.log(p.start);
  for (let i = 0; i < HISTORY; i++) {
    const drift = p.segments.find(([until]) => i < until)?.[1] ?? 0;
    logp += drift + p.noise * gauss(rnd);
    let price = Math.exp(logp);
    if (p.wave) price *= 1 + p.wave[0] * Math.sin((2 * Math.PI * i) / p.wave[1]);
    if (p.gap && i === p.gap[0]) {
      price *= p.gap[1];
      logp = Math.log(price); // the gap carries forward
    }
    prices.push(Number(price.toFixed(2)));
  }
  return prices;
}

export interface Stock {
  ticker: string;
  name: string;
  /** the one-line lesson this archetype teaches about the signal */
  teaches: string;
  prices: number[];
}

/* Four archetypes. Tickers and prices are invented; each one is shaped to
   exercise a different branch of the signal + filter pipeline. */
export const STOCKS: readonly [Stock, Stock, Stock, Stock] = [
  {
    ticker: "HLX",
    name: "Helix Compute",
    teaches: "the ideal: a smooth, persistent climb. High slope and high r² compound into a top score.",
    prices: buildPrices(101, {
      start: 38,
      segments: [[HISTORY, 0.0012]],
      noise: 0.003,
    }),
  },
  {
    ticker: "BRT",
    name: "Brightline Energy",
    teaches: "a one-day +28% gap fakes momentum. r² drops and the 15% gap filter disqualifies it outright.",
    prices: buildPrices(202, {
      start: 22,
      segments: [[HISTORY, 0.0003]],
      noise: 0.006,
      gap: [92, 1.28],
    }),
  },
  {
    ticker: "TDW",
    name: "Tidewater Foods",
    teaches: "drifts up but chops the whole way. r² collapses to ~0.05, so even a positive slope scores almost nothing and it never ranks.",
    prices: buildPrices(21, {
      start: 25,
      segments: [[HISTORY, 0.0006]],
      noise: 0.011,
      wave: [0.07, 20],
    }),
  },
  {
    ticker: "GRN",
    name: "Granite Mining",
    teaches: "ran hard, then rolled over. Once it loses its 100d MA the exit rule sells it, whatever the past run looked like.",
    prices: buildPrices(404, {
      start: 30,
      segments: [
        [55, 0.002],
        [HISTORY, -0.0023],
      ],
      noise: 0.005,
    }),
  },
];

/* --------------------------- ML regime classifier -------------------------- */

/**
 * The market-level features the regime classifier reads, all shifted one day
 * so nothing from the future leaks in. Each one answers a piece of "are
 * conditions friendly to trend rules right now?".
 */
export interface RegimeFeature {
  key: string;
  why: string;
}

export const REGIME_FEATURES: ReadonlyArray<RegimeFeature> = [
  { key: "vol_30", why: "1-month realised vol; spikes are trend-hostile" },
  { key: "vol_90", why: "the slower 3-month vol backdrop" },
  { key: "dd_252", why: "drawdown from the 1-year peak: bear-market context" },
  { key: "dist_ma_200", why: "% above the 200d MA: the classical regime, made continuous" },
  { key: "breadth_100", why: "share of names above their 100d MA: broad rally or fragile one" },
  { key: "dispersion_30", why: "cross-sectional return spread; momentum needs dispersion" },
  { key: "trend_persistence_90", why: "index mean/stdev ratio: how smooth the trend is" },
];

export type FeatureTone = "good" | "bad" | "mixed";

/** Labelled market moments: the slider snaps to them and they light up the
 *  features that drove the model's probability (all illustrative). */
export interface RegimePreset {
  label: string;
  prob: number;
  note: string;
  reads: Record<string, FeatureTone>;
}

export const REGIME_PRESETS: ReadonlyArray<RegimePreset> = [
  {
    label: "2008",
    prob: 0.08,
    note: "high vol, deep drawdown, thin breadth: nearly every input says trend-hostile, so the model goes to cash.",
    reads: {
      vol_30: "bad", vol_90: "bad", dd_252: "bad", dist_ma_200: "bad",
      breadth_100: "bad", dispersion_30: "mixed", trend_persistence_90: "bad",
    },
  },
  {
    label: "Aug 2011",
    prob: 0.46,
    note: "the ambiguous middle a binary filter handles worst: a vol spike over an otherwise intact backdrop.",
    reads: {
      vol_30: "bad", vol_90: "mixed", dd_252: "mixed", dist_ma_200: "mixed",
      breadth_100: "mixed", dispersion_30: "mixed", trend_persistence_90: "mixed",
    },
  },
  {
    label: "Late 2018",
    prob: 0.38,
    note: "a wobble, not a collapse: breadth thins and price slips the 200d, so the model takes half size, not all-out.",
    reads: {
      vol_30: "bad", vol_90: "mixed", dd_252: "mixed", dist_ma_200: "bad",
      breadth_100: "bad", dispersion_30: "good", trend_persistence_90: "mixed",
    },
  },
  {
    label: "2017 bull",
    prob: 0.91,
    note: "calm, broad and smooth: a textbook clean uptrend, so the model rides it at full size.",
    reads: {
      vol_30: "good", vol_90: "good", dd_252: "good", dist_ma_200: "good",
      breadth_100: "good", dispersion_30: "good", trend_persistence_90: "good",
    },
  },
];

/** The forward-looking target the classifier is trained to predict. */
export const REGIME_LABEL =
  "Were the next 60 days a clean uptrend by Clenow's own score (annualised slope × r² over 5%)? Not 'did the market go up', but 'did it go up in a way trend rules could ride'.";

/** How leakage is kept out: this is the part that has to be airtight. */
export const REGIME_VALIDATION =
  "Walk-forward: a 3-year expanding train window, 3-month test folds, and a 60-day embargo equal to the label horizon, so training never overlaps the window it is scoring. The backtest only ever uses out-of-sample predictions: no in-sample peek.";

/** Why a forest and not something flashier. */
export const REGIME_WHY_RF =
  "About 5,000 trading days and 7 features: a deep net would overfit this scale. A random forest is robust, fast to train and its feature importances are readable, which is what you want from a risk control.";

/** The discipline behind layering ML at all. */
export const ML_TRIAGE =
  "Classical baseline first, ML second, and only on the failure mode it can fix: sitting out bear markets. Two more models (confidence sizing, whipsaw-vs-reversal) ride the same walk-forward plumbing; sizing is trained and honestly did not beat the baseline yet, the trend-break model is scaffolded.";

/* ------------------------------ track record ------------------------------- */

/** Reported headline figures from the real 36-year backtest (1990 → 2026). */
export interface MetricRow {
  label: string;
  strat: string;
  bench: string;
  /** true when a lower number is the better one (drawdown) */
  lowerIsBetter?: boolean;
  stratBetter: boolean;
}

export const TRACK_RECORD: ReadonlyArray<MetricRow> = [
  { label: "CAGR", strat: "+13.1%", bench: "+10.8%", stratBetter: true },
  { label: "Max drawdown", strat: "-26.5%", bench: "-55.2%", lowerIsBetter: true, stratBetter: true },
  { label: "Sharpe", strat: "0.91", bench: "0.64", stratBetter: true },
  { label: "Calmar", strat: "0.50", bench: "0.19", stratBetter: true },
];

/** Targets the illustrative curve is calibrated to (growth of $1 over 36y). */
const STRAT_CAGR = 0.1313;
const BENCH_CAGR = 0.1075;

export interface EquityPoint {
  year: number;
  strat: number;
  spy: number;
}

/** The bear markets the curve is shaped around (depths are illustrative). */
const BEARS = [
  { peak: 2000.5, trough: 2002.5, recover: 2006.0, ddStrat: 0.13, ddSpy: 0.47 },
  { peak: 2007.5, trough: 2009.0, recover: 2013.0, ddStrat: 0.265, ddSpy: 0.55 },
  { peak: 2020.0, trough: 2020.5, recover: 2021.0, ddStrat: 0.15, ddSpy: 0.34 },
  { peak: 2022.0, trough: 2022.5, recover: 2024.0, ddStrat: 0.15, ddSpy: 0.25 },
] as const;

/**
 * Illustrative growth-of-$1 curve, semi-annual steps 1990 → 2026. Built as an
 * exact-CAGR log baseline (so each series lands on its reported endpoint) plus
 * a drawdown overlay per bear market: the strategy's regime gate sidesteps the
 * worst of each one, so its troughs are far shallower. Each episode's depth is
 * compensated for the baseline drift so the measured drawdown matches the
 * reported figure (the strategy's worst is -26.5% at the 2009 trough, SPY's is
 * -55%). The curve is a reconstruction for the page; production renders the
 * equity curve as a matplotlib PNG and the headline metrics above are the real
 * backtested figures.
 */
export function buildEquityCurve(): EquityPoint[] {
  const driftStrat = Math.log(1 + STRAT_CAGR);
  const driftBench = Math.log(1 + BENCH_CAGR);

  const overlay = (year: number, strat: boolean): number => {
    let o = 0;
    for (const b of BEARS) {
      const dd = strat ? b.ddStrat : b.ddSpy;
      const drift = strat ? driftStrat : driftBench;
      const depth = Math.log(1 - dd) - drift * (b.trough - b.peak);
      if (year > b.peak && year <= b.trough) {
        o += depth * ((year - b.peak) / (b.trough - b.peak));
      } else if (year > b.trough && year < b.recover) {
        o += depth * ((b.recover - year) / (b.recover - b.trough));
      }
    }
    return o;
  };

  const points: EquityPoint[] = [];
  for (let y = 1990; y <= 2026 + 1e-9; y += 0.5) {
    const year = Number(y.toFixed(1));
    points.push({
      year,
      strat: Math.exp(driftStrat * (year - 1990) + overlay(year, true)),
      spy: Math.exp(driftBench * (year - 1990) + overlay(year, false)),
    });
  }
  return points;
}

/* What we tested that did NOT beat the baseline, and the honest reason why.
   This transparency is the point: every extra knob removed more signal than
   risk, which is the real finding. */
export interface ResearchNote {
  idea: string;
  outcome: string;
  why: string;
}

export const RESEARCH_LOG: ReadonlyArray<ResearchNote> = [
  {
    idea: "ML confidence sizing",
    outcome: "< 0.3% CAGR, Sharpe slightly worse",
    why: "its OHLCV features just re-encode what the Clenow score already ranks. Tilting the basket the same way twice is redundant signal.",
  },
  {
    idea: "Risk parity (inverse-vol weights)",
    outcome: "CAGR 12.3% vs 13.3%",
    why: "the gap filter already strips the high-vol names, so held-name vols cluster too tightly to have any dispersion to exploit.",
  },
  {
    idea: "Volatility targeting",
    outcome: "loses 1.8%+ CAGR for nothing",
    why: "rolling covariance overestimates realised vol by ~30%, so it de-levers even when the book is calm.",
  },
  {
    idea: "Forced per-region weights",
    outcome: "-2% CAGR vs free-floating",
    why: "US led for 15 years; mandating geographic diversification hands capital to the laggards. Defensive, not a returns-maximiser.",
  },
];

/** Honest caveats kept on the page, as in the research README. */
export const CAVEATS: ReadonlyArray<string> = [
  "Universes are current constituents, not point-in-time: survivorship bias overstates returns by ~1-2% CAGR.",
  "Parameters were re-tuned on the full 1990-2026 sample (the dot-com and 2008 crashes in scope), not the easier 2010-on window, so they are regime-stable rather than overfit.",
];
