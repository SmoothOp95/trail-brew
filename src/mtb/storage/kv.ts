/**
 * Key-value storage behind an interface: localStorage in the browser, in memory for tests and for
 * signed-out Bench sessions. Keys are always namespaced `mtbTriage:<uid|anon>:<name>` so they never
 * collide with bikeTrackerData / bikeServiceHistory, which src/utils/migrate.js deletes.
 */
export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function namespacedKey(uid: string | null | undefined, name: string): string {
  return `mtbTriage:${uid || 'anon'}:${name}`;
}

export function memoryStore(): KeyValueStore & { dump(): Record<string, string> } {
  const m = new Map<string, string>();
  return {
    get: (k) => m.get(k) ?? null,
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
}

/** localStorage, failing soft: private windows and blocked storage fall back to memory. */
export function browserStore(): KeyValueStore {
  const fallback = memoryStore();
  const ls = (() => {
    try {
      const s = globalThis.localStorage;
      const probe = '__mtbTriage_probe__';
      s.setItem(probe, '1');
      s.removeItem(probe);
      return s;
    } catch {
      return null;
    }
  })();
  if (!ls) return fallback;
  return {
    get: (k) => {
      try { return ls.getItem(k); } catch { return fallback.get(k); }
    },
    set: (k, v) => {
      try { ls.setItem(k, v); } catch { fallback.set(k, v); }
    },
    remove: (k) => {
      try { ls.removeItem(k); } catch { fallback.remove(k); }
    },
  };
}

export function readJson<T>(store: KeyValueStore, key: string, fallback: T): T {
  const raw = store.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
