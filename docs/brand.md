# Orbit — Brand

**Product:** Orbit — a self-driving savings app on Solana. It sets aside a slice of daily spending and grows it via on-chain USDC yield.
**Status:** active
**Palette:** Black · White · Green
**Vibe:** minimal · bold · confident

## Why this palette

A stripped-back monochrome system — **white canvas, black ink** — with **green** as the one accent. Black and white are the **primary/dominant** roles (primary actions, emphasis, most text); green (`#2f6e4a` light / `#7fb891` dark) is the **accent** (`--accent`), used sparingly for highlights, icons, links, chart lines, and small status. Green is *not* the primary color. Status colors (red / amber / blue) stay functional and sparse.

## Token system

Custom CSS-variable token set in `app/src/app/globals.css` (not stock shadcn). Light in `:root`, dark in `.dark` (class-based). Consume via `var(--accent)`, `text-[var(--accent-strong)]`, `bg-[var(--accent-soft)]`, `shadow-soft`/`shadow-float`, and `var(--gradient-accent)`.

### Seeds

| Role | Light | Dark |
|---|---|---|
| `--background` | `#ffffff` | `#0a0a0a` |
| `--foreground` | `#0a0a0a` | `#fafafa` |
| `--surface` | `#f4f4f5` | `#161616` |
| `--accent` (green) | `#2f6e4a` | `#7fb891` |
| `--accent-strong` | `#244f36` | `#9ccfab` |
| `--accent-soft` | `rgba(47,110,74,.08)` | `rgba(127,184,145,.14)` |
| `--on-accent` | `#ffffff` | `#06130c` |
| `--primary` (neutral) | `#0a0a0a` | `#fafafa` |
| `--primary-strong` | `#000000` | `#ffffff` |
| `--primary-fg` | `#ffffff` | `#0a0a0a` |
| `--gradient-accent` | `linear-gradient(120deg,#2f6e4a,#5f8f6a)` | `…#3f6b50,#7fb891` |

**Key rule:** green and black/white are distinct roles. Use `--accent-strong` for green text/links and `--accent` for green fills, always pairing green fills with `--on-accent` (white on light, dark on dark). Primary actions/emphasis use `--primary` (black/white) with `--primary-fg`.

### Status roles

| Role | Light | Dark | Use |
|---|---|---|---|
| `--success` | `#15803d` | `#4ade80` | gains / positive |
| `--warning` | `#d97706` | `#fbbf24` | caution |
| `--destructive` | `#dc2626` | `#f87171` | withdraw-out, reset, delete — stays red |
| `--info` | `#2563eb` | `#60a5fa` | informational |

Neutrals: `--muted` `#595959` / `#a1a1a1`, `--faint` `#a3a3a3` / `#6b6b6b`, `--border` `rgba(10,10,10,.10)` / `rgba(255,255,255,.10)`, `--contrast` = black/white inverted bands. Chart line = dark green (light) / lime (dark).

## Typography

`next/font/google` in `app/src/app/layout.tsx`: Fraunces (display serif), Inter (sans), JetBrains Mono (mono). The landing hero headline overrides to Inter (bold uppercase grotesque).

## Dos & don'ts

- **Do** use `--accent` (green) sparingly — highlights, icons, links, chart lines; pair green fills with `--on-accent`.
- **Do** use `--primary` (black/white) for primary actions and emphasis; green is the accent, not the dominant fill.
- **Do** keep the palette to black, white, and green; status colors are the only exceptions and stay sparse.
- **Don't** hardcode hexes in components — consume the tokens so light/dark stays consistent.

_History: original green in `globals.css.bak`; prior brands Ember (`5c28c47`), Solana (`b818f1d`), Midnight (`d02336a`) preserved in git._
