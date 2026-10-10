// Per-key async mutex. Serializes async operations that share a key (here: a userId) so
// concurrent money mutations can't interleave — e.g. two "invest now" requests, or an
// invest racing a sync, both reading the same pending balance and depositing it twice.
//
// Each key owns a promise chain; a new op runs only after the previous one for that key
// settles (success or failure). The map holds one entry per in-flight key and drops it
// once the key goes idle, so it stays bounded by the number of concurrent users.
const tails = new Map<string, Promise<unknown>>();

export function withUserLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = tails.get(key) ?? Promise.resolve();
  const run = prev.then(fn, fn); // run fn after prev settles, regardless of prev's outcome
  const tail = run.then(
    () => {},
    () => {},
  );
  tails.set(key, tail);
  // Drop the entry once this op is the last one queued for the key (keeps the map bounded).
  void tail.finally(() => {
    if (tails.get(key) === tail) tails.delete(key);
  });
  return run;
}
