import type { DataIndex } from '../data/ingest/types';
import type { AirSpring, Chassis, Damper } from '../data/schema/tables';
import { RESERVED_DAMPERS } from '../data/pending';
import { modelLabel } from '../engine/bike';

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
  /** Damper record not written yet: selectable, adjusters resolve pending. */
  pending: boolean;
  model_code: string | null;
}

/** Brands with neither data nor a closest-match stand-in, and the harvest that would add them. */
const NOT_YET: { match: RegExp; message: string; stage: string }[] = [
  {
    match: /manitou|\bdvo\b|[oö]hlins|cane ?creek|\bext\b|push|formula|\bmrp\b|intend|cane/i,
    message: 'That brand is in the long tail (harvest 02 batch 3) and not on file yet. Pick the closest fork or shock by hand, or ask for it.',
    stage: '02 batch 3',
  },
];

/** A unit whose damper record does not exist yet (02C pending damper rule): selectable, adjusters pending. */
export const isPendingUnit = (index: DataIndex, u: { damper_id: string }) => !index.dampers[u.damper_id];

export function searchComponents(index: DataIndex, kind: ComponentKind, query: string): SearchResult<ComponentCandidate> {
  const tokens = tokenise(query);
  const all: ComponentCandidate[] =
    kind === 'fork'
      ? Object.values(index.fork_units).map((u) => ({
          kind, id: u.id, display_name: u.display_name, brand: index.chassis[u.chassis_id]?.brand ?? '', tier: u.tier, travel_mm: u.travel_mm,
          damper: index.dampers[u.damper_id]?.name ?? RESERVED_DAMPERS[u.damper_id]?.name ?? '', estimated: u.confidence === 'estimated',
          pending: isPendingUnit(index, u), model_code: u.model_code ?? null,
        }))
      : Object.values(index.shock_units).map((u) => ({
          kind, id: u.id, display_name: u.display_name, brand: u.brand, tier: u.tier, travel_mm: null,
          damper: index.dampers[u.damper_id]?.name ?? RESERVED_DAMPERS[u.damper_id]?.name ?? '', estimated: u.confidence === 'estimated',
          pending: isPendingUnit(index, u), model_code: u.model_code ?? null,
        }));
  const results = all
    .filter((c) => matches(`${c.brand} ${c.display_name} ${c.tier.replace(/_/g, ' ')} ${c.travel_mm ?? ''} ${c.damper} ${c.model_code ?? ''}`, tokens))
    .sort((a, b) => Number(a.pending) - Number(b.pending) || Number(a.estimated) - Number(b.estimated) || a.display_name.localeCompare(b.display_name, undefined, { numeric: true }));
  if (results.length) return { results, empty: null };

  const known = NOT_YET.find((n) => n.match.test(query));
  return {
    results: [],
    empty: known
      ? { message: known.message, stage: known.stage, next: 'identifier' }
      : { message: `Nothing on file matches "${query}". Try the part number or model code from the sticker, or pick the parts by hand.`, stage: null, next: 'identifier' },
  };
}

// ---------- 3. identifier match ----------

export interface IdentifierHit {
  kind: ComponentKind;
  id: string;
  display_name: string;
  matched: string;
  travel_mm: number | null;
  pending: boolean;
}

export type IdentifierResult =
  | { status: 'exact'; results: IdentifierHit[]; empty: null }
  /** One model code, many units (02C): the family and tier are known; the rider picks travel. */
  | { status: 'family'; family: string; damper: string; results: IdentifierHit[]; empty: null }
  | { status: 'prefix'; results: IdentifierHit[]; empty: null }
  | { status: 'none'; results: []; empty: EmptyReason };

const norm = (s: string) => s.toUpperCase().replace(/[\s.\-_/]/g, '');

/** Exact match on part_number or model_code, then prefix match. A model code returns a family. Explains a miss. */
export function matchIdentifier(index: DataIndex, code: string): IdentifierResult {
  const q = norm(code);
  const units = [
    ...Object.values(index.fork_units).map((u) => ({ kind: 'fork' as const, u, travel: u.travel_mm as number | null })),
    ...Object.values(index.shock_units).map((u) => ({ kind: 'shock' as const, u, travel: null as number | null })),
  ];
  const ids = units.flatMap(({ kind, u, travel }) =>
    [u.part_number, u.model_code].filter((x): x is string => !!x).map((value) => ({ kind, u, travel, value, n: norm(value) })),
  );
  const hit = (x: (typeof ids)[number]): IdentifierHit => ({
    kind: x.kind, id: x.u.id, display_name: x.u.display_name, matched: x.value, travel_mm: x.travel, pending: isPendingUnit(index, x.u),
  });

  if (q.length >= 3) {
    const exact = ids.filter((x) => x.n === q);
    if (exact.length) {
      const families = new Set(exact.map((x) => modelLabel({ display_name: x.u.display_name, travel_mm: x.travel ?? undefined })));
      if (exact.length > 1 && families.size === 1) {
        const first = exact[0].u;
        return {
          status: 'family',
          family: [...families][0],
          damper: index.dampers[first.damper_id]?.name ?? RESERVED_DAMPERS[first.damper_id]?.name ?? first.damper_id,
          results: exact.map(hit).sort((a, b) => (a.travel_mm ?? 0) - (b.travel_mm ?? 0)),
          empty: null,
        };
      }
      return { status: 'exact', results: exact.map(hit), empty: null };
    }
    const prefix = ids.filter((x) => x.n.startsWith(q));
    if (prefix.length) return { status: 'prefix', results: prefix.map(hit), empty: null };
  }

  const looksRockShox = /^00\.?\d{4}\.?\d{3}/.test(code.trim());
  const looksFox = /^\d{3}-\d{2}-\d{3}/.test(code.trim());
  const hasPartNumbers = ids.some((x) => !!x.u.part_number);
  const hasModelCodes = ids.some((x) => !!x.u.model_code);
  let message: string;
  if (q.length < 3) message = 'Type at least three characters of the part number or model code from the sticker.';
  else if (looksRockShox && !hasPartNumbers) {
    message = 'That looks like a RockShox part number. RockShox part numbers are not on file yet, but model codes are: look for the code starting FS- on the fork leg sticker and type that instead.';
  } else if (!ids.length) {
    message = looksFox
      ? 'That looks like a FOX part number. No part numbers are on file yet; they are captured in harvest 02b.'
      : 'No part numbers or model codes are on file yet, so there is nothing to match against. They are captured in harvest 02b.';
  } else {
    message = `Nothing on file matches "${code.trim()}".` +
      (hasModelCodes ? ' RockShox forks match on the model code printed on the sticker, starting FS- (for example FS-PIKE-SEL-C1).' : '') +
      (hasPartNumbers ? '' : ' FOX part numbers are not on file yet.') +
      ' Pick the parts by hand, or ask for it.';
  }
  const stage = (looksRockShox && !hasPartNumbers) || !ids.length ? '02b' : null;
  return { status: 'none', results: [], empty: { message, stage, next: 'manual' } };
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
      message: `No ${chassis.brand} fork dampers on file yet, so a hand-picked chassis cannot tell the engine which dials you have. Search for your fork by name or model code instead: every ${chassis.brand} fork in the 2023 spec sheet is listed, with its pressure and token data.`,
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
