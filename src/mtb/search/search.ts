import type { DataIndex } from '../data/ingest/types';
import type { AirSpring, Chassis, Damper } from '../data/schema/tables';
import { RESERVED_DAMPERS } from '../data/pending';

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

/** A unit whose damper record does not exist yet (02C pending damper rule). Held off the Bench for now. */
export const isPendingUnit = (index: DataIndex, u: { damper_id: string }) => !index.dampers[u.damper_id];

function pendingReason(index: DataIndex, matches: { display_name: string; damper_id: string }[], query: string): EmptyReason {
  const names = [...new Set(matches.map((u) => RESERVED_DAMPERS[u.damper_id]?.name ?? u.damper_id))];
  const example = matches[0].display_name;
  return {
    message:
      `${matches.length === 1 ? example : `${matches.length} forks matching "${query}", for example ${example},`} ${matches.length === 1 ? 'is' : 'are'} on file with ` +
      `pressure and token data. Damper adjuster data (${names.slice(0, 3).join(', ')}${names.length > 3 ? ' and others' : ''}) arrives with harvest 02b, ` +
      'and they become selectable on the Bench once the pending-damper update lands.',
    stage: '02b',
    next: 'identifier',
  };
}

export function searchComponents(index: DataIndex, kind: ComponentKind, query: string): SearchResult<ComponentCandidate> {
  const tokens = tokenise(query);
  const units = kind === 'fork' ? Object.values(index.fork_units) : Object.values(index.shock_units);
  const pending = units.filter((u) => isPendingUnit(index, u));
  const all: ComponentCandidate[] =
    kind === 'fork'
      ? Object.values(index.fork_units).filter((u) => !isPendingUnit(index, u)).map((u) => {
          const c = index.chassis[u.chassis_id];
          const d = index.dampers[u.damper_id];
          return {
            kind, id: u.id, display_name: u.display_name, brand: c?.brand ?? '', tier: u.tier, travel_mm: u.travel_mm,
            damper: d?.name ?? '', estimated: u.confidence === 'estimated',
          };
        })
      : Object.values(index.shock_units).filter((u) => !isPendingUnit(index, u)).map((u) => ({
          kind, id: u.id, display_name: u.display_name, brand: u.brand, tier: u.tier, travel_mm: null,
          damper: index.dampers[u.damper_id]?.name ?? '', estimated: u.confidence === 'estimated',
        }));
  const results = all
    .filter((c) => matches(`${c.brand} ${c.display_name} ${c.tier.replace(/_/g, ' ')} ${c.travel_mm ?? ''} ${c.damper}`, tokens))
    .sort((a, b) => Number(a.estimated) - Number(b.estimated) || a.display_name.localeCompare(b.display_name));
  if (results.length) return { results, empty: null };

  const pendingMatches = tokens.length
    ? pending.filter((u) => matches(`${u.display_name} ${u.tier.replace(/_/g, ' ')} ${'travel_mm' in u ? u.travel_mm : ''} ${u.model_code ?? ''}`, tokens))
    : [];
  if (pendingMatches.length) return { results: [], empty: pendingReason(index, pendingMatches, query) };

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
  const pendingIds = units
    .filter(({ u }) => isPendingUnit(index, u))
    .flatMap(({ u }) => [u.part_number, u.model_code].filter((x): x is string => !!x).map((value) => ({ u, n: norm(value) })));
  const ids = units.filter(({ u }) => !isPendingUnit(index, u)).flatMap(({ kind, u }) =>
    [u.part_number, u.model_code].filter((x): x is string => !!x).map((value) => ({ kind, u, value, n: norm(value) })),
  );

  if (q.length >= 3) {
    const exact = ids.filter((x) => x.n === q);
    if (exact.length) return { status: 'exact', results: exact.map(hit), empty: null };
    const prefix = ids.filter((x) => x.n.startsWith(q));
    if (prefix.length) return { status: 'prefix', results: prefix.map(hit), empty: null };
    const pend = pendingIds.filter((x) => x.n === q || x.n.startsWith(q)).map((x) => x.u);
    if (pend.length) return { status: 'none', results: [], empty: pendingReason(index, pend, code.trim()) };
  }

  const looksRockShox = /^00\.?\d{4}\.?\d{3}/.test(code.trim());
  const looksFox = /^\d{3}-\d{2}-\d{3}/.test(code.trim());
  const hasPartNumbers = [...ids, ...pendingIds].some((x) => 'u' in x && !!x.u.part_number);
  let message: string;
  if (q.length < 3) message = 'Type at least three characters of the part number or model code from the sticker.';
  else if (looksRockShox && !hasPartNumbers) {
    message = 'That looks like a RockShox part number. RockShox part numbers are not on file yet, but model codes are: look for the code starting FS- on the fork leg sticker and type that instead.';
  } else if (!ids.length && !pendingIds.length) {
    message = looksRockShox
      ? 'That looks like a RockShox part number. No part numbers are on file yet; RockShox numbers and model codes arrive with harvest 02b.'
      : looksFox
        ? 'That looks like a FOX part number. No part numbers are on file yet; they are captured in harvest 02b.'
        : 'No part numbers or model codes are on file yet, so there is nothing to match against. They are captured in harvest 02b.';
  } else {
    const hasModelCodes = [...ids, ...pendingIds].some((x) => !!x.u.model_code);
    message = `Nothing on file matches "${code.trim()}".` +
      (hasModelCodes ? ' RockShox forks match on the model code printed on the sticker, starting FS- (for example FS-PIKE-SEL-C1).' : '') +
      (hasPartNumbers ? '' : ' FOX part numbers are not on file yet.') +
      ' Pick the parts by hand, or ask for it.';
  }
  const stage = looksRockShox && !hasPartNumbers ? '02b' : ids.length || pendingIds.length ? null : '02b';
  return { status: 'none', results: [], empty: { message, stage, next: 'manual' } };

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
