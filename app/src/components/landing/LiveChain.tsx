"use client";

import { useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

const PROGRAM = new PublicKey("8LEjyrMCKukhxA4q3DRaYGfkappxRayiTPM7saZG2Kgi");

// Real devnet reads: current slot (proves a live connection) + the vault program's
// balance. Polls every ~4s and fails soft — never throws, never blocks render.
export function LiveChain() {
  const { connection } = useConnection();
  const [slot, setSlot] = useState<number | null>(null);
  const [sol, setSol] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const [s, lamports] = await Promise.all([
          connection.getSlot(),
          connection.getBalance(PROGRAM),
        ]);
        if (!alive) return;
        setSlot(s);
        setSol(lamports / 1e9);
      } catch {
        /* devnet hiccup — keep the last values */
      }
    };
    pull();
    const id = setInterval(pull, 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [connection]);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-[13px]">
      <span className="inline-flex items-center gap-1.5 text-[var(--accent)]">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
        </span>
        live · devnet
      </span>
      <span className="text-[var(--muted)]">
        slot <span className="text-[var(--foreground)]">{slot !== null ? slot.toLocaleString() : "…"}</span>
      </span>
      <span className="text-[var(--muted)]">
        program <span className="text-[var(--foreground)]">{sol !== null ? sol.toFixed(4) : "…"}</span> SOL
      </span>
    </div>
  );
}
