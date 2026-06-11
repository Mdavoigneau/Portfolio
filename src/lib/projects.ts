/**
 * The project ledger.
 *
 * Every system shipped solo, genericised. The employer is "a financial
 * institution", never named; no client identifiers, holdings or credentials
 * appear anywhere. Each impact figure carries its provenance so a reader knows
 * whether the number was reported by the team using the tool or estimated by me.
 */

export type Provenance = "team" | "self" | "fact" | "qual";
export type Status = "prod" | "ready" | "dev";

export interface Metric {
  label: string;
  provenance: Provenance;
}

export interface Project {
  id: string;
  title: string;
  context: string;
  status: Status;
  featured: boolean;
  /** short line for the ledger row and the card */
  summary: string;
  /** fuller description, shown in the details dialog */
  detail: string;
  /** the first-principles / "why it's hard" note, shown in the details dialog */
  note: string;
  stack: string[];
  /** metrics[0] is the headline; the rest show in the dialog */
  metrics: Metric[];
  /** JD-pillar tags, shown on featured cards */
  tags?: string[];
}

export const PROVENANCE_LABEL: Record<Provenance, string> = {
  team: "Reported by the team using it",
  self: "My own estimate",
  fact: "Measured",
  qual: "Qualitative",
};

export const STATUS_LABEL: Record<Status, string> = {
  prod: "In production",
  ready: "Ready · awaiting sign-off",
  dev: "In development",
};

export const PROJECTS: Project[] = [
  // ── Own business ──────────────────────────────────────────────────────────
  {
    id: "refurb-price",
    title: "Refurbished-market price intelligence",
    context: "Own business",
    status: "prod",
    featured: true,
    summary:
      "Daily price-intelligence and margin tool for a low-margin refurbished-phone business of my own.",
    detail:
      "Built to sharpen pricing in a business I ran myself: a daily crawl of the dominant marketplace feeds a margin calculator and a price-momentum read, so every buy-and-sell decision is grounded in where the market actually is. It lifted my margins, and other repair shops ended up buying it too.",
    note:
      "Price momentum from a hand-rolled least-squares regression over the daily series, not a stats package. The margin calculator toggles between two VAT treatments (tax on the margin versus the full sale price), the distinction that decides profitability. Daily prices upsert idempotently (ON CONFLICT) so a re-run never double-counts, and the whole thing is passkey-only (WebAuthn resident keys).",
    stack: ["Next.js", "React", "TypeScript", "PostgreSQL", "WebAuthn"],
    metrics: [{ label: "Sold to other shops", provenance: "fact" }],
    tags: ["First-principles maths", "Margins / P&L", "Own business"],
  },

  // ── A financial institution ────────────────────────────────────────────────
  {
    id: "unit-trust",
    title: "Wholesale unit-trust ledger & daily NAV",
    context: "A financial institution · Funds administration",
    status: "dev",
    featured: true,
    summary:
      "A fund-administration backbone where compliance is enforced by the database. The first system of its kind at the firm.",
    detail:
      "A double-entry general ledger, a daily NAV strike with forward-pricing cut-offs, and an append-only audit trail, where every application, redemption, distribution and fee posts a balanced journal. It was net-new groundwork: nothing like it existed at the firm before.",
    note:
      "Unit prices struck to four decimals (six internal) per FSC Standard 17; CHECK constraints hold application ≥ NAV ≥ redemption; BEFORE-UPDATE/DELETE triggers make the ledger physically append-only. Corrections post as reversing journals, never edits. Decimal arithmetic throughout, so valuations reconcile to the cent.",
    stack: ["Python", "SQLAlchemy", "SQLite (WAL)", "Decimal"],
    metrics: [{ label: "First of its kind", provenance: "qual" }],
    tags: ["Reconciliation", "Financial maths", "Audit / governance"],
  },
  {
    id: "sma-dashboard",
    title: "Separately Managed Accounts portfolio & risk dashboard",
    context: "A financial institution · Wealth advisory",
    status: "prod",
    featured: true,
    summary:
      "Per-portfolio performance, risk and mandate-compliance for a managed-accounts program, plus an investment-committee workspace.",
    detail:
      "The analytics an investment committee actually needs: per-portfolio performance and risk, mandate-compliance checks against allocation bands, holdings-snapshot reconciliation, and an IC workspace for minutes and action items. Earns time on oversight and keeps everyone across what is happening.",
    note:
      "Sharpe, Sortino, beta and Jensen's alpha computed by hand and annualised against the real historical monthly risk-free rate (synced live from the RBA) rather than a hard-coded constant. Mandate breaches detected against live allocation bands; snapshot reconciliation prefers dollar-valued holdings over weights-only.",
    stack: ["Next.js", "React", "TypeScript (strict)", "SQLite", "Recharts"],
    metrics: [{ label: "~40 hrs/mo", provenance: "team" }],
    tags: ["Portfolio workflows", "Financial maths", "Reconciliation"],
  },
  {
    id: "proposal-engine",
    title: "Private-wealth proposal engine",
    context: "A financial institution · Private wealth",
    status: "prod",
    featured: true,
    summary:
      "The single source of truth for client investment proposals: build, calculate, and export polished PDF / PPTX.",
    detail:
      "Replaced a legacy spreadsheet workflow and decks previously assembled by hand. Builds multi-asset proposals, blends private-credit sub-funds, and exports board-ready PDF and PPTX.",
    note:
      "Geometric-mean annualisation and three-year compounding from monthly product returns; private-credit sleeves blended as margin + RBA cash rate − fees. Database encrypted at rest (SQLCipher); SSO with per-request session revalidation, so a revoked session dies within one TTL window. The encryption and revalidation are there for security: the proposals hold sensitive client financials.",
    stack: ["Node", "Express", "SQLCipher", "SSO", "PPTX / PDF"],
    metrics: [
      { label: "~120 hrs/mo", provenance: "team" },
    ],
    tags: ["Capital-ready output", "Financial maths", "Security"],
  },
  {
    id: "smsf-agent",
    title: "On-device SMSF document agent",
    context: "A financial institution · SMSF",
    status: "prod",
    featured: true,
    summary:
      "A research agent that answers questions across a fund's documents in seconds, entirely on-device.",
    detail:
      "Sensitive data never leaves the building; every answer is grounded in the source and cited as it goes. Used across the SMSF team.",
    note:
      "Hand-rolled PDF text extraction in Rust (AcroForm fields + manual BT/ET content-stream parsing), with a local vision-LLM OCR fallback for scanned documents, cached by content hash. A tool-scoped agent loop is NDJSON-streamed to the browser within ~1s of each step: streaming, grounding and a human reading citations, the way AI belongs in a serious tool.",
    stack: ["Rust", "Python", "Ollama", "FastAPI", "SQLite"],
    metrics: [{ label: "~120 hrs/mo", provenance: "self" }],
    tags: ["AI UX · streaming / grounding", "Privacy by design"],
  },
  {
    id: "compliance-reviewer",
    title: "AI marketing-compliance reviewer",
    context: "A financial institution · Compliance",
    status: "prod",
    featured: true,
    summary:
      "Marketing material goes in; an ASIC-aware first-pass review comes back, routed through a team approval chain.",
    detail:
      "The model proposes, a human always approves. Replaced a manual email chain with a tracked, audited workflow and an AI first-pass that flags Minor / Critical issues with citations before a reviewer sees it.",
    note:
      "Streaming NDJSON progress (upload → extract → review → notify) drives a live, phased progress UI. Extraction spans PDF / DOCX / HTML / image (vision OCR), and the extracted text is shown back for human verification before any approval. The legislation library is held in an ephemeral prompt cache to cut the cost of repeated reviews.",
    stack: ["Next.js", "TypeScript (strict)", "Claude API", "SES"],
    metrics: [{ label: "~40 hrs/mo", provenance: "self" }],
    tags: ["AI UX · human-in-the-loop", "Regulatory workflow"],
  },
  {
    id: "team-planner",
    title: "Team planner + natural-language tools",
    context: "A financial institution · Operations",
    status: "prod",
    featured: true,
    summary:
      "Firm-wide scheduling (leave, hot-desking, rooms, intraday events), exposed to Claude as live tools over MCP.",
    detail:
      "Anyone can check availability and book in plain English from Claude. Also feeds HR's time-reporting, saving the back-office a few hours a month.",
    note:
      "Append-only daily snapshots give a forensic record of team state; the intraday timeline is rendered from computed segments in pure CSS, with no charting library. Every model-driven mutation is validated through strict Zod schemas before it can touch the database, and validation errors are handed back for correction.",
    stack: ["Next.js", "React", "TypeScript (strict)", "MCP SDK", "SQLite"],
    metrics: [
      { label: "40+ users", provenance: "fact" },
      { label: "~10 hrs/mo (HR time reports)", provenance: "self" },
    ],
    tags: ["AI UX · agent tools", "Typed contracts", "Scale"],
  },
  {
    id: "landing-platform",
    title: "Campaign landing platform",
    context: "A financial institution · Marketing",
    status: "prod",
    featured: false,
    summary:
      "A full-stack engine for marketing pages: per-campaign copy, theme, forms, CRM sync, E2E tests and auto-deploy.",
    detail:
      "Immutable slug-as-route URLs, three-channel lead delivery and per-campaign tests mean a new page goes live in about an hour. Marketing ships roughly two a week.",
    note:
      "Three-channel lead delivery (SQLite first, then SES + CRM in parallel via Promise.allSettled) returns success if any channel survives. Honeypot bot-traps are verified by E2E; visitor analytics use weekly-rotated IP hashing for accurate counts without keeping a privacy liability. No page ships without its Playwright suite passing.",
    stack: ["Next.js", "React", "TypeScript (strict)", "Zod", "CI/CD"],
    metrics: [
      { label: "~50 hrs/mo", provenance: "self" },
      { label: "12 live pages", provenance: "fact" },
    ],
    tags: ["Ship fast + governed", "Cost discipline"],
  },
  {
    id: "smsf-intake",
    title: "SMSF intake platform",
    context: "A financial institution · SMSF (white-label, adaptable to any enterprise)",
    status: "prod",
    featured: false,
    summary:
      "Multi-channel SMSF fund-formation intake, built to be re-skinned for bespoke clients.",
    detail:
      "Clients fill in their own details, so advisers and SMSF staff stop chasing information. Deliberately architected as a white-label platform: the same engine re-skins for a new client or use-case in days, not weeks.",
    note:
      "AES-256-GCM-encrypted PII with deterministic email hashing for lookup; dual B2B/B2C channels isolated at the schema level with independent CRM routing; everything driven from a single typed questions config so the form, validators, exports and admin views never drift. Shipped with unit + browser test coverage.",
    stack: ["Next.js", "TypeScript (strict)", "SQLite", "AES-256-GCM", "Zod"],
    metrics: [{ label: "~20 hrs/adviser·mo", provenance: "self" }],
    tags: ["White-label", "Security", "Typed contracts"],
  },
  {
    id: "asx-scanner",
    title: "Hybrid live ASX scanner",
    context: "A financial institution · Research",
    status: "prod",
    featured: false,
    summary:
      "Ranks the ASX universe daily, then overlays live Interactive Brokers ticks only for the candidates that matter.",
    detail:
      "Real-time gainers / losers / volume movers for an analyst, degrading gracefully to delayed quotes if the live connection drops.",
    note:
      "Ranks on free delayed data (sufficient for ranking, no scanner subscription needed), then overlays live IBKR ticks only for the top candidates, recovering accuracy exactly where it matters. Thread-safe dual loops behind a lock; graceful fallback to delayed quotes when TWS/Gateway is unavailable.",
    stack: ["Python", "Interactive Brokers API", "yfinance", "Flask"],
    metrics: [{ label: "Real-time", provenance: "qual" }],
    tags: ["Market data", "Reliability"],
  },
  {
    id: "fact-find",
    title: "Client fact-find questionnaire",
    context: "A financial institution · Wealth advisory",
    status: "prod",
    featured: false,
    summary:
      "Tiered financial-planning fact-find (insurance / comprehensive / investment), filled in by clients, captured straight.",
    detail:
      "Advisers share a link; clients complete in their own time with save-and-resume; submission generates a branded PDF and notifies the team. Replaces paper forms and email back-and-forth.",
    note:
      "Sensitive answers (TFNs, health, asset structures) encrypted at rest with AES-256-GCM; public questionnaire endpoints guarded by per-draft bearer tokens with constant-time comparison; admin gated by SSO + OTP; PDFs generated in-memory and never written to disk.",
    stack: ["Next.js", "React", "TypeScript (strict)", "SQLite", "AES-256-GCM"],
    metrics: [{ label: "~60 hrs/mo", provenance: "team" }],
    tags: ["Client workflow", "Security"],
  },
  {
    id: "strategy-papers",
    title: "Strategy-paper generator",
    context: "A financial institution · Wealth advisory",
    status: "prod",
    featured: false,
    summary:
      "Guided drafting of client strategy papers across three advisory types, with draft persistence and PDF export.",
    detail:
      "Gives every adviser one structured workflow per paper type instead of re-assembling documents by hand in Word. The app drafts, the adviser signs off.",
    note:
      "Per-adviser draft persistence with AES-256-GCM-encrypted PII columns (unique nonces, tamper detection); two-stage SSO MFA; per-request CSP with nonce + strict-dynamic in production; Vitest coverage for the crypto round-trip and rate limiting.",
    stack: ["Next.js", "React", "TypeScript (strict)", "SQLite", "jsPDF"],
    metrics: [{ label: "~24 hrs/mo", provenance: "team" }],
    tags: ["Document workflow", "Security"],
  },
  {
    id: "share-registry",
    title: "Shareholder registry portal",
    context: "A financial institution · Management",
    status: "prod",
    featured: false,
    summary:
      "Internal shareholder registry: admins manage records, dividends and payouts; shareholders self-serve statements.",
    detail:
      "Replaced a manual, spreadsheet-based registry. Non-admins get a read-only portal scoped to their own holdings, dividend statements and loan statements.",
    note:
      "SHIN-scoped JWT sessions; NextAuth credentials with rate-limited login and scrypt hashing (legacy-to-modern rehash on first login); all mutations via server actions; SQLite bound to localhost only; encrypted S3 backups four times daily.",
    stack: ["Next.js", "React", "TypeScript (strict)", "SQLite", "NextAuth"],
    metrics: [{ label: "~120 hrs/yr", provenance: "self" }],
    tags: ["Self-serve portal", "RBAC"],
  },
  {
    id: "csat",
    title: "Client-satisfaction survey platform",
    context: "A financial institution · SMSF",
    status: "prod",
    featured: false,
    summary:
      "Lifecycle satisfaction surveys for the SMSF service line, with admin-generated links and CSV export.",
    detail:
      "Clients answer a short survey at key touchpoints (setup, takeover, annual review, wind-up); staff generate per-client links and export responses. Advisers stop calling around to gather feedback.",
    note:
      "Cryptographically-secure per-survey bearer tokens with constant-time comparison; conditional questions driven by parent answers; server-side autosave every 3s; hot-safe SQLite .backup streamed to S3 with a 6-month lifecycle.",
    stack: ["Next.js", "React", "TypeScript", "SQLite", "AWS SES"],
    metrics: [{ label: "~10 hrs/mo", provenance: "self" }],
    tags: ["Client workflow", "Reporting"],
  },
  {
    id: "ai-mds",
    title: "AI-delivery knowledge base",
    context: "A financial institution · Internal AI infrastructure",
    status: "prod",
    featured: false,
    summary:
      "The firm's internal playbook for AI-assisted delivery: deployment, security, auth and governance templates.",
    detail:
      "Centralises every pattern I built (Next.js + SQLite on a $5–7 instance, security hardening, SSO flows, project governance), so the whole estate is consistent and a new build starts from a known-good baseline rather than a blank page.",
    note:
      "Distils the production architecture into a repeatable template: App Router + SQLite WAL (zero external deps), Caddy auto-TLS, systemd. The security guide runs to 2,000+ lines (IAM scoping, S3 lifecycle, KMS, SES verification, audit logging); a non-technical 'iterate on a live project' guide lets staff request changes without touching git, behind a mandatory review gate.",
    stack: ["Markdown", "Next.js patterns", "AWS", "Notion API"],
    metrics: [{ label: "~10 days saved / new project", provenance: "self" }],
    tags: ["AI delivery governance", "Internal infra"],
  },

  // ── A state MP's office ──────────────────────────────────────────────────────
  {
    id: "mp-email",
    title: "AI email triage & reply-drafting",
    context: "A state MP's office",
    status: "prod",
    featured: true,
    summary:
      "Drafts constituent replies in the office's own voice and extracts diary events, live on a per-minute poll.",
    detail:
      "A retrieval-augmented drafter that turns thousands of historic replies into exemplars, so the office answers constituents faster, plus a diary summariser that pulls structured events out of incoming mail.",
    note:
      "RAG over 2,300+ historic reply pairs with Voyage embeddings (1024-dim, K=6 retrieval) paired with Claude for exemplar-informed drafting. Gmail access via domain-wide delegation with service-account JWT signing (no downloadable keys); MIME-aware attachment extraction; runs on Cloud Functions polled every minute.",
    stack: ["Python", "Claude API", "Voyage embeddings", "Google Cloud", "Gmail API"],
    metrics: [
      { label: "~40–60 hrs/mo", provenance: "team" },
      { label: "~500 emails/mo", provenance: "fact" },
    ],
    tags: ["AI UX · RAG / grounding", "Production automation"],
  },

  // ── iRep, France ─────────────────────────────────────────────────────────────
  {
    id: "irep-claim",
    title: "Government-incentive claim automation",
    context: "iRep · France",
    status: "prod",
    featured: false,
    summary:
      "Turned a manual repair-incentive workflow into a near-instant compliant pipeline: OCR, eligibility, payout rules.",
    detail:
      "Aggregates data from spreadsheets, the CRM and government APIs, pre-fills claims, extracts device identifiers from photos via OCR, and submits compliant files in seconds instead of minutes per case.",
    note:
      "OCR serial/IMEI extraction with multi-format barcode fallback; eligibility and payout rules computed to the cent; idempotent submission so a re-run never double-files.",
    stack: ["Python", "Next.js", "PostgreSQL", "OCR", "Redis"],
    metrics: [
      { label: "~A$330k/yr", provenance: "team" },
      { label: "~80% less processing time", provenance: "team" },
    ],
    tags: ["Process automation", "OCR"],
  },
  {
    id: "irep-quote",
    title: "Repair-quote engine",
    context: "iRep · France",
    status: "prod",
    featured: false,
    summary:
      "Self-service repair-quote and booking engine with an admin back-office; saves a large slice of admin work.",
    detail:
      "Customers get a personalised quote and book without phone tag; the back-office manages brands, models, repairs and prices. Replaced phone-and-email coordination with a self-serve flow.",
    note:
      "Server-side price recalculation with a to-the-cent (±0.01) tolerance inside a transaction; immutable devis snapshots (a JSON blob frozen at creation) for an audit trail; an hourly Google-Sheets catalogue sync with longest-prefix series inference; a hand-rolled SVG reservation timeline, no charting library.",
    stack: ["Next.js", "React", "TypeScript", "PostgreSQL", "Recharts"],
    metrics: [{ label: "~20 hrs/wk admin saved", provenance: "self" }],
    tags: ["Self-serve workflow", "Transactional integrity"],
  },

  // ── Orange, telecoms ─────────────────────────────────────────────────────────
  {
    id: "orange-analytics",
    title: "Behavioural-analytics dashboard",
    context: "Orange · Telecoms",
    status: "ready",
    featured: false,
    summary:
      "Turns tens of millions of SMS/email delivery events into readable diagnostics for a telecoms operator.",
    detail:
      "Root-cause analysis of delivery failures, regional variance and channel quality over an Elasticsearch cluster, replacing manual log-grepping and spreadsheets. Built as a proof of concept during my apprenticeship; management never formally shipped it, but the team adopted it and kept using it.",
    note:
      "Dynamic index selection by date range over a three-node ES cluster to query billions of events efficiently; logarithmic visualisation of skewed distributions; phone-number validation with libphonenumber to geolocate failures.",
    stack: ["Node.js", "Express", "Elasticsearch", "Chart.js", "amCharts"],
    metrics: [{ label: "32M+ messages indexed", provenance: "fact" }],
    tags: ["Data at scale", "Diagnostics"],
  },

  // ── On-device tooling ────────────────────────────────────────────────────────
  {
    id: "transcription",
    title: "On-device meeting transcription",
    context: "Personal · on-device tooling",
    status: "ready",
    featured: false,
    summary:
      "Offline meeting transcription with speaker diarization, voiceprint matching across meetings, and an AI accuracy check.",
    detail:
      "Turns recordings into timestamped, speaker-labelled transcripts entirely offline, recognising the same speakers across meetings and flagging likely errors for review. Built and working; held from rollout until the on-prem inference hardware is provisioned.",
    note:
      "Speaker diarization via pyannote.audio with real-time voiceprint embeddings to match speakers across jobs; hallucination detection (repeat loops, number runs); a local LLM checks the transcript against a domain glossary to fix terminology. NDJSON event-stream progress with a single-worker GPU executor to avoid contention.",
    stack: ["Python", "MLX-Whisper", "pyannote.audio", "FastAPI", "Svelte"],
    metrics: [{ label: "~10–20 hrs/mo", provenance: "self" }],
    tags: ["On-device AI", "Audio"],
  },

  // ── Personal · quant research ────────────────────────────────────────────────
  {
    id: "trend-following",
    title: "Trend-following research system",
    context: "Personal · Quant research",
    status: "prod",
    featured: true,
    summary:
      "A momentum strategy validated across 36 years of market regimes, then deployed live as a monthly rebalancer.",
    detail:
      "Honest about survivorship bias and look-ahead leakage. Beats the benchmark on CAGR, drawdown, Sharpe and Calmar across dot-com, GFC, COVID and 2022.",
    note:
      "The momentum score is a Clenow-style annualised log-price regression slope × R², derived by hand (scipy.linregress) rather than pulled from a package. A walk-forward ML regime classifier (trained with a 60-day embargo to prevent label leakage) scales exposure probabilistically instead of a binary 200-day filter. An append-only JSON ledger is the source of truth, independent of the broker.",
    stack: ["Python", "pandas", "scikit-learn", "Ollama"],
    metrics: [
      { label: "13.1% CAGR vs 10.8%", provenance: "fact" },
      { label: "26% maxDD vs 55%", provenance: "fact" },
    ],
    tags: ["First-principles maths", "Walk-forward validation"],
  },
  {
    id: "finance-alerts",
    title: "Algorithmic trading alert engine",
    context: "Personal · Quant research",
    status: "prod",
    featured: false,
    summary:
      "Bollinger-squeeze + MACD breakout signals across 1,000+ equities and 444 crypto pairs, live on GCP.",
    detail:
      "Backtested with proper entry/exit mechanics (50/30/20 take-profit pyramid, break-even trailing), deployed on Cloud Run with push notifications and state deduplication across runs.",
    note:
      "Zero-lag DEMA-based MACD for signal freshness; Bollinger-width contraction scoring; multi-timeframe resampling aligned to each exchange's local market hours; charts rendered from matplotlib primitives, not a wrapper.",
    stack: ["Python", "pandas", "GCP Cloud Run", "matplotlib"],
    metrics: [{ label: "1,000+ equities · 444 crypto", provenance: "fact" }],
    tags: ["Quant signals", "Production deploy"],
  },
];

/** Approximate build / ship month per project (YYYY-MM), for date ordering. */
const DATES: Record<string, string> = {
  "orange-analytics": "2024-08",
  "refurb-price": "2024-11",
  "irep-quote": "2025-04",
  "irep-claim": "2025-07",
  "finance-alerts": "2026-02",
  "team-planner": "2026-03",
  "proposal-engine": "2026-04",
  "fact-find": "2026-04",
  "share-registry": "2026-04",
  "strategy-papers": "2026-04",
  "transcription": "2026-04",
  "smsf-agent": "2026-04",
  "asx-scanner": "2026-05",
  "sma-dashboard": "2026-05",
  "unit-trust": "2026-05",
  "trend-following": "2026-05",
  "smsf-intake": "2026-05",
  "compliance-reviewer": "2026-06",
  "ai-mds": "2026-06",
  "csat": "2026-06",
  "landing-platform": "2026-06",
  "mp-email": "2026-06",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatProjectDate(ym: string): string {
  const [y, m] = ym.split("-");
  const month = MONTHS[Number(m ?? "1") - 1] ?? "";
  return `${month} '${(y ?? "").slice(2)}`;
}

export interface DatedProject extends Project {
  date: string;
}

export const FEATURED = PROJECTS.filter((p) => p.featured);

/** The full ledger, newest first. */
export const LEDGER: DatedProject[] = PROJECTS.map((p) => ({
  ...p,
  date: DATES[p.id] ?? "2026-01",
})).sort((a, b) => b.date.localeCompare(a.date));
