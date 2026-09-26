"use client";

import { Buffer } from "buffer";
import { useMemo } from "react";

// web3.js touches Buffer during transaction serialization; polyfill it in the browser.
if (typeof globalThis !== "undefined" && !(globalThis as { Buffer?: unknown }).Buffer) {
  (globalThis as { Buffer?: unknown }).Buffer = Buffer;
}

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { OrbitWalletAdapter } from "@/lib/orbitWallet";
import { AuthProvider } from "@/lib/auth";

// Phantom and Solflare implement the Wallet Standard, so they auto-register. We add Orbit's
// own embedded wallet for non-crypto users (no extension needed). Devnet endpoint, autoConnect
// so the wallet persists across refreshes.
export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);
  const wallets = useMemo(() => [new OrbitWalletAdapter()], []);
  return (
    <AuthProvider>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </AuthProvider>
  );
}
