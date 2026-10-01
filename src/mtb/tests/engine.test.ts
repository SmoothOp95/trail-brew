import { describe, expect, it } from 'vitest';
import { RULES } from '../rules';
import {
  attributeScores,
  authoredConflicts,
  benchReducer,
  compose,
  describeMove,
  initialBench,
  lapFromProposal,
  readChart,
  readoutRows,
  resolveBike,
  startingValue,
  visibleGoals,
  type BikeSpec,
} from '../engine';
import { fixtureIndex, realIndex } from './helpers';

const index = realIndex();
const fixtures = fixtureIndex();

const FS = 'full_suspension' as const;
const bike = (spec: Partial<BikeSpec>, idx = index) =>
  resolveBike(idx, { suspension: FS, fork: { unitId: 'fox_36_factory_150_2024' }, shock: { unitId: 'fox_float_dps_evol_2023' }, ...spec });

describe('05 §10 test cases', () => {
  it('1. FOX 36 Rhythm GRIP (overlay estimate) + less_harsh: fork_hsc ruled out naming the damper, tyre and pressure still offered', () => {
    const b = bike({ fork: { unitId: 'fox_36_rhythm_150_2024' } });
    const p = compose(['less_harsh'], RULES, b, {});
    const hsc = p.ruledOut.find((r) => r.field === 'fork_hsc');
    expect(hsc?.reason).toBe('No high speed compression adjuster on the GRIP Sweep-Adjust (36 Rhythm) damper.');
    expect(hsc?.goals).toEqual(['less_harsh']);
    expect(p.changes.map((c) => c.field)).toEqual(['tyre_front', 'tyre_rear', 'fork_psi']);
  });

  it('2. FOX 36 GRIP X2 (manual pick of real records) + less_harsh: fork_hsc offered as a counted click change', () => {
    const b = bike({ fork: { chassisId: 'fox_36_2024', damperId: 'fox_grip_x2_2025', airSpringId: 'fox_float_evol_36_2024' } });
    const hsc = compose(['less_harsh'], RULES, b, {}).changes.find((c) => c.field === 'fork_hsc');
    expect(hsc).toMatchObject({ state: 'counted', delta: -2 });
    expect(describeMove(hsc!)).toMatch(/^Open 2 clicks anticlockwise \(softer\)/);
  });

  it('3. RockShox 35 Gold RL Motion Control (fixture) + berm_support: fork_lsc ruled out naming the lockout, compression row hidden', () => {
    const b = bike({ fork: { chassisId: 'rockshox_35_2020', damperId: 'fixture_motion_control_rl', airSpringId: null } }, fixtures);
    const p = compose(['berm_support'], RULES, b, {});
    expect(p.ruledOut.find((r) => r.field === 'fork_lsc')?.reason).toMatch(/Motion Control RL has a lockout lever, not a compression dial/);
    const rows = readoutRows(b).map((r) => r.field);
    expect(rows).not.toContain('fork_lsc');
    expect(rows).not.toContain('fork_hsc');
    expect(rows).toContain('fork_lsr');
  });

  it('4. FLOAT DPS three position + pedal_efficiency: shock_lsc coarse, stepping toward firm, with the coarse note', () => {
    const p = compose(['pedal_efficiency'], RULES, bike({}), {});
    const lsc = p.changes.find((c) => c.field === 'shock_lsc');
    expect(p.ruledOut.map((r) => r.field)).not.toContain('shock_lsc');
    expect(lsc).toMatchObject({ state: 'coarse', delta: 1 });
    expect(lsc?.coarseNote).toMatch(/3 position lever only/);
    expect(describeMove(lsc!)).toBe('Move toward firm');
    const known = compose(['pedal_efficiency'], RULES, bike({}), { shock_lsc: 0 }).changes.find((c) => c.field === 'shock_lsc');
    expect(describeMove(known!)).toBe('open to medium');
  });

  it('5. FLOAT X + pedal_efficiency: shock_lsc offered as counted clicks', () => {
    const lsc = compose(['pedal_efficiency'], RULES, bike({ shock: { unitId: 'fox_float_x_2023' } }), {}).changes.find((c) => c.field === 'shock_lsc');
    expect(lsc).toMatchObject({ state: 'counted', delta: 3 });
    expect(describeMove(lsc!)).toMatch(/^Firm up 3 clicks clockwise \(firmer\)/);
  });

  it('6. more_pop + high_speed_stability: cancels conflict shown, net rebound flagged near zero', () => {
    const goals = ['more_pop', 'high_speed_stability'];
    const p = compose(goals, RULES, bike({}), {});
    expect(authoredConflicts(goals, RULES).map((c) => c.severity)).toEqual(['cancels']);
    expect(p.netZero.map((n) => n.field).sort()).toEqual(['fork_lsr', 'shock_lsr']);
    expect(p.changes.find((c) => c.field === 'fork_lsr')?.netZero).toBe(true);
  });

  it('7. Hardtail (fixture frame type), any goal: no shock fields anywhere, tyre weighting raised', () => {
    const b = resolveBike(index, { suspension: 'hardtail', fork: { unitId: 'fox_36_factory_150_2024' }, shock: { unitId: 'fox_float_x_2023' } });
    expect(b.shock).toBeNull();
    const visible = visibleGoals(RULES, b).map((g) => g.id);
    expect(visible).not.toContain('pedal_efficiency');
    const p = compose(['more_pop', 'flat_corner_grip', 'berm_support'], RULES, b, {});
    const fields = [...p.changes, ...p.ruledOut].map((c) => c.field);
    expect(fields.some((f) => f.startsWith('shock_'))).toBe(false);
    expect(p.changes.find((c) => c.field === 'tyre_front')?.delta).toBe(-2.5);
    // more_pop's redistributed hardtail recipe (05 §3): fork_lsr +2, fork_spacers +1, tyre_rear +1, weighted.
    expect(p.changes.find((c) => c.field === 'tyre_rear')?.delta).toBe(1.5);
    expect(readoutRows(b).some((r) => r.field.startsWith('shock_'))).toBe(false);
    expect(compose(['pedal_efficiency'], RULES, b, {}).hiddenGoals).toEqual(['pedal_efficiency']);
  });

  it('8. Rider weight changed: starting values recompute and staged goals clear', () => {
    const b = bike({});
    expect(startingValue('fork_psi', b, 73).value).toBe(82);
    expect(startingValue('fork_psi', b, 83).value).toBe(89);
    let s = benchReducer({ ...initialBench, riderKg: 73 }, { type: 'toggleGoal', id: 'more_pop' });
    s = benchReducer(s, { type: 'toggleGoal', id: 'less_harsh' });
    expect(s.goals).toHaveLength(2);
    s = benchReducer(s, { type: 'setWeight', kg: 83 });
    expect(s.goals).toEqual([]);
    expect(s.riderKg).toBe(83);
  });

  it('9. A goal pushing past the component maximum is clamped to the record value and disclosed', () => {
    const hsc = compose(['bottom_out_control'], RULES, bike({}), { fork_hsc: 15, fork_spacers: 7 }).changes;
    const h = hsc.find((c) => c.field === 'fork_hsc')!;
    expect(h).toMatchObject({ requested: 2, delta: 1, to: 16, clamp: { bound: 'max', limit: 16 } });
    expect(h.clamp?.source).toMatch(/functional limit/);
    const sp = hsc.find((c) => c.field === 'fork_spacers')!;
    expect(sp).toMatchObject({ delta: 0, to: 7, clamp: { bound: 'max', limit: 7 } });
    const on38 = compose(['bottom_out_control'], RULES, bike({ fork: { unitId: 'fox_38_factory_170_2024' } }), { fork_spacers: 5 });
    expect(on38.changes.find((c) => c.field === 'fork_spacers')?.clamp?.limit).toBe(5);
  });

  it('10. Rebound direction: an increase in fork_lsr reads as opening and faster, never slowing down', () => {
    const lsr = compose(['flat_corner_grip'], RULES, bike({}), { fork_lsr: 4 }).changes.find((c) => c.field === 'fork_lsr')!;
    expect(lsr.to).toBe(5);
    const text = describeMove(lsr);
    expect(text).toMatch(/^Open 1 click anticlockwise \(faster\)/);
    expect(text).not.toMatch(/slow/i);
  });
});

describe('07 sparse-data cases', () => {
  it('unbounded count: change offered, no denominator, no maximum clamp, headroom disclosed once', () => {
    const p = compose(['pedal_efficiency', 'berm_support'], RULES, bike({ shock: { unitId: 'fox_float_x_2023' } }), { shock_lsc: 4 });
    const lsc = p.changes.find((c) => c.field === 'shock_lsc')!;
    expect(lsc).toMatchObject({ requested: 5, delta: 5, to: 9 });
    expect(lsc.clamp).toBeUndefined();
    expect(describeMove(lsc)).not.toMatch(/\bof\b|\//);
    expect(p.headroomUnknown.filter((o) => o === 'FLOAT X')).toHaveLength(1);
  });

  it('no charts: falls to the model or unknown, labelled derived, never published', () => {
    const dps = bike({});
    expect(startingValue('shock_psi', dps, 80)).toMatchObject({ value: null, provenance: 'unknown' });
    expect(startingValue('shock_lsr', dps, 80)).toMatchObject({ value: null, provenance: 'unknown' });
    const counted = bike({ fork: { chassisId: 'fox_36_2024', damperId: 'fixture_counted_damper', airSpringId: 'fox_float_evol_36_2024' } }, fixtures);
    const lsr = startingValue('fork_lsr', counted, 80);
    expect(lsr).toMatchObject({ value: 14, provenance: 'derived' });
    expect(startingValue('tyre_front', dps, 80).provenance).toBe('unknown');
  });

  it('setting_chart present: the model does not run for that adjuster', () => {
    const grip2 = bike({});
    const lsr = startingValue('fork_lsr', grip2, 83);
    expect(lsr.value).toBe(5);
    expect(lsr.provenance).toBe('estimated');
    expect(lsr.source).toMatch(/Manufacturer recommendation/);
    // Even with a documented total on the damper, the chart wins over count x 0.7.
    const idx = fixtureIndex();
    idx.dampers.fox_grip2_2024.adjusters.lsr = { ...idx.dampers.fox_grip2_2024.adjusters.lsr!, count: 20, count_basis: 'stated_total' };
    expect(startingValue('fork_lsr', bike({}, idx), 83).value).toBe(5);
  });

  it('bracket chart: band value, no interpolation across the boundary', () => {
    const pts: [number, number][] = [[54, 66], [59, 70], [64, 74]];
    expect(readChart(pts, 58.9, 'bracket')).toEqual({ value: 66 });
    expect(readChart(pts, 59, 'bracket')).toEqual({ value: 70 });
    expect(readChart(pts, 90, 'bracket')).toEqual({ value: 74 });
    expect(readChart(pts, 56.5, 'curve')).toEqual({ value: 68 });
    expect(readChart(pts, 50, 'bracket').value).toBeNull();
    expect(startingValue('fork_psi', bike({}), 81.9).value).toBe(86);
  });
});

describe('engine details', () => {
  it('rules seed validates and carries the expert-prior disclosure', () => {
    expect(RULES.version).toBe('0.1-seed');
    expect(RULES.goals).toHaveLength(8);
    expect(RULES.conflicts).toHaveLength(6);
    const a = attributeScores(RULES, [{ field: 'fork_psi', delta: 5 }], FS);
    expect(a.fitBasis).toBe('expert_prior');
    expect(a.disclosure).toMatch(/not measurement/);
    for (const s of a.scores) expect(Math.round(s.proposed * 10) / 10).toBe(s.proposed);
  });

  it('attribute model matches the prototype formula', () => {
    // Prototype: fork +5 psi, shock +10 psi -> p = (5/18 + 10/40) / 2
    const a = attributeScores(RULES, [{ field: 'fork_psi', delta: 5 }, { field: 'shock_psi', delta: 10 }], FS);
    const p = (5 / 18 + 10 / 40) / 2;
    expect(a.scores.find((s) => s.id === 'support')?.proposed).toBe(Math.round((5 + 2 * p) * 10) / 10);
  });

  it('coil shock: shock_psi and spacers ruled out with the reason', () => {
    const p = compose(['more_pop', 'bottom_out_control'], RULES, bike({ shock: { unitId: 'fox_dhx2_factory_2024' } }), {});
    expect(p.ruledOut.find((r) => r.field === 'shock_psi')?.reason).toMatch(/coil shock\. Spring rate is not modelled in v1/);
    expect(p.ruledOut.find((r) => r.field === 'shock_spacers')?.reason).toMatch(/coil shock/);
  });

  it('FIT4 Open Mode Adjust is offered only while the lever is in open', () => {
    const b = bike({ fork: { chassisId: 'fox_34_2024', damperId: 'fox_fit4_2024', airSpringId: null } });
    const inOpen = compose(['berm_support'], RULES, b, { fork_lsc: 0 }).changes.find((c) => c.field === 'fork_lsc')!;
    expect(inOpen.subAdjuster).toBe('Open Mode Adjust');
    expect(inOpen).toMatchObject({ state: 'counted', delta: 2 });
    const inMedium = compose(['berm_support'], RULES, b, { fork_lsc: 1 }).changes.find((c) => c.field === 'fork_lsc')!;
    expect(inMedium.subAdjuster).toBeUndefined();
    expect(inMedium).toMatchObject({ state: 'coarse', from: 1, to: 2 });
  });

  it('changes follow the fixed order: tyre, spring, ramp, rebound, compression', () => {
    const p = compose(['rock_garden_control', 'more_pop'], RULES, bike({ shock: { unitId: 'fox_float_x_2023' } }), {});
    expect(p.changes.map((c) => c.group)).toEqual(['tyre', 'spring', 'spring', 'ramp', 'rebound', 'rebound', 'compression']);
  });

  it('the session log records goal ids and field deltas, not only the end state', () => {
    const p = compose(['flat_corner_grip'], RULES, bike({}), { fork_psi: 85, tyre_front: 22 });
    const lap = lapFromProposal(p, { id: 'l1', bikeKey: 'b1', date: '2026-09-25', lap: 1 }, { fork_psi: 85, tyre_front: 22 });
    expect(lap.goal_ids).toEqual(['flat_corner_grip']);
    expect(lap.deltas.fork_psi).toEqual({ from: 85, to: 80, delta: -5 });
    expect(lap.deltas.tyre_front).toEqual({ from: 22, to: 20, delta: -2 });
    expect(lap.settings.fork_psi).toBe(80);
  });

  it('reset keeps nothing staged; apply writes the proposal into the rider\'s own values', () => {
    let s = benchReducer(initialBench, { type: 'toggleGoal', id: 'more_pop' });
    s = benchReducer(s, { type: 'apply', next: { fork_lsr: 7 } });
    expect(s).toMatchObject({ goals: [], entered: { fork_lsr: 7 } });
    s = benchReducer(s, { type: 'reset' });
    expect(s).toMatchObject({ goals: [], entered: {} });
  });

  it('a fourth goal drops the oldest', () => {
    let s = initialBench;
    for (const g of ['more_pop', 'less_harsh', 'berm_support', 'flat_corner_grip']) s = benchReducer(s, { type: 'toggleGoal', id: g });
    expect(s.goals).toEqual(['less_harsh', 'berm_support', 'flat_corner_grip']);
  });
});
