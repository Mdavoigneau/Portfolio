import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow } from "@/components/ui/section";
import { HoursChart } from "@/components/charts/HoursChart";
import { FIRM_IN_PRODUCTION, SITE } from "@/lib/site";

export function Hero() {
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
          <Eyebrow className="reveal">{SITE.role} · Sydney</Eyebrow>
          <h1 className="reveal mt-4 text-[2rem] leading-[1.06] tracking-tight text-ink sm:text-[2.75rem] sm:leading-[1.04] lg:text-6xl">
            I build AI and automation that teams actually{" "}
            <span className="swash text-brand-700">
              use
              <span className="swash-bar" aria-hidden />
            </span>
            .
          </h1>
          <p className="reveal mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
            I sit with the people doing the work, find what eats their week, and build the tool
            that gives it back. At a Sydney financial firm, that meant rolling Claude out to ~30
            staff and putting {FIRM_IN_PRODUCTION} systems into production in six months.
          </p>

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
          <HoursChart className="reveal" />
        </div>
      </Container>
    </div>
  );
}
