import { Suspense, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge, TechChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricPill, StatusBadge } from "@/components/ui/provenance";
import { DEMOS, DEMO_PAGES } from "@/components/demos";
import { type Project } from "@/lib/projects";

function DemoFallback() {
  return (
    <div className="grid h-48 place-items-center">
      <span className="animate-pulse font-mono text-xs text-ink-3">Loading the demo</span>
    </div>
  );
}

/** Wraps any trigger element; opens a details dialog for the project. */
export function ProjectDialog({
  project,
  children,
}: {
  project: Project;
  children: ReactNode;
}) {
  const demo = DEMOS[project.id];
  const page = DEMO_PAGES[project.id];

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className={demo ? "w-[min(56rem,calc(100vw_-_2rem))]" : undefined}>
        <div className="p-6 md:p-7">
          <div className="mb-3 flex flex-wrap items-center gap-2 pr-8">
            <span className="eyebrow">{project.context}</span>
            <StatusBadge status={project.status} />
          </div>

          <DialogTitle className="font-serif text-2xl tracking-tight text-ink">
            {project.title}
          </DialogTitle>
          <DialogDescription className="mt-2.5 text-sm leading-relaxed text-ink-2">
            {project.detail}
          </DialogDescription>

          {demo ? (
            <section
              aria-label="Interactive demo"
              className="mt-5 overflow-hidden rounded-xl border border-line bg-elevated"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-line px-4 py-2.5 md:px-5">
                <span className="eyebrow">{demo.eyebrow ?? "Interactive demo"}</span>
                <Badge variant="mint" size="sm">
                  Synthetic data · runs in your browser
                </Badge>
              </div>
              <p className="border-b border-line bg-elevated px-4 py-2.5 text-xs leading-relaxed text-ink-2 md:px-5">
                {demo.caption}
              </p>
              <div className="bg-surface p-4 md:p-5">
                <Suspense fallback={<DemoFallback />}>
                  <demo.Component />
                </Suspense>
              </div>
            </section>
          ) : null}

          {page ? (
            <section
              aria-label="Interactive demo"
              className="mt-5 overflow-hidden rounded-xl border border-line bg-elevated"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-line px-4 py-2.5 md:px-5">
                <span className="eyebrow">{page.eyebrow ?? "Interactive demo"}</span>
                <Badge variant="mint" size="sm">
                  Synthetic data · full page
                </Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 md:px-5">
                <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink-2">
                  {page.caption}
                </p>
                <Button asChild size="sm" className="shrink-0">
                  <a href={page.href} target="_blank" rel="noopener noreferrer">
                    {page.cta}
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </div>
            </section>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {project.metrics.map((m, i) => (
              <MetricPill key={i} metric={m} />
            ))}
          </div>

          <div className="mt-5 rounded-lg border-l-2 border-brand-line bg-sunken/60 px-4 py-3.5">
            <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
              How it's built
            </div>
            <p className="text-[0.8125rem] leading-relaxed text-ink-2">{project.note}</p>
          </div>

          <div className="mt-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
              Stack
            </div>
            <div className="flex flex-wrap gap-1.5">
              {project.stack.map((s) => (
                <TechChip key={s}>{s}</TechChip>
              ))}
            </div>
          </div>

          {project.tags && project.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.tags.map((t) => (
                <Badge key={t} variant="outline" size="sm">
                  {t}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
