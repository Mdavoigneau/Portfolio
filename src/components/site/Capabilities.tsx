import {
  Compass,
  Landmark,
  Layers,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Container, Section, SectionHead } from "@/components/ui/section";
import { FIRM_SYSTEMS } from "@/lib/projects";

interface Capability {
  icon: LucideIcon;
  title: string;
  body: string;
  evidence: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: Sparkles,
    title: "AI that ships, not demos",
    body: "Retrieval-augmented drafting over thousands of real emails, an on-device document agent, vision OCR, and Claude exposed as live tools over MCP. Streaming, grounded in sources, with a human in the loop.",
    evidence: "On-device SMSF agent · MP email RAG · compliance reviewer · MCP tools.",
  },
  {
    icon: Users,
    title: "Adoption, one team at a time",
    body: "Tools only matter if people use them. I rolled Claude out across a ~30-person firm by learning each team's work first, then shaping its setup, its training and the guardrails around that work.",
    evidence: "Claude rollout · AI-delivery knowledge base · internal training.",
  },
  {
    icon: Layers,
    title: "End-to-end, with the teams",
    body: "I build whole systems: a typed React front-end, the API and schema behind it, auth and audit logging, and the box it runs on. The requirements come straight from the people who will use it.",
    evidence: `${FIRM_SYSTEMS.length} systems at one firm, requirements from its own teams.`,
  },
  {
    icon: ShieldCheck,
    title: "Security & compliance by default",
    body: "Encryption at rest (AES-256-GCM, SQLCipher), SSO with per-request revalidation, append-only audit ledgers, and human-review gates. Built for regulated data from the first commit.",
    evidence: "Fund ledger · SMSF intake · proposal engine · compliance reviewer · phishing simulation.",
  },
  {
    icon: Landmark,
    title: "Finance, spoken natively",
    body: "NAV and FSC-17 unit pricing, double-entry ledgers, risk statistics, geometric annualisation, margin blends. I know the domain well enough to get the numbers right, and I invest in equities and derivatives myself.",
    evidence: "Fund-admin ledger · managed-accounts dashboard · proposal engine · quant research.",
  },
  {
    icon: Compass,
    title: "First principles & honest numbers",
    body: "Maths derived by hand where it matters, costs kept lean (most systems run on a $5–7/month box), and every impact figure on this page marked with where it came from.",
    evidence: "Provenance on every figure · audit logging · human-review gates.",
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
