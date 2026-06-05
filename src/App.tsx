import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Metrics } from "@/components/site/Metrics";
import { LiveProof } from "@/components/site/LiveProof";
import { SelectedWork } from "@/components/site/SelectedWork";
import { ProjectLedger } from "@/components/site/ProjectLedger";
import { Capabilities } from "@/components/site/Capabilities";
import { About } from "@/components/site/About";
import { Contact } from "@/components/site/Contact";

export function App() {
  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={300}>
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Header />
      <main>
        <Hero />
        <Metrics />
        <LiveProof />
        <SelectedWork />
        <ProjectLedger />
        <Capabilities />
        <About />
        <Contact />
      </main>
    </TooltipProvider>
  );
}
