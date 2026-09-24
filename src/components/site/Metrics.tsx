import { ArrowDown } from "lucide-react";
import { Container } from "@/components/ui/section";
import { METRICS } from "@/lib/site";

export function Metrics() {
  return (
    <div className="border-y border-line bg-elevated">
      <Container className="grid grid-cols-2 gap-px md:grid-cols-4">
        {METRICS.map((m, i) => (
          <div
            key={m.label}
            className={
              "px-2 py-8 md:px-6 " +
              (i > 0 ? "md:border-l md:border-line" : "")
            }
          >
            <div className="tnum font-serif text-3xl tracking-tight text-ink md:text-4xl">
              {m.value}
            </div>
            <div className="mt-1.5 text-sm leading-snug text-ink-2">{m.label}</div>
          </div>
        ))}
      </Container>
      <Container>
        <p className="border-t border-line/60 py-3 text-center text-xs text-ink-3">
          The hours count only what the teams using the tools reported. Where a figure is my own
          estimate,{" "}
          <a
            href="#ledger"
            className="inline-flex items-center gap-0.5 font-medium text-brand-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            the ledger
            <ArrowDown className="size-3" />
          </a>{" "}
          says so.
        </p>
      </Container>
    </div>
  );
}
