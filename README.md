# Matteo Davoigneau

Full-stack and frontend engineer in Sydney, focused on financial data. I build
end-to-end, from the front-end through to the infrastructure it runs on: data-dense
dashboards, charts and ledgers, the typed APIs behind them, and the parts around them
that keep data trustworthy (auth, audit logging, encrypted backups, human-review gates).

I work from first principles, care about craft and precision, and like owning a product
surface from the design system down to the deploy. Off the clock I invest in equities and
derivatives, and build the tools I wish existed.

- **Site:** https://davoigneau.com
- **Email:** matteo.davoigneau@gmail.com
- **Location:** Sydney, Australia

## This repository

The source of my portfolio site. It is a single page, built in the stack it talks about,
so the site is itself a work sample: a hand-rolled, interactive raw-SVG chart (no charting
library) and a headless TanStack data grid, both styled from one set of design tokens.

### Stack

- **React 18** + **TypeScript** (strict, plus `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`)
- **Vite 6**
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Radix UI** primitives
- **CVA + clsx + tailwind-merge** for component variants
- **d3-scale / d3-shape** for chart geometry, rendered as raw SVG by hand
- **@tanstack/react-table** for the live data grid
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
anywhere in this repository or on the page.** Descriptions are genericised, and every
figure shown (the chart, the holdings grid) is illustrative or synthetic;
`src/lib/data.ts` documents this.

### Accessibility

Targets WCAG 2.2 AA: the chart exposes its full series to assistive tech via an offscreen
data table and an `aria-label` summary, `aria-sort` on the sortable grid, visible focus
states, a skip link, contrast-checked text tokens, and full `prefers-reduced-motion` support.
