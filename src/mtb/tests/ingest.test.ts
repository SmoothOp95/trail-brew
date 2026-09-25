import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ingest } from '../data/ingest/ingest';
import { TABLES, TABLE_NAMES } from '../data/schema/tables';
import type { RawTables } from '../data/ingest/types';

const rawDir = join(__dirname, '../data/raw');
function loadRaw(): RawTables {
  const raw: RawTables = {};
  for (const t of TABLE_NAMES) {
    try {
      raw[t] = JSON.parse(readFileSync(join(rawDir, TABLES[t].file), 'utf8'));
    } catch {
      /* file absent */
    }
  }
  return raw;
}
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe('ingest on the real dataset', () => {
  const { index, coverage } = ingest(loadRaw());

  it('validates every current record with no dangling keys', () => {
    expect(coverage.exclusions).toEqual([]);
    expect(coverage.showable.fork_units).toHaveLength(3);
    expect(coverage.showable.shock_units).toHaveLength(4);
  });

  it('reports setting_charts as an absent file with zero records rather than failing', () => {
    expect(coverage.tables.setting_charts.file_present).toBe(false);
    expect(coverage.tables.setting_charts.valid).toBe(0);
  });

  it('holds back GRIP2 hsc.count (no count_basis) at field level and keeps the record', () => {
    expect(index.dampers.fox_grip2_2024).toBeDefined();
    expect(index.dampers.fox_grip2_2024.adjusters.hsc?.count).toBeNull();
    expect(coverage.annotations).toContainEqual(
      expect.objectContaining({ id: 'fox_grip2_2024', path: 'adjusters.hsc.count', kind: 'held_back', original: 16 }),
    );
  });

  it('derives lever counts from positions', () => {
    expect(index.dampers.float_dps_3pos_2023.adjusters.lsc?.count).toBe(3);
    expect(index.dampers.fox_fit4_2024.adjusters.lsc?.count).toBe(3);
  });

  it('names the known data flags', () => {
    const has = (code: string, id: string) => coverage.flags.some((f) => f.code === code && f.id === id);
    expect(has('lever_not_modelled', 'float_x_2023')).toBe(true);
    expect(has('sub_adjuster_not_modelled', 'fox_fit4_2024')).toBe(true);
    expect(has('converted_from_lb', 'fox_float_evol_36_pressure')).toBe(true);
    expect(has('shock_without_rebound', 'fox_dhx_2024')).toBe(true);
    expect(has('single_value_sag', 'fox_float_x2_factory_2024')).toBe(true);
    expect(has('estimated_downgrade', 'float_dps_3pos_2023')).toBe(true);
    expect(has('estimated', 'rockshox_debonair_plus_pike_140')).toBe(true);
  });
});

describe('07 sparse-data cases: ingest', () => {
  it('excludes a malformed raw record with a reason, keeps the rest, and names it in coverage', () => {
    const raw = loadRaw();
    const dampers = clone(raw.dampers) as Record<string, unknown>[];
    const bad = clone(dampers[0]);
    bad.id = 'broken_damper';
    delete (bad.adjusters as Record<string, unknown>).hsr;
    (bad as Record<string, unknown>).year_range = ['2023', 2024];
    dampers.push(bad);
    raw.dampers = dampers;

    const { index, coverage } = ingest(raw);
    const ex = coverage.exclusions.find((e) => e.id === 'broken_damper');
    expect(ex?.reasons.join(' ')).toMatch(/adjusters\.hsr key missing/);
    expect(ex?.reasons.join(' ')).toMatch(/rule 10/);
    expect(index.dampers.broken_damper).toBeUndefined();
    expect(Object.keys(index.dampers)).toHaveLength(13);
    expect(coverage.tables.dampers.excluded).toBe(1);
  });

  it('holds back a count without a count_basis and names it in coverage', () => {
    const raw = loadRaw();
    const dampers = clone(raw.dampers) as { id: string; adjusters: Record<string, { count: number | null; count_basis?: string } | null> }[];
    const x = dampers.find((d) => d.id === 'float_x_2023')!;
    x.adjusters.lsr!.count = 12;
    const y = dampers.find((d) => d.id === 'fox_grip_x2_2025')!;
    y.adjusters.lsc!.count = 20;
    y.adjusters.lsc!.count_basis = 'stated_total';
    raw.dampers = dampers;

    const { index, coverage } = ingest(raw);
    expect(index.dampers.float_x_2023.adjusters.lsr?.count).toBeNull();
    expect(coverage.annotations.some((a) => a.id === 'float_x_2023' && a.kind === 'held_back')).toBe(true);
    expect(index.dampers.fox_grip_x2_2025.adjusters.lsc?.count).toBe(20);
    expect(coverage.adjuster_counts.count_with_basis).toBe(1);
  });

  it('cascades an exclusion to records that point at it', () => {
    const raw = loadRaw();
    const springs = clone(raw.air_springs) as Record<string, unknown>[];
    springs.find((s) => s.id === 'fox_float_evol_38_2024')!.spacer_factory = 9;
    raw.air_springs = springs;

    const { coverage } = ingest(raw);
    const ids = coverage.exclusions.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['fox_float_evol_38_2024', 'fox_float_evol_38_pressure', 'fox_38_factory_170_2024']));
    expect(coverage.exclusions.find((e) => e.id === 'fox_38_factory_170_2024')?.reasons[0]).toMatch(/excluded air_springs record/);
  });

  it('tells a pending field apart from a bare null', () => {
    const raw = loadRaw();
    const chassis = clone(raw.chassis) as Record<string, unknown>[];
    chassis.find((c) => c.id === 'fox_36_2024')!.fields_pending = [
      { field: 'offset_options_mm', expected_source: 'FOX tech portal spec sheet', tier: 'B' },
    ];
    raw.chassis = chassis;

    const { coverage } = ingest(raw);
    const f = coverage.tables.chassis.fields.offset_options_mm;
    expect(f.null_pending).toBe(1);
    expect(f.null_bare).toBe(3);
  });
});
