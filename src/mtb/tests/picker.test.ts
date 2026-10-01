import { describe, expect, it } from 'vitest';
import { RULES } from '../rules';
import { STAND_INS } from '../data/standins';
import { compose, readoutRows, resolveBike, resolveCapability, startingValue } from '../engine';
import { forkCatalogue, shockCatalogue, searchCatalogue } from '../search/catalogue';
import { realIndex } from './helpers';

const index = realIndex();
const forks = forkCatalogue(index);
const shocks = shockCatalogue(index);

describe('component picker has no gaps', () => {
  it('every brand, model and travel in the picker resolves on the Bench', () => {
    let n = 0;
    for (const m of forks) for (const o of m.options) {
      const bike = resolveBike(index, { suspension: 'full_suspension', fork: o.spec, shock: null });
      expect(bike.fork).not.toBeNull();
      compose(['less_harsh', 'more_pop'], RULES, bike, {});
      n++;
    }
    for (const m of shocks) for (const o of m.options) {
      const bike = resolveBike(index, { suspension: 'full_suspension', fork: null, shock: o.spec });
      expect(bike.shock).not.toBeNull();
      compose(['pedal_efficiency'], RULES, bike, {});
      n++;
    }
    expect(n).toBeGreaterThan(250);
  });

  it('covers the brands South African riders ride, forks and shocks', () => {
    const brands = (ms: { brand: string }[]) => new Set(ms.map((m) => m.brand));
    for (const b of ['FOX', 'RockShox', 'Marzocchi', 'X-Fusion', 'SR Suntour']) {
      expect(brands(forks)).toContain(b);
      expect(brands(shocks)).toContain(b);
    }
  });

  it('fills FOX travels with no record from the nearest travel, figures stripped', () => {
    const m = forks.find((x) => x.brand === 'FOX' && x.model === '36 Factory (GRIP2)')!;
    expect(m.options.map((o) => o.travel)).toEqual([130, 140, 150, 160, 170]);
    const o160 = m.options.find((o) => o.travel === 160)!;
    expect(o160.exact).toBe(false);
    const bike = resolveBike(index, { suspension: 'full_suspension', fork: o160.spec, shock: null });
    expect(bike.fork?.standIn?.reason).toMatch(/No 160 mm record/);
    expect(bike.fork?.pressureChart).toBeNull();
    expect(startingValue('fork_psi', bike, 83).value).toBeNull();
    // The dials are still the GRIP2's.
    expect(resolveCapability('fork_hsc', bike).state).toBe('counted');
  });

  it('every stand-in names a target family that exists', () => {
    for (const st of STAND_INS) {
      const pool = st.kind === 'fork' ? forks : shocks;
      expect(pool.some((m) => `${m.brand} ${m.model}` === st.target), `${st.id} -> ${st.target}`).toBe(true);
    }
  });

  it('a closest-match stand-in borrows dials only, never figures', () => {
    const z1 = forks.find((m) => m.model === 'Bomber Z1 (air)')!;
    const bike = resolveBike(index, { suspension: 'full_suspension', fork: z1.options[2].spec, shock: null });
    expect(bike.fork?.standIn?.targetLabel).toBe('FOX 36 Performance (GRIP)');
    expect(bike.fork?.label).toBe('Marzocchi Bomber Z1 (air) 150');
    expect(bike.fork?.pressureChart).toBeNull();
    expect(bike.fork?.airSpring?.spacer_max).toBeNull();
    expect(bike.fork?.settingCharts).toEqual([]);
    expect(resolveCapability('fork_hsc', bike).reason).toMatch(/No high speed compression adjuster/);

    const coil = forks.find((m) => m.model === 'Bomber Z1 Coil')!;
    const coilBike = resolveBike(index, { suspension: 'full_suspension', fork: coil.options[0].spec, shock: null });
    expect(resolveCapability('fork_psi', coilBike).state).toBe('absent');

    const deluxe = shocks.find((m) => m.model.startsWith('Deluxe'))!;
    const sb = resolveBike(index, { suspension: 'full_suspension', fork: null, shock: deluxe.options[0].spec });
    expect(sb.shock?.label).toBe('RockShox Deluxe (Select, Select+, Ultimate)');
    expect(sb.shock?.unit?.pressure_max_psi).toBeNull();
    expect(resolveCapability('shock_lsc', sb).state).toBe('coarse');
  });

  it('lockout-only budget forks map to pending RockShox families, so no damping advice is invented', () => {
    const xcr = forks.find((m) => m.model === 'XCR Air')!;
    const bike = resolveBike(index, { suspension: 'full_suspension', fork: xcr.options[1].spec, shock: null });
    expect(resolveCapability('fork_lsr', bike).state).toBe('pending');
    expect(readoutRows(bike).map((r) => r.field)).not.toContain('fork_lsr');
  });

  it('forks with no tokens rule out spacer changes', () => {
    const bike = resolveBike(index, { suspension: 'full_suspension', fork: { unitId: 'rockshox_recon_silver_rl_120_2023' }, shock: null });
    expect(resolveCapability('fork_spacers', bike)).toMatchObject({ state: 'absent' });
  });

  it('search finds stand-ins and model codes', () => {
    expect(searchCatalogue(forks, 'suntour xcr').map((m) => m.model)).toContain('XCR Air');
    expect(searchCatalogue(forks, 'FS-LYRK-SELP-D1').map((m) => m.model)).toEqual(['Lyrik Select+ (Charger 3 RC2)']);
    expect(searchCatalogue(shocks, 'vivid').length).toBe(2);
  });
});
