import type { GarageStep } from '../search/search';
import { namespacedKey, readJson, type KeyValueStore } from './kv';

/**
 * The Request log (07 v0.2): what riders asked for and could not find. Stored on the device under
 * mtbTriage:<uid|anon>:requests and exportable as JSON. This is the harvest priority list.
 */
export interface RequestEntry {
  id: string;
  created_at: string;
  kind: 'bike' | 'fork' | 'shock' | 'other';
  brand: string;
  model: string;
  year: number | null;
  text: string;
  /** The Garage step the rider had reached when they gave up. */
  step_reached: GarageStep;
  /** What they typed, if the request came from an empty search. */
  query: string | null;
}

export type RequestInput = Omit<RequestEntry, 'id' | 'created_at'>;

export class RequestLog {
  private readonly key: string;
  constructor(private readonly store: KeyValueStore, uid: string | null) {
    this.key = namespacedKey(uid, 'requests');
  }

  list(): RequestEntry[] {
    return readJson<RequestEntry[]>(this.store, this.key, []);
  }

  /** Returns the saved entry, or throws if there is nothing to act on. */
  add(input: RequestInput, meta: { id: string; now: string }): RequestEntry {
    const clean = { ...input, brand: input.brand.trim(), model: input.model.trim(), text: input.text.trim() };
    if (!clean.brand && !clean.model && !clean.text) throw new Error('Tell us at least the brand, the model or what you are looking for.');
    const entry: RequestEntry = { ...clean, id: meta.id, created_at: meta.now };
    this.store.set(this.key, JSON.stringify([...this.list(), entry]));
    return entry;
  }

  remove(id: string): void {
    this.store.set(this.key, JSON.stringify(this.list().filter((r) => r.id !== id)));
  }

  /** JSON export for the harvest team. */
  exportJson(): string {
    return JSON.stringify({ exported_by: 'mtbTriage', key: this.key, requests: this.list() }, null, 2);
  }
}
