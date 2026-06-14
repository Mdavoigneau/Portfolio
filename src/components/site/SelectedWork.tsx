import { ArrowRight, Info, Play, SquareArrowOutUpRight } from "lucide-react";
import { Badge, TechChip } from "@/components/ui/badge";
import { Container, Section, SectionHead } from "@/components/ui/section";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MetricPill, ProvenanceLegend, StatusBadge } from "@/components/ui/provenance";
import { ProjectDialog } from "@/components/site/ProjectDialog";
import { hasDemo, hasDemoPage } from "@/components/demos";
import { FEATURED, LEDGER, type Project } from "@/lib/projects";

function WorkCard({ p }: { p: Project }) {
  const primary = p.metrics[0];
  const demo = hasDemo(p.id);
  const demoPage = hasDemoPage(p.id);
  return (
    <ProjectDialog project={p}>
      <button
        type="button"
        className="group flex h-full w-full flex-col rounded-xl border border-line bg-surface p-6 text-left shadow-card ring-1 ring-ink/[0.02] transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-brand-line hover:shadow-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="eyebrow">{p.context}</span>
          <StatusBadge status={p.status} className="shrink-0" />
        </div>

        <h3 className="mt-3 text-xl tracking-tight text-ink">{p.title}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{p.summary}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {primary ? <MetricPill metric={primary} /> : null}
          {p.tags?.slice(0, 1).map((t) => (
            <Badge key={t} variant="outline" size="sm">
              {t}
            </Badge>
          ))}
        </div>

        <div className="mt-auto pt-5">
          <div className="mb-3 flex flex-wrap gap-1.5">
            {p.stack.slice(0, 4).map((s) => (
              <TechChip key={s}>{s}</TechChip>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600">
            {demo ? (
              <>
                <Play className="size-3" aria-hidden />
                Try the interactive demo
              </>
            ) : demoPage ? (
              <>
                <SquareArrowOutUpRight className="size-3" aria-hidden />
                Open the live dashboard
              </>
            ) : (
              "View details"
            )}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </button>
    </ProjectDialog>
  );
}

export function SelectedWork() {
  return (
    <Section id="work" wash>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHead
            eyebrow="Selected work"
            title={
              <>
                Systems people <span className="font-serif italic text-brand-700">rely</span> on.
              </>
            }
            lead="Production work across private wealth, funds administration, SMSF and compliance, plus a business of my own, an MP's office, and quant research."
          />
          <a
            href="#ledger"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-brand-line hover:bg-brand-tint/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            All {LEDGER.length} in the ledger
            <ArrowRight className="size-4" />
          </a>
        </div>

        <div className="mt-6 flex items-center gap-2.5">
          <ProvenanceLegend />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="A note on confidentiality"
                className="grid size-5 shrink-0 place-items-center rounded-full border border-line text-ink-3 transition-colors hover:border-brand-line hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <Info className="size-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-[18rem] leading-relaxed">
              These are live, regulated systems: client identifiers, holdings and credentials are
              deliberately omitted, and every figure is illustrative or synthetic.
            </TooltipContent>
          </Tooltip>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
            <span className="grid size-4 shrink-0 place-items-center rounded-full bg-mint">
              <Play className="size-2.5 text-mint-deep" aria-hidden />
            </span>
            working miniature inside, on synthetic data
          </span>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((p) => (
            <WorkCard key={p.id} p={p} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
