// Reject a promise if it doesn't settle within `ms`. Used to bound on-chain RPC calls so a
// stalled devnet confirmation can't hold a request (and its socket) open indefinitely.
export function withTimeout<T>(p: Promise<T>, ms: number, label = 'operation'): Promise<T> {
  return Promise.race([
    p,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms).unref();
    }),
  ]);
}
