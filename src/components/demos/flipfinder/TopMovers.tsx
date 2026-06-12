/**
 * Screen 1: the overview. Top 5 gainers and losers since yesterday, computed
 * live over the whole synthetic universe in logic.ts, plus a browse row to
 * jump straight into any model.
 */
import * as React from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import {
  BRANDS,
  MODELS,
  UNIVERSE,
  brandName,
  colourName,
  gradeLabel,
  modelByCode,
  type BrandCode,
  type Combo,
} from "./data";
import { combosFor, eur, topMovers, type Mover } from "./logic";
import { FOCUS_RING, Pill, SectionLabel } from "./controls";

// Deterministic, so ranked once at module scope like the rest of the universe.
const MOVERS = topMovers(UNIVERSE);

function MoverRow({ mover, onOpen }: { mover: Mover; onOpen: (c: Combo) => void }) {
  const { combo, deltaEur, deltaPct } = mover;
  const model = modelByCode(combo.modelCode);
  const pos = deltaEur >= 0;
  const sign = pos ? "+" : "";
  return (
    <button
      type="button"
      onClick={() => onOpen(combo)}
      className={cn(
        "group flex w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-brand-tint/40",
        FOCUS_RING
      )}
    >
      <span className="text-sm font-medium text-ink">
        {model ? `${brandName(model.brand)} ${model.name}` : combo.modelCode}
      </span>
      <span className="flex flex-wrap gap-1">
        <Badge variant="outline" size="sm">{colourName(combo.modelCode, combo.colour)}</Badge>
        <Badge variant="outline" size="sm">{gradeLabel(combo.grade)}</Badge>
        <Badge variant="outline" size="sm" className="tnum">{combo.storage} GB</Badge>
      </span>
      <span className={cn("ml-auto font-mono text-xs font-medium tnum", pos ? "text-pos" : "text-neg")}>
        {sign}{eur(deltaEur)} · {sign}{deltaPct.toFixed(1)}%
      </span>
      <ChevronRight
        className="size-3.5 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}

function MoverCard(props: {
  title: string;
  movers: ReadonlyArray<Mover>;
  onOpen: (c: Combo) => void;
}) {
  return (
    <section aria-label={props.title} className="rounded-lg border border-line bg-elevated px-2 py-3">
      <SectionLabel className="px-2">{props.title}</SectionLabel>
      <ul>
        {props.movers.map((m) => (
          <li key={m.combo.id}>
            <MoverRow mover={m} onOpen={props.onOpen} />
          </li>
        ))}
      </ul>
    </section>
  );
}

interface TopMoversProps {
  onOpenCombo: (combo: Combo) => void;
}

export default function TopMovers({ onOpenCombo }: TopMoversProps) {
  const [brand, setBrand] = React.useState<BrandCode>("APL");
  const models = MODELS.filter((m) => m.brand === brand);

  const openModel = (modelCode: string) => {
    const first = combosFor(UNIVERSE, modelCode)[0];
    if (first) onOpenCombo(first);
  };

  return (
    <div>
      <div className="mb-3">
        <div className="eyebrow mb-1">refurbished market · FR · EUR</div>
        <h3 className="font-serif text-xl text-ink">Top movers since yesterday</h3>
        <p className="mt-0.5 text-xs text-ink-3">
          winner price, Wed 11 Jun to Thu 12 Jun, across all listed configurations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <MoverCard title="Top 5 price gainers" movers={MOVERS.gainers} onOpen={onOpenCombo} />
        <MoverCard title="Top 5 price losers" movers={MOVERS.losers} onOpen={onOpenCombo} />
      </div>

      <div className="mt-4 rounded-lg border border-line bg-elevated px-4 py-3">
        <SectionLabel>Browse the catalogue</SectionLabel>
        <p className="-mt-1 mb-2.5 text-xs text-ink-3">
          every mover above is clickable, or pick a brand and open a model's workspace directly
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Brand">
          {BRANDS.map((b) => (
            <Pill key={b.code} selected={brand === b.code} onClick={() => setBrand(b.code)}>
              {b.name}
            </Pill>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`${brandName(brand)} models`}>
          {models.map((m) => (
            <button
              key={m.code}
              type="button"
              onClick={() => openModel(m.code)}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-brand-600 transition-colors hover:border-brand-line hover:bg-brand-tint/40",
                FOCUS_RING
              )}
            >
              {m.name}
              <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
