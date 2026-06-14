/**
 * Hand-rolled SVG charts for the trend-following miniature (d3-scale +
 * d3-shape, ResizeObserver, sr-only data tables). The signal chart plots
 * log-price with its least-squares fit so the trend is literally a straight
 * line whose slope drives the score. The equity chart redraws the backtest's
 * growth-of-$1 on a log axis; production renders that as a matplotlib PNG.
 */
import * as React from "react";
import { scaleLinear, scaleLog } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
import type { EquityPoint } from "./data";

/* ----------------------------- signal chart -------------------------------- */

const M = { top: 12, right: 14, bottom: 22, left: 34 };
const SIG_H = 188;

interface SignalChartProps {
  /** the displayed window of actual prices (oldest → newest) */
  prices: ReadonlyArray<number>;
  /** least-squares fit in log space over x = 0..n-1 */
  fit: { slope: number; intercept: number };
  /** index within the window of the >15% gap day, if any */
  gapIndex: number | null;
  qualifies: boolean;
}

export function SignalChart({ prices, fit, gapIndex, qualifies }: SignalChartProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(360);
  const [active, setActive] = React.useState<number | null>(null);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = prices.length;
  const logs = React.useMemo(() => prices.map((p) => Math.log(p)), [prices]);

  const { x, y, pricePath, fitY0, fitY1, yTicks } = React.useMemo(() => {
    const fitStart = fit.intercept;
    const fitEnd = fit.intercept + fit.slope * (n - 1);
    const values = [...logs, fitStart, fitEnd];
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.1 || 0.05;
    const xS = scaleLinear().domain([0, n - 1]).range([M.left, width - M.right]);
    const yS = scaleLinear().domain([lo - pad, hi + pad]).range([SIG_H - M.bottom, M.top]);
    const mk = line<number>().x((_, i) => xS(i)).y((v) => yS(v)).curve(curveMonotoneX);
    return {
      x: xS,
      y: yS,
      pricePath: mk([...logs]) ?? "",
      fitY0: yS(fitStart),
      fitY1: yS(fitEnd),
      yTicks: yS.ticks(4),
    };
  }, [logs, fit, n, width]);

  const lineColor = qualifies ? "var(--color-series-1)" : "var(--color-series-3)";
  const cur = active !== null ? active : null;
  const curLog = cur !== null ? logs[cur] : undefined;
  const curPrice = cur !== null ? prices[cur] : undefined;
  const gapLog = gapIndex !== null ? logs[gapIndex] : undefined;

  function pointerToIndex(clientX: number): number {
    const el = wrapRef.current;
    if (!el) return 0;
    const i = Math.round(x.invert(clientX - el.getBoundingClientRect().left));
    return Math.max(0, Math.min(n - 1, i));
  }

  return (
    <div
      ref={wrapRef}
      className="relative w-full select-none overflow-hidden"
      style={{ height: SIG_H, touchAction: "pan-y" }}
      onPointerDown={(e) => setActive(pointerToIndex(e.clientX))}
      onPointerMove={(e) => active !== null && setActive(pointerToIndex(e.clientX))}
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") setActive(null);
      }}
    >
      <svg
        width={width}
        height={SIG_H}
        role="img"
        aria-label={`Log-price over the trailing ${n} trading days with its least-squares fit. The straight fit line's slope, annualised, drives the momentum score.`}
        className="block max-w-full overflow-visible"
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={width - M.right}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--color-line)"
              strokeWidth={1}
              strokeDasharray="2 4"
              opacity={0.6}
            />
            <text
              x={M.left - 7}
              y={y(t)}
              dy="0.32em"
              textAnchor="end"
              className="tnum fill-[var(--color-ink-3)] font-mono text-[10px]"
            >
              {t.toFixed(1)}
            </text>
          </g>
        ))}
        {[0, n - 1].map((d) => (
          <text
            key={d}
            x={x(d)}
            y={SIG_H - 6}
            textAnchor={d === 0 ? "start" : "end"}
            className="fill-[var(--color-ink-3)] font-mono text-[10px]"
          >
            {d === 0 ? `-${n}d` : "today"}
          </text>
        ))}

        {/* least-squares fit of the log-price series */}
        <line
          x1={x(0)}
          y1={fitY0}
          x2={x(n - 1)}
          y2={fitY1}
          stroke="var(--color-series-2)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          opacity={0.9}
        />
        {/* the price path itself */}
        <path
          d={pricePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "draw 1.2s var(--ease-out-soft) forwards" }}
        />

        {/* gap marker */}
        {gapIndex !== null && gapLog !== undefined && (
          <g>
            <line
              x1={x(gapIndex)}
              x2={x(gapIndex)}
              y1={M.top}
              y2={SIG_H - M.bottom}
              stroke="var(--color-neg)"
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.7}
            />
            <circle cx={x(gapIndex)} cy={y(gapLog)} r={3.5} fill="var(--color-neg)" />
          </g>
        )}

        {cur !== null && curLog !== undefined && (
          <g>
            <line
              x1={x(cur)}
              x2={x(cur)}
              y1={M.top}
              y2={SIG_H - M.bottom}
              stroke="var(--color-ink-3)"
              strokeWidth={1}
              opacity={0.4}
            />
            <circle cx={x(cur)} cy={y(curLog)} r={4} fill="var(--color-surface)" stroke={lineColor} strokeWidth={2} />
          </g>
        )}
      </svg>

      {cur !== null && curPrice !== undefined && (
        <div
          className="pointer-events-none absolute top-1 z-10 w-max rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-xs shadow-raised backdrop-blur"
          style={{ left: Math.min(Math.max(x(cur) - 52, 2), Math.max(width - 106, 2)) }}
        >
          <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
            day {cur - (n - 1)}
          </div>
          <div className="tnum mt-0.5 font-medium text-ink">${curPrice.toFixed(2)}</div>
          <div className="tnum font-mono text-[10px] text-ink-3">
            fit ${Math.exp(fit.intercept + fit.slope * cur).toFixed(2)}
          </div>
        </div>
      )}

      <table className="sr-only">
        <caption>Log-price by trading day for the selected stock</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p, i) => (
            <tr key={i}>
              <th scope="row">{i - (n - 1)}</th>
              <td>${p.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ----------------------------- equity chart -------------------------------- */

const EM = { top: 14, right: 40, bottom: 22, left: 30 };
const EQ_H = 210;
const LOG_TICKS = [1, 2, 5, 10, 20, 50, 100];

export function EquityChart({ points }: { points: ReadonlyArray<EquityPoint> }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(420);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { x, y, stratPath, spyPath, yTicks } = React.useMemo(() => {
    const years = points.map((p) => p.year);
    const all = points.flatMap((p) => [p.strat, p.spy]);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const y0 = years[0] ?? 1990;
    const yN = years[years.length - 1] ?? 2026;
    const xS = scaleLinear().domain([y0, yN]).range([EM.left, width - EM.right]);
    const yS = scaleLog().domain([lo * 0.85, hi * 1.1]).range([EQ_H - EM.bottom, EM.top]);
    const mk = (acc: (p: EquityPoint) => number) =>
      line<EquityPoint>().x((p) => xS(p.year)).y((p) => yS(acc(p))).curve(curveMonotoneX)([...points]) ?? "";
    return {
      x: xS,
      y: yS,
      stratPath: mk((p) => p.strat),
      spyPath: mk((p) => p.spy),
      yTicks: LOG_TICKS.filter((t) => t >= lo * 0.85 && t <= hi * 1.1),
    };
  }, [points, width]);

  const xTicks = [1990, 2000, 2010, 2020];
  const last = points[points.length - 1];
  if (!last) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: "var(--color-series-1)" }} />
          this strategy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: "var(--color-series-3)" }} />
          SPY buy &amp; hold
        </span>
      </div>
      <div ref={wrapRef} className="w-full overflow-hidden">
        <svg
          width={width}
          height={EQ_H}
          role="img"
          aria-label={`Growth of $1 from 1990 to 2026, log scale: the strategy ends at ${last.strat.toFixed(0)} times, SPY buy and hold at ${last.spy.toFixed(0)} times, with the strategy taking shallower drawdowns through every bear market.`}
          className="block max-w-full overflow-visible"
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={EM.left}
                x2={width - EM.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-line)"
                strokeWidth={1}
                strokeDasharray="2 4"
                opacity={0.6}
              />
              <text
                x={EM.left - 6}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="tnum fill-[var(--color-ink-3)] font-mono text-[10px]"
              >
                {t}x
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text
              key={t}
              x={x(t)}
              y={EQ_H - 6}
              textAnchor="middle"
              className="fill-[var(--color-ink-3)] font-mono text-[10px]"
            >
              {t}
            </text>
          ))}

          <path d={spyPath} fill="none" stroke="var(--color-series-3)" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.9} />
          <path
            d={stratPath}
            fill="none"
            stroke="var(--color-series-1)"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "draw 1.6s var(--ease-out-soft) forwards" }}
          />

          {/* endpoint multiples */}
          <text
            x={width - EM.right + 4}
            y={y(last.strat)}
            dy="0.32em"
            className="tnum fill-[var(--color-series-1)] font-mono text-[10px] font-semibold"
          >
            {last.strat.toFixed(0)}x
          </text>
          <text
            x={width - EM.right + 4}
            y={y(last.spy)}
            dy="0.32em"
            className="tnum fill-[var(--color-ink-3)] font-mono text-[10px]"
          >
            {last.spy.toFixed(0)}x
          </text>
        </svg>
      </div>

      <table className="sr-only">
        <caption>Growth of $1 by year, strategy versus SPY buy and hold</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Strategy</th>
            <th scope="col">SPY</th>
          </tr>
        </thead>
        <tbody>
          {points
            .filter((_, i) => i % 4 === 0)
            .map((p) => (
              <tr key={p.year}>
                <th scope="row">{p.year}</th>
                <td>{p.strat.toFixed(1)}x</td>
                <td>{p.spy.toFixed(1)}x</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
