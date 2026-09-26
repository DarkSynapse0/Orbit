import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';
import { signSession } from '../auth.js';

export const authRouter = Router();

const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

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
    const token = signSession({ userId, email: user.email, name: user.name });
    res.json({ token, user });
  } catch (e) {
    console.error('[auth] google verify failed:', (e as Error).message);
    res.status(401).json({ error: 'invalid Google credential' });
  }
});

/** Demo session: a shared sandbox account. Only enabled outside production
 * (devnet), so it can't be used to bypass real auth in a live deployment. */
authRouter.post('/demo', (_req, res) => {
  if (!config.isDevnet) {
    res.status(403).json({ error: 'demo sign-in disabled' });
    return;
  }
  const token = signSession({ userId: 'demo', email: 'alex@orbit.app', name: 'Alex Rivera' });
  res.json({ token, user: { name: 'Alex Rivera', email: 'alex@orbit.app' } });
});
