import crypto from 'node:crypto';

// Verify a "Sign in with Apple" identity token (a JWT signed by Apple, RS256)
// without any JWT dependency: fetch Apple's public keys, pick the one named in
// the token header, and verify the signature + standard claims with node:crypto
// (which can build a public key straight from a JWK).

export type AppleClaims = { sub: string; email?: string; email_verified?: boolean | string; iss: string; aud: string; exp: number };

type Jwk = { kid: string; alg: string; kty: string; n: string; e: string };
let cache: { keys: Jwk[]; at: number } | null = null;

async function appleKeys(): Promise<Jwk[]> {
  if (cache && Date.now() - cache.at < 3_600_000) return cache.keys;
  const r = await fetch('https://appleid.apple.com/auth/keys', { signal: AbortSignal.timeout(5000) });
  if (!r.ok) throw new Error(`apple keys ${r.status}`);
  const j = (await r.json()) as { keys: Jwk[] };
  cache = { keys: j.keys, at: Date.now() };
  return j.keys;
}

const decode = (seg: string) => JSON.parse(Buffer.from(seg, 'base64url').toString());

/** Returns the verified claims, or null if the token is invalid/expired/wrong audience. */
export async function verifyAppleToken(idToken: string, audience: string): Promise<AppleClaims | null> {
  try {
    const [h, p, s] = idToken.split('.');
    if (!h || !p || !s) return null;
    const header = decode(h) as { kid: string; alg: string };
    if (header.alg !== 'RS256') return null;
    const jwk = (await appleKeys()).find((k) => k.kid === header.kid);
    if (!jwk) return null;
    const pub = crypto.createPublicKey({ key: jwk as unknown as crypto.JsonWebKey, format: 'jwk' });
    const ok = crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), pub, Buffer.from(s, 'base64url'));
    if (!ok) return null;
    const claims = decode(p) as AppleClaims;
    if (claims.iss !== 'https://appleid.apple.com') return null;
    if (claims.aud !== audience) return null;
    if (typeof claims.exp !== 'number' || claims.exp < Math.floor(Date.now() / 1000)) return null;
    if (!claims.sub) return null;
    return claims;
  } catch {
    return null;
  }
}
