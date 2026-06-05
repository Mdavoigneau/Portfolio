/**
 * Curated, genericised project content.
 *
 * Client names, holdings, account numbers, credentials and screenshots are
 * deliberately omitted: these are live, regulated systems. Framing favours the
 * financial substance, with the first-principles technical detail stated
 * precisely (and honestly: where a charting library was the right call, it says so).
 */

export interface Project {
  title: string;
  context: string;
  blurb: string;
  metric: string;
  /** the first-principles / "why it's hard" detail */
  note: string;
  stack: string[];
  /** JD pillars this evidences, for the reader who's matching against the brief */
  tags: string[];
}

export const FEATURED: Project[] = [
  {
    title: "Refurbished-market price intelligence",
    context: "Own business · Repairoo",
    blurb:
      "Built to sharpen the pricing in a low-margin business of my own: a daily crawl of the dominant marketplace feeds a margin calculator and a price-momentum read, so every buy-and-sell decision is grounded in where the market actually is. It lifted margins, and other repair shops ended up buying it too.",
    metric: "Own P&L · later sold on",
    note:
      "Price momentum from a hand-rolled least-squares regression over the daily price series, not a stats package. The margin calculator toggles between two VAT treatments (tax on the margin versus the full sale price), the distinction that decides profitability. Daily prices upsert idempotently (ON CONFLICT) so a re-run never double-counts, and the whole thing is passkey-only (WebAuthn resident keys).",
    stack: ["Next.js", "React", "TypeScript", "PostgreSQL", "WebAuthn"],
    tags: ["First-principles maths", "Margins / P&L", "Own business"],
  },
  {
    title: "Wholesale unit-trust ledger & daily NAV",
    context: "Rivkin Securities · Fund administration",
    blurb:
      "A fund-administration backbone where compliance is enforced by the database, not by convention. A double-entry general ledger, a daily NAV strike with forward-pricing cut-offs, and an append-only audit trail, where every application, redemption, distribution and fee posts a balanced journal.",
    metric: "FSC-17 · 4dp unit pricing",
    note:
      "Unit prices struck to four decimals (six internal) per FSC Standard 17; CHECK constraints hold application ≥ NAV ≥ redemption; BEFORE-UPDATE/DELETE triggers make the ledger physically append-only. Corrections are posted as reversing journals, never edits. Decimal arithmetic throughout, so valuations reconcile to the cent.",
    stack: ["Python", "SQLAlchemy", "SQLite (WAL)", "Decimal"],
    tags: ["Reconciliation", "Financial maths", "Audit / governance"],
  },
  {
    title: "SMA portfolio & risk dashboard",
    context: "Rivkin Securities · Private wealth",
    blurb:
      "The analytics an investment committee actually needs: per-portfolio performance and risk, mandate-compliance checks, and reconciliation of holdings snapshots, computed from first principles rather than lifted from a library.",
    metric: "14+ risk stats · live RBA rate",
    note:
      "Sharpe, Sortino, beta and Jensen's alpha computed by hand and annualised against the real historical monthly risk-free rate (synced live from the RBA) rather than a hard-coded constant. Mandate breaches detected against live allocation bands; snapshot reconciliation prefers dollar-valued holdings over weights-only.",
    stack: ["Next.js", "React", "TypeScript (strict)", "SQLite", "Recharts"],
    tags: ["Portfolio workflows", "Financial maths", "Reconciliation"],
  },
  {
    title: "Private-wealth proposal engine",
    context: "Rivkin Securities · Private wealth",
    blurb:
      "The single source of truth for client investment proposals: build, calculate, and export polished PDF / PPTX. Replaced a legacy spreadsheet workflow and decks previously assembled by hand.",
    metric: "~120 hrs/mo saved",
    note:
      "Geometric-mean annualisation and three-year compounding from monthly product returns; private-credit sleeves blended as margin + RBA cash rate − fees. Database encrypted at rest (SQLCipher, every page AES-encrypted); SSO with per-request session revalidation so a revoked session dies within one TTL window.",
    stack: ["Node", "Express", "SQLCipher", "SSO", "PPTX / PDF"],
    tags: ["Capital-ready output", "Financial maths", "Security"],
  },
  {
    title: "On-device document intelligence",
    context: "Rivkin Securities · SMSF",
    blurb:
      "A research agent that answers questions across a fund's documents in seconds, running entirely on-device so sensitive data never leaves the building. Every answer is grounded in the source and cited as it goes.",
    metric: "100% on-device · ~70 hrs/mo",
    note:
      "Hand-rolled PDF text extraction in Rust (AcroForm fields + manual BT/ET content-stream parsing), with a local vision-LLM OCR fallback for scanned documents, cached by content hash. A tool-scoped agent loop is NDJSON-streamed to the browser within ~1s of each step: streaming, grounding and a human reading citations, the way AI belongs in a serious tool.",
    stack: ["Rust", "Python", "Ollama", "FastAPI", "SQLite"],
    tags: ["AI UX · streaming / grounding", "Privacy by design"],
  },
  {
    title: "AI compliance reviewer",
    context: "Rivkin Securities · Marketing & compliance",
    blurb:
      "Marketing material goes in; an ASIC-aware review comes back, routed through a configurable team approval chain. The model proposes; a human always approves.",
    metric: "AFSL workflow · ~80% cheaper re-reviews",
    note:
      "Streaming NDJSON progress (upload → extract → review → notify) drives a live, phased progress UI. Extraction spans PDF / DOCX / HTML / image (vision OCR), and the extracted text is shown back for human verification before any approval. The legislation library is held in an ephemeral prompt cache to cut the cost of repeated reviews.",
    stack: ["Next.js", "TypeScript (strict)", "Claude API", "SES"],
    tags: ["AI UX · human-in-the-loop", "Regulatory workflow"],
  },
  {
    title: "Team planner + natural-language tools",
    context: "Rivkin Securities · Firm-wide",
    blurb:
      "Scheduling for the whole firm: leave, hot-desking, rooms and intraday events. An OAuth 2.1 MCP server exposes it as live tools, so anyone can check availability and book in plain English from Claude.",
    metric: "40+ users · OAuth 2.1 / PKCE",
    note:
      "Append-only daily snapshots give a forensic record of team state; the intraday timeline is rendered from computed segments in pure CSS, with no charting library. Every model-driven mutation is validated through strict Zod schemas before it can touch the database, and validation errors are handed back for correction.",
    stack: ["Next.js", "React", "TypeScript (strict)", "MCP SDK", "SQLite"],
    tags: ["AI UX · agent tools", "Typed contracts", "Scale"],
  },
  {
    title: "Trend-following research system",
    context: "Personal · Quant research",
    blurb:
      "A momentum strategy validated across 36 years of market regimes (dot-com, GFC, COVID, 2022), then deployed live as a monthly rebalancer. Built to be honest about survivorship bias and look-ahead leakage.",
    metric: "13.1% CAGR vs 10.8% · 26% maxDD vs 55%",
    note:
      "The momentum score is a Clenow-style annualised log-price regression slope × R², derived by hand (scipy.linregress) rather than pulled from a package. A walk-forward ML regime classifier (trained with a 60-day embargo to prevent label leakage) scales exposure probabilistically instead of a binary 200-day filter. An append-only JSON ledger is the source of truth, independent of the broker.",
    stack: ["Python", "pandas", "scikit-learn", "Ollama"],
    tags: ["First-principles maths", "Walk-forward validation"],
  },
];

export interface MiniProject {
  title: string;
  blurb: string;
  context: string;
}

export const ALSO_SHIPPED: MiniProject[] = [
  {
    title: "Algorithmic trading alert engine",
    context: "Personal",
    blurb:
      "Bollinger-squeeze + MACD breakout signals across 1,000+ global equities and 444 crypto pairs, backtested with proper entry/exit mechanics and deployed live on GCP Cloud Run.",
  },
  {
    title: "Hybrid live ASX datafeed",
    context: "Rivkin Securities",
    blurb:
      "Ranks the ASX universe daily on delayed data, then overlays live Interactive Brokers ticks only for the candidates that matter, degrading gracefully to delayed quotes if the connection drops.",
  },
  {
    title: "Campaign landing platform",
    context: "Rivkin Securities",
    blurb:
      "A full-stack engine for marketing pages: per-campaign copy, theme and forms, immutable slug-as-route URLs, CRM sync and lead tracking, with per-campaign E2E tests and auto-deploy. A new page goes live in about an hour.",
  },
  {
    title: "Encrypted SMSF onboarding",
    context: "Rivkin Securities",
    blurb:
      "Multi-step fund-formation intake with AES-256-GCM-encrypted PII, deterministic email hashing, OAuth, and dual B2B/B2C CRM routing, shipped with unit + browser test coverage.",
  },
  {
    title: "Government-incentive claim automation",
    context: "iRep · France",
    blurb:
      "Turned a manual repair-incentive workflow into a near-instant compliant pipeline: OCR serial extraction, eligibility and payout rules. ~80% less processing time; ~€200k/yr.",
  },
  {
    title: "Behavioural analytics platform",
    context: "Orange · Telecoms",
    blurb:
      "Raw telecom event streams turned into readable intelligence (traffic, delivery failures, anomaly detection), giving support teams self-serve diagnostics instead of guesswork.",
  },
];
