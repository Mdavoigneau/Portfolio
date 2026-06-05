import { ArrowRight, Github, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow, Section } from "@/components/ui/section";
import { SITE } from "@/lib/site";

export function Contact() {
  return (
    <>
      <Section id="contact">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <Eyebrow className="mb-4">Contact</Eyebrow>
            <h2 className="text-4xl tracking-tight text-ink md:text-5xl">
              If your clients stake decisions on it,{" "}
              <span className="font-serif italic text-brand-700">it's worth building well</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-2">
              I'm open to a conversation about owning the product surface of a serious financial
              tool, end-to-end. The fastest way to reach me is email or a call.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <a href={`mailto:${SITE.email}`}>
                  <Mail className="size-4" /> {SITE.email}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={SITE.phoneHref}>
                  <Phone className="size-4" /> {SITE.phone}
                </a>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <a href={SITE.resume} target="_blank" rel="noopener noreferrer">
                  Résumé <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>

            <p className="mt-6 inline-flex items-center gap-1.5 text-sm text-ink-3">
              <MapPin className="size-3.5" /> {SITE.location}
            </p>
          </div>
        </Container>
      </Section>

      <footer className="border-t border-line bg-elevated">
        <Container className="flex flex-col gap-6 py-10">
          <p className="max-w-3xl text-xs leading-relaxed text-ink-3">
            <span className="font-medium text-ink-2">A note on the work shown:</span> several
            systems above are live, regulated platforms built for a licensed brokerage. Client
            identifiers, holdings, credentials and screenshots are deliberately omitted, and every
            figure on this page is illustrative or synthetic. Discretion with client data is part
            of the job.
          </p>
          <div className="flex flex-col items-start justify-between gap-4 border-t border-line/60 pt-6 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-2">
              <span>© {SITE.name} · {SITE.site}</span>
              <a
                href={SITE.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <Github className="size-3.5" /> Source on GitHub
              </a>
              <a
                href={SITE.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <Linkedin className="size-3.5" /> Want something more professional?
              </a>
            </div>
            <p className="font-mono text-[11px] leading-relaxed text-ink-3">Built with React 18</p>
          </div>
        </Container>
      </footer>
    </>
  );
}
