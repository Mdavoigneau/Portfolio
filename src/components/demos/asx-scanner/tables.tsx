/* The movers and volume tables, in the portfolio's light palette. The volume bar is the
   production "inline-div bar" (a flex track, no charting library). A pulsing dot marks
   rows backed by a live tick; price and volume cells flash on each live update. */

import * as React from "react";
import { cn } from "@/lib/cn";
import { fmtChange, fmtPrice, fmtVolume, type Quote } from "./logic";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600";

/** A number cell that flashes when its value changes between live ticks. */
function FlashNum({ value, text, volume = false }: { value: number; text: string; volume?: boolean }) {
  const prev = React.useRef(value);
  const [key, setKey] = React.useState(0);
  const [dir, setDir] = React.useState<"up" | "down" | null>(null);
  React.useEffect(() => {
    if (value !== prev.current) {
      setDir(value > prev.current || volume ? "up" : "down");
      setKey((k) => k + 1);
      prev.current = value;
    }
  }, [value, volume]);
  return (
    <span
      key={key}
      className={cn(
        "rounded px-1",
        dir === "up" && "motion-safe:animate-[flashUp_0.7s_ease-out]",
        dir === "down" && "motion-safe:animate-[flashDown_0.7s_ease-out]"
      )}
    >
      {text}
    </span>
  );
}

function LiveDot({ live }: { live: boolean }) {
  if (!live) return null;
  return (
    <span
      className="mr-1.5 inline-block size-1.5 shrink-0 rounded-full bg-pos align-middle motion-safe:animate-pulse"
      title="Live IBKR tick"
      aria-label="live"
    />
  );
}

function Ticker({ q }: { q: Quote }) {
  return (
    <div className="flex items-center">
      <LiveDot live={q.live} />
      <span className="font-mono text-[13px] font-semibold text-brand-700">{q.ticker}</span>
      <span className="ml-2 hidden truncate text-xs text-ink-3 sm:inline">{q.name}</span>
    </div>
  );
}

function ChangePct({ q }: { q: Quote }) {
  const pos = q.changePct >= 0;
  return (
    <span className={cn("tnum", pos ? "text-pos" : "text-neg")}>
      {pos ? "▲" : "▼"} {Math.abs(q.changePct).toFixed(2)}%
    </span>
  );
}

const TH = "px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.12em] text-ink-3";
const THR = cn(TH, "text-right");
const TD = "px-3 py-2 align-middle";
const TDR = cn(TD, "text-right tnum");

function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-6 text-center text-xs text-ink-3">
        {label}
      </td>
    </tr>
  );
}

export function MoversTable({ quotes, emptyLabel }: { quotes: readonly Quote[]; emptyLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className={TH}>Stock</th>
            <th className={THR}>Price</th>
            <th className={THR}>% Chg</th>
            <th className={THR}>$ Chg</th>
            <th className={THR}>Volume</th>
            <th className={THR}>Vol/Avg</th>
          </tr>
        </thead>
        <tbody>
          {quotes.length === 0 ? (
            <EmptyRow cols={6} label={emptyLabel} />
          ) : (
            quotes.map((q) => (
              <tr key={q.ticker} className="border-b border-line/50 last:border-0 hover:bg-mint/[0.12]">
                <td className={TD}>
                  <Ticker q={q} />
                </td>
                <td className={TDR}>
                  <FlashNum value={q.price} text={fmtPrice(q.price)} />
                </td>
                <td className={TDR}>
                  <ChangePct q={q} />
                </td>
                <td className={cn(TDR, q.change >= 0 ? "text-pos" : "text-neg")}>{fmtChange(q.change)}</td>
                <td className={cn(TDR, "text-ink-2")}>
                  <FlashNum value={q.volume} text={fmtVolume(q.volume)} volume />
                </td>
                <td className={cn(TDR, "text-ink-3")}>{q.avgVolume > 0 ? `${q.volRatio.toFixed(1)}x` : "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Bar colour by intensity, mirroring the production thresholds (>5x, >3x, >2x). */
function barColor(ratio: number): string {
  if (ratio > 5) return "var(--color-neg)";
  if (ratio > 3) return "var(--color-series-2)";
  if (ratio > 2) return "var(--color-brand)";
  return "var(--color-series-3)";
}

export function VolumeTable({ quotes }: { quotes: readonly Quote[] }) {
  const maxRatio = Math.max(...quotes.map((q) => q.volRatio), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-line">
            <th className={TH}>Stock</th>
            <th className={THR}>Price</th>
            <th className={THR}>% Chg</th>
            <th className={THR}>Today vol</th>
            <th className={THR}>3M avg</th>
            <th className={cn(TH, "w-[34%]")}>Vol ratio</th>
          </tr>
        </thead>
        <tbody>
          {quotes.length === 0 ? (
            <EmptyRow cols={6} label="No volume data" />
          ) : (
            quotes.map((q) => {
              const color = barColor(q.volRatio);
              const width = `${Math.max((q.volRatio / maxRatio) * 100, 3).toFixed(1)}%`;
              return (
                <tr key={q.ticker} className="border-b border-line/50 last:border-0 hover:bg-mint/[0.12]">
                  <td className={TD}>
                    <Ticker q={q} />
                  </td>
                  <td className={TDR}>
                    <FlashNum value={q.price} text={fmtPrice(q.price)} />
                  </td>
                  <td className={TDR}>
                    <ChangePct q={q} />
                  </td>
                  <td className={cn(TDR, "text-ink-2")}>
                    <FlashNum value={q.volume} text={fmtVolume(q.volume)} volume />
                  </td>
                  <td className={cn(TDR, "text-ink-3")}>{fmtVolume(q.avgVolume)}</td>
                  <td className={TD}>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                        <div className="h-full rounded-full" style={{ width, background: color }} />
                      </div>
                      <span className="tnum w-10 shrink-0 text-right font-mono text-xs" style={{ color }}>
                        {q.volRatio.toFixed(1)}x
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export { FOCUS_RING };
