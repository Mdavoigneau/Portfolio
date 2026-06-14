/* The simulated IBKR live feed. In production, ib_loop() holds the Interactive Brokers
   connection and streams reqMktData ticks for the candidate movers; a browser cannot hold
   a market-data line, so the demo fakes those ticks with a seeded random walk over the
   candidates only. Everything below the feed (ranking, merging, breadth) is the real maths.
   Deterministic (seeded, no Math.random) and reduced-motion safe: it advances one tick and
   stops when the visitor prefers reduced motion. */

import * as React from "react";
import { selectCandidates, type LiveTick, type Quote } from "./logic";

const POLL_MS = 1200; // production polls IBKR ticks every 1 to 2s

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Overlay {
  ticks: Record<string, LiveTick>;
  /** monotonically increasing tick number, for cell-flash keys */
  step: number;
  /** the tickers the live feed covers (the production candidate pool) */
  candidates: string[];
}

const EMPTY: Overlay = { ticks: {}, step: 0, candidates: [] };

/** Advances each candidate one bounded step from its current tick: price drifts within
    +/-3% of the snapshot close, intraday volume only accumulates (so volRatio ticks up). */
function advance(
  prev: Record<string, LiveTick>,
  base: Map<string, Quote>,
  gens: Map<string, () => number>
): Record<string, LiveTick> {
  const next: Record<string, LiveTick> = {};
  for (const [t, tick] of Object.entries(prev)) {
    const b = base.get(t);
    const rnd = gens.get(t);
    if (!b || !rnd) {
      next[t] = tick;
      continue;
    }
    const drift = (rnd() * 2 - 1) * b.price * 0.0012;
    const price = Math.min(b.price * 1.03, Math.max(b.price * 0.97, tick.price + drift));
    const volume = tick.volume + Math.round(b.avgVolume * (0.002 + rnd() * 0.004));
    next[t] = {
      price,
      prevClose: tick.prevClose,
      high: Math.max(tick.high, price),
      low: Math.min(tick.low, price),
      volume,
    };
  }
  return next;
}

export function useLiveOverlay(delayed: readonly Quote[], connected: boolean): Overlay {
  const [overlay, setOverlay] = React.useState<Overlay>(EMPTY);
  const timer = React.useRef<number | null>(null);
  const gens = React.useRef<Map<string, () => number>>(new Map());

  const baseByTicker = React.useMemo(() => {
    const m = new Map<string, Quote>();
    for (const q of delayed) m.set(q.ticker, q);
    return m;
  }, [delayed]);
  const candidates = React.useMemo(() => selectCandidates(delayed), [delayed]);

  React.useEffect(() => {
    if (timer.current !== null) {
      window.clearInterval(timer.current);
      timer.current = null;
    }
    if (!connected) {
      setOverlay(EMPTY);
      return;
    }

    // seed one generator per candidate and an opening tick from the delayed close
    gens.current = new Map();
    const seeded: Record<string, LiveTick> = {};
    for (const t of candidates) {
      gens.current.set(t, mulberry32(hash(t)));
      const b = baseByTicker.get(t);
      if (b) seeded[t] = { price: b.price, prevClose: b.prevClose, high: b.high, low: b.low, volume: b.volume };
    }
    // one advance so the open differs visibly from the delayed bar
    const first = advance(seeded, baseByTicker, gens.current);
    setOverlay({ ticks: first, step: 1, candidates });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return; // a single live state, no streaming motion

    timer.current = window.setInterval(() => {
      setOverlay((o) => ({
        ticks: advance(o.ticks, baseByTicker, gens.current),
        step: o.step + 1,
        candidates,
      }));
    }, POLL_MS);

    return () => {
      if (timer.current !== null) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    };
  }, [connected, candidates, baseByTicker]);

  return overlay;
}
