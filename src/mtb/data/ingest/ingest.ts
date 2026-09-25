import type { ZodIssue } from 'zod';
import {
  ADJUSTER_KEYS,
  NON_SCHEMA_FIELDS,
  TABLES,
  TABLE_NAMES,
  knownKeys,
  type Adjuster,
  type Damper,
  type TableName,
  type TableRecords,
} from '../schema/tables';
import type { FieldPending } from '../schema/common';
import { detectFlags } from './flags';
import type {
  AdjusterCountStats,
  Annotation,
  BrandSummary,
  Coverage,
  DataFlag,
  DataIndex,
  Exclusion,
  FieldStats,
  IngestResult,
  RawTables,
  ReadinessGate,
  ShowableUnit,
  TableCoverage,
} from './types';

export const SCHEMA_VERSION = '0.3';

type AnyRecord = { id: string; fields_pending?: FieldPending[] } & Record<string, unknown>;

/**
 * Validate the raw harvest tables against 01_SCHEMA.md v0.3 and build the index the app reads.
 *
 * Pure: no file system, no clock. Never throws on bad data. A malformed record is excluded with a
 * reason, a count without a count_basis is held back at field level, and everything is reported.
 */
export function ingest(raw: RawTables): IngestResult {
  const exclusions: Exclusion[] = [];
  const annotations: Annotation[] = [];
  const extraFlags: DataFlag[] = [];
  const tables = {} as Record<TableName, TableCoverage>;
  const valid = {} as TableRecords;

  const exclude = (table: TableName, id: string, reasons: string[]) => {
    const existing = exclusions.find((e) => e.table === table && e.id === id);
    if (existing) existing.reasons.push(...reasons);
    else exclusions.push({ table, id, reasons });
  };

  // ---- 1. shape validation, per record ----
  for (const table of TABLE_NAMES) {
    const input = raw[table];
    const cov: TableCoverage = {
      file_present: input !== undefined,
      records: 0,
      valid: 0,
      excluded: 0,
      fields: {},
      dangling_fks: [],
      unknown_fields: [],
    };
    tables[table] = cov;
    const out: AnyRecord[] = [];
    (valid as unknown as Record<TableName, AnyRecord[]>)[table] = out;
    if (input === undefined) continue;
    if (!Array.isArray(input)) {
      exclude(table, '(file)', [`${TABLES[table].file} is not a JSON array`]);
      continue;
    }

    const known = new Set(knownKeys(table));
    const seen = new Set<string>();
    input.forEach((rec: unknown, i: number) => {
      cov.records++;
      const id = recordId(rec, i);
      if (rec && typeof rec === 'object') {
        for (const k of Object.keys(rec)) {
          if (!known.has(k)) cov.unknown_fields.push({ id, field: k });
        }
      }
      const parsed = TABLES[table].schema.safeParse(rec);
      if (!parsed.success) {
        exclude(table, id, parsed.error.issues.map(describeIssue));
        return;
      }
      if (seen.has(id)) {
        exclude(table, id, ['duplicate id']);
        return;
      }
      seen.add(id);
      out.push(parsed.data as AnyRecord);
    });

    for (const f of NON_SCHEMA_FIELDS[table] ?? []) {
      for (const r of out) {
        if (r[f] !== undefined) {
          extraFlags.push({
            code: 'field_not_in_schema',
            severity: 'info',
            table,
            id: r.id,
            message: `${f} is requested by 02B but not defined in 01_SCHEMA v0.3`,
          });
        }
      }
    }
  }

  // ---- 2. field-level corrections on dampers: held-back counts, derived lever counts ----
  for (const d of valid.dampers) {
    for (const key of ADJUSTER_KEYS) {
      const a = d.adjusters[key];
      if (!a) continue;
      normaliseCount(a, `adjusters.${key}`, d, annotations, extraFlags);
      if (a.sub_adjuster) {
        normaliseCount(a.sub_adjuster as unknown as Adjuster, `adjusters.${key}.sub_adjuster`, d, annotations, extraFlags);
      }
    }
  }

  // ---- 3. foreign keys and cross-record consistency, in dependency order ----
  const byId = <T extends { id: string }>(rows: T[]) => new Map(rows.map((r) => [r.id, r]));
  const keep = <T extends { id: string }>(table: TableName, rows: T[], check: (r: T) => string[]) => {
    const kept: T[] = [];
    for (const r of rows) {
      const problems = check(r);
      if (problems.length) exclude(table, r.id, problems);
      else kept.push(r);
    }
    return kept;
  };
  const fk = (table: TableName, id: string, field: string, target: string, map: Map<string, unknown>, targetTable: TableName) => {
    if (map.has(target)) return [];
    const wasExcluded = exclusions.some((e) => e.table === targetTable && e.id === target);
    tables[table].dangling_fks.push({ id, field, target });
    return [wasExcluded ? `${field} "${target}" refers to an excluded ${targetTable} record` : `${field} "${target}" does not resolve`];
  };

  const chassisMap = byId(valid.chassis);
  const damperMap = byId(valid.dampers);

  valid.air_springs = keep('air_springs', valid.air_springs, (s) => fk('air_springs', s.id, 'chassis_id', s.chassis_id, chassisMap, 'chassis'));
  const springMap = byId(valid.air_springs);

  valid.pressure_charts = keep('pressure_charts', valid.pressure_charts, (c) =>
    fk('pressure_charts', c.id, 'air_spring_id', c.air_spring_id, springMap, 'air_springs'),
  );
  valid.setting_charts = keep('setting_charts', valid.setting_charts, (c) => {
    const p = fk('setting_charts', c.id, 'damper_id', c.damper_id, damperMap, 'dampers');
    if (p.length) return p;
    const adj = damperMap.get(c.damper_id)!.adjusters[c.adjuster];
    return adj ? [] : [`chart is for ${c.adjuster}, which does not exist on damper ${c.damper_id}`];
  });

  valid.fork_units = keep('fork_units', valid.fork_units, (u) => {
    const p = [
      ...fk('fork_units', u.id, 'chassis_id', u.chassis_id, chassisMap, 'chassis'),
      ...fk('fork_units', u.id, 'damper_id', u.damper_id, damperMap, 'dampers'),
      ...fk('fork_units', u.id, 'air_spring_id', u.air_spring_id, springMap, 'air_springs'),
    ];
    if (p.length) return p;
    const d = damperMap.get(u.damper_id)!;
    const s = springMap.get(u.air_spring_id)!;
    const c = chassisMap.get(u.chassis_id)!;
    if (d.type !== 'fork') p.push(`damper ${d.id} is a ${d.type} damper`);
    if (s.chassis_id !== u.chassis_id) p.push(`air spring ${s.id} belongs to chassis ${s.chassis_id}, not ${u.chassis_id}`);
    if (s.travel_mm !== u.travel_mm) p.push(`air spring ${s.id} is for ${s.travel_mm}mm, unit is ${u.travel_mm}mm`);
    if (s.tier_applies_to && !s.tier_applies_to.includes(u.tier)) {
      p.push(`air spring ${s.id} applies to tiers ${s.tier_applies_to.join(', ')}, not ${u.tier}`);
    }
    if (c.travel_options_mm && !c.travel_options_mm.includes(u.travel_mm)) {
      extraFlags.push({
        code: 'travel_not_in_chassis_options',
        severity: 'warning',
        table: 'fork_units',
        id: u.id,
        message: `${u.travel_mm}mm is not among chassis ${c.id} travel options`,
      });
    }
    return p;
  });

  valid.shock_units = keep('shock_units', valid.shock_units, (u) => {
    const p = fk('shock_units', u.id, 'damper_id', u.damper_id, damperMap, 'dampers');
    if (p.length) return p;
    const d = damperMap.get(u.damper_id)!;
    return d.type === 'shock' ? [] : [`damper ${d.id} is a ${d.type} damper`];
  });

  // ---- 4. coverage ----
  for (const table of TABLE_NAMES) {
    const rows = (valid as unknown as Record<TableName, AnyRecord[]>)[table];
    const cov = tables[table];
    cov.valid = rows.length;
    cov.excluded = exclusions.filter((e) => e.table === table).length;
    cov.fields = fieldStats(table, rows, table === 'dampers' ? ['adjusters'] : []);
    for (const r of rows) {
      for (const p of r.fields_pending ?? []) {
        if (valueAt(r, p.field) != null) {
          extraFlags.push({
            code: 'pending_field_populated',
            severity: 'warning',
            table,
            id: r.id,
            message: `fields_pending lists ${p.field}, but it has a value`,
          });
        }
      }
    }
  }

  const index = buildIndex(valid, annotations);
  const flags = [...detectFlags(valid), ...extraFlags];

  const coverage: Coverage = {
    schema_version: SCHEMA_VERSION,
    tables,
    adjuster_counts: adjusterCountStats(valid.dampers, annotations),
    annotations,
    exclusions,
    flags,
    showable: showable(valid),
    brands: brandSummary(valid),
    readiness: readiness(valid),
  };
  return { index, coverage };
}

// ---------- helpers ----------

function recordId(rec: unknown, i: number): string {
  if (rec && typeof rec === 'object' && typeof (rec as { id?: unknown }).id === 'string') {
    return (rec as { id: string }).id;
  }
  return `#${i}`;
}

function describeIssue(issue: ZodIssue): string {
  const path = issue.path.join('.');
  if (issue.code === 'invalid_type' && issue.received === 'undefined') {
    if (issue.path[0] === 'adjusters' && issue.path.length === 2) return `${path} key missing (rule 3: all four adjuster keys, null when absent)`;
    return `${path} is required`;
  }
  if (issue.code === 'invalid_type' && issue.received === 'string' && issue.expected === 'number') {
    return `${path} is a string, must be a number (rule 10)`;
  }
  return path ? `${path}: ${issue.message}` : issue.message;
}

/**
 * v0.3 "count means true total only". A count without a count_basis cannot be told apart from a
 * recommendation, so it is held back: the index carries null and the annotation says why. Lever counts
 * are the number of positions by definition, so they are derived rather than held back.
 */
function normaliseCount(a: Adjuster, path: string, d: Damper, annotations: Annotation[], flags: DataFlag[]) {
  if (a.type === 'lever') {
    const n = a.positions?.length ?? null;
    if (a.count == null && n != null) {
      annotations.push({
        table: 'dampers', id: d.id, path: `${path}.count`, kind: 'derived', original: null, value: n,
        reason: 'lever count is the number of positions (01_SCHEMA v0.3)',
      });
      a.count = n;
    } else if (a.count != null && n != null && a.count !== n) {
      flags.push({
        code: 'lever_count_mismatch', severity: 'warning', table: 'dampers', id: d.id,
        message: `${path}.count is ${a.count} but the lever has ${n} positions; using ${n}`,
      });
      annotations.push({
        table: 'dampers', id: d.id, path: `${path}.count`, kind: 'derived', original: a.count, value: n,
        reason: 'lever count is the number of positions (01_SCHEMA v0.3)',
      });
      a.count = n;
    }
    return;
  }
  if (a.count != null && a.type === 'sweep') {
    annotations.push({
      table: 'dampers', id: d.id, path: `${path}.count`, kind: 'held_back', original: a.count, value: null,
      reason: 'a sweep has no count (01_SCHEMA v0.3)',
    });
    a.count = null;
    return;
  }
  if (a.count != null && !a.count_basis) {
    annotations.push({
      table: 'dampers', id: d.id, path: `${path}.count`, kind: 'held_back', original: a.count, value: null,
      reason: 'count has no count_basis, so it cannot be told apart from a recommendation',
    });
    a.count = null;
    if (a.usable_range) a.usable_range = null;
  }
}

function isPending(r: AnyRecord, path: string): boolean {
  return (r.fields_pending ?? []).some((p) => p.field === path || path.startsWith(`${p.field}.`));
}

function valueAt(r: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), r);
}

const BOOKKEEPING = new Set(['id', 'confidence', 'confidence_note', 'source', 'fields_pending']);

function fieldStats(table: TableName, rows: AnyRecord[], skip: string[]): Record<string, FieldStats> {
  const out: Record<string, FieldStats> = {};
  for (const key of knownKeys(table)) {
    if (BOOKKEEPING.has(key) || skip.includes(key)) continue;
    const s: FieldStats = { populated: 0, null_pending: 0, null_bare: 0, absent: 0 };
    for (const r of rows) {
      const v = r[key];
      if (v === undefined) {
        if (isPending(r, key)) s.null_pending++;
        else s.absent++;
      } else if (v === null) {
        if (isPending(r, key)) s.null_pending++;
        else s.null_bare++;
      } else s.populated++;
    }
    out[key] = s;
  }
  return out;
}

function adjusterCountStats(dampers: Damper[], annotations: Annotation[]): AdjusterCountStats {
  const s: AdjusterCountStats = {
    adjusters_present: 0, adjusters_absent: 0, by_type: {}, count_with_basis: 0, count_held_back: 0,
    count_derived_from_positions: 0, count_null_pending: 0, count_null_bare: 0, count_not_applicable: 0,
  };
  for (const d of dampers) {
    for (const key of ADJUSTER_KEYS) {
      const a = d.adjusters[key];
      if (!a) { s.adjusters_absent++; continue; }
      s.adjusters_present++;
      s.by_type[a.type] = (s.by_type[a.type] ?? 0) + 1;
      const path = `adjusters.${key}.count`;
      const ann = annotations.find((x) => x.table === 'dampers' && x.id === d.id && x.path === path);
      if (a.type === 'sweep') s.count_not_applicable++;
      else if (ann?.kind === 'derived') s.count_derived_from_positions++;
      else if (ann?.kind === 'held_back') s.count_held_back++;
      else if (a.count != null) s.count_with_basis++;
      else if (isPending(d as unknown as AnyRecord, path)) s.count_null_pending++;
      else s.count_null_bare++;
    }
  }
  return s;
}

function buildIndex(v: TableRecords, annotations: Annotation[]): DataIndex {
  const map = <T extends { id: string }>(rows: T[]) => Object.fromEntries(rows.map((r) => [r.id, r]));
  const ann: Record<string, Annotation[]> = {};
  for (const a of annotations) (ann[`${a.table}:${a.id}`] ??= []).push(a);
  return {
    chassis: map(v.chassis),
    dampers: map(v.dampers),
    air_springs: map(v.air_springs),
    pressure_charts: map(v.pressure_charts),
    setting_charts: map(v.setting_charts),
    fork_units: map(v.fork_units),
    shock_units: map(v.shock_units),
    annotations: ann,
  };
}

function showable(v: TableRecords): Coverage['showable'] {
  const chassis = new Map(v.chassis.map((c) => [c.id, c]));
  const fork_units: ShowableUnit[] = v.fork_units.map((u) => ({
    id: u.id, display_name: u.display_name, brand: chassis.get(u.chassis_id)?.brand ?? '', tier: u.tier, damper_id: u.damper_id,
  }));
  const shock_units: ShowableUnit[] = v.shock_units.map((u) => ({
    id: u.id, display_name: u.display_name, brand: u.brand, tier: u.tier, damper_id: u.damper_id,
  }));
  return { fork_units, shock_units };
}

function brandSummary(v: TableRecords): Record<string, BrandSummary> {
  const out: Record<string, BrandSummary> = {};
  const get = (b: string) =>
    (out[b] ??= { chassis: 0, dampers: 0, air_springs: 0, pressure_charts: 0, setting_charts: 0, fork_units: 0, shock_units: 0 });
  const chassisBrand = new Map(v.chassis.map((c) => [c.id, c.brand]));
  const springBrand = new Map(v.air_springs.map((s) => [s.id, s.brand]));
  const damperBrand = new Map(v.dampers.map((d) => [d.id, d.brand]));
  v.chassis.forEach((c) => get(c.brand).chassis++);
  v.dampers.forEach((d) => get(d.brand).dampers++);
  v.air_springs.forEach((s) => get(s.brand).air_springs++);
  v.pressure_charts.forEach((c) => get(springBrand.get(c.air_spring_id) ?? '?').pressure_charts++);
  v.setting_charts.forEach((c) => get(damperBrand.get(c.damper_id) ?? '?').setting_charts++);
  v.fork_units.forEach((u) => get(chassisBrand.get(u.chassis_id) ?? '?').fork_units++);
  v.shock_units.forEach((u) => get(u.brand).shock_units++);
  return out;
}

/** 07_BUILD_SPEC v0.2, Data readiness gates, evaluated against what is actually in the index. */
function readiness(v: TableRecords): ReadinessGate[] {
  const chassisBrand = new Map(v.chassis.map((c) => [c.id, c.brand]));
  const forkBrands = v.fork_units.map((u) => ({ brand: chassisBrand.get(u.chassis_id) ?? '', tier: u.tier.toLowerCase() }));
  const shockBrands = v.shock_units.map((u) => ({ brand: u.brand, tier: u.tier.toLowerCase() }));
  const all = [...forkBrands, ...shockBrands];
  const count = (pred: (x: { brand: string; tier: string }) => boolean) => all.filter(pred).length;
  const foxFP = count((x) => x.brand === 'FOX' && ['factory', 'performance', 'performance_elite'].includes(x.tier));
  const rhythm = count((x) => x.brand === 'FOX' && x.tier === 'rhythm');
  const rs = count((x) => x.brand === 'RockShox');
  const budgetBrands = ['X-Fusion', 'SR Suntour', 'Marzocchi'];
  const budget = count((x) => budgetBrands.includes(x.brand));
  const ids = [...v.fork_units, ...v.shock_units].filter((u) => u.part_number || u.model_code).length;
  return [
    { feature: 'Component search, FOX Factory and Performance', meaningful_after: 'now', ready: foxFP > 0, evidence: `${foxFP} units` },
    { feature: 'Component search, FOX Rhythm', meaningful_after: '02b objective C', ready: rhythm > 0, evidence: `${rhythm} units` },
    { feature: 'Component search, RockShox', meaningful_after: '02b', ready: rs > 0, evidence: `${rs} units` },
    {
      feature: 'Component search, X-Fusion, SR Suntour, Marzocchi, RockShox Recon and 35 Silver',
      meaningful_after: '02 batch 2', ready: budget > 0, evidence: `${budget} units`,
    },
    { feature: 'Identifier match', meaningful_after: '02b', ready: ids > 0, evidence: `${ids} units carry a part_number or model_code` },
    { feature: 'Bike search', meaningful_after: '03', ready: false, evidence: 'no frames table yet' },
    { feature: 'Tyre starting pressures', meaningful_after: '04', ready: false, evidence: 'no tyre data or tyre_pressure_model records' },
  ];
}
