import {
  BaseSignerWalletAdapter,
  WalletReadyState,
  type WalletName,
} from "@solana/wallet-adapter-base";
import { Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { encryptSecret, decryptSecret, type EncryptedBlob } from "./walletCrypto";

// An in-app "embedded" wallet for non-crypto users: no extension, no seed phrase — Orbit
// generates a keypair in the browser and signs with it. The secret key is encrypted at
// rest with the user's passphrase (AES-GCM), so a stolen localStorage blob is useless
// without it. Production swaps this for Privy/Turnkey (MPC / server-side key custody).
// It plugs into the standard wallet-adapter so the rest of the app treats it like any wallet.

export const OrbitWalletName = "Orbit account" as WalletName<"Orbit account">;
const LS_V1 = "orbit.embedded.wallet.v1"; // legacy plaintext (migrated + deleted on load)
const LS_V2 = "orbit.embedded.wallet.v2"; // encrypted blob
const SS_KEY = "orbit.embedded.session"; // per-tab decrypted key, avoids re-prompting

// How the passphrase is collected. Defaults to a prompt; the app can override this with
// a nicer modal via setPassphraseProvider().
export type PassphraseMode = "create" | "unlock";
type PassphraseProvider = (mode: PassphraseMode) => Promise<string | null>;
let passphraseProvider: PassphraseProvider = (mode) =>
  Promise.resolve(
    typeof window === "undefined"
      ? null
      : window.prompt(
          mode === "create"
            ? "Set a passphrase to protect your Orbit account. You'll need it to sign in on this device — it can't be recovered."
            : "Enter your Orbit account passphrase:",
        ),
  );
export function setPassphraseProvider(fn: PassphraseProvider) {
  passphraseProvider = fn;
}

// Small orbit-mark icon (indigo ring) so it looks intentional in the wallet list.
const ICON =
  "data:image/svg+xml;base64," +
  btoaSafe(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#818cf8" stroke-width="2"/><circle cx="12" cy="12" r="2.5" fill="#818cf8"/></svg>`,
  );

function btoaSafe(s: string): string {
  if (typeof window !== "undefined" && window.btoa) return window.btoa(s);
  return Buffer.from(s, "utf8").toString("base64");
}

const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function cacheSession(secret: Uint8Array) {
  try {
    window.sessionStorage.setItem(SS_KEY, toB64(secret));
  } catch {}
}

async function askPassphrase(mode: PassphraseMode): Promise<string> {
  const p = await passphraseProvider(mode);
  if (!p) throw new Error("Passphrase required");
  return p;
}

async function loadOrCreateKeypair(): Promise<Keypair> {
  if (typeof window === "undefined") return Keypair.generate();

  // 1) Already unlocked this tab session — no prompt.
  const cached = window.sessionStorage.getItem(SS_KEY);
  if (cached) {
    try {
      return Keypair.fromSecretKey(fromB64(cached));
    } catch {
      window.sessionStorage.removeItem(SS_KEY);
    }
  }

  // 2) Encrypted account exists — unlock with the passphrase.
  const blobRaw = window.localStorage.getItem(LS_V2);
  if (blobRaw) {
    const blob = JSON.parse(blobRaw) as EncryptedBlob;
    const secret = await decryptSecret(blob, await askPassphrase("unlock"));
    cacheSession(secret);
    return Keypair.fromSecretKey(secret);
  }

  // 3) Legacy plaintext key — migrate it to an encrypted blob, then delete the plaintext.
  const legacy = window.localStorage.getItem(LS_V1);
  if (legacy) {
    try {
      const secret = Uint8Array.from(JSON.parse(legacy));
      const enc = await encryptSecret(secret, await askPassphrase("create"));
      window.localStorage.setItem(LS_V2, JSON.stringify(enc));
      window.localStorage.removeItem(LS_V1);
      cacheSession(secret);
      return Keypair.fromSecretKey(secret);
    } catch {
      window.localStorage.removeItem(LS_V1); // corrupt — fall through to create
    }
  }

  // 4) Create a fresh account, encrypt it at rest.
  const kp = Keypair.generate();
  const enc = await encryptSecret(kp.secretKey, await askPassphrase("create"));
  window.localStorage.setItem(LS_V2, JSON.stringify(enc));
  cacheSession(kp.secretKey);
  return kp;
}

/** True if the user has already created an embedded Orbit account in this browser. */
export function hasEmbeddedAccount(): boolean {
  return typeof window !== "undefined" && (!!window.localStorage.getItem(LS_V2) || !!window.localStorage.getItem(LS_V1));
}

export class OrbitWalletAdapter extends BaseSignerWalletAdapter {
  name = OrbitWalletName;
  url = "https://orbit.savings";
  icon = ICON;
  readonly supportedTransactionVersions = null; // Orbit uses legacy transactions

  private _keypair: Keypair | null = null;
  private _publicKey: PublicKey | null = null;
  private _connecting = false;

  get connecting(): boolean {
    return this._connecting;
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get readyState(): WalletReadyState {
    // Always available — it's built into the app, nothing to install.
    return WalletReadyState.Installed;
  }

  async connect(): Promise<void> {
    if (this.connected || this.connecting) return;
    try {
      this._connecting = true;
      const kp = await loadOrCreateKeypair();
      this._keypair = kp;
      this._publicKey = kp.publicKey;
      // Defer the emit to the next macrotask. The provider subscribes to `connect` in a
      // parent effect, which React runs *after* child effects — so a synchronous emit here
      // would fire before the listener exists and be missed (leaving `connected` false).
      await new Promise((resolve) => setTimeout(resolve, 0));
      this.emit("connect", kp.publicKey);
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    this._keypair = null;
    this._publicKey = null;
    this.emit("disconnect");
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    if (!this._keypair) throw new Error("Orbit account not connected");
    if (transaction instanceof VersionedTransaction) transaction.sign([this._keypair]);
    else (transaction as Transaction).partialSign(this._keypair);
    return transaction;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    for (const tx of transactions) await this.signTransaction(tx);
    return transactions;
  }
}
