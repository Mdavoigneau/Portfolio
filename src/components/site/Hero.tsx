import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Eyebrow } from "@/components/ui/section";
import { NavChart } from "@/components/charts/NavChart";
import { NAV_SERIES, cagr, maxDrawdown } from "@/lib/data";
import { pct } from "@/lib/format";
import { SITE } from "@/lib/site";

export function Hero() {
  const stratCagr = cagr(NAV_SERIES, "nav");
  const stratMdd = maxDrawdown(NAV_SERIES, "nav");

  return (
    <div id="top" className="relative overflow-hidden">
      {/* atmospheric backdrop: soft, low-contrast */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 size-[28rem] rounded-full bg-mint/50 blur-3xl" />
        <div className="absolute right-0 top-10 size-[24rem] rounded-full bg-brand/10 blur-3xl" />
        <div className="dotted absolute inset-0 text-ink opacity-[0.05]" />
      </div>

      <Container className="grid items-center gap-12 pb-20 pt-16 md:grid-cols-12 md:pb-28 md:pt-24">
        <div className="min-w-0 md:col-span-6 lg:col-span-5">
          <Eyebrow className="reveal">Full-stack & AI engineer · Sydney</Eyebrow>
          <h1 className="reveal mt-4 text-[2rem] leading-[1.06] tracking-tight text-ink sm:text-[2.75rem] sm:leading-[1.04] lg:text-6xl">
            I build the financial-data surfaces sophisticated readers{" "}
            <span className="swash text-brand-700">
              trust
              <span className="swash-bar" aria-hidden />
            </span>
            .
          </h1>
          <p className="reveal mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
            Dashboards, charts, reconciliation, NAV ledgers: the product surface boards,
            investors and lenders actually see. Owned end-to-end, from the design system down to
            the infrastructure it runs on.
          </p>

          <div className="reveal mt-6 max-w-xl rounded-lg border border-line bg-elevated/70 p-4">
            <p className="text-sm leading-relaxed text-ink-2">
              <span className="font-medium text-ink">This page is one of those surfaces.</span>{" "}
              React 18, TypeScript (strict), Vite, Tailwind v4, Radix. The chart beside it is
              raw SVG, with no charting library.
            </p>
          </div>

          <div className="reveal mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg">
              <a href="#work">
                See the work <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={SITE.resume} target="_blank" rel="noopener noreferrer">
                Résumé
              </a>
            </Button>
          </div>
        </div>

        <div className="min-w-0 md:col-span-6 lg:col-span-7">
          <Card className="reveal p-5 md:p-6">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <Eyebrow className="mb-1">Growth of strategy vs benchmark</Eyebrow>
                <p className="text-sm text-ink-3">Rebased to 100 · monthly · synthetic</p>
              </div>
              <div className="flex gap-5 text-right">
                <div>
                  <div className="eyebrow mb-1">CAGR</div>
                  <div className="tnum font-serif text-lg text-pos">{pct(stratCagr, 1)}</div>
                </div>
                <div>
                  <div className="eyebrow mb-1">Max DD</div>
                  <div className="tnum font-serif text-lg text-neg">{pct(stratMdd, 1)}</div>
                </div>
              </div>
            </div>
            <NavChart series={NAV_SERIES} />
          </Card>
        </div>
      </Container>
    </div>
  );
}
