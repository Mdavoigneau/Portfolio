import {
  BarChart3,
  Braces,
  Compass,
  Component,
  Landmark,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Container, Section, SectionHead } from "@/components/ui/section";

interface Capability {
  icon: LucideIcon;
  title: string;
  body: string;
  evidence: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: Component,
    title: "Design systems for data-dense domains",
    body: "Foundations → Components → Patterns → Templates, owned end-to-end and held to the line on consistency, visual polish and WCAG 2.2 AA. A reusable component system shared across two dozen products.",
    evidence: "Tokens, CVA + clsx + tailwind-merge, Radix primitives: exactly this page.",
  },
  {
    icon: BarChart3,
    title: "Data tables & charting that carry the workflow",
    body: "Headless tables (TanStack / AG Grid) styled from my own tokens, and charts built from primitives (D3 + raw SVG) when the chart is the product. I reach for a charting library only when it's plumbing, not the point.",
    evidence: "The live grid and raw-SVG chart above are the demonstration.",
  },
  {
    icon: Sparkles,
    title: "AI UX inside serious tools",
    body: "Streaming, grounding and human-in-the-loop as first-class UX, not bolt-ons: NDJSON-streamed agent steps, answers cited to their source, and a human reading the evidence before anything is approved.",
    evidence: "On-device document agent · AI compliance reviewer · MCP tool surfaces.",
  },
  {
    icon: Braces,
    title: "Typed contracts over relational data",
    body: "TypeScript in strict mode end-to-end, Zod-validated boundaries, and a typed client over the database. Schemas as the single source of truth for the UI, the exports and the API alike.",
    evidence: "PostgreSQL / SQLite (WAL), Zod, typed envelopes on every route.",
  },
  {
    icon: Landmark,
    title: "Finance, spoken natively",
    body: "NAV and FSC-17 unit pricing, double-entry ledgers, risk statistics, geometric annualisation, margin blends. I present financial data the way sophisticated readers expect it, and I invest in equities and derivatives myself.",
    evidence: "Fund-admin ledger · SMA risk dashboard · proposal engine · quant research.",
  },
  {
    icon: Compass,
    title: "First principles & real autonomy",
    body: "Twenty-four production systems shipped solo on ~$190/month of infrastructure. Maths derived by hand where it matters, and a bias toward telling you exactly what I have and haven't done over a confident bluff.",
    evidence: "Independent delivery, end-to-end, with audit logging and human-review gates.",
  },
];

export function Capabilities() {
  return (
    <Section id="capabilities">
      <Container>
        <SectionHead
          eyebrow="Capabilities"
          title={
            <>
              Built for a data-dense{" "}
              <span className="font-serif italic text-brand-700">product surface</span>.
            </>
          }
          lead="The throughline across the work above, and what I bring to a serious, data-dense financial product."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => {
            const Icon = c.icon;
            return (
              <Card key={c.title} className="flex h-full flex-col p-6">
                <span
                  className="grid size-11 place-items-center rounded-xl"
                  style={{ background: "var(--color-mint)", color: "var(--color-mint-deep)" }}
                  aria-hidden
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-lg tracking-tight text-ink">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{c.body}</p>
                <p className="mt-auto pt-4 font-mono text-[11px] leading-relaxed text-ink-3">
                  {c.evidence}
                </p>
              </Card>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
