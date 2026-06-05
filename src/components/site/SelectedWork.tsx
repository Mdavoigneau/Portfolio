import { Badge, TechChip } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container, Eyebrow, Section, SectionHead } from "@/components/ui/section";
import { ALSO_SHIPPED, FEATURED, type Project } from "@/lib/projects";

function WorkCard({ p }: { p: Project }) {
  return (
    <Card interactive className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <Eyebrow>{p.context}</Eyebrow>
        <Badge variant="mint" size="sm" className="tnum shrink-0 whitespace-nowrap">
          {p.metric}
        </Badge>
      </div>

      <h3 className="mt-3 text-xl tracking-tight text-ink">{p.title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-ink-2">{p.blurb}</p>

      <div className="mt-4 rounded-lg border-l-2 border-brand-line bg-sunken/60 px-3.5 py-3">
        <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
          How it's built
        </div>
        <p className="text-[0.8125rem] leading-relaxed text-ink-2">{p.note}</p>
      </div>

      <div className="mt-auto pt-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {p.tags.map((t) => (
            <Badge key={t} variant="outline" size="sm">
              {t}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {p.stack.map((s) => (
            <TechChip key={s}>{s}</TechChip>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function SelectedWork() {
  return (
    <Section id="work" wash>
      <Container>
        <SectionHead
          eyebrow="Selected work"
          title={
            <>
              Systems people <span className="font-serif italic text-brand-700">rely</span> on.
            </>
          }
          lead="Production work across private wealth, funds administration, SMSF and compliance, plus a business of my own and quant research on the side. All live in production; client identifiers, holdings and credentials are deliberately omitted."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {FEATURED.map((p) => (
            <WorkCard key={p.title} p={p} />
          ))}
        </div>

        {/* Also shipped */}
        <div className="mt-12">
          <Eyebrow className="mb-5">Also in production</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALSO_SHIPPED.map((m) => (
              <div
                key={m.title}
                className="rounded-lg border border-line bg-surface/70 p-4"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h4 className="text-sm font-medium text-ink">{m.title}</h4>
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  {m.context}
                </div>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-2">{m.blurb}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-ink-3">
            … and more: SMSF client-data intake portals, fund-admin sync integrations, a daily
            imports orchestrator, an AI email router for an MP's office, on-device transcription.
          </p>
        </div>
      </Container>
    </Section>
  );
}
