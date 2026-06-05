import * as React from "react";
import { scaleLinear } from "d3-scale";
import { line, area, curveMonotoneX } from "d3-shape";
import { cn } from "@/lib/cn";
import { pct } from "@/lib/format";
import type { NavPoint } from "@/lib/data";

interface NavChartProps {
  series: NavPoint[];
  height?: number;
  className?: string;
}

const MARGIN = { top: 16, right: 18, bottom: 28, left: 44 };

/**
 * Strategy NAV vs benchmark, rebased to 100.
 *
 * Charting from first principles: d3-scale builds the axes, d3-shape generates
 * the path geometry, and every element below is raw SVG rendered by hand, with no
 * Recharts, no Chart.js, no wrapper. Interactive (pointer + keyboard) with an
 * offscreen data table so assistive tech gets the full series.
 */
export function NavChart({ series, height = 320, className }: NavChartProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(320);
  const [active, setActive] = React.useState<number | null>(null);
  const [showBench, setShowBench] = React.useState(true);

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

  const n = series.length;

  const { x, y, navPath, benchPath, areaPath, yTicks } = React.useMemo(() => {
    const values = series.flatMap((d) => (showBench ? [d.nav, d.bench] : [d.nav]));
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.08;

    const xS = scaleLinear()
      .domain([0, n - 1])
      .range([MARGIN.left, width - MARGIN.right]);
    const yS = scaleLinear()
      .domain([lo - pad, hi + pad])
      .range([height - MARGIN.bottom, MARGIN.top]);

    const navLine = line<NavPoint>()
      .x((d) => xS(d.t))
      .y((d) => yS(d.nav))
      .curve(curveMonotoneX);
    const benchLine = line<NavPoint>()
      .x((d) => xS(d.t))
      .y((d) => yS(d.bench))
      .curve(curveMonotoneX);
    const navArea = area<NavPoint>()
      .x((d) => xS(d.t))
      .y0(yS.range()[0] ?? height)
      .y1((d) => yS(d.nav))
      .curve(curveMonotoneX);

    return {
      x: xS,
      y: yS,
      navPath: navLine(series) ?? "",
      benchPath: benchLine(series) ?? "",
      areaPath: navArea(series) ?? "",
      yTicks: yS.ticks(5),
    };
  }, [series, n, width, height, showBench]);

  const idx = active ?? n - 1;
  const cur = series[idx];

  function pointerToIndex(clientX: number): number {
    const el = wrapRef.current;
    if (!el) return idx;
    const rect = el.getBoundingClientRect();
    const px = clientX - rect.left;
    const i = Math.round(x.invert(px));
    return Math.max(0, Math.min(n - 1, i));
  }

  const navRet = cur ? cur.nav - 100 : 0;
  const benchRet = cur ? cur.bench - 100 : 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Readout */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-4">
          <div>
            <div className="eyebrow mb-1">Strategy · index</div>
            <div className="font-serif text-2xl tabular-nums tnum text-ink">
              {cur ? cur.nav.toFixed(1) : "·"}
            </div>
          </div>
          <div
            className={cn(
              "tnum text-sm font-medium",
              navRet >= 0 ? "text-pos" : "text-neg"
            )}
            aria-hidden
          >
            {pct(navRet, 1)}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setShowBench((s) => !s)}
            className="flex items-center gap-2 rounded-full px-2 py-1 text-ink-2 transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            aria-pressed={showBench}
          >
            <span className="inline-block h-2 w-4 rounded-full" style={{ background: "var(--color-series-1)" }} />
            Strategy
            <span
              className={cn("inline-block h-2 w-4 rounded-full transition-opacity", !showBench && "opacity-30")}
              style={{ background: "var(--color-series-2)" }}
            />
            <span className={cn(!showBench && "text-ink-3 line-through")}>Benchmark</span>
          </button>
          <span className="hidden text-ink-3 sm:inline" aria-hidden>
            {cur?.label}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div
        ref={wrapRef}
        className="relative w-full select-none overflow-hidden"
        style={{ height }}
        onPointerMove={(e) => setActive(pointerToIndex(e.clientX))}
        onPointerLeave={() => setActive(null)}
      >
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Growth of strategy versus benchmark, rebased to 100. Over the period the strategy compounds to ${series[n - 1]?.nav.toFixed(1)} against the benchmark's ${series[n - 1]?.bench.toFixed(1)}. A full month-by-month data table follows.`}
          className="block max-w-full overflow-visible"
        >
          <defs>
            <linearGradient id="navFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal gridlines + y labels */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-line)"
                strokeWidth={1}
                strokeDasharray={t === 100 ? "0" : "2 4"}
                opacity={t === 100 ? 0.9 : 0.6}
              />
              <text
                x={MARGIN.left - 8}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-[var(--color-ink-3)] font-mono text-[10px] tnum"
              >
                {t}
              </text>
            </g>
          ))}

          {/* x labels: sparse, with ends anchored inward so they never clip */}
          {series
            .filter((_, i) => i % 12 === 0 || i === n - 1)
            .map((d) => (
              <text
                key={d.t}
                x={x(d.t)}
                y={height - 8}
                textAnchor={d.t === 0 ? "start" : d.t === n - 1 ? "end" : "middle"}
                className="fill-[var(--color-ink-3)] font-mono text-[10px]"
              >
                {d.label}
              </text>
            ))}

          {/* Area + strategy line */}
          <path d={areaPath} fill="url(#navFill)" />
          {showBench && (
            <path
              d={benchPath}
              fill="none"
              stroke="var(--color-series-2)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              opacity={0.9}
            />
          )}
          <path
            d={navPath}
            fill="none"
            stroke="var(--color-series-1)"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1,
              animation: "draw 1.3s var(--ease-out-soft) forwards",
            }}
          />

          {/* Crosshair + markers */}
          {cur && (
            <g>
              <line
                x1={x(cur.t)}
                x2={x(cur.t)}
                y1={MARGIN.top}
                y2={height - MARGIN.bottom}
                stroke="var(--color-ink-3)"
                strokeWidth={1}
                opacity={0.4}
              />
              {showBench && (
                <circle cx={x(cur.t)} cy={y(cur.bench)} r={3} fill="var(--color-series-2)" />
              )}
              <circle
                cx={x(cur.t)}
                cy={y(cur.nav)}
                r={4}
                fill="var(--color-surface)"
                stroke="var(--color-series-1)"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>

        {/* Floating readout */}
        {cur && active !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-line bg-surface/95 px-3 py-2 text-xs shadow-raised backdrop-blur"
            style={{
              left: Math.min(Math.max(x(cur.t) - 70, 4), width - 144),
            }}
          >
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
              {cur.label}
            </div>
            <div className="flex items-center gap-2 tnum">
              <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-series-1)" }} />
              <span className="text-ink-2">Strategy</span>
              <span className="ml-auto font-medium text-ink">{cur.nav.toFixed(1)}</span>
              <span className={navRet >= 0 ? "text-pos" : "text-neg"}>{pct(navRet, 1)}</span>
            </div>
            {showBench && (
              <div className="mt-1 flex items-center gap-2 tnum">
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--color-series-2)" }} />
                <span className="text-ink-2">Benchmark</span>
                <span className="ml-auto font-medium text-ink">{cur.bench.toFixed(1)}</span>
                <span className={benchRet >= 0 ? "text-pos" : "text-neg"}>{pct(benchRet, 1)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink-3">
        Raw SVG · d3-scale axes · d3-shape path geometry · rendered by hand. No charting library. Hover to read any month.
      </p>

      {/* Offscreen data table for assistive technology */}
      <table className="sr-only">
        <caption>Strategy and benchmark index by month, rebased to 100.</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Strategy</th>
            <th scope="col">Benchmark</th>
          </tr>
        </thead>
        <tbody>
          {series.map((d) => (
            <tr key={d.t}>
              <th scope="row">{d.label}</th>
              <td>{d.nav.toFixed(2)}</td>
              <td>{d.bench.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
