import { Card } from "@/components/ui/card";
import { Container, Eyebrow, Section } from "@/components/ui/section";

interface Fact {
  label: string;
  value: string;
}

const FACTS: Fact[] = [
  {
    label: "Core stack",
    value: "React · TypeScript (strict) · Vite · Tailwind · Radix · Node / Python · PostgreSQL / SQLite · AWS / GCP · Claude API + MCP.",
  },
  {
    label: "Finance",
    value: "Active equities & derivatives investor; I read financial statements for fun and build the tools I wish existed.",
  },
  { label: "Languages", value: "Fluent in English and French." },
  { label: "Based", value: "Sydney, Australia." },
];

interface Degree {
  qualification: string;
  detail: string;
}

const DEGREES: Degree[] = [
  {
    qualification: "M.Sc. Digital Sciences & Management (MIAGE)",
    detail: "Université de Bordeaux, 2022–24 · first-class honours (distinction average).",
  },
  {
    qualification: "B.Sc. Computer Science & IT Systems (MIAGE)",
    detail: "Université de Bordeaux, 2019–22 · first-class honours · top of graduating class.",
  },
];

export function About() {
  return (
    <Section id="about" wash>
      <Container className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <Eyebrow className="mb-3">About</Eyebrow>
          <p className="font-serif text-2xl leading-snug tracking-tight text-ink md:text-3xl">
            I care more about <span className="italic text-brand-700">why</span> a number is right
            than which library produced it.
          </p>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-ink-2">
            <p>
              I'm a master's-qualified engineer who builds end-to-end: front-end through to
              infrastructure, AI agents through to audit logging. I've shipped twenty-two
              production systems solo; most recently at a Sydney financial institution, across
              private wealth, funds administration, SMSF, compliance and operations. Before that I
              ran a repair business end-to-end, which is where I learned firsthand where real-world
              processes actually break.
            </p>
            <p>
              My interest in markets is neither recent nor decorative. It took hold during the 2021
              crypto cycle, when a close friend (Gauthier, now a quant in Dubai) and I spent the
              better part of a year reverse-engineering the machinery underneath it: order books and
              derivatives, market structure, how settlement actually works. We'd argue a thesis,
              break it, and rebuild it. Years of that later I invest in equities and derivatives
              myself, which is why presenting financial data the way demanding readers expect comes
              naturally rather than as a stretch.
            </p>
            <p>
              I work from first principles and in the open: I derive the maths by hand where it
              matters, put audit logging and human-review gates wherever data is sensitive, and
              keep the whole estate running on a rounding error of infrastructure. I'm most useful
              owning a surface end-to-end with minimal supervision, and I'd rather give you a
              defended "here's exactly what I have and haven't done" than a confident bluff.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 md:col-span-5">
          <Card className="p-6">
            <Eyebrow className="mb-4">Academic background</Eyebrow>
            <ul className="space-y-3">
              {DEGREES.map((d) => (
                <li key={d.qualification}>
                  <p className="text-sm font-medium text-ink">{d.qualification}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-2">{d.detail}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line/70 pt-4 text-sm leading-relaxed text-ink-2">
              MIAGE pairs computer science with quantitative business methods: a systems-and-numbers
              training. Standout marks in the subjects that matter here:{" "}
              <span className="text-ink">Probability &amp; Statistics</span>,{" "}
              <span className="text-ink">Programming</span> and{" "}
              <span className="text-ink">Finance</span> (16.7, 18.6 and 17 out of 20).
            </p>
          </Card>

          <Card className="p-6">
            <Eyebrow className="mb-4">At a glance</Eyebrow>
            <dl className="space-y-4">
              {FACTS.map((f) => (
                <div key={f.label}>
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-ink-3">
                    {f.label}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink-2">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
