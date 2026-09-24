# Matteo Davoigneau

AI and software engineer in Sydney. I build AI and automation that teams actually use,
end-to-end: from the front-end through to the infrastructure it runs on, the typed APIs in
between, and the parts that keep data trustworthy (auth, audit logging, encrypted backups,
human-review gates).

I work from first principles, care about craft and precision, and like owning a product
surface from the design system down to the deploy. Off the clock I invest in equities and
derivatives, and build the tools I wish existed.

- **Site:** https://davoigneau.com
- **Email:** matteo.davoigneau@gmail.com
- **Location:** Sydney, Australia

## This repository

The source of my portfolio site: a single page that reads everything from one typed
project ledger (`src/lib/projects.ts`), so the headline numbers, the hours chart and the
ledger can't drift apart. Several projects open a working miniature on synthetic data.

### Stack

- **React 18** + **TypeScript** (strict, plus `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`)
- **Vite 6**
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Radix UI** primitives
- **CVA + clsx + tailwind-merge** for component variants
- **d3-scale / d3-shape** for the demos' chart geometry, rendered as raw SVG by hand
- **lucide-react** for icons

No charting wrapper, no UI template.

### Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc -b, strict
npm run build      # tsc -b && vite build, into dist/
npm run preview    # serve the production build
```

### Deploy

Hosted on Cloudflare (Workers Static Assets), connected to GitHub. On each push,
`npx wrangler deploy` runs the build (`npm run build`, per `wrangler.toml`) and serves
`./dist`. `public/_headers` sets security and caching headers.

```bash
npm run deploy     # = npx wrangler deploy (builds, then deploys ./dist)
```

### A note on the work referenced

Some of the projects described on the site are live systems built for regulated firms.
**No client identifiers, holdings, account numbers, credentials or screenshots appear
anywhere in this repository or on the page.** Descriptions are genericised and the demos
run on synthetic data. Impact figures are real, and each one carries its provenance:
reported by the team using the tool, or my own estimate.

### Accessibility

Each row of the hours chart is a button with screen-reader text for its value and where the
figure came from. There are visible focus states, a skip link, contrast-checked text tokens,
and full `prefers-reduced-motion` support.
