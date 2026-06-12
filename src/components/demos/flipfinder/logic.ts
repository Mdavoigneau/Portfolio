/**
 * Pure business logic for the Flipfinder miniature. No React imports.
 * Every function mirrors a production behaviour, noted in its comment;
 * the formulas are the production maths, only the data is synthetic.
 */
import {
  GRADES,
  STORAGES,
  type Combo,
  type GradeCode,
  type Selection,
  type Storage,
} from "./data";

/* -------------------------------- regression ------------------------------- */

export interface Regression {
  slope: number;
  intercept: number;
}

/**
 * Production momentum formula: ordinary least squares over (day index, price).
 * slope is EUR per day; null when fewer than 2 points or a zero denominator.
 */
export function regress(ys: ReadonlyArray<number>): Regression | null {
  const n = ys.length;
  if (n < 2) return null;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  ys.forEach((yv, i) => {
    sumX += i;
    sumY += yv;
    sumXY += i * yv;
    sumX2 += i * i;
  });
  const den = n * sumX2 - sumX * sumX;
  if (den === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / den;
  return { slope, intercept: (sumY - slope * sumX) / n };
}

/* --------------------------------- margins --------------------------------- */

export interface MarginInputs {
  /** chosen average sale price, EUR (avg price to win or avg winner price) */
  sale: number;
  /** product buying price, EUR */
  buy: number;
  /** VAT rate, percent */
  vatRate: number;
  /** marketplace cut, percent of the sale price */
  marketplaceCut: number;
  /** shipping cost, EUR */
  shipping: number;
}

export interface MarginResult {
  /** sale price net of the marketplace cut, EUR */
  net: number;
  /** profit per unit, EUR */
  margin: number;
  /** margin as a percent of the net sale price */
  marginPct: number;
}

const netSale = (i: MarginInputs) => i.sale - i.sale * (i.marketplaceCut / 100);
const pctOfNet = (margin: number, net: number) => (net !== 0 ? (margin / net) * 100 : 0);

/**
 * Production "TVA sur la marge" mode: VAT applies to the margin only
 * (net sale minus buying price), the regime for second-hand goods.
 */
export function marginMargeTVA(i: MarginInputs): MarginResult {
  const net = netSale(i);
  const taxableMargin = net - i.buy;
  const vat = taxableMargin * (i.vatRate / 100);
  const margin = taxableMargin - vat - i.shipping;
  return { net, margin, marginPct: pctOfNet(margin, net) };
}

/**
 * Production "TVA classique" mode: VAT applies to the full net sale price.
 * In this business, the difference between the two modes decides profitability.
 */
export function marginClassiqueTVA(i: MarginInputs): MarginResult {
  const net = netSale(i);
  const vat = net * (i.vatRate / 100);
  const margin = net - vat - i.buy - i.shipping;
  return { net, margin, marginPct: pctOfNet(margin, net) };
}

/* -------------------------------- top movers ------------------------------- */

export interface Mover {
  combo: Combo;
  /** yesterday-to-today winner-price change, EUR */
  deltaEur: number;
  /** the same change as a percent of yesterday's winner price */
  deltaPct: number;
}

export interface TopMoversResult {
  gainers: ReadonlyArray<Mover>;
  losers: ReadonlyArray<Mover>;
}

/**
 * Production overview query: the winner-price change between the last two
 * daily closes, computed for every listed configuration, then ranked.
 * Returns the top `count` gainers (largest rise first) and losers
 * (largest fall first).
 */
export function topMovers(universe: ReadonlyArray<Combo>, count = 5): TopMoversResult {
  const movers: Mover[] = [];
  for (const combo of universe) {
    const today = combo.series[combo.series.length - 1];
    const yesterday = combo.series[combo.series.length - 2];
    if (!today || !yesterday || yesterday.winner === 0) continue;
    const deltaEur = today.winner - yesterday.winner;
    movers.push({ combo, deltaEur, deltaPct: (deltaEur / yesterday.winner) * 100 });
  }
  const ranked = [...movers].sort((a, b) => b.deltaEur - a.deltaEur);
  return {
    gainers: ranked.slice(0, count),
    losers: ranked.slice(-count).reverse(),
  };
}

/* ------------------------------- smart filter ------------------------------ */

const DIMENSIONS = ["storage", "grade", "colour"] as const;
type Dimension = (typeof DIMENSIONS)[number];

export interface AvailableOptions {
  storage: ReadonlySet<Storage>;
  grade: ReadonlySet<GradeCode>;
  colour: ReadonlySet<string>;
}

/**
 * Production smart filter: an option in one dimension stays enabled only if
 * at least one listing exists that matches the current selection on the OTHER
 * dimensions. Anything else is disabled, so impossible combinations cannot
 * be picked. Generic over the dimension, exactly like the production check
 * over remaining attribute combinations.
 */
export function availableOptions(
  combos: ReadonlyArray<Combo>,
  selection: Selection
): AvailableOptions {
  const enabledFor = <D extends Dimension>(dim: D): ReadonlySet<Combo[D]> => {
    const others = DIMENSIONS.filter((d) => d !== dim);
    return new Set(
      combos.filter((c) => others.every((d) => c[d] === selection[d])).map((c) => c[dim])
    );
  };
  return {
    storage: enabledFor("storage"),
    grade: enabledFor("grade"),
    colour: enabledFor("colour"),
  };
}

/* ------------------------------- aggregations ------------------------------ */

export function combosFor(universe: ReadonlyArray<Combo>, modelCode: string): Combo[] {
  return universe.filter((c) => c.modelCode === modelCode);
}

export function findCombo(combos: ReadonlyArray<Combo>, s: Selection): Combo | undefined {
  return combos.find(
    (c) => c.storage === s.storage && c.grade === s.grade && c.colour === s.colour
  );
}

export const mean = (vs: ReadonlyArray<number>) =>
  vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0;

export interface BreakdownBar {
  label: string;
  value: number;
}

/**
 * Production breakdown query: average winner price across all of a model's
 * listings and all 30 days, grouped by storage or by grade. Groups keep the
 * production order (storage ascending, grade ladder order); empty groups,
 * combinations with no listings at all, are dropped.
 */
export function avgWinnerBy(
  combos: ReadonlyArray<Combo>,
  dim: "storage" | "grade"
): BreakdownBar[] {
  const groups =
    dim === "storage"
      ? STORAGES.map((s) => ({ label: `${s} GB`, match: (c: Combo) => c.storage === s }))
      : GRADES.map((g) => ({ label: g.label, match: (c: Combo) => c.grade === g.code }));
  return groups
    .map(({ label, match }) => ({
      label,
      value: mean(combos.filter(match).flatMap((c) => c.series.map((p) => p.winner))),
    }))
    .filter((b) => b.value > 0);
}

/* -------------------------------- formatting ------------------------------- */

export const eur = (v: number) => `${v.toFixed(2)} €`;

/** Calculator input clamp: never NaN, never out of range. */
export function toNum(raw: string, min: number, max: number): number {
  const v = Number(raw);
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, v));
}
