/**
 * Number formatting for financial display. Locale-stable (en-AU), with the
 * conventions a sophisticated reader expects: thousands separators, fixed
 * decimals, explicit signs on deltas, basis points where appropriate.
 */

const AUD = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const AUD_CENTS = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUM = new Intl.NumberFormat("en-AU");

export function currency(value: number, cents = false): string {
  return (cents ? AUD_CENTS : AUD).format(value);
}

/** Compact money for axis labels: $1.2m, $940k. */
export function currencyCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(abs >= 1e7 ? 0 : 1)}m`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

export function number(value: number, digits = 0): string {
  return NUM.format(Number(value.toFixed(digits)));
}

/** A signed percentage, e.g. +2.41% / −0.86%. Uses a true minus glyph. */
export function pct(value: number, digits = 2, signed = true): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const body = `${Math.abs(value).toFixed(digits)}%`;
  return signed ? `${sign}${body}` : body;
}

/** Unit price struck to four decimals (FSC-17 published-price convention). */
export function unitPrice(value: number): string {
  return value.toLocaleString("en-AU", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function basisPoints(fraction: number): string {
  return `${Math.round(fraction * 10_000)} bps`;
}

export const sign = (v: number): "pos" | "neg" | "flat" =>
  v > 0 ? "pos" : v < 0 ? "neg" : "flat";
