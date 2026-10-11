import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import type { SavingsState } from '@orbit/shared';
import { DEFAULT_SET_ASIDE_PCT, clampSetAsidePct } from '@orbit/shared';
import { config } from '../lib/config.js';

// Durable earmark ledger backed by SQLite (Node's built-in node:sqlite — zero deps).
// "pending" = earmarked, dollars still in the user's bank; "invested" = USDC in the vault.
// Survives server restarts, unlike the previous in-memory Map. On a host with a mounted
// volume, DATA_DIR points the db at that volume so it persists across redeploys.
const dbPath = config.dataDir
  ? path.join(config.dataDir, 'orbit.db')
  : fileURLToPath(new URL('../../.orbit.db', import.meta.url));
// Make sure the directory exists (e.g. a mounted volume path) so SQLite can open the file
// instead of crash-looping with "unable to open database file".
try {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
} catch {}
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS savings (
    user_id           TEXT PRIMARY KEY,
    pending_usd       REAL NOT NULL DEFAULT 0,
    invested_usd      REAL NOT NULL DEFAULT 0,
    set_aside_pct     REAL NOT NULL DEFAULT ${DEFAULT_SET_ASIDE_PCT},
    last_deposit_sig  TEXT
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'Other',
    amount_usd  REAL NOT NULL,
    set_aside   REAL NOT NULL DEFAULT 0,
    deposited   INTEGER NOT NULL DEFAULT 0,
    ts          INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_txn_user_ts ON transactions (user_id, ts);
  CREATE TABLE IF NOT EXISTS plaid_items (
    user_id       TEXT PRIMARY KEY,
    access_token  TEXT NOT NULL,
    item_id       TEXT,
    cursor        TEXT,
    institution   TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    user_id       TEXT PRIMARY KEY,
    email         TEXT,
    name          TEXT,
    created_at    INTEGER NOT NULL,
    last_login_at INTEGER NOT NULL,
    token_version INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT
  );
  CREATE TABLE IF NOT EXISTS activity (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  TEXT NOT NULL,
    kind     TEXT NOT NULL,
    text     TEXT NOT NULL,
    ts       INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_activity_user_ts ON activity (user_id, ts);
`);

// Migration: add set_aside_pct to savings tables created before percentage rates existed.
try {
  db.exec(`ALTER TABLE savings ADD COLUMN set_aside_pct REAL NOT NULL DEFAULT ${DEFAULT_SET_ASIDE_PCT}`);
} catch {
  // column already exists — fine.
}
// Migration: add password_hash to users tables created before email/password auth.
try {
  db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT');
} catch {
  // column already exists — fine.
}

export type Txn = {
  id: number;
  name: string;
  category: string;
  amountUsd: number;
  setAside: number;
  deposited: boolean;
  ts: number;
};

const insertTxnStmt = db.prepare(
  `INSERT INTO transactions (user_id, name, category, amount_usd, set_aside, deposited, ts)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
);
const selectTxnStmt = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY ts DESC, id DESC LIMIT ?');
const deleteTxnStmt = db.prepare('DELETE FROM transactions WHERE user_id = ?');

/** Record a processed spend/set-aside so the dashboard can chart real history. */
export function recordTxn(
  userId: string,
  t: { name: string; category: string; amountUsd: number; setAside: number; deposited: boolean; ts: number },
): void {
  insertTxnStmt.run(userId, t.name, t.category, t.amountUsd, t.setAside, t.deposited ? 1 : 0, t.ts);
}

/** Recent transactions, newest first. */
export function getTransactions(userId: string, limit = 500): Txn[] {
  const rows = selectTxnStmt.all(userId, limit) as {
    id: number;
    name: string;
    category: string;
    amount_usd: number;
    set_aside: number;
    deposited: number;
    ts: number;
  }[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    amountUsd: r.amount_usd,
    setAside: r.set_aside,
    deposited: !!r.deposited,
    ts: r.ts,
  }));
}

// ---- Activity: per-user app-event log (deposits, goals, wallet, sign-in…). The
// server-side home for what used to live in the browser's localStorage, so a user's
// history follows them across devices and never leaks between accounts on one browser. ----
export type ActivityRow = { id: string; kind: string; text: string; ts: number };

const insertActivityStmt = db.prepare('INSERT INTO activity (user_id, kind, text, ts) VALUES (?, ?, ?, ?)');
const selectActivityStmt = db.prepare('SELECT id, kind, text, ts FROM activity WHERE user_id = ? ORDER BY ts DESC, id DESC LIMIT ?');
const deleteActivityStmt = db.prepare('DELETE FROM activity WHERE user_id = ?');

/** Append an app-activity event for a user. */
export function recordActivity(userId: string, kind: string, text: string, ts = Date.now()): void {
  insertActivityStmt.run(userId, kind, text, ts);
}

/** A user's activity, newest first. */
export function listActivity(userId: string, limit = 200): ActivityRow[] {
  const rows = selectActivityStmt.all(userId, limit) as { id: number; kind: string; text: string; ts: number }[];
  return rows.map((r) => ({ id: String(r.id), kind: r.kind, text: r.text, ts: r.ts }));
}

/** Clear a user's activity log. */
export function clearActivity(userId: string): void {
  deleteActivityStmt.run(userId);
}

// ---- Users: a canonical registry, upserted on each real sign-in. Parent of the
// savings / transactions / plaid_items rows. token_version is reserved for future
// "sign out everywhere" revocation (bump it to invalidate a user's live tokens). ----
export type User = {
  userId: string;
  email: string | null;
  name: string | null;
  createdAt: number;
  lastLoginAt: number;
  tokenVersion: number;
  passwordHash: string | null; // set only for email/password accounts; null for OAuth
};

const upsertUserStmt = db.prepare(
  `INSERT INTO users (user_id, email, name, created_at, last_login_at)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(user_id) DO UPDATE SET
     email = excluded.email,
     name = excluded.name,
     last_login_at = excluded.last_login_at`,
);
const insertLocalUserStmt = db.prepare(
  `INSERT INTO users (user_id, email, name, created_at, last_login_at, password_hash)
   VALUES (?, ?, ?, ?, ?, ?)`,
);
const touchLoginStmt = db.prepare('UPDATE users SET last_login_at = ? WHERE user_id = ?');
const selectUserStmt = db.prepare('SELECT * FROM users WHERE user_id = ?');

/** Create the user's row on first OAuth sign-in, or refresh name/email + last_login on return. */
export function upsertUser(userId: string, email: string | null, name: string | null): void {
  const now = Date.now();
  upsertUserStmt.run(userId, email, name, now, now);
}

/** Create an email/password account. Returns false if the user_id already exists. */
export function registerLocalUser(userId: string, email: string, name: string, passwordHash: string): boolean {
  const now = Date.now();
  try {
    insertLocalUserStmt.run(userId, email, name, now, now, passwordHash);
    return true;
  } catch {
    return false; // UNIQUE constraint — account already exists
  }
}

/** Stamp a successful sign-in. */
export function touchLogin(userId: string): void {
  touchLoginStmt.run(Date.now(), userId);
}

/** The user's registry row, or null if they've never signed in. */
export function getUser(userId: string): User | null {
  const r = selectUserStmt.get(userId) as
    | { user_id: string; email: string | null; name: string | null; created_at: number; last_login_at: number; token_version: number; password_hash: string | null }
    | undefined;
  if (!r) return null;
  return {
    userId: r.user_id,
    email: r.email,
    name: r.name,
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
    tokenVersion: r.token_version,
    passwordHash: r.password_hash ?? null,
  };
}

type Row = { user_id: string; pending_usd: number; invested_usd: number; set_aside_pct: number; last_deposit_sig: string | null };

const selectStmt = db.prepare('SELECT * FROM savings WHERE user_id = ?');
const upsertStmt = db.prepare(
  `INSERT INTO savings (user_id, pending_usd, invested_usd, set_aside_pct, last_deposit_sig)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(user_id) DO UPDATE SET
     pending_usd = excluded.pending_usd,
     invested_usd = excluded.invested_usd,
     set_aside_pct = excluded.set_aside_pct,
     last_deposit_sig = excluded.last_deposit_sig`,
);
const deleteStmt = db.prepare('DELETE FROM savings WHERE user_id = ?');

function toState(row: Row): SavingsState {
  const s: SavingsState = {
    userId: row.user_id,
    pendingUsd: row.pending_usd,
    investedUsd: row.invested_usd,
    setAsidePct: row.set_aside_pct ?? DEFAULT_SET_ASIDE_PCT,
  };
  if (row.last_deposit_sig) s.lastDepositSig = row.last_deposit_sig;
  return s;
}

// Money lives in REAL columns, so repeated += / -= accumulate float dust. Round to cents on
// every write and clamp sub-cent negative pending (a flushed balance that landed at -1e-14)
// to 0 so the threshold check and displayed balances stay clean.
const round2 = (n: number) => Math.round(n * 100) / 100;

function write(s: SavingsState) {
  let pending = round2(s.pendingUsd);
  if (pending < 0 && pending > -0.01) pending = 0;
  upsertStmt.run(s.userId, pending, round2(s.investedUsd), clampSetAsidePct(s.setAsidePct ?? DEFAULT_SET_ASIDE_PCT), s.lastDepositSig ?? null);
}

export function getState(userId: string): SavingsState {
  const row = selectStmt.get(userId) as Row | undefined;
  if (row) return toState(row);
  const fresh: SavingsState = { userId, pendingUsd: 0, investedUsd: 0, setAsidePct: DEFAULT_SET_ASIDE_PCT };
  write(fresh);
  return fresh;
}

/** Update the user's set-aside rate (% of each purchase), clamped to the allowed band. */
export function setSetAsidePct(userId: string, pct: number): SavingsState {
  const s = getState(userId);
  s.setAsidePct = clampSetAsidePct(pct);
  write(s);
  return s;
}

/** Earmark a set-aside. No money moves — it's just accounting until the threshold fires. */
export function addPending(userId: string, amountUsd: number): SavingsState {
  const s = getState(userId);
  s.pendingUsd += amountUsd;
  write(s);
  return s;
}

/** Move a batch from pending -> invested once it's been delivered on-chain. */
export function moveToInvested(userId: string, amountUsd: number, sig: string): SavingsState {
  const s = getState(userId);
  s.pendingUsd -= amountUsd;
  s.investedUsd += amountUsd;
  s.lastDepositSig = sig;
  write(s);
  return s;
}

/** Clear a user's state + transaction history (demo replay). */
export function resetState(userId: string): SavingsState {
  deleteStmt.run(userId);
  deleteTxnStmt.run(userId);
  return getState(userId);
}

// --- Plaid items (one linked bank per user) ------------------------------------
// Each user's Plaid access token + sync cursor live here, keyed by user_id, so one
// person's linked bank never bleeds into another's. Access tokens are bearer secrets:
// they stay server-side and are never returned to the client.
export type PlaidItem = { accessToken: string; itemId?: string; cursor?: string; institution?: string };

const selectPlaidStmt = db.prepare('SELECT * FROM plaid_items WHERE user_id = ?');
const upsertPlaidStmt = db.prepare(
  `INSERT INTO plaid_items (user_id, access_token, item_id, cursor, institution)
   VALUES (?, ?, ?, ?, ?)
   ON CONFLICT(user_id) DO UPDATE SET
     access_token = excluded.access_token,
     item_id = excluded.item_id,
     cursor = excluded.cursor,
     institution = excluded.institution`,
);
const updatePlaidCursorStmt = db.prepare('UPDATE plaid_items SET cursor = ? WHERE user_id = ?');
const deletePlaidStmt = db.prepare('DELETE FROM plaid_items WHERE user_id = ?');

/** The user's linked Plaid item, or null if they haven't connected a bank. */
export function getPlaidItem(userId: string): PlaidItem | null {
  const row = selectPlaidStmt.get(userId) as
    | { user_id: string; access_token: string; item_id: string | null; cursor: string | null; institution: string | null }
    | undefined;
  if (!row) return null;
  return {
    accessToken: row.access_token,
    itemId: row.item_id ?? undefined,
    cursor: row.cursor ?? undefined,
    institution: row.institution ?? undefined,
  };
}

/** Store (or replace) the user's linked bank. */
export function savePlaidItem(userId: string, item: PlaidItem): void {
  upsertPlaidStmt.run(userId, item.accessToken, item.itemId ?? null, item.cursor ?? null, item.institution ?? null);
}

/** Advance the user's transactions-sync cursor after a successful sync. */
export function updatePlaidCursor(userId: string, cursor: string | undefined): void {
  updatePlaidCursorStmt.run(cursor ?? null, userId);
}

/** Forget the user's linked bank (disconnect). Savings + history are untouched. */
export function clearPlaidItem(userId: string): void {
  deletePlaidStmt.run(userId);
}

/** Flush + close the SQLite handle cleanly (called on graceful shutdown). */
export function closeDb(): void {
  db.close();
}
