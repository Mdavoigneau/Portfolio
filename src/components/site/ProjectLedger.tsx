import { ChevronRight } from "lucide-react";
import { Container, Section, SectionHead } from "@/components/ui/section";
import { ProvenanceDot, ProvenanceLegend, StatusBadge } from "@/components/ui/provenance";
import { ProjectDialog } from "@/components/site/ProjectDialog";
import { LEDGER, type DatedProject } from "@/lib/projects";

function LedgerRow({ project }: { project: DatedProject }) {
  const primary = project.metrics[0];
  return (
    <ProjectDialog project={project}>
      <button
        type="button"
        className="group flex w-full items-center gap-3 rounded-lg border border-line bg-surface/70 px-3.5 py-3 text-left transition-colors hover:border-brand-line hover:bg-mint/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{project.title}</div>
          <div className="truncate font-mono text-[10px] uppercase tracking-wider text-ink-3">
            {project.context}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          {primary ? (
            <span className="tnum hidden items-center gap-1.5 text-xs text-ink-2 sm:inline-flex">
              {primary.label}
              <ProvenanceDot provenance={primary.provenance} />
            </span>
          ) : null}
          <StatusBadge status={project.status} />
          <ChevronRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>
    </ProjectDialog>
  );
}

export function ProjectLedger() {
  const inProd = LEDGER.filter((p) => p.status === "prod").length;

  return (
    <Section id="ledger">
      <Container>
        <SectionHead
          eyebrow="The full ledger"
          title={
            <>
              Every system, <span className="font-serif italic text-brand-700">accounted for</span>.
            </>
          }
          lead={`All ${LEDGER.length} shipped solo, ${inProd} of them in production. Each figure is marked with where it came from. Open any row for the detail.`}
        />

        <div className="mt-6">
          <ProvenanceLegend />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-2 md:grid-cols-2">
          {LEDGER.map((p) => (
            <LedgerRow key={p.id} project={p} />
          ))}
        </div>
      </Container>
    </Section>
  );
}
