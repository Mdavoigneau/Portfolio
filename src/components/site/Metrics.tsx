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
          Most time-saved figures are reported by the teams using the tools; the rest are my own
          estimates. Each project's source is marked in the ledger below.
        </p>
      </Container>
    </div>
  );
}
