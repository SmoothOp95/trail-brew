import { describe, expect, it } from 'vitest';
import { manualGap, matchIdentifier, searchBikes, searchComponents } from '../search/search';
import { memoryStore } from '../storage/kv';
import { RequestLog } from '../storage/requests';
import { fixtureIndex, realIndex } from './helpers';

const index = realIndex();

describe('07 findability', () => {
  it('bike search with zero frames returns empty with a reason naming stage 3 and falls through to component search', () => {
    const r = searchBikes('Trek Fuel EX');
    expect(r.results).toEqual([]);
    expect(r.empty).toMatchObject({ stage: '03', next: 'component_search' });
    expect(r.empty?.message).toMatch(/stage 3/);
  });

  it('component search finds FOX units and explains RockShox and budget brands', () => {
    expect(searchComponents(index, 'fork', 'fox 36').results.map((c) => c.id)).toEqual(
      expect.arrayContaining(['fox_36_factory_150_2024', 'fox_36_performance_150_2024', 'fox_36_rhythm_150_2024']),
    );
    const rhythm = searchComponents(index, 'fork', 'rhythm').results;
    expect(rhythm.map((r) => r.id)).toEqual(expect.arrayContaining(['fox_36_rhythm_150_2024', 'fox_34_rhythm_140_2024', 'fox_32_rhythm_120_2024']));
    expect(rhythm.every((r) => r.estimated)).toBe(true);
    const pike = searchComponents(index, 'fork', 'Pike Ultimate').results;
    expect(pike.length).toBeGreaterThan(0);
    expect(pike.every((r) => r.pending)).toBe(true);
    const code = matchIdentifier(index, 'FS-PIKE-SEL-C1');
    expect(code).toMatchObject({ status: 'family', family: 'RockShox Pike Select (Charger RC)', damper: 'Charger RC' });
    expect(searchComponents(index, 'fork', 'Manitou Mattoc').empty).toMatchObject({ stage: '02 batch 3' });
    expect(searchComponents(index, 'shock', 'float x').results.map((c) => c.id)).toContain('fox_float_x_2023');
  });

  it('identifier match: exact part_number hit resolves the unit, prefix returns candidates, no hit says why', () => {
    const fx = fixtureIndex();
    expect(matchIdentifier(fx, '910 26 821')).toMatchObject({ status: 'exact', results: [{ id: 'fixture_fox_36_part_numbered' }] });
    expect(matchIdentifier(fx, '910-26')).toMatchObject({ status: 'prefix', results: [{ id: 'fixture_fox_36_part_numbered' }] });
    const miss = matchIdentifier(fx, 'zzz-nonsense');
    expect(miss.status).toBe('none');
    expect(miss.empty?.message).toMatch(/Nothing on file matches "zzz-nonsense"/);
    const real = matchIdentifier(index, '00.4020.123');
    expect(real.empty).toMatchObject({ stage: '02b', next: 'manual' });
    expect(real.empty?.message).toMatch(/looks like a RockShox part number/);
  });

  it('manual pick on a RockShox chassis explains why it cannot complete', () => {
    expect(manualGap(index, index.chassis.rockshox_pike_2023)).toMatchObject({ stage: '02b', next: 'request' });
    expect(manualGap(index, index.chassis.fox_36_2024)).toBeNull();
  });

  it('request submission is stored under the namespaced key, exportable, and records the step reached', () => {
    const store = memoryStore();
    const log = new RequestLog(store, null);
    log.add(
      { kind: 'fork', brand: 'RockShox', model: 'Pike Select+', year: 2023, text: 'On my Giant Trance', step_reached: 'identifier', query: 'pike' },
      { id: 'r1', now: '2026-09-25T10:00:00Z' },
    );
    expect(Object.keys(store.dump())).toEqual(['mtbTriage:anon:requests']);
    const exported = JSON.parse(log.exportJson());
    expect(exported.requests[0]).toMatchObject({ id: 'r1', brand: 'RockShox', step_reached: 'identifier' });
    expect(() => log.add({ kind: 'other', brand: ' ', model: '', year: null, text: '', step_reached: 'request', query: null }, { id: 'r2', now: 'x' })).toThrow();
    expect(new RequestLog(store, 'uid123').list()).toEqual([]);
  });
});
