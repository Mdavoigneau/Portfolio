/**
 * Trend-following research system, rebuilt as an interactive explainer on
 * synthetic data. Three lenses onto the same pipeline:
 *   universe → Clenow score → filters → top-N → regime gate → monthly rebalance
 *
 * • Signal: the per-stock momentum score and its hard filters, computed live.
 * • Regime: the probability → gross-exposure gate, the system's biggest risk
 *   control, and why a smooth ramp beats a binary 200d-MA filter.
 * • Track record: the 36-year growth-of-$1 vs SPY, the headline metrics, and
 *   an honest log of what was tested and did NOT beat the baseline.
 *
 * The maths in ./logic.ts mirrors the production formulas; the data in
 * ./data.ts is invented and deterministic.
 */
import * as React from "react";
import { cn } from "@/lib/cn";
import {
  STOCKS,
  REGIME_PRESETS,
  REGIME_FEATURES,
  REGIME_LABEL,
  REGIME_VALIDATION,
  REGIME_WHY_RF,
  ML_TRIAGE,
  TRACK_RECORD,
  RESEARCH_LOG,
  CAVEATS,
  buildEquityCurve,
  DISPLAY_WINDOW,
  type Stock,
  type FeatureTone,
} from "./data";
import {
  evaluate,
  regimeExposure,
  binaryExposure,
  pct,
  signedPct,
  GAP_THRESHOLD,
} from "./logic";
import { SignalChart, EquityChart } from "./charts";
import { Segmented, SectionLabel, StatTile, TickerPill } from "./controls";

const LENSES = [
  { id: "signal", label: "Signal" },
  { id: "regime", label: "ML regime" },
  { id: "record", label: "Track record" },
] as const;

const PIPELINE = ["universe", "Clenow score", "filters", "top-N", "regime gate", "rebalance"];

/* --------------------------------- signal ---------------------------------- */

function SignalLens() {
  const [ticker, setTicker] = React.useState(STOCKS[0].ticker);
  const stock = STOCKS.find((s) => s.ticker === ticker) ?? STOCKS[0];

  const display = stock.prices.slice(-DISPLAY_WINDOW);

  // the displayed-window index of the worst single-day move, for the marker
  const gapIndex = React.useMemo(() => {
    let idx = -1;
    let max = 0;
    for (let i = 1; i < display.length; i++) {
      const cur = display[i];
      const prev = display[i - 1];
      if (cur === undefined || prev === undefined || prev === 0) continue;
      const move = Math.abs(cur / prev - 1);
      if (move > max) {
        max = move;
        idx = i;
      }
    }
    return max > GAP_THRESHOLD ? idx : null;
  }, [display]);

  const verdict = evaluate(stock.prices, DISPLAY_WINDOW);
  if (!verdict) return null;

  return (
    <div>
      <p className="mb-3 text-sm leading-relaxed text-ink-2">
        Each name, each day, gets one score:{" "}
        <span className="tnum rounded bg-sunken px-1.5 py-0.5 font-mono text-[12px] text-brand-700">
          (exp(slope × 252) - 1) × r²
        </span>{" "}
        from a least-squares fit of <span className="font-medium text-ink">log price</span>. Slope is the
        trend's annualised return; r² is how cleanly price tracks the line. Multiplying them rewards smooth,
        rideable trends and punishes gappy ones. Then two hard filters decide if it can be held at all.
      </p>

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Stock">
        {STOCKS.map((s: Stock) => (
          <TickerPill
            key={s.ticker}
            ticker={s.ticker}
            name={s.name}
            selected={s.ticker === ticker}
            onClick={() => setTicker(s.ticker)}
          />
        ))}
      </div>

      <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <SectionLabel>log price · trailing {DISPLAY_WINDOW} days · least-squares fit</SectionLabel>
          <SignalChart prices={display} fit={verdict.score.fit} gapIndex={gapIndex} qualifies={verdict.qualifies} />
          <p className="mt-1 text-[11px] leading-snug text-ink-3">{stock.teaches}</p>
        </div>

        <div className="min-w-0">
          <SectionLabel>the score, computed live</SectionLabel>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="annualised" value={signedPct(verdict.score.annualised)} hint="exp(slope × 252) - 1" />
            <StatTile label="r²" value={verdict.score.r2.toFixed(2)} hint="fit quality" />
            <StatTile
              label="score"
              value={verdict.score.score.toFixed(3)}
              tone={verdict.score.score > 0.05 ? "pos" : "muted"}
              hint="annualised × r²"
            />
          </div>

          <SectionLabel className="mt-4">hard filters</SectionLabel>
          <div className="flex flex-col gap-2">
            <FilterRow
              ok={verdict.aboveMA}
              label="Above 100d moving average"
              detail={verdict.aboveMA ? "trend still intact" : "trend has broken: disqualified"}
            />
            <FilterRow
              ok={!verdict.gapped}
              label="No single-day move over 15% in 90d"
              detail={`largest move ${pct(verdict.maxGap)}${verdict.gapped ? " : shock, disqualified" : ""}`}
            />
          </div>

          <div
            className={cn(
              "mt-3 rounded-lg border px-3.5 py-3 text-sm",
              verdict.qualifies
                ? "border-brand-line bg-brand-tint/50 text-ink"
                : "border-line bg-sunken text-ink-2"
            )}
          >
            {verdict.qualifies ? (
              <span>
                <span className="font-semibold text-brand-700">Qualifies.</span>{" "}
                {verdict.score.score > 0.05
                  ? "Ranks near the top of the universe and earns a slot in the basket."
                  : "Survives the filters, but the score is too low to make the top-N: it never gets held."}
              </span>
            ) : (
              <span>
                <span className="font-semibold text-neg">Disqualified</span> · {verdict.reason}. Score is
                irrelevant once a filter fails: the exit rule does the work, not the ranking.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-line bg-elevated px-3 py-2">
      <span
        className={cn(
          "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full text-white",
          ok ? "bg-pos" : "bg-neg"
        )}
        aria-hidden
      >
        <span className="text-[11px] font-bold leading-none">{ok ? "✓" : "✕"}</span>
      </span>
      <div className="min-w-0">
        <div className="text-[13px] font-medium leading-snug text-ink">{label}</div>
        <div className="tnum text-[11px] leading-snug text-ink-3">{detail}</div>
      </div>
    </div>
  );
}

/* --------------------------------- regime ---------------------------------- */

function RegimeLens() {
  const [prob, setProb] = React.useState(0.46);
  const gross = regimeExposure(prob); // raw-prob ramp (0:1), the tuned production choice
  const binary = binaryExposure(prob);
  const active = REGIME_PRESETS.find((r) => Math.abs(prob - r.prob) < 1e-9) ?? null;

  return (
    <div>
      <p className="mb-3 text-sm leading-relaxed text-ink-2">
        Most of single-stock momentum's edge comes from{" "}
        <span className="font-medium text-ink">skipping bear markets</span>, not picking better names in bull
        ones, so the biggest risk control is a gate. Its probability is not hand-set: it is the{" "}
        <span className="font-medium text-ink">out-of-sample output of a walk-forward random-forest classifier</span>{" "}
        that reads market-level features and predicts whether the next 60 days will be a clean uptrend. That
        probability scales gross exposure directly; the rest of the book sits in cash.
      </p>

      <SectionLabel>pick a market moment</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {REGIME_PRESETS.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => setProb(r.prob)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600",
              active?.label === r.label
                ? "border-brand bg-brand text-white"
                : "border-line-strong bg-surface text-ink-2 hover:border-brand-line hover:bg-brand-tint/40"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <SectionLabel className="mt-4">
        1 · what the model reads{active ? ` · ${active.label}` : ""}
      </SectionLabel>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {REGIME_FEATURES.map((f) => (
          <div key={f.key} className="flex items-start gap-2 rounded-lg border border-line bg-elevated px-2.5 py-1.5">
            <ToneDot tone={active?.reads[f.key]} />
            <div className="min-w-0">
              <code className="font-mono text-[11px] font-medium text-brand-700">{f.key}</code>
              <div className="text-[11px] leading-snug text-ink-3">{f.why}</div>
            </div>
          </div>
        ))}
      </div>
      <p
        className={cn(
          "mt-2 rounded-lg border-l-2 px-3 py-2 text-[12px] leading-snug",
          active ? "reveal border-brand-line bg-sunken/60 text-ink-2" : "border-line-strong text-ink-3"
        )}
      >
        {active?.note ?? "Pick a moment above, or drag the gate below, to light up the features that drove the score."}
      </p>

      <SectionLabel className="mt-4">2 · trained without leaking the future</SectionLabel>
      <div className="grid gap-2 sm:grid-cols-3">
        <ModelCard title="the label" body={REGIME_LABEL} />
        <ModelCard title="no leakage" body={REGIME_VALIDATION} highlight />
        <ModelCard title="why a forest" body={REGIME_WHY_RF} />
      </div>

      <SectionLabel className="mt-4">3 · the gate · P(clean uptrend) → gross exposure</SectionLabel>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(prob * 100)}
        onChange={(e) => setProb(Number(e.target.value) / 100)}
        aria-label="Regime probability"
        className="w-full accent-brand"
      />
      <div className="tnum mt-1 flex justify-between font-mono text-[10px] text-ink-3">
        <span>0.0 · cash</span>
        <span className="text-base font-semibold text-ink">P = {prob.toFixed(2)}</span>
        <span>1.0 · full</span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-brand-line bg-surface p-3.5 shadow-card">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-ink">ML regime, raw-prob ramp</span>
            <span className="tnum font-mono text-xs text-brand-700">tuned</span>
          </div>
          <ExposureBar gross={gross} />
          <p className="tnum mt-1.5 font-mono text-[11px] text-ink-3">
            {pct(gross, 0)} invested · {pct(1 - gross, 0)} cash
          </p>
        </div>
        <div className="rounded-xl border border-line bg-elevated p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[13px] font-medium text-ink-2">binary 200d-MA filter</span>
            <span className="tnum font-mono text-xs text-ink-3">replaced</span>
          </div>
          <ExposureBar gross={binary} muted />
          <p className="tnum mt-1.5 font-mono text-[11px] text-ink-3">
            {pct(binary, 0)} invested · {pct(1 - binary, 0)} cash
          </p>
        </div>
      </div>

      <p className="mt-3 rounded-lg border-l-2 border-brand-line bg-sunken/60 px-3 py-2 text-[12px] leading-snug text-ink-2">
        {Math.abs(gross - binary) > 0.25
          ? "Right here the binary filter slams fully in or fully out on a coin-flip signal, while the ramp holds a measured middle. That gap is where the smooth gate earns its keep."
          : "When the signal is decisive the two agree. The difference shows up in the ambiguous middle, where the binary filter is at its worst."}
      </p>

      <p className="mt-3 text-[11px] leading-snug text-ink-3">{ML_TRIAGE}</p>
    </div>
  );
}

function ToneDot({ tone }: { tone: FeatureTone | undefined }) {
  const cls =
    tone === "good"
      ? "bg-pos"
      : tone === "bad"
        ? "bg-neg"
        : tone === "mixed"
          ? "bg-[var(--color-series-2)]"
          : "border border-line-strong bg-surface";
  return <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", cls)} aria-hidden />;
}

function ModelCard({ title, body, highlight }: { title: string; body: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        highlight ? "border-brand-line bg-brand-tint/40" : "border-line bg-elevated"
      )}
    >
      <div className="font-mono text-[10px] uppercase tracking-wider text-ink-3">{title}</div>
      <p className="mt-1 text-[11px] leading-snug text-ink-2">{body}</p>
    </div>
  );
}

function ExposureBar({ gross, muted }: { gross: number; muted?: boolean }) {
  return (
    <div className="mt-2.5 flex h-7 overflow-hidden rounded-md border border-line bg-sunken">
      <div
        className={cn("h-full transition-[width] duration-200", muted ? "bg-ink-3/60" : "bg-brand")}
        style={{ width: `${gross * 100}%` }}
      />
    </div>
  );
}

/* ------------------------------ track record ------------------------------- */

function RecordLens() {
  const points = React.useMemo(() => buildEquityCurve(), []);

  return (
    <div>
      <p className="mb-3 text-sm leading-relaxed text-ink-2">
        Top-10 by score, equal-weighted, rebalanced monthly, scaled by the regime gate. Backtested across{" "}
        <span className="font-medium text-ink">36 years</span> (1990 → 2026): the dot-com bust, the 2008
        crash, COVID and the 2022 bear. It beats the benchmark on every risk-adjusted measure, and the
        drawdowns are roughly half as deep.
      </p>

      <EquityChart points={points} />

      <SectionLabel className="mt-4">headline · 1990 → 2026</SectionLabel>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-sunken text-left font-mono text-[10px] uppercase tracking-wider text-ink-3">
              <th className="px-3 py-1.5 font-medium"> </th>
              <th className="px-3 py-1.5 text-right font-medium">this strategy</th>
              <th className="px-3 py-1.5 text-right font-medium">SPY B&amp;H</th>
            </tr>
          </thead>
          <tbody>
            {TRACK_RECORD.map((m) => (
              <tr key={m.label} className="border-t border-line">
                <td className="px-3 py-1.5 text-ink-2">{m.label}</td>
                <td className="tnum px-3 py-1.5 text-right font-semibold text-pos">{m.strat}</td>
                <td className="tnum px-3 py-1.5 text-right text-ink-3">{m.bench}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionLabel className="mt-4">what we tested that did NOT beat the baseline</SectionLabel>
      <ul className="flex list-none flex-col gap-2 p-0">
        {RESEARCH_LOG.map((r) => (
          <li key={r.idea} className="rounded-lg border border-line bg-elevated px-3 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="text-[13px] font-medium text-ink">{r.idea}</span>
              <span className="tnum font-mono text-[11px] text-neg">{r.outcome}</span>
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-2">{r.why}</p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-ink-3">
        The finding is the honesty: every extra knob removed more signal than risk. Pushing past this needs
        orthogonal data (fundamentals, sector strength, options skew), not more ways to reshape one price series.
      </p>

      <div className="mt-3 flex flex-col gap-1.5">
        {CAVEATS.map((c) => (
          <p key={c} className="border-l-2 border-line-strong pl-2.5 text-[11px] leading-snug text-ink-3">
            {c}
          </p>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- shell ----------------------------------- */

export default function TrendFollowingDemo() {
  const [lens, setLens] = React.useState<string>("signal");

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-ink-3">
        {PIPELINE.map((step, i) => (
          <React.Fragment key={step}>
            <span
              className={cn(
                (lens === "signal" && (step === "Clenow score" || step === "filters")) ||
                  (lens === "regime" && step === "regime gate") ||
                  (lens === "record" && step === "rebalance")
                  ? "rounded bg-brand-tint px-1.5 py-0.5 font-semibold text-brand-700"
                  : ""
              )}
            >
              {step}
            </span>
            {i < PIPELINE.length - 1 && <span className="text-line-strong">→</span>}
          </React.Fragment>
        ))}
      </div>

      <Segmented segments={LENSES} value={lens} onChange={setLens} ariaLabel="What to look at" />

      <div className="mt-4">
        {lens === "signal" && <SignalLens />}
        {lens === "regime" && <RegimeLens />}
        {lens === "record" && <RecordLens />}
      </div>

      <p className="mt-4 font-mono text-[11px] leading-relaxed text-ink-3">
        the Clenow score, both hard filters and the regime ramp are the production formulas, computed live in
        your browser. the ML regime panel describes the real classifier (its features, its forward label, the
        60-day-embargo walk-forward training); the per-moment feature readings are illustrative. the four
        stocks, their prices and the equity curve are synthetic: the curve is an illustrative reconstruction
        (production renders it as a matplotlib PNG), calibrated to the real backtest, whose headline figures
        are reported as-is. no real tickers, prices or holdings appear here.
      </p>
    </div>
  );
}
