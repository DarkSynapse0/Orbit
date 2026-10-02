# Orbit — web app

The frontend for Orbit: the public landing page at `/` and the signed-in dashboard at `/app`. Built with Next.js 16 (App Router) and Tailwind 4, with Solana wallet support and an in-app embedded wallet so people without a crypto wallet can still use it.

> This is part of the Orbit monorepo. For the big picture — how money actually moves from a card swipe into an on-chain vault — see the [root README](../README.md).

## Run it

From the repo root (so the app and backend start together):

```bash
pnpm dev          # app on http://localhost:3000, server on :4000
```

Or just the app on its own:

```bash
pnpm dev:app
```

The dashboard talks to the backend on `:4000`, so for the full experience run both.

## Where things live

```
src/
  app/                 routes (App Router)
    page.tsx           the landing page
    app/page.tsx       the signed-in dashboard (/app)
    layout.tsx         root layout, fonts, metadata
    globals.css        design tokens + the black/white/green theme + motion
  components/
    common/            shared chrome (logo, theme toggle)
    landing/           pieces of the landing page (hero bits, FAQ, charts…)
    dashboard/         the dashboard panels (activity, goals, security…)
    ui/                small reusable primitives (button, chart, sheet…)
  lib/                 client helpers (API client, auth, embedded wallet, utils)
  idl/                 the vault program's interface, for talking to Solana
```

## Good to know

- **Theme:** colors are CSS variables in `globals.css` (a light `:root` set and a `.dark` set). The landing forces the dark set for its black canvas; the dashboard follows the user's theme.
- **Next.js 16 is not the version you remember** — it ships breaking changes. See [`AGENTS.md`](./AGENTS.md) before writing code against Next internals.
- **Build:** `pnpm build` runs a production build and type-checks everything.
