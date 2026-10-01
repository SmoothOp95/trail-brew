import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ComponentType, type ReactNode } from 'react';
import { COVERAGE, INDEX } from '../data/load';
import { benchReducer, initialBench, type BenchAction, type BenchState, type LapEntry } from '../engine/bench';
import type { BikeSpec } from '../engine/bike';
import type { Settings } from '../engine/types';
import { browserStore, memoryStore } from '../storage/kv';
import { GarageStore, adhocBikeKey, type GarageBike } from '../storage/garage';
import { RequestLog, type RequestEntry, type RequestInput } from '../storage/requests';
import { idbLapStore, memoryLapStore } from '../storage/sessionLog';

/** The host app's Firebase user, reduced to what this module needs. undefined = auth still loading. */
export interface MtbUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
}

export interface MtbContextValue {
  user: MtbUser | null | undefined;
  SignIn: ComponentType<{ className?: string }>;
  index: typeof INDEX;
  coverage: typeof COVERAGE;
  bench: BenchState;
  dispatch: (a: BenchAction) => void;
  spec: BikeSpec;
  bikeKey: string;
  activeBike: GarageBike | null;
  /** Put a bike on the Bench. Works signed out. */
  openOnBench: (spec: BikeSpec, opts?: { entered?: Settings; garageKey?: string | null }) => void;
  /** Edit the bike on the Bench (type, travel) without clearing the rider's entered settings. */
  editSpec: (spec: BikeSpec) => void;
  bikes: GarageBike[];
  /** Signed in only. Returns null when signed out. */
  saveBike: (bike: Omit<GarageBike, 'key' | 'saved_at'> & { key?: string }) => GarageBike | null;
  removeBike: (key: string) => void;
  laps: LapEntry[];
  lapsPersistent: boolean;
  putLap: (lap: LapEntry) => void;
  removeLap: (id: string) => void;
  requests: RequestEntry[];
  addRequest: (input: RequestInput) => RequestEntry;
  removeRequest: (id: string) => void;
  exportRequests: () => string;
  setWeight: (kg: number | null) => void;
}

const Ctx = createContext<MtbContextValue | null>(null);

export function useMtb(): MtbContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMtb outside MtbProvider');
  return v;
}

const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** The Bench starts with no brand or model: the rider gives bike type and travel. */
export function defaultSpec(): BikeSpec {
  return { suspension: 'full_suspension', fork: { generic: true, travel: null }, shock: { generic: true, travel: null } };
}

export function MtbProvider({ user, SignIn, children }: { user: MtbUser | null | undefined; SignIn: MtbContextValue['SignIn']; children: ReactNode }) {
  const uid = user?.uid ?? null;
  // Signed out: Garage and log live in memory for this visit only. Requests always persist on the device.
  const store = useMemo(() => (uid ? browserStore() : memoryStore()), [uid]);
  const garage = useMemo(() => new GarageStore(store, uid), [store, uid]);
  const lapStore = useMemo(() => (uid ? idbLapStore(uid) : memoryLapStore()), [uid]);
  const requestLog = useMemo(() => new RequestLog(browserStore(), uid), [uid]);

  const [bench, dispatch] = useReducer(benchReducer, initialBench);
  const [spec, setSpec] = useState<BikeSpec>(defaultSpec);
  const [garageKey, setGarageKey] = useState<string | null>(null);
  const [bikes, setBikes] = useState<GarageBike[]>([]);
  const [laps, setLaps] = useState<LapEntry[]>([]);
  const [requests, setRequests] = useState<RequestEntry[]>([]);

  useEffect(() => {
    setBikes(garage.list());
    const w = garage.profile().kitted_weight_kg;
    if (w != null) dispatch({ type: 'setWeight', kg: w });
  }, [garage]);
  useEffect(() => {
    let live = true;
    lapStore.list().then((l) => live && setLaps(l));
    return () => {
      live = false;
    };
  }, [lapStore]);
  useEffect(() => setRequests(requestLog.list()), [requestLog]);

  const bikeKey = garageKey ?? adhocBikeKey(spec);
  const activeBike = bikes.find((b) => b.key === garageKey) ?? null;

  const openOnBench = useCallback<MtbContextValue['openOnBench']>((next, opts) => {
    setSpec(next);
    setGarageKey(opts?.garageKey ?? null);
    dispatch({ type: 'setBike', key: opts?.garageKey ?? adhocBikeKey(next), entered: opts?.entered ?? {} });
  }, []);

  const editSpec = useCallback<MtbContextValue['editSpec']>((next) => {
    setSpec(next);
    setGarageKey(null);
  }, []);

  const saveBike = useCallback<MtbContextValue['saveBike']>(
    (b) => {
      if (!uid) return null;
      const bike: GarageBike = { ...b, key: b.key ?? `bike_${newId()}`, saved_at: new Date().toISOString() };
      setBikes(garage.save(bike));
      return bike;
    },
    [garage, uid],
  );

  const value: MtbContextValue = {
    user,
    SignIn,
    index: INDEX,
    coverage: COVERAGE,
    bench,
    dispatch,
    spec,
    bikeKey,
    activeBike,
    openOnBench,
    editSpec,
    bikes,
    saveBike,
    removeBike: (key) => {
      setBikes(garage.remove(key));
      if (key === garageKey) setGarageKey(null);
    },
    laps,
    lapsPersistent: lapStore.persistent,
    putLap: (lap) => {
      setLaps((ls) => [...ls.filter((l) => l.id !== lap.id), lap]);
      void lapStore.put(lap);
    },
    removeLap: (id) => {
      setLaps((ls) => ls.filter((l) => l.id !== id));
      void lapStore.remove(id);
    },
    requests,
    addRequest: (input) => {
      const entry = requestLog.add(input, { id: newId(), now: new Date().toISOString() });
      setRequests(requestLog.list());
      return entry;
    },
    removeRequest: (id) => {
      requestLog.remove(id);
      setRequests(requestLog.list());
    },
    exportRequests: () => requestLog.exportJson(),
    setWeight: (kg) => {
      dispatch({ type: 'setWeight', kg });
      if (uid) garage.saveProfile({ kitted_weight_kg: kg });
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { newId };
