import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import type { SavingsState } from '@orbit/shared';

// Durable earmark ledger backed by SQLite (Node's built-in node:sqlite — zero deps).
// "pending" = earmarked, dollars still in the user's bank; "invested" = USDC in the vault.
// Survives server restarts, unlike the previous in-memory Map.
const dbPath = fileURLToPath(new URL('../.orbit.db', import.meta.url));
const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS savings (
    user_id           TEXT PRIMARY KEY,
    pending_usd       REAL NOT NULL DEFAULT 0,
    invested_usd      REAL NOT NULL DEFAULT 0,
    last_deposit_sig  TEXT
  );
`);

type Row = { user_id: string; pending_usd: number; invested_usd: number; last_deposit_sig: string | null };

const selectStmt = db.prepare('SELECT * FROM savings WHERE user_id = ?');
const upsertStmt = db.prepare(
  `INSERT INTO savings (user_id, pending_usd, invested_usd, last_deposit_sig)
   VALUES (?, ?, ?, ?)
   ON CONFLICT(user_id) DO UPDATE SET
     pending_usd = excluded.pending_usd,
     invested_usd = excluded.invested_usd,
     last_deposit_sig = excluded.last_deposit_sig`,
);
const deleteStmt = db.prepare('DELETE FROM savings WHERE user_id = ?');

function toState(row: Row): SavingsState {
  const s: SavingsState = { userId: row.user_id, pendingUsd: row.pending_usd, investedUsd: row.invested_usd };
  if (row.last_deposit_sig) s.lastDepositSig = row.last_deposit_sig;
  return s;
}

function write(s: SavingsState) {
  upsertStmt.run(s.userId, s.pendingUsd, s.investedUsd, s.lastDepositSig ?? null);
}

export function getState(userId: string): SavingsState {
  const row = selectStmt.get(userId) as Row | undefined;
  if (row) return toState(row);
  const fresh: SavingsState = { userId, pendingUsd: 0, investedUsd: 0 };
  write(fresh);
  return fresh;
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

/** Clear a user's state (demo replay). */
export function resetState(userId: string): SavingsState {
  deleteStmt.run(userId);
  return getState(userId);
}
