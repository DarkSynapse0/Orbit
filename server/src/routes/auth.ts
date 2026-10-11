import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../lib/config.js';
import { signSession } from '../lib/auth.js';
import { upsertUser, getUser, registerLocalUser, touchLogin } from '../services/ledger.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { verifyAppleToken } from '../lib/apple.js';
import { parseEmail, parsePassword, BadRequest } from '../lib/validate.js';

export const authRouter = Router();

const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

const cleanName = (v: unknown, fallback: string) =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, 80) : fallback;

/** Verify a Google ID token and issue a session. */
authRouter.post('/google', async (req, res) => {
  const credential = req.body?.credential as string | undefined;
  if (!credential) {
    res.status(400).json({ error: 'credential required' });
    return;
  }
  if (!googleClient) {
    res.status(503).json({ error: 'Google sign-in not configured' });
    return;
  }
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: config.googleClientId });
    const p = ticket.getPayload();
    if (!p?.sub || !p.email_verified) {
      res.status(401).json({ error: 'unverified Google account' });
      return;
    }
    // Stable per-user id derived from the verified subject — not client-supplied.
    const userId = `google:${p.sub}`;
    const user = { name: p.name ?? 'Orbit user', email: p.email ?? '', picture: p.picture };
    // Record the user in the registry (first sign-in creates the row; returns refresh it).
    upsertUser(userId, user.email || null, user.name);
    const token = signSession({ userId, email: user.email, name: user.name });
    res.json({ token, user });
  } catch (e) {
    console.error('[auth] google verify failed:', (e as Error).message);
    res.status(401).json({ error: 'invalid Google credential' });
  }
});

/** Create an email/password account and issue a session. */
authRouter.post('/register', (req, res) => {
  try {
    const email = parseEmail(req.body?.email);
    const password = parsePassword(req.body?.password);
    const name = cleanName(req.body?.name, email.split('@')[0]);
    const userId = `email:${email}`;
    if (getUser(userId)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    if (!registerLocalUser(userId, email, name, hashPassword(password))) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    const token = signSession({ userId, email, name });
    res.json({ token, user: { name, email } });
  } catch (e) {
    if (e instanceof BadRequest) {
      res.status(400).json({ error: e.message });
      return;
    }
    console.error('[auth] register failed:', (e as Error).message);
    res.status(500).json({ error: 'registration failed' });
  }
});

/** Sign in with an email/password account. */
authRouter.post('/login', (req, res) => {
  try {
    const email = parseEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const userId = `email:${email}`;
    const u = getUser(userId);
    // One generic message whether the email is unknown or the password is wrong.
    if (!u || !u.passwordHash || !verifyPassword(password, u.passwordHash)) {
      res.status(401).json({ error: 'Incorrect email or password.' });
      return;
    }
    touchLogin(userId);
    const name = u.name ?? email;
    const token = signSession({ userId, email, name });
    res.json({ token, user: { name, email } });
  } catch (e) {
    if (e instanceof BadRequest) {
      res.status(400).json({ error: e.message });
      return;
    }
    console.error('[auth] login failed:', (e as Error).message);
    res.status(500).json({ error: 'login failed' });
  }
});

/** Verify a Sign in with Apple identity token and issue a session. Gated on config. */
authRouter.post('/apple', async (req, res) => {
  if (!config.appleClientId) {
    res.status(503).json({ error: 'Apple sign-in not configured' });
    return;
  }
  const idToken = req.body?.identityToken as string | undefined;
  if (!idToken) {
    res.status(400).json({ error: 'identityToken required' });
    return;
  }
  const claims = await verifyAppleToken(idToken, config.appleClientId);
  if (!claims?.sub) {
    res.status(401).json({ error: 'invalid Apple credential' });
    return;
  }
  const userId = `apple:${claims.sub}`;
  const email = claims.email ?? '';
  // Apple only sends the name on the very first authorization, so accept it from the client.
  const name = cleanName(req.body?.name, email ? email.split('@')[0] : 'Orbit user');
  upsertUser(userId, email || null, name);
  const token = signSession({ userId, email, name });
  res.json({ token, user: { name, email } });
});

/** Demo session: a throwaway sandbox account. Only enabled outside production
 * (devnet), so it can't be used to bypass real auth in a live deployment. */
authRouter.post('/demo', (_req, res) => {
  if (!config.isDevnet) {
    res.status(403).json({ error: 'demo sign-in disabled' });
    return;
  }
  // Unique id per session so demo visitors never share a ledger or linked bank.
  const userId = `demo:${globalThis.crypto.randomUUID()}`;
  const token = signSession({ userId, email: 'alex@orbit.app', name: 'Alex Rivera' });
  res.json({ token, user: { name: 'Alex Rivera', email: 'alex@orbit.app' } });
});
