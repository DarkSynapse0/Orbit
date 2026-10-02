import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { config } from './config.js';

// Minimal, dependency-free session tokens: base64url(payload).hmacSHA256.
// The server derives the acting userId from a verified token — never from the
// request body — which closes the IDOR hole where any caller could pass userId.

export type Session = { userId: string; email?: string; name?: string; exp: number };

const b64url = (b: Buffer) => b.toString('base64url');

function sign(data: string): string {
  return crypto.createHmac('sha256', config.sessionSecret).update(data).digest('base64url');
}

export function signSession(s: Omit<Session, 'exp'>, ttlSeconds = 7 * 24 * 3600): string {
  const payload: Session = { ...s, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  return `${body}.${sign(body)}`;
}

export function verifySession(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  // Constant-time compare against a recomputed MAC.
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString()) as Session;
    if (!s.userId || typeof s.exp !== 'number' || s.exp < Math.floor(Date.now() / 1000)) return null;
    return s;
  } catch {
    return null;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      email?: string;
    }
  }
}

/** Require a valid session; attaches req.userId. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
  const s = verifySession(token);
  if (!s) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  req.userId = s.userId;
  req.email = s.email;
  next();
}
