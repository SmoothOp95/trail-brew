import { describe, expect, it } from 'vitest';
import { RULES } from '../rules';
import {
  BASIC_FIELDS, benchReducer, compose, initialBench, readoutRows, resolveBike, setupFields, setupMissing, startingValues,
  type BikeSpec,
} from '../engine';
import { adhocBikeKey } from '../storage/garage';
import { realIndex } from './helpers';

const index = realIndex();
const full: BikeSpec = { suspension: 'full_suspension', fork: { generic: true, travel: 150 }, shock: { generic: true, travel: 140 } };
const allDials: BikeSpec = {
  suspension: 'full_suspension',
  fork: { generic: true, travel: 150, dials: { hsc: true, hsr: true } },
  shock: { generic: true, travel: 140, dials: { hsc: true, hsr: true } },
};
const hardtail: BikeSpec = { suspension: 'hardtail', fork: { generic: true, travel: 120 }, shock: null };

describe('setup flow: bike type and travel, no brand or model', () => {
  it('a travel-only bike resolves without touching the dataset', () => {
    const bike = resolveBike(index, full);
    expect(bike.fork?.label).toBe('Fork, 150 mm');
    expect(bike.shock?.label).toBe('Rear shock, 140 mm');
    expect(bike.annotations).toEqual([]);
    expect(resolveBike(index, hardtail).shock).toBeNull();
  });

  it('advanced offers the full suite as unbounded clicks once the rider ticks the high speed dials', () => {
    const bike = resolveBike(index, allDials);
    const rows = readoutRows(bike, 'advanced');
    expect(rows.map((r) => r.field)).toEqual([
      'fork_psi', 'fork_spacers', 'fork_lsr', 'fork_hsr', 'fork_lsc', 'fork_hsc',
      'shock_psi', 'shock_spacers', 'shock_lsr', 'shock_hsr', 'shock_lsc', 'shock_hsc', 'tyre_front', 'tyre_rear',
    ]);
    expect(rows.filter((r) => r.unit === 'clicks').every((r) => r.state === 'counted' && r.max == null)).toBe(true);
    const starts = startingValues(bike, 80);
    expect(Object.values(starts).every((s) => s.value == null)).toBe(true);
  });

  it('high speed dials are off until the rider says they have them, and ruling them out quotes the answer', () => {
    const bike = resolveBike(index, full);
    expect(readoutRows(bike, 'advanced').map((r) => r.field)).toEqual([
      'fork_psi', 'fork_spacers', 'fork_lsr', 'fork_lsc', 'shock_psi', 'shock_spacers', 'shock_lsr', 'shock_lsc', 'tyre_front', 'tyre_rear',
    ]);
    const hscGoal = RULES.goals.find((g) => 'fork_hsc' in g.recipe)!;
    const p = compose([hscGoal.id], RULES, bike, {}, { fields: setupFields('advanced') });
    expect(p.ruledOut.find((r) => r.field === 'fork_hsc')?.reason).toMatch(/You said your fork has no high speed compression dial/);
    const forkOnly = resolveBike(index, { ...full, fork: { generic: true, travel: 150, dials: { hsc: true } } });
    const rows = readoutRows(forkOnly, 'advanced').map((r) => r.field);
    expect(rows).toContain('fork_hsc');
    expect(rows).not.toContain('fork_hsr');
    expect(rows).not.toContain('shock_hsc');
  });

  it('basic shows tyre pressures and air pressures only', () => {
    expect(readoutRows(resolveBike(index, full), 'basic').map((r) => r.field)).toEqual(['fork_psi', 'shock_psi', 'tyre_front', 'tyre_rear']);
    expect(readoutRows(resolveBike(index, hardtail), null).map((r) => r.field)).toEqual(['fork_psi', 'tyre_front', 'tyre_rear']);
  });

  it('basic proposes pressure changes only and lists the rest as advanced, not ruled out', () => {
    const bike = resolveBike(index, allDials);
    const goals = RULES.goals.filter((g) => g.applies_to.includes('full_suspension')).map((g) => g.id);
    for (const id of goals) {
      const basic = compose([id], RULES, bike, {}, { fields: setupFields('basic') });
      expect(basic.changes.every((c) => BASIC_FIELDS.includes(c.field))).toBe(true);
      expect(basic.ruledOut.every((r) => BASIC_FIELDS.includes(r.field))).toBe(true);
      const adv = compose([id], RULES, bike, {}, { fields: setupFields('advanced') });
      expect(adv.advanced).toEqual([]);
      expect(basic.changes.length + basic.advanced.length).toBe(adv.changes.length);
    }
  });

  it('tuning waits for travel and a setup mode', () => {
    expect(setupMissing({ ...full, fork: { generic: true, travel: null } }, null)).toEqual([
      'Enter your fork travel', 'Choose Basic or Advanced setup',
    ]);
    expect(setupMissing({ ...full, shock: { generic: true, travel: null } }, 'basic')).toEqual(['Enter your rear travel']);
    expect(setupMissing({ ...hardtail, shock: { generic: true, travel: null } }, 'basic')).toEqual([]);
    expect(setupMissing(full, 'advanced')).toEqual([]);
    // A Garage bike with named parts needs no travel.
    expect(setupMissing({ suspension: 'full_suspension', fork: { unitId: 'fox_36_factory_150_2024' }, shock: { unitId: 'fox_float_x_2023' } }, 'basic')).toEqual([]);
  });

  it('mode switches keep staged goals, and editing travel keeps the same log key', () => {
    let s = benchReducer(initialBench, { type: 'toggleGoal', id: RULES.goals[0].id });
    s = benchReducer(s, { type: 'setMode', mode: 'advanced' });
    expect(s.mode).toBe('advanced');
    expect(s.goals).toHaveLength(1);
    expect(adhocBikeKey(full)).toBe(adhocBikeKey({ ...full, fork: { generic: true, travel: 160 } }));
  });
});
