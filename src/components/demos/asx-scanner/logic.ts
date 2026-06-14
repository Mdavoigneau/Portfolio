/* Pure scanner logic, no React. A faithful port of the production asx_live.py:
   - deriveQuote(): change / changePct / volRatio from a yfinance daily bar (its fetch_all)
   - selectCandidates(): the live-feed pool (top/bottom movers + volume spikes, capped)
   - mergeLive(): overlay an IBKR live tick on a candidate, recompute against live volume
   - buildPayload(): gainers / losers / volume spikes + market breadth
   - marketSession(): the ASX trading session from an AEST clock

   Production scale: a 300-stock universe, top + bottom 50 by %change plus the top 30
   volume movers into the live pool, capped at 90 concurrent IBKR market-data lines. The
   demo runs the identical algorithm over 20 real large caps with the constants scaled down. */

import { UNIVERSE, type BaseQuote } from "./data";

export interface Quote extends BaseQuote {
  /** price - prevClose */
  change: number;
  /** change / prevClose * 100 */
  changePct: number;
  /** volume / avgVolume */
  volRatio: number;
  /** true when an IBKR live tick is backing this row */
  live: boolean;
}

/** Production demo constants (scaled from 300 / 50 / 30 / 90 to a 20-stock basket). */
export const TOP_N = 20; // rows shown per table
export const CANDIDATE_N = 5; // top + bottom N by %change go into the live pool
export const VOLUME_LIVE_N = 4; // plus the top N volume movers
export const MAX_LIVE_TICKERS = 12; // cap on concurrent live subscriptions
export const PROD = { universe: 300, candidateN: 50, volumeN: 30, maxLive: 90 } as const;

const r2 = (v: number) => Math.round(v * 100) / 100;

/** fetch_all(): the delayed yfinance quote, before any live overlay. */
export function deriveQuote(b: BaseQuote): Quote {
  const change = b.price - b.prevClose;
  return {
    ...b,
    change: r2(change),
    changePct: b.prevClose ? r2((change / b.prevClose) * 100) : 0,
    volRatio: b.avgVolume ? r2(b.volume / b.avgVolume) : 0,
    live: false,
  };
}

/** The delayed snapshot every view starts from. */
export const DELAYED: readonly Quote[] = UNIVERSE.map(deriveQuote);

/** A streamed IBKR tick. price/high/low/volume are live; avgVolume never is. */
export interface LiveTick {
  price: number;
  prevClose: number;
  high: number;
  low: number;
  volume: number;
}

/** merge_live(): override the delayed bar with the live tick, recompute change and
    volRatio against the live numbers, keep avgVolume from yfinance, tag the row live. */
export function mergeLive(base: Quote, tick: LiveTick): Quote {
  const prev = tick.prevClose || base.prevClose;
  const change = tick.price - prev;
  return {
    ...base,
    price: r2(tick.price),
    prevClose: r2(prev),
    change: r2(change),
    changePct: prev ? r2((change / prev) * 100) : 0,
    // production takes the live extreme directly (IBKR reports cumulative intraday
    // high/low); the simulated tick already carries the running max/min.
    high: r2(tick.high),
    low: r2(tick.low),
    volume: Math.round(tick.volume),
    volRatio: base.avgVolume ? r2(tick.volume / base.avgVolume) : 0,
    live: true,
  };
}

/** refresh_loop()'s pool: top + bottom CANDIDATE_N by %change, then the top
    VOLUME_LIVE_N volume movers, deduped in priority order and capped. These are
    the only tickers the production tool asks IBKR to stream live. */
export function selectCandidates(quotes: readonly Quote[]): string[] {
  const ranked = [...quotes].sort((a, b) => a.changePct - b.changePct);
  const losers = ranked.slice(0, CANDIDATE_N).map((q) => q.ticker);
  const gainers = ranked.slice(-CANDIDATE_N).reverse().map((q) => q.ticker);
  const volume = [...quotes]
    .filter((q) => q.avgVolume > 0)
    .sort((a, b) => b.volRatio - a.volRatio)
    .slice(0, VOLUME_LIVE_N)
    .map((q) => q.ticker);

  const pool: string[] = [];
  const seen = new Set<string>();
  for (const t of [...gainers, ...losers, ...volume]) {
    if (!seen.has(t) && pool.length < MAX_LIVE_TICKERS) {
      pool.push(t);
      seen.add(t);
    }
  }
  return pool;
}

export interface Breadth {
  scanned: number;
  advancing: number;
  declining: number;
  unchanged: number;
}

export interface Payload {
  gainers: Quote[];
  losers: Quote[];
  volSpikes: Quote[];
  breadth: Breadth;
  /** how many rows are backed by a live tick right now */
  liveCount: number;
}

/** build_payload(): when IBKR is streaming, only rank the live-backed quotes for the
    movers tables (yfinance's delayed daily bar otherwise surfaces yesterday's losers as
    if they were today's). Volume spikes always rank the full scan. */
export function buildPayload(quotes: readonly Quote[], liveActive: boolean): Payload {
  const liveQuotes = quotes.filter((q) => q.live);
  const moversPool = liveActive && liveQuotes.length ? liveQuotes : quotes;

  const gainers = moversPool
    .filter((q) => q.changePct > 0)
    .sort((a, b) => b.changePct - a.changePct)
    .slice(0, TOP_N);
  const losers = moversPool
    .filter((q) => q.changePct < 0)
    .sort((a, b) => a.changePct - b.changePct)
    .slice(0, TOP_N);
  const volSpikes = [...quotes]
    .filter((q) => q.avgVolume > 0)
    .sort((a, b) => b.volRatio - a.volRatio)
    .slice(0, TOP_N);

  const advancing = quotes.filter((q) => q.changePct > 0).length;
  const declining = quotes.filter((q) => q.changePct < 0).length;
  return {
    gainers,
    losers,
    volSpikes,
    breadth: {
      scanned: quotes.length,
      advancing,
      declining,
      unchanged: quotes.length - advancing - declining,
    },
    liveCount: liveQuotes.length,
  };
}

/* ── ASX session, ported from the dashboard's AEST clock ───────────────────── */

export type SessionKind = "pre" | "open" | "closed";

export interface Session {
  label: string;
  kind: SessionKind;
  note: string;
}

/** The same session bands the production header shows, given an instant. The demo
    passes a fixed snapshot time (the data is an end-of-day close), so this stays
    deterministic rather than reading the wall clock. */
export function marketSession(aestHour: number, weekday: number): Session {
  if (weekday === 0 || weekday === 6) return { label: "Closed", kind: "closed", note: "weekend" };
  if (aestHour >= 7 && aestHour < 10) return { label: "Pre-Open", kind: "pre", note: "auction 7:00 to 10:00 AEST" };
  if (aestHour >= 10 && aestHour < 16) return { label: "Open", kind: "open", note: "10:00 to 16:00 AEST" };
  if (aestHour >= 16 && aestHour < 16.25) return { label: "Closing Auction", kind: "pre", note: "about 4:15 AEST" };
  return { label: "Closed", kind: "closed", note: "after hours" };
}

export const fmtPrice = (v: number) => `$${v.toFixed(2)}`;
export const fmtChange = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(3)}`;
export function fmtVolume(v: number): string {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return String(v);
}
