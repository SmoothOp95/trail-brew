import type { BikeSpec } from '../engine/bike';
import type { Settings } from '../engine/types';
import { namespacedKey, readJson, type KeyValueStore } from './kv';

/** A bike in the rider's Garage: the hardware plus the rider's own current settings. */
export interface GarageBike {
  key: string;
  name: string;
  spec: BikeSpec;
  entered: Settings;
  /** How the rider found it, for the harvest priority picture. */
  found_via: 'bike_search' | 'component_search' | 'identifier' | 'manual';
  saved_at: string;
}

export interface RiderProfile {
  kitted_weight_kg: number | null;
}

export class GarageStore {
  private readonly bikesKey: string;
  private readonly profileKey: string;
  constructor(private readonly store: KeyValueStore, uid: string | null) {
    this.bikesKey = namespacedKey(uid, 'garage');
    this.profileKey = namespacedKey(uid, 'profile');
  }

  list(): GarageBike[] {
    return readJson<GarageBike[]>(this.store, this.bikesKey, []);
  }

  save(bike: GarageBike): GarageBike[] {
    const rest = this.list().filter((b) => b.key !== bike.key);
    const next = [...rest, bike];
    this.store.set(this.bikesKey, JSON.stringify(next));
    return next;
  }

  remove(key: string): GarageBike[] {
    const next = this.list().filter((b) => b.key !== key);
    this.store.set(this.bikesKey, JSON.stringify(next));
    return next;
  }

  profile(): RiderProfile {
    return readJson<RiderProfile>(this.store, this.profileKey, { kitted_weight_kg: null });
  }

  saveProfile(p: RiderProfile): void {
    this.store.set(this.profileKey, JSON.stringify(p));
  }
}

/** Stable key for a bike that is on the Bench but not saved to the Garage. */
export function adhocBikeKey(spec: BikeSpec): string {
  // A travel-only part keys as "generic", so editing travel keeps the same log.
  const part = (x: unknown) => (!x ? 'none' : 'generic' in (x as object) ? 'generic' : Object.values(x as Record<string, unknown>).join('+'));
  return `adhoc:${spec.suspension}:${part(spec.fork)}:${part(spec.shock)}`;
}
