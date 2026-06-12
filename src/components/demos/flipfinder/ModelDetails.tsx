/**
 * Screen 2: the model workspace. Smart-filtered configuration toggles, the
 * 30-day price chart with regression overlay, aggregate stat cards, the
 * storage and grade breakdown bars, and the margin calculator.
 */
import * as React from "react";
import { ChevronLeft, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import {
  GRADES,
  STORAGES,
  brandName,
  colourName,
  gradeLabel,
  skuFor,
  type Combo,
  type PhoneModel,
  type Selection,
} from "./data";
import { availableOptions, avgWinnerBy, eur, findCombo, mean, regress } from "./logic";
import { FOCUS_RING, Pill, SectionLabel } from "./controls";
import { BreakdownBars, ChartLegend, PriceChart } from "./charts";
import MarginCalculator from "./MarginCalculator";

function FilterGroup(props: { label: string; children: React.ReactNode }) {
  return (
    <div role="group" aria-label={props.label}>
      <SectionLabel>{props.label}</SectionLabel>
      <div className="flex flex-wrap gap-2">{props.children}</div>
    </div>
  );
}

function StatCard(props: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-elevated px-4 py-3">
      <SectionLabel className="mb-1">{props.label}</SectionLabel>
      {props.children}
    </div>
  );
}

interface ModelDetailsProps {
  model: PhoneModel;
  /** every listed configuration of this model */
  combos: ReadonlyArray<Combo>;
  selection: Selection;
  onSelectionChange: (s: Selection) => void;
  onBack: () => void;
}

export default function ModelDetails(props: ModelDetailsProps) {
  const { model, combos, selection, onSelectionChange, onBack } = props;

  const avail = React.useMemo(() => availableOptions(combos, selection), [combos, selection]);
  const selected = findCombo(combos, selection);
  const data = selected?.series ?? [];
  const reg = React.useMemo(() => regress(data.map((d) => d.winner)), [data]);

  const avgWinner = mean(data.map((d) => d.winner));
  const avgPtw = mean(data.map((d) => d.ptw));
  const firstWinner = data[0]?.winner;
  const momentumPct = reg && firstWinner ? (reg.slope / firstWinner) * 100 : null;
  const rising = (reg?.slope ?? 0) >= 0;
  const TrendIcon = rising ? TrendingUp : TrendingDown;

  const byStorage = React.useMemo(() => avgWinnerBy(combos, "storage"), [combos]);
  const byGrade = React.useMemo(() => avgWinnerBy(combos, "grade"), [combos]);

  const comboName = `${selection.storage} GB ${gradeLabel(selection.grade).toLowerCase()}, ${colourName(model.code, selection.colour)}`;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className={cn(
          "-ml-2 mb-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink",
          FOCUS_RING
        )}
      >
        <ChevronLeft className="size-3.5 shrink-0" aria-hidden />
        all movers
      </button>

      {/* identity */}
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="eyebrow mb-1">refurbished market · FR · EUR</div>
          <h3 className="font-serif text-xl text-ink">
            {brandName(model.brand)} {model.name}
          </h3>
        </div>
        <Badge variant="neutral" size="sm" className="font-mono tnum">
          {skuFor(model.code, selection)}
        </Badge>
      </div>

      {/* smart-filtered configuration + chart legend */}
      <div className="mb-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <FilterGroup label="Storage">
            {STORAGES.map((s) => (
              <Pill
                key={s}
                selected={selection.storage === s}
                disabled={!avail.storage.has(s)}
                onClick={() => onSelectionChange({ ...selection, storage: s })}
              >
                {s} GB
              </Pill>
            ))}
          </FilterGroup>
          <FilterGroup label="Grade">
            {GRADES.map((g) => (
              <Pill
                key={g.code}
                selected={selection.grade === g.code}
                disabled={!avail.grade.has(g.code)}
                onClick={() => onSelectionChange({ ...selection, grade: g.code })}
              >
                {g.label}
              </Pill>
            ))}
          </FilterGroup>
          <FilterGroup label="Colour">
            {model.colours.map((c) => (
              <Pill
                key={c.code}
                selected={selection.colour === c.code}
                disabled={!avail.colour.has(c.code)}
                onClick={() => onSelectionChange({ ...selection, colour: c.code })}
              >
                {c.name}
              </Pill>
            ))}
          </FilterGroup>
        </div>
        <ChartLegend />
      </div>

      {selected ? (
        <PriceChart
          data={data}
          reg={reg}
          caption={`Daily price to win and winner price, ${comboName}, 30 days.`}
        />
      ) : (
        <div className="rounded-lg border border-line bg-sunken px-4 py-6 text-center text-sm text-ink-3">
          no listings for this combination
        </div>
      )}

      {/* aggregate stats for the selected combination */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="avg winner price · 30d">
          <div className="font-serif text-xl tnum text-ink">{eur(avgWinner)}</div>
        </StatCard>
        <StatCard label="avg price to win · 30d">
          <div className="font-serif text-xl tnum text-ink">{eur(avgPtw)}</div>
        </StatCard>
        <StatCard label="momentum · winner price">
          {reg && momentumPct !== null ? (
            <div className={cn("flex items-center gap-2 tnum", rising ? "text-pos" : "text-neg")}>
              <TrendIcon className="size-4 shrink-0" aria-hidden />
              <span className="font-serif text-xl">
                {rising ? "+" : ""}
                {reg.slope.toFixed(2)} €/day
              </span>
              <span className="text-xs font-medium">
                {rising ? "+" : ""}
                {momentumPct.toFixed(2)}%/day
              </span>
            </div>
          ) : (
            <div className="text-sm text-ink-3">not enough data</div>
          )}
        </StatCard>
      </div>

      {/* breakdowns across all of the model's listed configurations */}
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <BreakdownBars title="avg winner price · by storage" bars={byStorage} color="var(--color-series-2)" />
        <BreakdownBars title="avg winner price · by grade" bars={byGrade} color="var(--color-series-1)" />
      </div>

      <MarginCalculator avgPtw={avgPtw} avgWinner={avgWinner} />
    </div>
  );
}
