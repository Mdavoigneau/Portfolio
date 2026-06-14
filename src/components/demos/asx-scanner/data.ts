/**
 * Synthetic-free, but synthetic-safe: a REAL yfinance daily snapshot of 20 large-cap
 * ASX stocks at the close on 11 Jun 2026. Public market data only, no client information.
 *
 * These are the inputs the production scanner works from (yfinance delayed daily bars).
 * change / changePct / volRatio are DERIVED in logic.ts with the production formulas,
 * rather than stored, so the maths is visible. The live IBKR overlay the real tool adds
 * on top of these is simulated in the demo (a browser cannot hold a market-data line).
 */

export const SNAPSHOT_DATE = "11 Jun 2026";

/** The fields yfinance gives the production scanner per ticker (its fetch_all output,
    minus the derived change/changePct/volRatio, which logic.ts computes). */
export interface BaseQuote {
  ticker: string;
  name: string;
  /** last daily close, AUD */
  price: number;
  /** prior daily close, AUD */
  prevClose: number;
  open: number;
  high: number;
  low: number;
  /** that day's volume, shares */
  volume: number;
  /** trailing ~3-month average daily volume, shares (yfinance, never a live tick) */
  avgVolume: number;
}

export const UNIVERSE: readonly BaseQuote[] = [
  { ticker: "BHP", name: "BHP Group", price: 60.8, prevClose: 60.2, open: 59.14, high: 61.19, low: 59.06, volume: 10371932, avgVolume: 9187397 },
  { ticker: "CBA", name: "Commonwealth Bank", price: 156.42, prevClose: 160.24, open: 158.6, high: 159.09, low: 156.42, volume: 2555692, avgVolume: 2200430 },
  { ticker: "CSL", name: "CSL", price: 107.23, prevClose: 102.95, open: 102.43, high: 108.46, low: 102.15, volume: 2802061, avgVolume: 1710680 },
  { ticker: "NAB", name: "National Australia Bank", price: 35.68, prevClose: 36.33, open: 35.8, high: 36.14, low: 35.64, volume: 4758182, avgVolume: 6175093 },
  { ticker: "WBC", name: "Westpac Banking", price: 34.5, prevClose: 35.41, open: 34.85, high: 35.29, low: 34.5, volume: 5437877, avgVolume: 5402984 },
  { ticker: "ANZ", name: "ANZ Group", price: 33.83, prevClose: 34.56, open: 34.2, high: 34.43, low: 33.83, volume: 4590931, avgVolume: 5001062 },
  { ticker: "MQG", name: "Macquarie Group", price: 235.84, prevClose: 237.47, open: 235.5, high: 236.95, low: 232.01, volume: 757635, avgVolume: 844648 },
  { ticker: "WES", name: "Wesfarmers", price: 84.31, prevClose: 83.39, open: 82.59, high: 84.75, low: 82.45, volume: 2168489, avgVolume: 1580479 },
  { ticker: "FMG", name: "Fortescue", price: 19.6, prevClose: 19.66, open: 19.2, high: 19.6, low: 19.14, volume: 7779278, avgVolume: 5961802 },
  { ticker: "RIO", name: "Rio Tinto", price: 180.0, prevClose: 179.44, open: 177.82, high: 180.73, low: 176.76, volume: 983883, avgVolume: 1308356 },
  { ticker: "WOW", name: "Woolworths Group", price: 38.09, prevClose: 37.63, open: 37.68, high: 38.09, low: 37.63, volume: 2377238, avgVolume: 2531219 },
  { ticker: "TLS", name: "Telstra Group", price: 5.2, prevClose: 5.18, open: 5.2, high: 5.22, low: 5.18, volume: 19543340, avgVolume: 22739012 },
  { ticker: "WDS", name: "Woodside Energy", price: 31.52, prevClose: 31.04, open: 31.41, high: 31.98, low: 31.41, volume: 4158476, avgVolume: 6993116 },
  { ticker: "WTC", name: "WiseTech Global", price: 36.99, prevClose: 38.05, open: 37.12, high: 37.61, low: 36.53, volume: 2077321, avgVolume: 1629471 },
  { ticker: "XRO", name: "Xero", price: 74.07, prevClose: 76.82, open: 74.55, high: 76.07, low: 73.26, volume: 1289004, avgVolume: 891864 },
  { ticker: "JBH", name: "JB Hi-Fi", price: 76.21, prevClose: 76.02, open: 75.6, high: 76.56, low: 74.24, volume: 540898, avgVolume: 519475 },
  { ticker: "COL", name: "Coles Group", price: 24.1, prevClose: 23.73, open: 23.6, high: 24.13, low: 23.6, volume: 4539684, avgVolume: 3370984 },
  { ticker: "GMG", name: "Goodman Group", price: 30.83, prevClose: 31.69, open: 31.39, high: 31.73, low: 30.72, volume: 5556669, avgVolume: 4236508 },
  { ticker: "RMD", name: "ResMed", price: 27.97, prevClose: 28.21, open: 27.69, high: 27.97, low: 27.56, volume: 1706453, avgVolume: 1453943 },
  { ticker: "STO", name: "Santos", price: 8.07, prevClose: 7.91, open: 7.99, high: 8.13, low: 7.99, volume: 10784248, avgVolume: 15513414 },
];
