import { describe, expect, it } from 'vitest';
import { ingest } from '../data/ingest/ingest';
import { OVERLAY } from '../data/overlay/overlay';
import { loadRaw } from './helpers';

/**
 * 02C section 12 golden values. The transcription is manual, and the harvest it corrected was wrong in
 * exactly the way manual transcription goes wrong, so these values must survive ingest unchanged.
 */
const { index, coverage } = ingest(loadRaw(), OVERLAY);
const spring = (id: string) => index.air_springs[id];
const band = (chartId: string, kgMin: number | null) => index.pressure_charts[chartId]?.bands?.find((b) => b.kg_min === kgMin);
const a2c = (chassisId: string, wheel: string, travel: number, variant?: string) =>
  index.chassis[chassisId]?.axle_to_crown?.find((a) => a.wheel === wheel && a.travel_mm === travel && (variant ? a.variant === variant : true))?.mm;

describe('02C golden values survive ingest', () => {
  it('ingests the 02C records with no exclusions', () => {
    expect(coverage.exclusions).toEqual([]);
  });

  it.each([
    ['Pike 140', 'rockshox_debonair_plus_pike_140', 0, 5],
    ['Pike 120', 'rockshox_debonair_plus_pike_120', 1, 6],
    ['ZEB 160', 'rockshox_debonair_plus_zeb_160', 1, 5],
    ['Revelation 120', 'rockshox_debonair_revelation_120', 4, 6],
    ['Yari 29+ 100', 'rockshox_debonair_yari_29plus_100', 5, 7],
  ])('%s tokens', (_name, id, installed, max) => {
    expect(spring(id)).toMatchObject({ spacer_factory: installed, spacer_max: max });
  });

  it('ZEB 190, 29 Boost axle to crown is 606', () => {
    expect(a2c('rockshox_zeb_2023', '29_boost', 190)).toBe(606);
  });

  it('Judy Gold 29 at 120 axle to crown is 527', () => {
    expect(a2c('rockshox_judy_2023', '29', 120, 'Judy Gold')).toBe(527);
  });

  it('SID max_rotor_mm is 220', () => {
    expect(index.chassis.rockshox_sid_2023.max_rotor_mm).toBe(220);
  });

  it('Recon Gold 130-150 max psi is 225', () => {
    for (const t of [130, 140, 150]) expect(spring(`rockshox_debonair_recon_gold_${t}`).pressure_max_psi).toBe(225);
  });

  it('35 Silver 100-120 band for 72-81 kg is 125 to 140 psi', () => {
    for (const t of [100, 120]) {
      expect(band(`rockshox_solo_air_35_silver_${t}_pressure`, 72)).toEqual({ kg_min: 72, kg_max: 81, psi_min: 125, psi_max: 140 });
    }
  });

  it('Lyrik 150-160 band for 81-90 kg is 80 to 90 psi', () => {
    expect(band('rockshox_lyrik_150_pressure', 81)).toEqual({ kg_min: 81, kg_max: 90, psi_min: 80, psi_max: 90 });
    expect(band('rockshox_debonair_plus_lyrik_160_pressure', 81)).toEqual({ kg_min: 81, kg_max: 90, psi_min: 80, psi_max: 90 });
  });

  it('five-band charts keep their closed lowest band (the boundary point method lost it)', () => {
    expect(band('rockshox_solo_air_35_silver_100_pressure', null)).toEqual({ kg_min: null, kg_max: 63, psi_min: 90, psi_max: 110 });
  });

  it('existing RockShox charts are re-expressed as bands and agree with their old boundary points', () => {
    const pike = index.pressure_charts.rockshox_pike_140_pressure;
    expect(pike.points).toBeUndefined();
    expect(pike.point_type).toBe('bracket');
    // Old point [81, 75] is the lower bound of the 81-90 kg band.
    expect(band('rockshox_pike_140_pressure', 81)).toMatchObject({ psi_min: 75, psi_max: 85 });
  });

  it('coil springs carry the colour chart', () => {
    const coil = spring('rockshox_coil_judy_100');
    expect(coil.type).toBe('coil');
    expect(coil.coil_chart?.find((b) => b.kg_min === 81)).toEqual({ kg_min: 81, kg_max: 90, label: 'Firm', colour: 'Blue' });
  });

  it('every RockShox fork unit carries a model code', () => {
    const rs = Object.values(index.fork_units).filter((u) => u.id.startsWith('rockshox_'));
    expect(rs.length).toBe(153);
    expect(rs.every((u) => u.model_code?.startsWith('FS-'))).toBe(true);
  });

  it('FS-PIKE-SEL-C1 units point at the reserved Charger RC damper', () => {
    const units = Object.values(index.fork_units).filter((u) => u.model_code === 'FS-PIKE-SEL-C1');
    expect(units.map((u) => u.travel_mm).sort()).toEqual([120, 130, 140]);
    expect(new Set(units.map((u) => u.damper_id))).toEqual(new Set(['rockshox_charger_rc_2023']));
  });

  it('ZEB Base keeps both damper readings rather than picking one', () => {
    const zeb = index.fork_units.rockshox_zeb_base_160_2023;
    expect(zeb.confidence).toBe('estimated');
    expect(zeb.confidence_note).toMatch(/Rush RC.*Charger R/);
  });

  it.todo('FS-PIKE-SEL-C1 identifier match returns the Pike Select family and lets the rider pick travel (engine step)');
  it.todo('any fork unit on a pending damper: adjusters resolve pending, never absent; pressure band still shown (engine step)');
  it.todo('coil fork at 85 kg: "Blue, Firm" shown as published; fork_psi absent (engine step)');
});

describe('02C pending damper rule at ingest', () => {
  it('keeps units whose damper_id is declared pending, and lists them', () => {
    expect(index.fork_units.rockshox_pike_select_140_2023).toBeDefined();
    expect(coverage.pending_dampers).toHaveLength(153);
    expect(coverage.pending_dampers.find((p) => p.id === 'rockshox_pike_select_140_2023')).toMatchObject({ damper_name: 'Charger RC' });
  });

  it('still excludes a unit whose missing damper is not declared pending', () => {
    const raw = loadRaw();
    const forks = JSON.parse(JSON.stringify(raw.fork_units)) as Record<string, unknown>[];
    const u = forks.find((f) => f.id === 'rockshox_pike_select_140_2023')!;
    u.fields_pending = [];
    raw.fork_units = forks;
    const r = ingest(raw, OVERLAY);
    expect(r.coverage.exclusions.find((e) => e.id === 'rockshox_pike_select_140_2023')?.reasons[0]).toMatch(/damper_id .* does not resolve/);
  });

  it('holds pending units off the Bench list until the engine resolves pending adjusters', () => {
    expect(coverage.showable.fork_units.some((u) => u.id.startsWith('rockshox_'))).toBe(false);
  });

  it('lists deferred source content rather than omitting it', () => {
    expect(coverage.deferred.map((d) => d.item)).toContain('RockShox Pike DJ');
  });
});
