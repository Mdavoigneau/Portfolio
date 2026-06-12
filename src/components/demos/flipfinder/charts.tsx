/**
 * Hand-rolled SVG charts. Production renders these with Recharts; the
 * miniature redraws them in raw SVG (d3-scale + d3-shape, ResizeObserver,
 * sr-only data) to match the page. Only the rendering differs: the numbers
 * feeding both charts come from logic.ts.
 */
import * as React from "react";
import { scaleLinear } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
import { type PricePoint } from "./data";
import { eur, type BreakdownBar, type Regression } from "./logic";
import { SectionLabel } from "./controls";

/* --------------------------------- legend ---------------------------------- */

const LEGEND = [
  { name: "price to win", color: "var(--color-series-1)" },
  { name: "winner price", color: "var(--color-series-2)" },
  { name: "least-squares trend", color: "var(--color-ink-3)" },
] as const;

export function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
      {LEGEND.map((s) => (
        <span key={s.name} className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full" style={{ background: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

/* -------------------------------- line chart ------------------------------- */

const M = { top: 12, right: 12, bottom: 22, left: 40 };
const CHART_H = 164;

interface PriceChartProps {
  data: ReadonlyArray<PricePoint>;
  reg: Regression | null;
  /** caption for the sr-only data table, names the selected combination */
  caption: string;
}

export function PriceChart({ data, reg, caption }: PriceChartProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(320);
  const [tipWidth, setTipWidth] = React.useState(150);
  const [active, setActive] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const w = tipRef.current?.offsetWidth;
    if (w) setTipWidth(w);
  }, [active]);

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

  const n = data.length;

  const { x, y, ptwPath, winnerPath, yTicks } = React.useMemo(() => {
    const values = data.flatMap((d) => [d.ptw, d.winner]);
    if (reg) values.push(reg.intercept, reg.intercept + reg.slope * (n - 1));
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const pad = (hi - lo) * 0.08 || 1;

    const xS = scaleLinear().domain([0, n - 1]).range([M.left, width - M.right]);
    const yS = scaleLinear().domain([lo - pad, hi + pad]).range([CHART_H - M.bottom, M.top]);

    const mk = (acc: (d: PricePoint) => number) =>
      line<PricePoint>().x((d) => xS(d.day)).y((d) => yS(acc(d))).curve(curveMonotoneX)([...data]) ?? "";

    return { x: xS, y: yS, ptwPath: mk((d) => d.ptw), winnerPath: mk((d) => d.winner), yTicks: yS.ticks(4) };
  }, [data, reg, n, width]);

  if (n === 0) return null;

  const cur = active !== null ? data[active] : undefined;

  function pointerToIndex(clientX: number): number {
    const el = wrapRef.current;
    if (!el) return 0;
    const i = Math.round(x.invert(clientX - el.getBoundingClientRect().left));
    return Math.max(0, Math.min(n - 1, i));
  }

  const last = data[n - 1];

  return (
    <>
      <div
        ref={wrapRef}
        className="relative w-full select-none overflow-hidden"
        style={{ height: CHART_H, touchAction: "pan-y", WebkitTouchCallout: "none" }}
        onPointerDown={(e) => {
          if (e.pointerType === "touch") e.currentTarget.setPointerCapture(e.pointerId);
          setActive(pointerToIndex(e.clientX));
        }}
        onPointerMove={(e) => setActive(pointerToIndex(e.clientX))}
        onPointerLeave={(e) => {
          // Touch fires leave on finger-up; keep the crosshair pinned instead.
          if (e.pointerType !== "touch") setActive(null);
        }}
      >
        <svg
          width={width}
          height={CHART_H}
          role="img"
          aria-label={`Daily price to win and winner price over 30 days, ending ${last?.label ?? ""} at ${last ? eur(last.winner) : ""} winner price. The stat cards below give the averages and the regression slope.`}
          className="block max-w-full overflow-visible"
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} strokeDasharray="2 4" opacity={0.6} />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[var(--color-ink-3)] font-mono text-[10px] tnum">
                {t}
              </text>
            </g>
          ))}

          {data
            .filter((d) => d.day === n - 1 || (d.day % 7 === 0 && n - 1 - d.day > 4))
            .map((d) => (
              <text
                key={d.day}
                x={x(d.day)}
                y={CHART_H - 6}
                textAnchor={d.day === 0 ? "start" : d.day === n - 1 ? "end" : "middle"}
                className="fill-[var(--color-ink-3)] font-mono text-[10px]"
              >
                {d.label}
              </text>
            ))}
          {/* least-squares trend of the winner-price series */}
          {reg && (
            <line
              x1={x(0)} y1={y(reg.intercept)} x2={x(n - 1)} y2={y(reg.intercept + reg.slope * (n - 1))}
              stroke="var(--color-ink-3)" strokeWidth={1} strokeDasharray="2 3" opacity={0.7}
            />
          )}
          <path d={winnerPath} fill="none" stroke="var(--color-series-2)" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.9} />
          <path
            d={ptwPath}
            fill="none"
            stroke="var(--color-series-1)"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "draw 1.3s var(--ease-out-soft) forwards" }}
          />

          {cur && (
            <g>
              <line x1={x(cur.day)} x2={x(cur.day)} y1={M.top} y2={CHART_H - M.bottom} stroke="var(--color-ink-3)" strokeWidth={1} opacity={0.4} />
              <circle cx={x(cur.day)} cy={y(cur.winner)} r={3} fill="var(--color-series-2)" />
              <circle cx={x(cur.day)} cy={y(cur.ptw)} r={4} fill="var(--color-surface)" stroke="var(--color-series-1)" strokeWidth={2} />
            </g>
          )}
        </svg>

        {cur && (
          <div
            ref={tipRef}
            className="pointer-events-none absolute top-1 z-10 w-max rounded-lg border border-line bg-surface/95 px-3 py-2 text-xs shadow-raised backdrop-blur"
            style={{ left: Math.min(Math.max(x(cur.day) - tipWidth / 2, 2), Math.max(width - tipWidth - 2, 2)) }}
          >
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
              {cur.label}
            </div>
            {([
              { name: "price to win", value: cur.ptw, color: "var(--color-series-1)" },
              { name: "winner price", value: cur.winner, color: "var(--color-series-2)" },
            ] as const).map((row) => (
              <div key={row.name} className="mt-1 flex items-center gap-2 tnum first:mt-0">
                <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
                <span className="text-ink-2">{row.name}</span>
                <span className="ml-auto font-medium text-ink">{eur(row.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* offscreen series for assistive tech */}
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr><th scope="col">Date</th><th scope="col">Price to win</th><th scope="col">Winner price</th></tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}><th scope="row">{d.label}</th><td>{eur(d.ptw)}</td><td>{eur(d.winner)}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/* ------------------------------ breakdown bars ------------------------------ */

const BAR_H = 104;
const BAR_M = { top: 16, bottom: 16 };

interface BreakdownBarsProps {
  title: string;
  bars: ReadonlyArray<BreakdownBar>;
  /** bar fill, one of the page's series hues */
  color: string;
}

/** Compact vertical bar chart with mono value labels, zero-based like production. */
export function BreakdownBars({ title, bars, color }: BreakdownBarsProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(280);

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

  const max = Math.max(...bars.map((b) => b.value), 1);
  const y = scaleLinear().domain([0, max * 1.08]).range([BAR_H - BAR_M.bottom, BAR_M.top]);
  const band = bars.length ? width / bars.length : width;
  const barW = Math.min(band * 0.55, 72);

  return (
    <div className="rounded-lg border border-line bg-elevated px-4 py-3">
      <SectionLabel>{title}</SectionLabel>
      <div ref={wrapRef} className="w-full">
        <svg
          width={width}
          height={BAR_H}
          role="img"
          aria-label={`${title}: ${bars.map((b) => `${b.label} ${eur(b.value)}`).join(", ")}`}
          className="block max-w-full"
        >
          <line x1={0} x2={width} y1={BAR_H - BAR_M.bottom} y2={BAR_H - BAR_M.bottom} stroke="var(--color-line)" strokeWidth={1} />
          {bars.map((b, i) => {
            const cx = band * i + band / 2;
            const top = y(b.value);
            return (
              <g key={b.label}>
                <rect
                  x={cx - barW / 2}
                  y={top}
                  width={barW}
                  height={Math.max(BAR_H - BAR_M.bottom - top, 0)}
                  rx={3}
                  fill={color}
                  opacity={0.85}
                />
                <text x={cx} y={top - 5} textAnchor="middle" className="fill-[var(--color-ink-2)] font-mono text-[10px] tnum">
                  {Math.round(b.value)} €
                </text>
                <text x={cx} y={BAR_H - 4} textAnchor="middle" className="fill-[var(--color-ink-3)] font-mono text-[10px]">
                  {b.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
