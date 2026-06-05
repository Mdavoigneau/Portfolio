import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/section";
import { NAV, SITE } from "@/lib/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/80 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
          <span
            className="grid size-7 place-items-center rounded-md font-serif text-sm font-medium italic"
            style={{ background: "var(--color-brand-deep)", color: "var(--color-mint)" }}
            aria-hidden
          >
            M
          </span>
          <span className="text-sm font-medium text-ink">{SITE.name}</span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {NAV.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3 py-1.5 text-sm text-ink-2 transition-colors hover:bg-sunken hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden size-9 px-0 sm:inline-flex"
          >
            <a
              href={SITE.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Source on GitHub"
            >
              <Github className="size-4" />
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <a href={SITE.resume} target="_blank" rel="noopener noreferrer">
              Résumé
            </a>
          </Button>
          <Button asChild size="sm">
            <a href="#contact">Get in touch</a>
          </Button>
        </div>
      </Container>
    </header>
  );
}
