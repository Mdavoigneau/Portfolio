import { type ReactNode } from "react";
import { Badge, TechChip } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Eyebrow, Section, SectionHead } from "@/components/ui/section";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HoldingsGrid } from "@/components/grid/HoldingsGrid";

interface ChipNote {
  label: ReactNode;
  note: string;
}

const CHIP_NOTES: ChipNote[] = [
  { label: <>TanStack&nbsp;Table</>, note: "Headless: sorting, the model and state are mine; the markup and styling are entirely the design system. (Used live in the table below.)" },
  { label: <>AG&nbsp;Grid</>, note: "Where a virtualised, enterprise-grade grid earns its weight: large position sets, pinning, grouping." },
  { label: <>D3&nbsp;+&nbsp;raw&nbsp;SVG</>, note: "Scales from d3; the paths, axes and interaction written by hand, with no charting wrapper. That's the chart above." },
];

interface Swatch {
  token: string;
  varName: string;
  onDark?: boolean;
}

const SWATCHES: Swatch[] = [
  { token: "brand", varName: "--color-brand", onDark: true },
  { token: "brand-deep", varName: "--color-brand-deep", onDark: true },
  { token: "mint", varName: "--color-mint" },
  { token: "pos", varName: "--color-pos", onDark: true },
  { token: "neg", varName: "--color-neg", onDark: true },
  { token: "ink", varName: "--color-ink", onDark: true },
  { token: "paper", varName: "--color-paper" },
  { token: "line", varName: "--color-line" },
];

export function LiveProof() {
  return (
    <Section id="proof" divider={false}>
      <Container>
        <SectionHead
          eyebrow="Built in the open"
          title={
            <>
              The medium <span className="font-serif italic text-brand-700">is</span> the message.
            </>
          }
          lead="No screenshots to take on faith. The chart above and the table below are live: a headless data table and raw-SVG charting, styled entirely from one set of design tokens."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* The live grid */}
          <Card className="min-w-0 lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div>
                <Eyebrow className="mb-1">Sample model portfolio</Eyebrow>
                <p className="text-sm text-ink-2">Headless table · sortable · tabular figures</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CHIP_NOTES.map((c, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <TechChip className="cursor-help">{c.label}</TechChip>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[16rem] leading-relaxed">
                      {c.note}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
            <div className="p-3 md:p-5">
              <HoldingsGrid />
            </div>
          </Card>

          {/* Foundations panel */}
          <Card className="min-w-0 lg:col-span-4">
            <div className="border-b border-line px-6 py-4">
              <Eyebrow className="mb-1">Foundations</Eyebrow>
              <p className="text-sm text-ink-2">Tokens, type & components: one source of truth</p>
            </div>
            <div className="space-y-6 p-6">
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  Colour
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {SWATCHES.map((s) => (
                    <div key={s.token} className="text-center">
                      <div
                        className="mb-1 h-9 w-full rounded-md border border-line"
                        style={{ background: `var(${s.varName})` }}
                        title={s.varName}
                      />
                      <div className="font-mono text-[9px] text-ink-3">{s.token}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  Type
                </div>
                <p className="font-serif text-xl italic text-ink">Fraunces · display</p>
                <p className="text-sm text-ink-2">Figtree · the workhorse for body and UI</p>
                <p className="font-mono text-xs text-ink-3">Geist Mono · labels · 0123456789</p>
              </div>

              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-3">
                  Components
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Primary</Button>
                  <Button size="sm" variant="outline">
                    Outline
                  </Button>
                  <Badge variant="mint">CVA</Badge>
                  <Badge variant="pos">+2.4%</Badge>
                  <Badge variant="neg">−0.9%</Badge>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-ink-3">
                  Variants via CVA + clsx + tailwind-merge; primitives on Radix; visible focus
                  states and reduced-motion baked in.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
