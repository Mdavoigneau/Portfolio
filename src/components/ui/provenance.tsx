import { cn } from "@/lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PROVENANCE_LABEL,
  STATUS_LABEL,
  type Metric,
  type Provenance,
  type Status,
} from "@/lib/projects";

/**
 * Provenance dot: ● filled = reported by the team using the tool,
 * ○ hollow = my own estimate. Facts and qualitative claims carry no dot
 * (they aren't estimates). Each dot tooltips its meaning.
 */
export function ProvenanceDot({
  provenance,
  className,
}: {
  provenance: Provenance;
  className?: string;
}) {
  if (provenance !== "team" && provenance !== "self") return null;
  const isTeam = provenance === "team";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={PROVENANCE_LABEL[provenance]}
          className={cn(
            "inline-block size-2 shrink-0 cursor-help rounded-full align-middle",
            isTeam ? "bg-brand" : "border border-ink-3 bg-transparent",
            className
          )}
        />
      </TooltipTrigger>
      <TooltipContent>{PROVENANCE_LABEL[provenance]}</TooltipContent>
    </Tooltip>
  );
}

/** A mint impact pill carrying its provenance dot. */
export function MetricPill({ metric, className }: { metric: Metric; className?: string }) {
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-1.5 rounded-full bg-mint/55 px-2.5 py-1 text-xs font-medium leading-none text-mint-deep",
        className
      )}
    >
      {metric.label}
      <ProvenanceDot provenance={metric.provenance} />
    </span>
  );
}

/** Status: In production (green) vs Ready, awaiting sign-off (gold). */
export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const isProd = status === "prod";
  return (
    <span
      title={STATUS_LABEL[status]}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium leading-none",
        isProd ? "bg-pos/10 text-pos" : "bg-sunken text-ink-2",
        className
      )}
    >
      <span
        className={cn("size-1.5 rounded-full", isProd ? "bg-pos" : "bg-[var(--color-series-3)]")}
      />
      {isProd ? "In production" : "Ready"}
    </span>
  );
}

/** Inline legend explaining the two estimate provenances. */
export function ProvenanceLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink-3", className)}>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-brand" /> reported by the team using it
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full border border-ink-3" /> my own estimate
      </span>
      <span className="text-ink-3/80">facts &amp; backtests carry no dot</span>
    </div>
  );
}
