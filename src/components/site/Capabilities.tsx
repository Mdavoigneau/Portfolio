import {
  BarChart3,
  Compass,
  Landmark,
  Layers,
  ShieldCheck,
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
    icon: Layers,
    title: "End-to-end, front-end to infrastructure",
    body: "I build whole verticals on my own: a typed React front-end, the API and relational schema behind it, auth and audit logging, and the box it runs on. No layer of the stack is left to someone else.",
    evidence: "Every system here: UI, data model, deploy, backups.",
  },
  {
    icon: Sparkles,
    title: "AI that ships, not demos",
    body: "Retrieval-augmented drafting over thousands of real emails, an on-device document agent, vision OCR, and Claude exposed as live tools over MCP. Streaming, grounded in sources, with a human in the loop.",
    evidence: "On-device SMSF agent · MP email RAG · compliance reviewer · MCP tools.",
  },
  {
    icon: ShieldCheck,
    title: "Security & compliance by default",
    body: "Encryption at rest (AES-256-GCM, SQLCipher), SSO with per-request revalidation, append-only audit ledgers, and human-review gates. Built for regulated data from the first commit.",
    evidence: "Fund ledger · SMSF intake · proposal engine · compliance reviewer.",
  },
  {
    icon: BarChart3,
    title: "Interfaces that present numbers people act on",
    body: "Dashboards, sortable tables and charts built from primitives (raw SVG, no wrapper when the chart is the point). The detail a reader needs, without the clutter.",
    evidence: "The live chart and grid above · risk dashboards · price analytics.",
  },
  {
    icon: Landmark,
    title: "Finance, spoken natively",
    body: "NAV and FSC-17 unit pricing, double-entry ledgers, risk statistics, geometric annualisation, margin blends. I present financial data the way sophisticated readers expect it, and I invest in equities and derivatives myself.",
    evidence: "Fund-admin ledger · managed-accounts dashboard · proposal engine · quant research.",
  },
  {
    icon: Compass,
    title: "First principles & real autonomy",
    body: "Twenty-two production systems shipped solo, most on a $5–7/month box. Maths derived by hand where it matters, and a bias toward telling you exactly what I have and haven't done over a confident bluff.",
    evidence: "Independent delivery, end-to-end, with audit logging and human-review gates.",
  },
];

export function Capabilities() {
  return (
    <Section id="capabilities">
      <Container>
        <SectionHead
          eyebrow="How I work"
          title={
            <>
              The same few <span className="font-serif italic text-brand-700">strengths</span>,
              across very different work.
            </>
          }
          lead="Across the systems above, in finance, telecoms, an MP's office and ventures of my own, the same patterns keep showing up."
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
