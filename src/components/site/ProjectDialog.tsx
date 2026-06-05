import { type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge, TechChip } from "@/components/ui/badge";
import { MetricPill, StatusBadge } from "@/components/ui/provenance";
import { type Project } from "@/lib/projects";

/** Wraps any trigger element; opens a details dialog for the project. */
export function ProjectDialog({
  project,
  children,
}: {
  project: Project;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
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
