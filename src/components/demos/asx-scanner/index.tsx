/* ASX hybrid scanner miniature. yfinance ranks a real 20-stock snapshot on delayed daily
   bars; connecting the (simulated) IBKR feed overlays live ticks on the candidate movers
   and re-ranks the live-backed quotes, exactly the production hybrid. Disconnecting falls
   back to the delayed bars, the production behaviour when TWS is not running. */

import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Radio, RadioTower } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { SNAPSHOT_DATE } from "./data";
import {
  DELAYED,
  MAX_LIVE_TICKERS,
  PROD,
  buildPayload,
  marketSession,
  mergeLive,
  type Quote,
} from "./logic";
import { useLiveOverlay } from "./useLiveOverlay";
import { MoversTable, VolumeTable, FOCUS_RING } from "./tables";

const TAB_TRIGGER = cn(
  "-mb-px border-b-2 border-transparent px-3 pb-2 pt-1 text-xs font-medium text-ink-3 transition-colors hover:text-ink-2",
  "data-[state=active]:border-brand-600 data-[state=active]:text-brand-700",
  FOCUS_RING
);

// The snapshot is an end-of-day close on a Thursday: deterministic session, no wall clock.
const SESSION = marketSession(16.5, 4);

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "pos" | "neg" }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-ink-3">{label}</span>
      <span className={cn("tnum font-mono font-semibold", tone === "pos" ? "text-pos" : tone === "neg" ? "text-neg" : "text-ink")}>
        {value}
      </span>
    </div>
  );
}

export default function AsxScannerDemo() {
  const [connected, setConnected] = React.useState(false);
  const overlay = useLiveOverlay(DELAYED, connected);

  const quotes = React.useMemo<Quote[]>(
    () =>
      DELAYED.map((q) => {
        const tick = overlay.ticks[q.ticker];
        return connected && tick ? mergeLive(q, tick) : q;
      }),
    [connected, overlay]
  );

  const payload = React.useMemo(() => buildPayload(quotes, connected), [quotes, connected]);

  return (
    <div className="w-full">
      {/* header: identity + the two production badges */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <div className="eyebrow mb-1">ASX hybrid scanner · delayed rank + live overlay</div>
          <h3 className="font-serif text-xl text-ink">Top movers</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elevated px-2.5 py-1 text-[11px] text-ink-2">
            <span className={cn("size-1.5 rounded-full", SESSION.kind === "open" ? "bg-pos" : "bg-ink-3")} aria-hidden />
            ASX {SESSION.label}
            <span className="text-ink-3">· {SESSION.note}</span>
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
              connected ? "border-brand-line bg-brand-tint text-brand-700" : "border-line bg-elevated text-ink-2"
            )}
          >
            <span
              className={cn("size-1.5 rounded-full", connected ? "bg-pos motion-safe:animate-pulse" : "bg-ink-3")}
              aria-hidden
            />
            {connected ? `IBKR live · ${payload.liveCount} tickers` : "IBKR offline · yfinance only"}
          </span>
        </div>
      </div>

      {/* the key control: connect / disconnect the live feed */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Button size="sm" variant={connected ? "outline" : "primary"} onClick={() => setConnected((c) => !c)}>
          {connected ? <Radio aria-hidden /> : <RadioTower aria-hidden />}
          {connected ? "Disconnect live feed" : "Connect live feed"}
        </Button>
        <span className="font-mono text-[11px] text-ink-3">
          yfinance close · {SNAPSHOT_DATE} · 20 ASX large caps
        </span>
      </div>

      {/* market breadth, the production stats bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-lg border border-line bg-elevated px-4 py-2.5 text-xs">
        <Stat label="Scanned" value={payload.breadth.scanned} />
        <Stat label="Advancing" value={payload.breadth.advancing} tone="pos" />
        <Stat label="Declining" value={payload.breadth.declining} tone="neg" />
        <Stat label="Unchanged" value={payload.breadth.unchanged} />
        <Stat label="Live ticks" value={payload.liveCount} />
      </div>

      {/* mode explainer: why fewer rows show when live */}
      <p className="mb-3 mt-2 text-[11px] leading-relaxed text-ink-3">
        {connected ? (
          <>
            Live feed covers the {overlay.candidates.length} movers that matter (top and bottom by % change, plus
            volume spikes), not all 20. The movers tables now rank live-backed quotes only, so the delayed bars
            cannot surface yesterday's movers as today's. The demo caps the live pool at {MAX_LIVE_TICKERS} of 20;
            production caps it at {PROD.maxLive} lines over a {PROD.universe}-stock universe.
          </>
        ) : (
          <>
            Delayed yfinance daily bars, the ranking layer. Connect the live feed to overlay real-time ticks on the
            candidate movers and re-rank, the way Interactive Brokers backs the displayed prices in production.
          </>
        )}
      </p>

      <Tabs.Root defaultValue="movers">
        <Tabs.List aria-label="Scanner views" className="mb-3 flex border-b border-line">
          <Tabs.Trigger value="movers" className={TAB_TRIGGER}>
            Gainers &amp; losers
          </Tabs.Trigger>
          <Tabs.Trigger value="volume" className={TAB_TRIGGER}>
            Volume spikes
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="movers" className="outline-none">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="text-xs font-semibold text-ink">Top gainers</span>
                <span className="rounded-full bg-pos/10 px-2 py-0.5 text-[10px] font-medium text-pos">% chg ▲</span>
              </div>
              <MoversTable quotes={payload.gainers} emptyLabel="No gainers in the live pool" />
            </section>
            <section className="rounded-lg border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                <span className="text-xs font-semibold text-ink">Top losers</span>
                <span className="rounded-full bg-neg/10 px-2 py-0.5 text-[10px] font-medium text-neg">% chg ▼</span>
              </div>
              <MoversTable quotes={payload.losers} emptyLabel="No losers in the live pool" />
            </section>
          </div>
        </Tabs.Content>

        <Tabs.Content value="volume" className="outline-none">
          <section className="rounded-lg border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <span className="text-xs font-semibold text-ink">Volume spikes · vs 3-month daily average</span>
              <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-medium text-brand-700">ratio</span>
            </div>
            <VolumeTable quotes={payload.volSpikes} />
          </section>
        </Tabs.Content>
      </Tabs.Root>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-3">
        Real yfinance daily snapshot, ASX close {SNAPSHOT_DATE} (20 large caps, public market data). The delayed
        ranking, the merge and the market breadth are the production maths exactly. The live IBKR overlay is
        simulated here, since a browser cannot hold a market-data subscription; in production those ticks stream
        from Interactive Brokers for the candidate movers only, with graceful fallback to the delayed bars.
      </p>
    </div>
  );
}
