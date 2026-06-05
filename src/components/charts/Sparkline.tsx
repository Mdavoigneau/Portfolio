interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}

/**
 * A row sparkline written from first principles: no d3, no library, just the
 * path math: normalise the series into the box and emit an SVG polyline. The
 * counterpart to the d3 chart: proof I reach for a dependency by choice, not need.
 */
export function Sparkline({ data, width = 76, height = 24, positive = true }: SparklineProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const dx = width / (data.length - 1);
  const pad = 2;

  const points = data.map((v, i) => {
    const x = i * dx;
    const y = pad + (height - pad * 2) * (1 - (v - min) / span);
    return [x, y] as const;
  });

  const d = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];
  const color = positive ? "var(--color-pos)" : "var(--color-neg)";

  return (
    <svg width={width} height={height} aria-hidden className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {last && <circle cx={last[0]} cy={last[1]} r={1.8} fill={color} />}
    </svg>
  );
}
