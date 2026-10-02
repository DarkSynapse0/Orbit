# Deploying Orbit

Orbit is two parts that deploy separately:

- **`app/`** — the Next.js frontend → **Vercel**.
- **`server/`** — the Express API (Plaid, ledger, on-chain deposits) → **Railway**
  (any always-on Node host works: Render paid, Fly.io, a VPS). It is **not** serverless:
  it keeps a SQLite file, an in-memory cache, and runs multi-second on-chain deposits, so
  it needs a real process + a persistent disk.

They talk over HTTPS. Do the steps in this order.

---

## 0. Deploy the on-chain program first (one-time / after program changes)

From a machine whose Solana CLI can reach devnet (large uploads):

```bash
./orbit-vault/deploy-devnet.sh
```

This builds + deploys the program and drops `server/.devnet.json` so the backend creates a
fresh reserve with the current layout. The wallet at `~/.config/solana/id.json` is the
upgrade authority **and** the funder/mint authority — you'll reuse its secret key below.

Get the funder secret key as base58 for the backend env:

```bash
# prints the base58 secret key for FUNDER_SECRET_KEY (run from the repo's server/ dir)
cd server && node --input-type=module -e "import bs58 from 'bs58';import fs from 'node:fs';const k=JSON.parse(fs.readFileSync(process.env.HOME+'/.config/solana/id.json','utf8'));process.stdout.write(bs58.encode(Uint8Array.from(k)))"; cd ..
```

(Or just paste the raw JSON array from `~/.config/solana/id.json` — `FUNDER_SECRET_KEY`
accepts either a base58 string or a `[1,2,3,...]` byte array.)

Keep this secret. On devnet it's low-risk; for mainnet use a dedicated, minimally-funded key.

---

## 1. Backend → Railway

1. **New Project → Deploy from GitHub repo** → pick this repo. Railway reads `railway.json`
   (Nixpacks build, `pnpm --filter server start`). Leave Root Directory at the repo root so
   the pnpm workspace (`@orbit/shared`) installs.
2. **Add a Volume** and mount it at `/data` (Settings → Volumes). This is where SQLite + the
   saved mint live so they survive redeploys.
3. **Variables** (Settings → Variables):

   | Variable | Value |
   |---|---|
   | `DATA_DIR` | `/data` |
   | `FUNDER_SECRET_KEY` | the base58 key from step 0 |
   | `SESSION_SECRET` | a long random string (`openssl rand -base64 32`) |
   | `GOOGLE_CLIENT_ID` | same client id the frontend uses |
   | `CORS_ORIGINS` | your Vercel URL, e.g. `https://orbit.vercel.app` |
   | `SOLANA_RPC_URL` | a real devnet RPC (Helius free tier) — the public one is rate-limited |
   | `SOLANA_CLUSTER` | `devnet` |
   | `THRESHOLD_USD` | `10` |
   | `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` | your Plaid sandbox creds |

4. Deploy. Note the public URL Railway gives you, e.g. `https://orbit-api.up.railway.app`
   (this is your `NEXT_PUBLIC_API_URL`). Verify: open `<url>/health` → `{"ok":true,...}`.

> Single instance only (SQLite is single-writer). That's fine here. Scale-out later = Postgres/Turso.

---

## 2. Frontend → Vercel

1. **New Project** → import this repo. Set **Root Directory = `app`**. Framework preset:
   Next.js (auto). Vercel installs the pnpm workspace from the repo root automatically.
2. **Environment Variables:**

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | the Railway URL from step 1 (no trailing slash) |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | your Google OAuth client id |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel URL, e.g. `https://orbit.vercel.app` |

3. Deploy. `NEXT_PUBLIC_API_URL` is baked into the CSP `connect-src` and `apiFetch` at build
   time, so redeploy the frontend whenever the backend URL changes.

---

## 3. Wire the two together

- **Google Cloud Console → your OAuth client → Authorized JavaScript origins:** add your
  Vercel URL (`https://orbit.vercel.app`). Without it Google sign-in falls back to demo.
- **Railway `CORS_ORIGINS`** must equal your Vercel origin exactly (scheme + host, no path).
- Both ends are HTTPS (required — an HTTPS page can't call an HTTP API).

Quick check: open the Vercel site → sign in with Google → the dashboard loads and
`<railway-url>/health` is reachable from the browser (no CORS/CSP errors in the console).

---

## Notes

- **Which RPC:** the public `api.devnet.solana.com` rate-limits hosted IPs. Use a free
  Helius/QuickNode devnet endpoint for `SOLANA_RPC_URL` to avoid flaky deposits.
- **Secrets:** never commit `.env` / `FUNDER_SECRET_KEY`. They live only in the host's
  dashboard. `.env*` and `id.json` are gitignored.
- **Mainnet later:** split the single funder/mint key into separate roles, revoke mint
  authority, and swap the reserve for a real venue (Kamino) — see `CLAUDE.md`.
