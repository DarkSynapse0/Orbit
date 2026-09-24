import {
  BaseSignerWalletAdapter,
  WalletReadyState,
  type WalletName,
} from "@solana/wallet-adapter-base";
import { Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

// An in-app "embedded" wallet for non-crypto users: no extension, no seed phrase — Orbit
// generates a keypair in the browser and signs with it. DEMO-GRADE: the key lives in
// localStorage. Production swaps this for Privy/Turnkey (secure, server-side key custody).
// It plugs into the standard wallet-adapter so the rest of the app treats it like any wallet.

export const OrbitWalletName = "Orbit account" as WalletName<"Orbit account">;
const LS_KEY = "orbit.embedded.wallet.v1";

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

function loadOrCreateKeypair(): Keypair {
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(saved)));
      } catch {
        /* corrupt — regenerate below */
      }
    }
  }
  const kp = Keypair.generate();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LS_KEY, JSON.stringify(Array.from(kp.secretKey)));
  }
  return kp;
}

/** True if the user has already created an embedded Orbit account in this browser. */
export function hasEmbeddedAccount(): boolean {
  return typeof window !== "undefined" && !!window.localStorage.getItem(LS_KEY);
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
      const kp = loadOrCreateKeypair();
      this._keypair = kp;
      this._publicKey = kp.publicKey;
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
