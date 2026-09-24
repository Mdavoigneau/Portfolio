import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/section";
import { ProjectDialog } from "@/components/site/ProjectDialog";
import { cn } from "@/lib/cn";
import { FIRM_SYSTEMS, FIRM_TEAM_HOURS, PROVENANCE_LABEL, timeSaved } from "@/lib/projects";

/** Row labels: the ledger titles are too long for a bar chart. */
const SHORT: Record<string, string> = {
  "smsf-intake": "SMSF intake",
  "unit-trust": "Unit-trust admin",
  "proposal-engine": "Proposal engine",
  "smsf-agent": "SMSF doc agent",
  "fact-find": "Client fact-find",
  "landing-platform": "Campaign pages",
  "sma-dashboard": "Managed accounts",
  "compliance-reviewer": "Compliance review",
  "strategy-papers": "Strategy papers",
  csat: "Client surveys",
  "share-registry": "Share registry",
  "team-planner": "Team planner",
  transcription: "Transcription",
};

const ROWS = FIRM_SYSTEMS.flatMap((project) => {
  const saved = timeSaved(project);
  return saved ? [{ project, saved }] : [];
}).sort((a, b) => b.saved.hours - a.saved.hours);

const MAX_HOURS = Math.max(1, ...ROWS.map((r) => r.saved.hours));

/**
 * Hours a month each system gives back at the firm, from the same ledger the
 * rest of the page reads. Dark bars were reported by the team using the tool;
 * light ones are my own estimate, and the headline total counts only the dark.
 */
export function HoursChart({ className }: { className?: string }) {
  return (
    <Card className={cn("p-5 md:p-6", className)}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <Eyebrow className="mb-1">Hours given back each month</Eyebrow>
          <p className="text-sm text-ink-3">Per system, at one Sydney financial firm</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="tnum font-serif text-2xl leading-none text-ink">
            ~{Math.round(FIRM_TEAM_HOURS / 10) * 10}
          </div>
          <div className="mt-1 text-xs text-ink-3">reported by the teams</div>
        </div>
      </div>

      <ul className="-mx-1.5">
        {ROWS.map(({ project, saved }) => {
          const isTeam = saved.provenance === "team";
          return (
            <li key={project.id}>
              <ProjectDialog project={project}>
                <button
                  type="button"
                  className="group grid w-full grid-cols-[8rem_minmax(0,1fr)_2.75rem] items-center gap-3 rounded-md px-1.5 py-[0.3125rem] text-left text-[0.8125rem] transition-colors hover:bg-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:grid-cols-[9.5rem_minmax(0,1fr)_3.5rem] sm:text-sm"
                >
                  <span className="truncate text-ink-2 transition-colors group-hover:text-ink">
                    {SHORT[project.id] ?? project.title}
                  </span>
                  <span className="relative h-2 rounded-full bg-sunken" aria-hidden>
                    <span
                      className={cn(
                        "absolute inset-y-0 left-0 min-w-1.5 rounded-full",
                        isTeam ? "bg-brand" : "bg-brand/25"
                      )}
                      style={{ width: `${(saved.hours / MAX_HOURS) * 100}%` }}
                    />
                  </span>
                  <span className="tnum whitespace-nowrap text-right text-ink">
                    {saved.display}
                    <span className="hidden text-ink-3 sm:inline" aria-hidden>
                      {" "}h
                    </span>
                    <span className="sr-only">
                      {" "}hours a month, {PROVENANCE_LABEL[saved.provenance].toLowerCase()}
                    </span>
                  </span>
                </button>
              </ProjectDialog>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line/70 pt-3 text-xs text-ink-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-brand" aria-hidden /> reported by the team
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-brand/25" aria-hidden /> my own estimate
          </span>
        </div>
        <span>Open any row for the detail</span>
      </div>
    </Card>
  );
}
