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
  "smsf-intake": {
    Component: lazy(() => import("./smsf-intake")),
    caption:
      "Both intake channels, driven end to end by one typed questions config: member templates expand live, validation bites, and a white-label switch re-skins everything.",
  },
};

export function hasDemo(id: string): boolean {
  return id in DEMOS;
}
