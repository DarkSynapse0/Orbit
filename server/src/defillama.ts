// Live lending stats (APY + TVL) for the yield venues, from DefiLlama's public
// yields API. Cached for 10 minutes so we don't refetch the (large) pool list
// on every request. Each venue maps to its DefiLlama project slug; we pick the
// USDC pool with the highest TVL as the representative rate.

export type VenueStat = { apy: number | null; tvl: number | null };

type Matcher = { projects: string[]; chain?: string };
const MATCH: Record<string, Matcher> = {
  kamino: { projects: ["kamino-lend"], chain: "Solana" },
  aave: { projects: ["aave-v3"] }, // largest USDC market across chains
  save: { projects: ["save", "solend"], chain: "Solana" },
  marginfi: { projects: ["marginfi-lend", "marginfi"], chain: "Solana" },
};

const TTL = 10 * 60 * 1000;
let cache: { at: number; data: Record<string, VenueStat> } | null = null;

type Pool = { project: string; chain: string; symbol: string; tvlUsd: number; apy: number | null; apyBase: number | null };

export async function getVenueStats(): Promise<Record<string, VenueStat>> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  const res = await fetch("https://yields.llama.fi/pools");
  if (!res.ok) throw new Error(`DefiLlama ${res.status}`);
  const json = (await res.json()) as { data: Pool[] };
  const pools = json.data ?? [];

  const out: Record<string, VenueStat> = {};
  for (const [id, m] of Object.entries(MATCH)) {
    const cands = pools.filter(
      (p) =>
        m.projects.includes(p.project) &&
        /^usdc$/i.test(p.symbol) &&
        (!m.chain || p.chain === m.chain),
    );
    const best = cands.sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0))[0];
    out[id] = best ? { apy: best.apy ?? best.apyBase ?? null, tvl: best.tvlUsd ?? null } : { apy: null, tvl: null };
  }

  cache = { at: Date.now(), data: out };
  return out;
}
