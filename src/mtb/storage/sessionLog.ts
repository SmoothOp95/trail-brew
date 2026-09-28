import type { LapEntry } from '../engine/bench';

/**
 * Session log storage behind an interface (07 v0.2): IndexedDB when signed in, memory when signed out
 * or when IndexedDB is unavailable. One database per user, `mtbTriage:<uid>`.
 */
export interface LapStore {
  readonly persistent: boolean;
  list(): Promise<LapEntry[]>;
  put(lap: LapEntry): Promise<void>;
  remove(id: string): Promise<void>;
}

export function memoryLapStore(): LapStore {
  const laps = new Map<string, LapEntry>();
  return {
    persistent: false,
    list: async () => [...laps.values()].sort((a, b) => a.date.localeCompare(b.date) || a.lap - b.lap),
    put: async (lap) => void laps.set(lap.id, { ...lap }),
    remove: async (id) => void laps.delete(id),
  };
}

const STORE = 'laps';

function openDb(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** IndexedDB lap store for a signed-in rider. Falls back to memory if IndexedDB cannot open. */
export function idbLapStore(uid: string): LapStore {
  const fallback = memoryLapStore();
  let dbPromise: Promise<IDBDatabase | null> | null = null;
  const db = () =>
    (dbPromise ??= typeof indexedDB === 'undefined' ? Promise.resolve(null) : openDb(`mtbTriage:${uid}`).catch(() => null));
  return {
    persistent: true,
    async list() {
      const d = await db();
      if (!d) return fallback.list();
      const all = await run<LapEntry[]>(d, 'readonly', (s) => s.getAll() as IDBRequest<LapEntry[]>);
      return all.sort((a, b) => a.date.localeCompare(b.date) || a.lap - b.lap);
    },
    async put(lap) {
      const d = await db();
      if (!d) return fallback.put(lap);
      await run(d, 'readwrite', (s) => s.put(lap));
    },
    async remove(id) {
      const d = await db();
      if (!d) return fallback.remove(id);
      await run(d, 'readwrite', (s) => s.delete(id));
    },
  };
}
