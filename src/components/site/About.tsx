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
              I'm a master's-qualified software engineer in Sydney, originally from France. I like building things
              end-to-end, from the front-end down to the box they run on, and I've shipped
              twenty-two production systems solo so far. Most of that has been at a Sydney financial
              institution, across private wealth, funds administration, SMSF and compliance. Before
              that I ran a phone-repair business myself, which taught me more about where real
              processes break than any course did.
            </p>
            <p>
              My interest in markets goes back a while. During the 2021 crypto cycle a close friend,
              Gauthier (now a quant in Dubai), and I spent the better part of a year trying to
              understand the machinery underneath it: order books, derivatives, how settlement
              actually works. We'd take a thesis, argue it, break it, and start again. I still
              invest in equities and derivatives, and a fair bit of what I build comes from wanting
              better tools for it.
            </p>
            <p>
              I work from first principles and try to stay honest about the edges of what I know. I
              derive the maths by hand when it matters, put audit logging and human-review gates
              wherever data is sensitive, and keep things lean. I'm happiest owning a problem
              end-to-end with room to think, and I'll always rather tell you exactly what I have and
              haven't done than oversell it.
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
