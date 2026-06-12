/**
 * The dual-VAT margin calculator, the risk-assessment half of the product.
 * Both modes call the production formulas in logic.ts; inputs are clamped
 * so the result is never NaN.
 */
import * as React from "react";
import { ArrowLeftRight, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { eur, marginClassiqueTVA, marginMargeTVA, toNum } from "./logic";
import { FOCUS_RING, Pill, SectionLabel } from "./controls";

interface NumFieldProps {
  id: string;
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  step: string;
}

function NumField(props: NumFieldProps) {
  return (
    <label htmlFor={props.id} className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-ink-3">
        {props.label} <span className="normal-case">({props.suffix})</span>
      </span>
      <input
        id={props.id}
        type="number"
        inputMode="decimal"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className={cn(
          "h-8 w-full rounded-md border border-line bg-surface px-2 font-mono text-sm tnum text-ink",
          FOCUS_RING
        )}
      />
    </label>
  );
}

interface MarginCalculatorProps {
  /** average price to win of the selected combination, EUR */
  avgPtw: number;
  /** average winner price of the selected combination, EUR */
  avgWinner: number;
}

export default function MarginCalculator({ avgPtw, avgWinner }: MarginCalculatorProps) {
  const [buyRaw, setBuyRaw] = React.useState("500");
  const [rateRaw, setRateRaw] = React.useState("20");
  const [cutRaw, setCutRaw] = React.useState("10");
  const [shipRaw, setShipRaw] = React.useState("4.99");
  const [source, setSource] = React.useState<"ptw" | "winner">("ptw");
  const [mode, setMode] = React.useState<"marge" | "classique">("marge");

  const sale = source === "ptw" ? avgPtw : avgWinner;
  const inputs = {
    sale,
    buy: toNum(buyRaw, 0, 9999),
    vatRate: toNum(rateRaw, 0, 100),
    marketplaceCut: toNum(cutRaw, 0, 100),
    shipping: toNum(shipRaw, 0, 999),
  };
  const { margin, marginPct } =
    mode === "marge" ? marginMargeTVA(inputs) : marginClassiqueTVA(inputs);

  return (
    <div className="mt-3 rounded-lg border border-line bg-elevated p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <SectionLabel className="mb-0">Margin calculator</SectionLabel>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSource((s) => (s === "ptw" ? "winner" : "ptw"))}
            className={cn(
              "flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3 py-1 text-xs text-ink-2 transition-colors hover:border-brand-line hover:bg-brand-tint/40",
              FOCUS_RING
            )}
          >
            <ArrowLeftRight className="size-3.5 shrink-0" aria-hidden />
            selling at {source === "ptw" ? "avg price to win" : "avg winner price"}
            <span className="font-mono tnum font-medium text-ink">{eur(sale)}</span>
          </button>
          <div className="flex items-center gap-2" role="group" aria-label="VAT mode">
            <Pill selected={mode === "marge"} onClick={() => setMode("marge")}>
              TVA sur la marge
            </Pill>
            <Pill selected={mode === "classique"} onClick={() => setMode("classique")}>
              TVA classique
            </Pill>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Explain the two VAT modes"
                className={cn("rounded-full p-1 text-ink-3 hover:bg-sunken hover:text-ink-2", FOCUS_RING)}
              >
                <Info className="size-3.5" aria-hidden />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              TVA sur la marge: VAT is computed on the margin only (net sale minus buying
              price). TVA classique: VAT is computed on the full net sale price. In this
              business, that distinction decides profitability.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <NumField id="ff-buy" label="Buying price" suffix="€" value={buyRaw} onChange={setBuyRaw} min={0} max={9999} step="10" />
        <NumField id="ff-vat" label="VAT rate" suffix="%" value={rateRaw} onChange={setRateRaw} min={0} max={100} step="1" />
        <NumField id="ff-cut" label="Marketplace cut" suffix="%" value={cutRaw} onChange={setCutRaw} min={0} max={100} step="1" />
        <NumField id="ff-ship" label="Shipping" suffix="€" value={shipRaw} onChange={setShipRaw} min={0} max={999} step="0.5" />
      </div>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-line bg-surface px-4 py-3">
        <div>
          <SectionLabel className="mb-1">Margin per unit</SectionLabel>
          <div className={cn("font-serif text-2xl tnum", margin >= 0 ? "text-pos" : "text-neg")}>
            {margin >= 0 ? "+" : ""}
            {eur(margin)}
          </div>
        </div>
        <div className="text-right">
          <div className={cn("tnum text-sm font-medium", margin >= 0 ? "text-pos" : "text-neg")}>
            {marginPct >= 0 ? "+" : ""}
            {marginPct.toFixed(2)}% of net sale
          </div>
          <div className="mt-1 text-xs text-ink-3">
            {mode === "marge"
              ? "TVA sur la marge: VAT applied to the margin only."
              : "TVA classique: VAT applied to the full net sale price."}
          </div>
        </div>
      </div>
    </div>
  );
}
