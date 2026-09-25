import type { DataIndex } from '../data/ingest/types';
import type { AirSpring, Chassis, Damper } from '../data/schema/tables';

/**
 * Garage findability (07 v0.2): bike search, component search, identifier match, manual pick, Request.
 * Every empty result says which harvest fills it, in rider language, and where to go next.
 */

export type GarageStep = 'bike_search' | 'component_search' | 'identifier' | 'manual' | 'request';

export interface EmptyReason {
  message: string;
  /** Harvest stage that fills this, when known. */
  stage: string | null;
  next: GarageStep;
}

export interface SearchResult<T> {
  results: T[];
  empty: EmptyReason | null;
}

// ---------- 1. bike search ----------

export interface BikeCandidate {
  id: string;
  label: string;
}

export function searchBikes(query: string, frames: { id: string; brand: string; model: string; model_year: number }[] = []): SearchResult<BikeCandidate> {
  if (!frames.length) {
    return {
      results: [],
      empty: {
        message: 'No complete bikes on file yet. South African bikes are added in harvest stage 3. Search for your fork and shock instead.',
        stage: '03',
        next: 'component_search',
      },
    };
  }
  const tokens = tokenise(query);
  const results = frames
    .filter((f) => matches(`${f.brand} ${f.model} ${f.model_year}`, tokens))
    .map((f) => ({ id: f.id, label: `${f.brand} ${f.model} ${f.model_year}` }));
  return {
    results,
    empty: results.length ? null : { message: `No bike matches "${query}". Search for your fork and shock instead.`, stage: null, next: 'component_search' },
  };
}

// ---------- 2. component search ----------

export type ComponentKind = 'fork' | 'shock';

export interface ComponentCandidate {
  kind: ComponentKind;
  id: string;
  display_name: string;
  brand: string;
  tier: string;
  travel_mm: number | null;
  damper: string;
  /** Record is an estimate (for example the overlay reference fork): show it, but say so. */
  estimated: boolean;
}

/** Brands and models riders will type that the dataset does not have yet, and the harvest that adds them. */
const NOT_YET: { match: RegExp; message: string; stage: string }[] = [
  {
    match: /rock ?shox|\bpike\b|lyrik|\bzeb\b|\bsid\b|reba|revelation|yari|domain|recon|judy|\b35\b|super ?deluxe|deluxe|vivid|monarch/i,
    message: 'RockShox forks and shocks are being added (harvest 02b). The chassis are on file, the dampers are not yet.',
    stage: '02b',
  },
  {
    match: /x-?fusion|suntour|marzocchi|bomber|\bz[12]\b|raidon|\bxc[rm]\b|aion|auron|durolux|rc32|velvet|sweep/i,
    message: 'X-Fusion, SR Suntour and Marzocchi are next after RockShox (harvest 02 batch 2). That covers most bikes under R40k.',
    stage: '02 batch 2',
  },
  {
    match: /manitou|\bdvo\b|[oö]hlins|cane ?creek|\bext\b|push|formula|\bmrp\b|intend/i,
    message: 'That brand is in the long tail (harvest 02 batch 3) and not on file yet.',
    stage: '02 batch 3',
  },
  {
    match: /rhythm|\b3[24]\b/i,
    message: 'FOX 32 and 34 forks, including Rhythm, are being added (harvest 02b objective C).',
    stage: '02b',
  },
];

export function searchComponents(index: DataIndex, kind: ComponentKind, query: string): SearchResult<ComponentCandidate> {
  const tokens = tokenise(query);
  const all: ComponentCandidate[] =
    kind === 'fork'
      ? Object.values(index.fork_units).map((u) => {
          const c = index.chassis[u.chassis_id];
          const d = index.dampers[u.damper_id];
          return {
            kind, id: u.id, display_name: u.display_name, brand: c?.brand ?? '', tier: u.tier, travel_mm: u.travel_mm,
            damper: d?.name ?? '', estimated: u.confidence === 'estimated',
          };
        })
      : Object.values(index.shock_units).map((u) => ({
          kind, id: u.id, display_name: u.display_name, brand: u.brand, tier: u.tier, travel_mm: null,
          damper: index.dampers[u.damper_id]?.name ?? '', estimated: u.confidence === 'estimated',
        }));
  const results = all
    .filter((c) => matches(`${c.brand} ${c.display_name} ${c.tier.replace(/_/g, ' ')} ${c.travel_mm ?? ''} ${c.damper}`, tokens))
    .sort((a, b) => Number(a.estimated) - Number(b.estimated) || a.display_name.localeCompare(b.display_name));
  if (results.length) return { results, empty: null };

  const known = NOT_YET.find((n) => n.match.test(query));
  return {
    results: [],
    empty: known
      ? { message: known.message, stage: known.stage, next: 'identifier' }
      : { message: `Nothing on file matches "${query}". Try the part number from the sticker, or pick the parts by hand.`, stage: null, next: 'identifier' },
  };
}

// ---------- 3. identifier match ----------

export interface IdentifierHit {
  kind: ComponentKind;
  id: string;
  display_name: string;
  matched: string;
}

export type IdentifierResult =
  | { status: 'exact'; results: IdentifierHit[]; empty: null }
  | { status: 'prefix'; results: IdentifierHit[]; empty: null }
  | { status: 'none'; results: []; empty: EmptyReason };

const norm = (s: string) => s.toUpperCase().replace(/[\s.\-_/]/g, '');

/** Exact match on part_number or model_code, then prefix match. Explains an empty result. */
export function matchIdentifier(index: DataIndex, code: string): IdentifierResult {
  const q = norm(code);
  const units = [
    ...Object.values(index.fork_units).map((u) => ({ kind: 'fork' as const, u })),
    ...Object.values(index.shock_units).map((u) => ({ kind: 'shock' as const, u })),
  ];
  const ids = units.flatMap(({ kind, u }) =>
    [u.part_number, u.model_code].filter((x): x is string => !!x).map((value) => ({ kind, u, value, n: norm(value) })),
  );

  if (q.length >= 3) {
    const exact = ids.filter((x) => x.n === q);
    if (exact.length) return { status: 'exact', results: exact.map(hit), empty: null };
    const prefix = ids.filter((x) => x.n.startsWith(q));
    if (prefix.length) return { status: 'prefix', results: prefix.map(hit), empty: null };
  }

  const looksRockShox = /^00\.?\d{4}\.?\d{3}/.test(code.trim());
  const looksFox = /^\d{3}-\d{2}-\d{3}/.test(code.trim());
  let message: string;
  if (q.length < 3) message = 'Type at least three characters of the part number or model code from the sticker.';
  else if (!ids.length) {
    message = looksRockShox
      ? 'That looks like a RockShox part number. No part numbers are on file yet; RockShox numbers and model codes arrive with harvest 02b.'
      : looksFox
        ? 'That looks like a FOX part number. No part numbers are on file yet; they are captured in harvest 02b.'
        : 'No part numbers or model codes are on file yet, so there is nothing to match against. They are captured in harvest 02b.';
  } else message = `No fork or shock on file has a part number starting "${code.trim()}". Pick the parts by hand, or ask for it.`;
  return { status: 'none', results: [], empty: { message, stage: ids.length ? null : '02b', next: 'manual' } };

  function hit(x: (typeof ids)[number]): IdentifierHit {
    return { kind: x.kind, id: x.u.id, display_name: x.u.display_name, matched: x.value };
  }
}

// ---------- 4. manual pick ----------

export function manualChassis(index: DataIndex): Chassis[] {
  return Object.values(index.chassis).sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model, undefined, { numeric: true }));
}

export function manualDampers(index: DataIndex, kind: ComponentKind, brand?: string): Damper[] {
  return Object.values(index.dampers)
    .filter((d) => d.type === kind && (!brand || d.brand === brand))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function manualAirSprings(index: DataIndex, chassisId: string): AirSpring[] {
  return Object.values(index.air_springs).filter((s) => s.chassis_id === chassisId);
}

/** Why manual pick cannot complete, when it cannot. RockShox chassis exist but have no dampers yet. */
export function manualGap(index: DataIndex, chassis: Chassis | undefined): EmptyReason | null {
  if (!chassis) return null;
  if (!manualDampers(index, 'fork', chassis.brand).length) {
    return {
      message: `No ${chassis.brand} fork dampers on file yet, so the engine cannot tell which adjusters your fork has. They arrive with harvest 02b.`,
      stage: '02b',
      next: 'request',
    };
  }
  return null;
}

// ---------- helpers ----------

function tokenise(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

function matches(haystack: string, tokens: string[]): boolean {
  const h = haystack.toLowerCase();
  return tokens.every((t) => h.includes(t));
}
