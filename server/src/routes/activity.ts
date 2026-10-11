import { Router } from 'express';
import { requireAuth } from '../lib/auth.js';
import { recordActivity, listActivity, clearActivity } from '../services/ledger.js';

// Per-user app-activity log. Every route derives the user from the verified session
// (requireAuth → req.userId), so a user only ever sees and writes their own history.
export const activityRouter = Router();
activityRouter.use(requireAuth);

const KINDS = new Set([
  'goal_create',
  'goal_allocate',
  'goal_empty',
  'goal_delete',
  'deposit',
  'withdraw',
  'faucet',
  'wallet_connect',
  'wallet_disconnect',
  'sign_in',
]);

/** The signed-in user's activity, newest first. */
activityRouter.get('/', (req, res) => {
  res.json({ activity: listActivity(req.userId!) });
});

/** Record one activity event for the signed-in user. */
activityRouter.post('/', (req, res) => {
  const kind = typeof req.body?.kind === 'string' ? req.body.kind : '';
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!KINDS.has(kind)) {
    res.status(400).json({ error: 'invalid activity kind' });
    return;
  }
  if (!text || text.length > 300) {
    res.status(400).json({ error: 'invalid activity text' });
    return;
  }
  recordActivity(req.userId!, kind, text);
  res.json({ ok: true });
});

/** Clear the signed-in user's activity log. */
activityRouter.delete('/', (req, res) => {
  clearActivity(req.userId!);
  res.json({ ok: true });
});
