import type { Overlay, OverlayPatch } from '../ingest/types';

/**
 * Gap-filling overlay, applied by ingest on top of src/mtb/data/raw. The raw files stay verbatim.
 *
 * Every entry says why it is trusted (correction / research / estimate). `fill` only writes where the
 * raw value is null or missing, `override` only while the raw value is unchanged, and overlay records
 * drop out once a harvest writes a record with the same id. So each entry retires itself when 02b or a
 * later harvest supplies the real figure.
 *
 * Added 2026-09-25 at Tumi's instruction to fill gaps with research or best estimate. The session's
 * network policy blocked tech.ridefox.com, so "research" entries rest on web search summaries of the
 * FOX manuals, not on the manuals themselves.
 */

const RETRIEVED = '2026-09-25';
const FOX_36_38_MANUAL = 'https://tech.ridefox.com/bike/owners-manuals/2930/fork--2024-36mm-or-38mm';

const searchSource = (url: string, document: string) => ({
  url,
  document: `${document} (read through web search summaries; the page itself was blocked by the session network policy)`,
  retrieved: RETRIEVED,
  method: 'cross_check' as const,
});

const COUNT_TOTALS_SOURCE = 'Service manual or statement of functional limit (02B objective B totals hunt)';
const FOX_SPEC_SHEET = 'FOX tech portal spec sheet';

/** Pending entries for every click adjuster whose total is unknown. */
function countPending(adjusters: string[]) {
  return adjusters.map((a) => ({ field: `adjusters.${a}.count`, expected_source: COUNT_TOTALS_SOURCE, tier: 'A' }));
}

/**
 * Records marked `estimated` only because counts or fields were missing. Their notes say the adjuster
 * layout was read from the manual, so the record is published; the gaps move to fields_pending.
 */
function confidenceCorrection(table: OverlayPatch['table'], id: string, pending: OverlayPatch['pending'], why: string): OverlayPatch {
  return {
    table,
    id,
    basis: 'correction',
    reason: `Record downgraded to estimated for missing data, not for an assumed value. ${why} Gaps recorded in fields_pending instead (01_SCHEMA v0.3).`,
    override: { confidence: 'published' },
    expect: { confidence: 'estimated' },
    pending,
  };
}

const patches: OverlayPatch[] = [
  // ---- confidence corrections ----
  confidenceCorrection('dampers', 'float_dps_3pos_2023', countPending(['lsr']), 'Lever layout and hsc absence are read from the manual.'),
  confidenceCorrection('dampers', 'float_x_2023', countPending(['lsc', 'lsr']), 'LSC dial and hsc absence are read from the manual.'),
  confidenceCorrection('dampers', 'fox_float_x2_factory_2024', countPending(['lsc', 'hsc', 'lsr', 'hsr']), 'The manual states the four-way layout for Factory tier.'),
  confidenceCorrection('dampers', 'fox_dhx2_factory_2024', countPending(['lsc', 'hsc', 'lsr', 'hsr']), 'The manual states Factory DHX2 uses all four adjustments.'),
  confidenceCorrection('dampers', 'fox_fit4_2024', countPending(['lsr']), 'The 3-position lever is read from both manuals.'),
  confidenceCorrection('dampers', 'fox_grip_x_2025', countPending(['lsc', 'hsc', 'lsr']), 'Independent LSC and HSC are read from the 2025 manual.'),
  confidenceCorrection('dampers', 'fox_grip_x2_2025', countPending(['lsc', 'hsc', 'lsr', 'hsr']), 'The four-way layout is read from the 2025 rebound table.'),
  confidenceCorrection('shock_units', 'fox_float_x2_factory_2024', [], 'The only reason given was the single-value sag, which v0.3 allows as [30, 30].'),
  confidenceCorrection('shock_units', 'fox_dhx2_factory_2024', [], 'The only reason given was the single-value sag, which v0.3 allows as [30, 30].'),
  ...['fox_36_2024', 'fox_38_2024', 'fox_34_2024', 'fox_32_2024'].map((id) =>
    confidenceCorrection(
      'chassis',
      id,
      ['axle_std', 'offset_options_mm', 'steerer', 'wheel_sizes', 'max_rotor_mm'].map((field) => ({ field, expected_source: FOX_SPEC_SHEET, tier: 'B' })),
      'Travel options are read from the owner\'s manual; dimensional fields live in the session-gated spec sheet.',
    ),
  ),

  // Published FOX dampers whose counts are unknown: pending, not bare.
  ...([
    ['fox_float_x2_perf_elite_2024', ['lsc', 'lsr']],
    ['fox_dhx2_performance_elite_2024', ['lsc', 'lsr']],
    ['fox_grip_2024', ['lsr']],
    ['fox_rail_2024', ['lsr']],
    ['fox_dhx_2024', ['lsc']],
    ['fox_grip2_2024', ['lsc', 'lsr', 'hsr']],
  ] as const).map(([id, adj]): OverlayPatch => ({
    table: 'dampers', id, basis: 'correction', reason: 'Adjuster total not published in the owner\'s manual.', pending: countPending([...adj]),
  })),

  // GRIP2 hsc = 16 is a stated functional limit (the record's own note quotes it). Supplying the basis
  // un-holds it, so the one real total in the dataset can clamp.
  {
    table: 'dampers', id: 'fox_grip2_2024', basis: 'correction',
    reason: 'The note quotes the manual: settings beyond 16 clicks out from closed do not change damping. That is a functional_total (01_SCHEMA v0.3).',
    fill: { 'adjusters.hsc.count_basis': 'functional_total' },
  },

  // FIT4 Open Mode Adjust, described in the record's own note, modelled as a v0.3 sub_adjuster.
  {
    table: 'dampers', id: 'fox_fit4_2024', basis: 'correction',
    reason: 'The note describes a 22-position Open Mode Adjust active only in Open. v0.3 models this as sub_adjuster.',
    fill: {
      'adjusters.lsc.sub_adjuster': {
        within_position: 'open', type: 'clicks', count: 22, count_basis: 'stated_total', label: 'Open Mode Adjust', direction: 'cw_firmer',
      },
    },
  },

  // ---- pressure charts ----
  ...['fox_float_evol_36_pressure', 'fox_float_evol_38_pressure'].map((id): OverlayPatch => ({
    table: 'pressure_charts', id, basis: 'research',
    reason:
      'Search summaries of the FOX 36/38 manual: riders weigh themselves in riding gear, and the table is in 10 lb weight bands (120-130 lb, 130-140 lb and so on). So basis is rider_plus_kit and the points are band lower bounds, read as brackets.',
    fill: { basis: 'rider_plus_kit', point_type: 'bracket' },
  })),
  ...['rockshox_pike_140_pressure', 'rockshox_lyrik_150_pressure', 'rockshox_zeb_160_pressure'].map((id): OverlayPatch => ({
    table: 'pressure_charts', id, basis: 'correction',
    reason: '02_REPORT schema friction 3 and 02B: RockShox air pressure tables are weight-bracket tables written by the boundary point method.',
    fill: { point_type: 'bracket' },
    pending: [{ field: 'basis', expected_source: 'RockShox Suspension Welcome Guide or user manual', tier: 'A' }],
  })),

  // The harvested EVOL 36 spring (2 spacers, 234-04-736) differs from the Rhythm fork's (3, 234-44-079).
  {
    table: 'air_springs', id: 'fox_float_evol_36_2024', basis: 'estimate',
    reason: '00_STATE conflict 3: the spacer difference against the 36 Rhythm points to a Performance/Factory spring. Scoped to those tiers so it is not applied to a Rhythm fork.',
    fill: { tier_applies_to: ['performance', 'factory'] },
  },
  ...['fox_float_evol_36_2024', 'fox_float_evol_38_2024'].map((id): OverlayPatch => ({
    table: 'air_springs', id, basis: 'correction', reason: 'Minimum pressure not published in the owner\'s manual.',
    pending: [{ field: 'pressure_min_psi', expected_source: 'FOX service documentation', tier: 'A' }],
  })),
];

const GRIP2_BANDS_KG = [54, 59, 64, 68, 73, 77, 82, 86, 91, 95, 100, 104, 109];
const GRIP2_LSR = [9, 8, 7, 7, 6, 6, 5, 4, 4, 3, 2, 2, 1];
const GRIP2_HSR = [8, 7, 6, 6, 5, 5, 4, 3, 3, 2, 1, 1, 0];

const REFERENCE_NOTE =
  "Tumi's 2024 FOX 36 Rhythm 150, the reference bike (00_STATE conflict 1). FOX calls the damper 'Grip Sweep-Adj'; whether it is the 2-position RAIL sweep or the 3-position GRIP is unresolved, but both resolve identically for gating: coarse LSC, counted LSR, no HSC or HSR. Spring figures are the fork's own documented values recorded in 00_STATE, not harvested. Replace with 02B objective C.";

export const OVERLAY: Overlay = {
  version: '2026-09-25',
  patches,
  records: {
    setting_charts: (['lsr', 'hsr'] as const).map((adjuster) => ({
      basis: 'research',
      reason: 'GRIP2 rebound starting points from search summaries of the FOX 36 manual. Consistent with the harvested note (LSR 0-9, HSR 0-8 recommended).',
      record: {
        id: `fox_grip2_${adjuster}_setting`,
        damper_id: 'fox_grip2_2024',
        adjuster,
        unit: 'clicks_from_closed',
        points: GRIP2_BANDS_KG.map((kg, i) => [kg, (adjuster === 'lsr' ? GRIP2_LSR : GRIP2_HSR)[i]]),
        basis: 'rider_plus_kit',
        point_type: 'bracket',
        confidence: 'estimated',
        confidence_note:
          'From web search summaries of the FOX 36 GRIP2 rebound table (10 lb bands, 120-250 lb), not read from the manual directly. Recorded for the 36; assumed to apply to the 38 GRIP2 as well.',
        source: searchSource(FOX_36_38_MANUAL, 'FORK- 2024 36mm/38mm | Bike Tech Help Center | FOX'),
      },
    })),
    dampers: [
      {
        basis: 'estimate',
        reason: 'Reference bike damper, so the one build with known answers can be represented.',
        record: {
          id: 'fox_grip_sweep_adj_36_rhythm_2024',
          brand: 'FOX',
          name: 'GRIP Sweep-Adjust (36 Rhythm)',
          tier: 'rhythm',
          type: 'fork',
          adjusters: {
            lsc: { type: 'sweep', count: null, positions: ['open', 'firm'], detented: false, direction: 'cw_firmer' },
            hsc: null,
            lsr: { type: 'clicks', count: null, positions: null, detented: true, direction: 'cw_slower' },
            hsr: null,
          },
          year_range: [2024, 2024],
          confidence: 'estimated',
          confidence_note: REFERENCE_NOTE,
          source: { url: 'docs/mtb/00_STATE.md', document: '00_STATE.md, known conflicts 1 to 3', retrieved: RETRIEVED, method: 'manual_entry' },
          fields_pending: [{ field: 'adjusters.lsr.count', expected_source: COUNT_TOTALS_SOURCE, tier: 'A' }],
        },
      },
    ],
    air_springs: [
      {
        basis: 'estimate',
        reason: 'Reference bike air spring, from the fork\'s documented figures in 00_STATE.',
        record: {
          id: 'fox_float_36_rhythm_150_2024',
          brand: 'FOX',
          name: 'FLOAT (36 Rhythm)',
          type: 'air',
          negative: null,
          chassis_id: 'fox_36_2024',
          tier_applies_to: ['rhythm'],
          travel_mm: 150,
          spacer_pn: '234-44-079',
          spacer_volume_cc: 10,
          spacer_factory: 3,
          spacer_max: 7,
          pressure_max_psi: 120,
          sag_target_pct: [15, 20],
          equalise_note: null,
          confidence: 'estimated',
          confidence_note: REFERENCE_NOTE,
          source: { url: 'docs/mtb/00_STATE.md', document: '00_STATE.md, known conflicts 2 and 3', retrieved: RETRIEVED, method: 'manual_entry' },
          fields_pending: [{ field: 'pressure_min_psi', expected_source: 'FOX service documentation', tier: 'A' }],
        },
      },
    ],
    fork_units: [
      {
        basis: 'estimate',
        reason: 'Reference bike fork unit.',
        record: {
          id: 'fox_36_rhythm_150_2024',
          display_name: 'FOX 36 Rhythm 150 (GRIP Sweep-Adjust)',
          chassis_id: 'fox_36_2024',
          damper_id: 'fox_grip_sweep_adj_36_rhythm_2024',
          air_spring_id: 'fox_float_36_rhythm_150_2024',
          travel_mm: 150,
          offset_mm: null,
          tier: 'rhythm',
          model_year: 2024,
          part_number: null,
          service_interval_h: null,
          oil: null,
          known_issues: [],
          sa_availability: null,
          confidence: 'estimated',
          confidence_note: REFERENCE_NOTE,
          source: { url: 'docs/mtb/00_STATE.md', document: '00_STATE.md, known conflicts 1 to 3', retrieved: RETRIEVED, method: 'manual_entry' },
          fields_pending: [{ field: 'part_number', expected_source: 'Fork leg sticker or FOX spec sheet', tier: 'B' }],
        },
      },
    ],
  },
};
