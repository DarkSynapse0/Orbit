// Passphrase-based encryption for the embedded wallet's secret key, so the value
// persisted in localStorage is useless without the user's passphrase (a stolen
// localStorage blob can't be turned into a signing key). AES-256-GCM with a
// PBKDF2-SHA256 derived key. Interim hardening before a Privy/Turnkey MPC swap.

export type EncryptedBlob = { v: 2; salt: string; iv: string; iter: number; ct: string };

const ITER = 210_000;
const enc = new TextEncoder();

const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(passphrase: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptSecret(secret: Uint8Array, passphrase: string): Promise<EncryptedBlob> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, ITER);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, secret as BufferSource));
  return { v: 2, salt: toB64(salt), iv: toB64(iv), iter: ITER, ct: toB64(ct) };
}

export async function decryptSecret(blob: EncryptedBlob, passphrase: string): Promise<Uint8Array> {
  const key = await deriveKey(passphrase, fromB64(blob.salt), blob.iter);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(blob.iv) as BufferSource }, key, fromB64(blob.ct) as BufferSource);
    return new Uint8Array(pt);
  } catch {
    // AES-GCM auth failure == wrong passphrase (or tampered blob).
    throw new Error("Incorrect passphrase");
  }
}
