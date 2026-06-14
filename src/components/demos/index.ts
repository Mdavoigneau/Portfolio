import { lazy, type ComponentType, type LazyExoticComponent } from "react";

/**
 * Interactive miniatures of real production tools, rebuilt for the page on
 * 100% synthetic data. Keyed by project id (src/lib/projects.ts); each demo
 * is code-split and only loads when its dialog opens.
 */
export interface DemoEntry {
  Component: LazyExoticComponent<ComponentType>;
  /** one calm line under the demo header explaining what to try */
  caption: string;
  /** optional override for the section eyebrow (defaults to "Interactive demo") */
  eyebrow?: string;
}

export const DEMOS: Record<string, DemoEntry> = {
  "team-planner": {
    Component: lazy(() => import("./team-planner")),
    caption:
      "A working miniature of the planner: three days, hot desks and resources, every change (typed form or plain English) validated through the same action schema before it can touch state.",
  },
  "refurb-price": {
    Component: lazy(() => import("./flipfinder")),
    caption:
      "The real two-screen tool on synthetic data: live-ranked top movers, a smart-filtered model workspace, least-squares momentum and the dual-VAT margin calculator.",
  },
  "mp-email": {
    Component: lazy(() => import("./EmailPipelineDemo")),
    caption:
      "Step through the backend pipeline an email travels: triage, retrieval over historic replies, drafting, diary extraction.",
  },
  "smsf-agent": {
    Component: lazy(() => import("./SmsfAgentDemo")),
    caption:
      "Ask a synthetic fund's documents a question and watch the on-device agent run: plan, tool calls, corroboration, a cited answer, with the real NDJSON event stream alongside.",
  },
  "compliance-reviewer": {
    Component: lazy(() => import("./ComplianceReviewerDemo")),
    caption:
      "Submit an invented promo and watch the production phases run: extract, AI review with cited findings, then the human approval chain that always has the last word.",
  },
  "asx-scanner": {
    Component: lazy(() => import("./asx-scanner")),
    caption:
      "A real yfinance snapshot of 20 ASX large caps, ranked the production way; connect the (simulated) IBKR feed to overlay live ticks on the movers that matter and watch them re-rank.",
  },
  "smsf-intake": {
    Component: lazy(() => import("./smsf-intake")),
    caption:
      "Both intake channels, driven end to end by one typed questions config: member templates expand live, validation bites, and a white-label switch re-skins everything.",
  },
  "trend-following": {
    Component: lazy(() => import("./trend-following")),
    caption:
      "Three lenses on the research: the Clenow momentum score and its filters computed live on four archetype stocks, the walk-forward ML regime classifier (its features, its no-leakage training, the probability scaling exposure), and the 36-year track record vs SPY with an honest log of what did not beat the baseline.",
  },
  "irep-claim": {
    Component: lazy(() => import("./irep-terminal")),
    eyebrow: "Where it started · terminal tool",
    caption:
      "Before it was a web app, the government repair-incentive claims ran in this Python terminal tool, built fast under an emergency. Replay one Ecologic case end to end: the ticket review, the Drive document pick, the IMEI prompt, the brand / product / IRIS picker, then CreateClaim and submit.",
  },
};

export function hasDemo(id: string): boolean {
  return id in DEMOS;
}

/**
 * Full-page demos. Where an in-dialog miniature would not do the tool justice,
 * the demo is a standalone page (its own Vite entry, code-split from the site).
 * Keyed by project id; the dialog renders a call-to-action that opens it.
 */
export interface DemoPage {
  /** path to the standalone page */
  href: string;
  /** one calm line in the dialog explaining what the page is */
  caption: string;
  /** label on the call-to-action button */
  cta: string;
  /** optional override for the section eyebrow (defaults to "Interactive demo") */
  eyebrow?: string;
}

export const DEMO_PAGES: Record<string, DemoPage> = {
  "orange-analytics": {
    href: "/orange-analytics/",
    caption:
      "The original internal tool, rebuilt from its own source: a Next.js + shadcn/ui dashboard with an amCharts world map and Recharts breakdowns, on synthetic delivery events. Three sections (Dashboard KPIs by channel with the country heatmap, SMS/Mail analytics, and Utilities: address tracker, invalid-address analyzer and a period comparator), light and dark. The Elasticsearch backend is retired, so a built-in shim feeds it in the browser.",
    cta: "Open the dashboard",
  },
  "irep-claim": {
    href: "/irep-claim/",
    eyebrow: "What it became · the web app",
    caption:
      "What the terminal tool grew into: the real Next.js web app, rebuilt from its own source. Work a queue of pending cases, read the device nameplate and the signed customer validation from Drive, let OCR lift the IMEI off the photo, confirm the Ecologic IRIS or Ecosystem repair type, then submit the compliant claim while a live job runs the stages. The Google / RepairShopr / Ecologic backend is retired, so a built-in shim feeds it in the browser.",
    cta: "Open the web app",
  },
};

export function hasDemoPage(id: string): boolean {
  return id in DEMO_PAGES;
}

/** Either kind of demo: an in-dialog miniature or a standalone page. */
export function hasAnyDemo(id: string): boolean {
  return hasDemo(id) || hasDemoPage(id);
}
