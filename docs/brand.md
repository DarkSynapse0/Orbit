# Orbit — Brand

**Product:** Orbit — a self-driving savings app on Solana. It sets aside a slice of daily spending and grows it via on-chain USDC yield.
**Status:** active
**Palette:** Black · White · Green
**Vibe:** minimal · bold · confident

## Why this palette

A stripped-back monochrome system — **white canvas, black ink** — with **green** as the one accent. The system accent is a readable green (`#4d7c0f` light / `#a3e635` dark) for buttons, icons, links, and chart lines; a **brighter lime (`#d4f34d`)** is reserved as a hero highlight (e.g. the landing feature card), always with black text. Status colors (red / amber / blue) stay functional and sparse.

## Token system

Custom CSS-variable token set in `app/src/app/globals.css` (not stock shadcn). Light in `:root`, dark in `.dark` (class-based). Consume via `var(--accent)`, `text-[var(--accent-strong)]`, `bg-[var(--accent-soft)]`, `shadow-soft`/`shadow-float`, and `var(--gradient-accent)`.

### Seeds

| Role | Light | Dark |
|---|---|---|
| `--background` | `#ffffff` | `#0a0a0a` |
| `--foreground` | `#0a0a0a` | `#fafafa` |
| `--surface` | `#f4f4f5` | `#161616` |
| `--accent` / `--primary` | `#4d7c0f` | `#a3e635` |
| `--accent-strong` / `--primary-strong` | `#3f6212` | `#bef264` |
| `--on-accent` / `--primary-fg` | `#ffffff` | `#0a0a0a` |
| `--accent-soft` / `--primary-soft` | `rgba(77,124,15,.12)` | `rgba(163,230,53,.16)` |
| `--gradient-accent` | `linear-gradient(120deg,#d4f34d,#a3e635)` | same |

**Key rule:** always use `--on-accent` for text on accent fills — white on light, black on dark. The reserved hero lime (`#d4f34d`) always takes black text. Use `--accent-strong` for green text/links.

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

- **Do** use `--accent` for primary fills, icons, and links; pair fills with `--on-accent`.
- **Do** reserve the bright lime (`#d4f34d`) for occasional hero highlights, with black text.
- **Do** keep the palette to black, white, and green; status colors are the only exceptions and stay sparse.
- **Don't** hardcode hexes in components — consume the tokens so light/dark stays consistent.

_History: original green in `globals.css.bak`; prior brands Ember (`5c28c47`), Solana (`b818f1d`), Midnight (`d02336a`) preserved in git._
