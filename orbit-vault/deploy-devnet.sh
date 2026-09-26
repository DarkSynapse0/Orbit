#!/usr/bin/env bash
# Build + deploy the orbit-vault program to devnet, then reset to a fresh reserve
# so the new Reserve layout (total_principal) takes effect. Run from a machine whose
# Solana CLI can reach devnet for large uploads. Uses ~/.config/solana/id.json as the
# upgrade authority (the key that originally deployed the program).
set -euo pipefail
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.cargo/bin:$PATH"
cd "$(dirname "$0")"

RPC="${SOLANA_RPC_URL:-https://api.devnet.solana.com}"
echo "Building…"
anchor build

echo "Deploying to $RPC …"
solana program deploy target/deploy/orbit_vault.so \
  --program-id target/deploy/orbit_vault-keypair.json \
  --url "$RPC" \
  --upgrade-authority "$HOME/.config/solana/id.json" \
  --use-rpc

# The existing reserve account has the OLD layout; the new program expects the new one.
# Vaults are now keyed by (owner, mint), so pointing the server at a fresh mint creates a
# clean reserve + vaults with the new layout. This drops the server's saved test mint.
rm -f ../server/.devnet.json
# Keep the frontend IDL in sync with what was just deployed.
cp target/idl/orbit_vault.json ../app/src/idl/orbit_vault.json

echo
echo "Done. Now restart the backend (pnpm dev:server) — on first call it will create a"
echo "fresh test mint + reserve (prefunded interest buffer) with the new solvency accounting."
