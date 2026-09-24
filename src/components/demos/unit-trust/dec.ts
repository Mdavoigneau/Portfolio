/**
 * Exact fixed-point decimals, standing in for the production code's Python
 * Decimal. A value is an integer count of 10^-s units held in a BigInt, so no
 * money figure in this demo ever passes through a binary float. Rounding is
 * ROUND_HALF_UP (ties away from zero), the mode every price, unit and cent
 * figure is quantised with in production.
 *
 * Division is exact rational rounding at the target scale. Python divides to a
 * 28-digit context first and then quantises; the two agree on every figure in
 * this demo, checked against the output of the production functions themselves.
 */

export interface Dec {
  /** value = u / 10^s */
  readonly u: bigint;
  readonly s: number;
}

const POW10: bigint[] = [1n];
function pow10(n: number): bigint {
  while (POW10.length <= n) POW10.push((POW10[POW10.length - 1] ?? 1n) * 10n);
  return POW10[n] ?? 1n;
}

export const ZERO: Dec = { u: 0n, s: 0 };

/** Parse "1,234.5600" or "-0.01". Throws on anything else. */
export function dec(text: string): Dec {
  const m = /^([+-])?(\d+)(?:\.(\d+))?$/.exec(text.replace(/,/g, "").trim());
  if (!m) throw new Error(`not a decimal: ${text}`);
  const frac = m[3] ?? "";
  const u = BigInt((m[2] ?? "0") + frac);
  return { u: m[1] === "-" ? -u : u, s: frac.length };
}

/** Non-throwing parse for operator input; null when it is not a plain decimal. */
export function tryDec(text: string): Dec | null {
  try {
    return dec(text);
  } catch {
    return null;
  }
}

function align(a: Dec, b: Dec): [bigint, bigint, number] {
  const s = Math.max(a.s, b.s);
  return [a.u * pow10(s - a.s), b.u * pow10(s - b.s), s];
}

export function add(a: Dec, b: Dec): Dec {
  const [x, y, s] = align(a, b);
  return { u: x + y, s };
}

export function sub(a: Dec, b: Dec): Dec {
  const [x, y, s] = align(a, b);
  return { u: x - y, s };
}

export function mul(a: Dec, b: Dec): Dec {
  return { u: a.u * b.u, s: a.s + b.s };
}

export function neg(a: Dec): Dec {
  return { u: -a.u, s: a.s };
}

export function sum(xs: ReadonlyArray<Dec>): Dec {
  return xs.reduce(add, ZERO);
}

export function cmp(a: Dec, b: Dec): -1 | 0 | 1 {
  const [x, y] = align(a, b);
  return x < y ? -1 : x > y ? 1 : 0;
}

export const eq = (a: Dec, b: Dec) => cmp(a, b) === 0;
export const isZero = (a: Dec) => a.u === 0n;
export const isPos = (a: Dec) => a.u > 0n;
export const isNeg = (a: Dec) => a.u < 0n;

/** n / d rounded half-up (ties away from zero). */
function divRound(n: bigint, d: bigint): bigint {
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const q = n / d; // BigInt division truncates toward zero
  const r = n % d; // and the remainder carries n's sign
  if (r === 0n) return q;
  const twice = 2n * (r < 0n ? -r : r);
  if (twice < d) return q;
  return n < 0n ? q - 1n : q + 1n;
}

/** Decimal.quantize(Decimal("1e-scale"), rounding=ROUND_HALF_UP). */
export function quantize(a: Dec, scale: number): Dec {
  if (scale >= a.s) return { u: a.u * pow10(scale - a.s), s: scale };
  return { u: divRound(a.u, pow10(a.s - scale)), s: scale };
}

/** (a / b).quantize(1e-scale, ROUND_HALF_UP), computed exactly. */
export function div(a: Dec, b: Dec, scale: number): Dec {
  if (b.u === 0n) throw new Error("division by zero");
  return { u: divRound(a.u * pow10(b.s + scale), b.u * pow10(a.s)), s: scale };
}

/** The value as whole cents (the AMIT allocation works in integer cents). */
export function toCents(a: Dec): bigint {
  return quantize(a, 2).u;
}

export function fromCents(c: bigint): Dec {
  return { u: c, s: 2 };
}

/** The plain decimal string, the form the golden file and the ABA writer use. */
export function toPlain(a: Dec): string {
  const negv = a.u < 0n;
  const digits = (negv ? -a.u : a.u).toString().padStart(a.s + 1, "0");
  const int = digits.slice(0, digits.length - a.s);
  const frac = a.s > 0 ? "." + digits.slice(digits.length - a.s) : "";
  return (negv ? "-" : "") + int + frac;
}

/** Display: thousands separators, a true minus sign, fixed places. */
export function fmt(a: Dec, dp: number, opts: { sign?: boolean } = {}): string {
  const q = quantize(a, dp);
  const negv = q.u < 0n;
  const plain = toPlain({ u: negv ? -q.u : q.u, s: dp });
  const [int = "0", frac] = plain.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = negv ? "−" : opts.sign && q.u > 0n ? "+" : "";
  return sign + grouped + (frac !== undefined ? "." + frac : "");
}

/** "$1,234.56", with a true minus sign ahead of the dollar sign. */
export function money(a: Dec, dp = 2): string {
  const body = fmt(a, dp);
  return body.startsWith("−") ? "−$" + body.slice(1) : "$" + body;
}
