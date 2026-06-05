# davoigneau.com

A one-page portfolio for **Matteo Davoigneau**, a frontend engineer for financial
data. The page is deliberately built in the exact stack of the role it's aimed at,
so the site is itself the work sample: a hand-rolled, interactive **raw-SVG chart**
(no charting library) and a headless **TanStack** data grid, both styled from a
single set of design tokens.

## Stack

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

## Design

Typography and palette echo the résumé (the "EngAIn" design language): **Figtree**
for body/UI, **Fraunces** (often italic) for display headings, **Geist Mono** for
labels, over warm-neutral greys with a teal-green accent and a mint wash.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc -b, strict
npm run build      # tsc -b && vite build → dist/
npm run preview    # serve the production build
```

## Deploy to Cloudflare (Workers Static Assets)

Connected to GitHub via Cloudflare's Workers Builds. On each push, Cloudflare runs
`npx wrangler deploy`; per `wrangler.toml` that builds the site (`npm run build`) and
serves `./dist` as a static-assets Worker. Settings:

- Deploy command: `npx wrangler deploy`
- Build command: can be left blank (the `[build]` step in `wrangler.toml` runs the build).

Locally:

```bash
npm run deploy     # = npx wrangler deploy (builds, then deploys ./dist)
```

`public/_headers` applies security and caching headers; `not_found_handling` falls back
to the single page. Add `davoigneau.com` as a custom domain in the dashboard.

## A note on the work referenced

Several projects described on the page are live, regulated systems built for a
licensed brokerage. **No client identifiers, holdings, account numbers, credentials
or screenshots appear anywhere in this repo or on the page.** Descriptions are
genericised, and every figure (the chart, the holdings grid) is illustrative or
synthetic. `src/lib/data.ts` documents this.

## Accessibility

Targets **WCAG 2.2 AA**: the chart exposes its full series to assistive tech via an
offscreen data table and an `aria-label` summary, `aria-sort` on the sortable grid,
visible focus states, a skip link, contrast-checked text tokens (the muted label
colour was darkened to clear 4.5:1), and full `prefers-reduced-motion` support.
