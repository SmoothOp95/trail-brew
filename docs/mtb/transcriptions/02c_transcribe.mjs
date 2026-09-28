// Transcription of 02C_ROCKSHOX_FRONT_SPEC_2023.md into src/mtb/data/raw.
// Run once, by hand: `node docs/mtb/transcriptions/02c_transcribe.mjs`. Not part of the build.
// Idempotent: corrections are value assignments, and new records are skipped when their id already exists.
// Every figure below is copied from the 02C tables, which transcribe RockShox GEN.00000000007168 Rev D.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAW = join(dirname(fileURLToPath(import.meta.url)), '../../../src/mtb/data/raw');
const load = (f) => { try { return JSON.parse(readFileSync(join(RAW, f), 'utf8')); } catch { return []; } };
const save = (f, rows) => writeFileSync(join(RAW, f), JSON.stringify(rows, null, 2) + '\n');

const SRC = {
  url: 'https://www.sram.com/en/service',
  document: '2023 Front Suspension Specifications - Oil Volume, Air Pressure, Coil Spring Rates, and Technical Specifications (GEN.00000000007168 Rev D, SRAM/RockShox), as transcribed in 02C_ROCKSHOX_FRONT_SPEC_2023.md',
  retrieved: '2026-09-25',
  method: 'manual_entry',
};
const withSource = (r) => {
  const list = Array.isArray(r.source) ? r.source : [r.source];
  if (!list.some((s) => s.document === SRC.document)) list.push(SRC);
  r.source = list;
  return r;
};
const PENDING_02B = { field: 'damper_id', expected_source: '02B_HARVEST_ROCKSHOX.md objective A (adjuster inventory)', tier: 'A' };
const corrections = [];

const chassis = load('chassis.json');
const springs = load('air_springs.json');
const charts = load('pressure_charts.json');
const forks = load('fork_units.json');

// ---------- section 1: corrections ----------
function correct(rows, id, field, value, page) {
  const r = rows.find((x) => x.id === id);
  if (!r) throw new Error(`correction target missing: ${id}`);
  const before = JSON.stringify(r[field]);
  if (before !== JSON.stringify(value)) corrections.push(`${id}.${field}: ${before} -> ${JSON.stringify(value)} (p${page})`);
  r[field] = value;
  withSource(r);
}
correct(springs, 'rockshox_debonair_plus_pike_140', 'spacer_factory', 0, 19);
correct(springs, 'rockshox_debonair_plus_pike_140', 'spacer_max', 5, 19);
correct(springs, 'rockshox_debonair_plus_lyrik_150', 'spacer_factory', 0, 18);
correct(springs, 'rockshox_debonair_plus_zeb_160', 'spacer_max', 5, 25);
correct(chassis, 'rockshox_sid_2023', 'max_rotor_mm', 220, 23);
correct(chassis, 'rockshox_pike_2023', 'offset_options_mm', [37, 44], 19);
correct(chassis, 'rockshox_lyrik_2023', 'offset_options_mm', [37, 44], 18);
correct(chassis, 'rockshox_yari_2023', 'offset_options_mm', [37, 42, 44, 46, 51], '23-24');
correct(chassis, 'rockshox_yari_2023', 'travel_options_mm', [100, 110, 120, 130, 140, 150, 160, 170, 180], 24);
correct(chassis, 'rockshox_reba_2022', 'travel_options_mm', [100, 110, 120], 19);

// ---------- section 3: chassis ----------
const byId = (rows, id) => rows.find((x) => x.id === id);
const r35 = byId(chassis, 'rockshox_35_2020');
if (JSON.stringify(r35.year_range) !== '[2020,2023]') corrections.push('rockshox_35_2020.year_range: [2020,2022] -> [2020,2023] (35 Gold and Silver 2023 dimensions match)');
r35.year_range = [2020, 2023];
withSource(r35);

const NOTES = {
  rockshox_35_2020: ['27.5 Boost: offsets 37, 44; tyre max 732 mm (730 with fender), 81 mm wide', '29 Boost: offsets 44, 51; tyre max 770 mm (768 with fender), 81 mm wide', 'Rotor 180 min, 220 max. Steerer 1.5 tapered, or 1.8 tapered at 44 offset'],
  rockshox_pike_2023: ['27.5 Boost: offsets 37, 44; tyre max 732 mm, 81 mm wide', '29 Boost: offset 44; tyre max 770 mm, 81 mm wide', 'Rotor 180 min, 220 max'],
  rockshox_lyrik_2023: ['27.5 Boost: offsets 37, 44; tyre max 732 mm, 81 mm wide', '29 Boost: offset 44; tyre max 770 mm, 81 mm wide', 'Rotor 180 min, 220 max. Steerer 1.5 tapered on Ultimate Flight Attendant, 1.5 or 1.8 tapered on other tiers'],
  rockshox_zeb_2023: ['27.5 Boost: offsets 38, 44; tyre max 732 mm, 81 mm wide', '29 Boost: offsets 44, 51; tyre max 770 mm, 81 mm wide', 'Rotor 200 min, 220 max. Steerer 1.5 tapered on Ultimate Flight Attendant, 1.5 or 1.8 tapered on other tiers'],
  rockshox_domain_2023: ['27.5 Boost: offsets 38, 44; tyre max 732 mm, 81 mm wide', '29 Boost: offsets 44, 51; tyre max 770 mm, 81 mm wide', 'Rotor 200 min, 220 max. Steerer 1.5 tapered, or 1.8 tapered at 44 offset'],
  rockshox_yari_2023: ['27.5 Boost 150-180: offsets 37, 44, 46; tyre max 732 mm, 81 mm wide', '29 Boost 150-180: offsets 42, 44, 51; tyre max 770 mm, 81 mm wide', '29+ 100-160: offset 51; tyre max 786 mm, 82 mm wide; rotor 160 min', 'Rotor 180 min, 220 max on 27.5 and 29 Boost'],
  rockshox_revelation_2023: ['27.5 Boost 120-160: offsets 37, 46; tyre max 732 mm, 81 mm wide', '29 Boost 120-150: offsets 42, 51; tyre max 770 mm, 81 mm wide', 'Rotor 180 min, 220 max'],
  rockshox_sid_2023: ['29 Boost 110-120: offset 44; tyre max 758 mm, 66 mm wide', 'Rotor 180 min, 220 max'],
  rockshox_sid_sl_2023: ['29 Boost 100: offset 44; tyre max 751 mm, 60 mm wide', 'Rotor 160 min, 200 max'],
  rockshox_reba_2022: ['27.5 Boost: offset 42; tyre max 712-714 mm, 81 mm wide', '29 Boost: offset 51; tyre max 755-760 mm, 81 mm wide', 'Rotor 160 min, 220 max', 'Dimensions match the 2023 Reba RL (FS-Reba-RL-A9)'],
};
for (const [id, notes] of Object.entries(NOTES)) {
  const c = byId(chassis, id);
  c.notes = notes;
  withSource(c);
}

const newChassis = [
  {
    id: 'rockshox_boxxer_2023', brand: 'RockShox', model: 'BoXXer', stanchion_mm: 35, travel_options_mm: [180, 190, 200],
    axle_std: '20x110', offset_options_mm: [36, 46, 56], steerer: 'straight_1_125', wheel_sizes: ['27_5', '29'], max_rotor_mm: 220,
    brake_mount: null, year_range: [2023, 2023],
    notes: ['27.5 Boost 200: offsets 36, 46; tyre max 732 mm', '27.5 or 29 Boost 180, and 29 Boost 190-200: offsets 46, 56; tyre max 770 mm', 'Tyre max 81 mm wide. Rotor 200 min, 220 max'],
  },
  {
    id: 'rockshox_judy_2023', brand: 'RockShox', model: 'Judy', stanchion_mm: 30, travel_options_mm: [80, 100, 120, 130],
    axle_std: null, offset_options_mm: [40, 42, 46, 51], steerer: null, wheel_sizes: ['26', '27_5', '29'], max_rotor_mm: 220,
    brake_mount: null, year_range: [2023, 2023],
    notes: [
      'Covers Judy, Judy Silver and Judy Gold, all 30 mm stanchions',
      'Axle varies by wheel: 9 mm QR on 26, 27.5 and 29 (rotor 160 min, 185 max; tyre max 58-62 mm wide); 15x110 on 27.5 and 29 Boost (rotor 160 min, 220 max; tyre max 81 mm wide)',
      'Steerer varies by model: 1 1/8 straight (alloy or steel) or 1.5 tapered; Boost versions 1.5 tapered',
      'Offsets: 40 on 26, 42 on 27.5, 46 or 51 on 29, 42 or 51 on 27.5 and 29 Boost',
      'Tyre max diameter: 680 (26), 710 (27.5), 755 (29), 732 (27.5 Boost, 726 with fender), 770 (29 Boost, 766 with fender)',
    ],
  },
  {
    id: 'rockshox_recon_2023', brand: 'RockShox', model: 'Recon', stanchion_mm: 32, travel_options_mm: [80, 100, 120, 130, 140, 150],
    axle_std: null, offset_options_mm: [37, 40, 42, 46, 51], steerer: null, wheel_sizes: ['26', '27_5', '29'], max_rotor_mm: 220,
    brake_mount: null, year_range: [2023, 2023],
    notes: [
      'Covers Recon Gold and Recon Silver, 32 mm stanchions',
      'Axle varies: 9 mm QR, 15x100 or 15x110 Boost depending on model and wheel',
      'Steerer: 1 1/8 straight (some steel) or 1.5 tapered; Boost versions 1.5 tapered',
      'Offsets: 37 or 46 on 27.5 Boost, 42 or 51 on 29 Boost, 42 on 27.5, 46 or 51 on 29, 40 on 26',
      'Rotor 160 min, 220 max (200 max on Recon Silver TK 26). Tyre max 710-770 mm diameter, 62-81 mm wide',
    ],
  },
];
for (const c of newChassis) {
  if (byId(chassis, c.id)) continue;
  chassis.push({ ...c, confidence: 'published', source: SRC, fields_pending: [{ field: 'brake_mount', expected_source: 'RockShox user manual or technical manual', tier: 'A' }] });
}


// ---------- section 4: axle to crown by travel and wheel ----------
// Not in 01_SCHEMA v0.3.2; stored as chassis.axle_to_crown and flagged as a non-schema field.
const A = (wheel, travel_mm, mm, fender_mm, variant) => ({ ...(variant ? { variant } : {}), wheel, travel_mm, mm, ...(fender_mm ? { fender_mm } : {}) });
// Each value is either mm or [mm, fender_mm].
const cell = (w, t, x, variant) => { const [mm, fender] = Array.isArray(x) ? x : [x, null]; return A(w, t, mm, fender, variant); };
const pairs = (travels, w1, w2, v1, v2, variant) => travels.flatMap((t, i) => [
  ...(v1[i] != null ? [cell(w1, t, v1[i], variant)] : []),
  ...(v2 && v2[i] != null ? [cell(w2, t, v2[i], variant)] : []),
]);
const B27 = '27_5_boost', B29 = '29_boost';
const A2C = {
  rockshox_pike_2023: pairs([120, 130, 140], B27, B29, [512, 522, 532], [531, 541, 551]),
  rockshox_lyrik_2023: pairs([140, 150, 160], B27, B29, [532, 542, 552], [551, 561, 571]),
  rockshox_zeb_2023: pairs([150, 160, 170, 180, 190], B27, B29, [547, 557, 567, 577, 587], [566, 576, 586, 596, 606]),
  rockshox_revelation_2023: pairs([120, 130, 140, 150, 160], B27, B29, [512, 522, 532, 542, 552], [531, 541, 551, 561, null]),
  rockshox_yari_2023: [
    ...pairs([150, 160, 170, 180], B27, B29, [542, 552, 562, 572], [561, 571, 581, 591]),
    ...pairs([100, 110, 120, 130, 140, 150, 160], '29_plus', null, [523, 533, 543, 553, 563, 573, 583]),
  ],
  rockshox_domain_2023: pairs([150, 160, 170, 180], B27, B29, [547, 557, 567, 577], [566, 576, 586, 596]),
  rockshox_boxxer_2023: [A(B27, 200, 581), A(B27, 180, 582), A(B29, 180, 582), A(B29, 190, 592), A(B29, 200, 602)],
  rockshox_sid_2023: [A(B29, 110, 521), A(B29, 120, 531)],
  rockshox_sid_sl_2023: [A(B29, 100, 506)],
  rockshox_35_2020: pairs([100, 120, 130, 140, 150, 160], B27, B29,
    [[492, 498], [512, 518], [522, 528], [532, 538], [542, 548], [552, 558]],
    [[511, 517], [531, 537], [541, 547], [551, 557], [561, 567], [571, 577]]),
  rockshox_reba_2022: pairs([100, 110, 120], B27, B29, [487, 497, 507], [506, 521, 531]),
  rockshox_recon_2023: [
    ...pairs([80, 100, 120, 130, 140, 150], B27, B29,
      [[474, 480], [494, 500], [514, 520], [524, 530], [534, 540], [544, 550]],
      [[493, 499], [513, 519], [533, 539], [543, 549], [553, 559], [563, 569]], 'Recon Gold RL'),
    ...pairs([100, 120, 130, 140], '27_5', '29', [486, 506, 520, 530], [505, 529, 539, 549], 'Recon Silver RL'),
    ...pairs([100, 120, 130, 140, 150], B27, B29, [[494, 500], [514, 520], [524, 530], [534, 540], [544, 550]], [[513, 519], [533, 539], [543, 549], [553, 559], [563, 569]], 'Recon Silver RL'),
    A('26', 100, 490, null, 'Recon Silver TK'),
    ...pairs([80, 100], '27_5', '29', [466, 486], [485, 505], 'Recon Silver TK'),
    ...pairs([80, 100, 120], B27, B29, [[474, 480], [494, 500], [514, 520]], [[493, 499], [513, 519], [533, 539]], 'Recon Silver TK'),
  ],
  rockshox_judy_2023: [
    ...pairs([80, 100], '26', null, [453, 473], null, 'Judy Gold'),
    ...pairs([80, 100, 120], '27_5', '29', [468, 488, 508], [487, 507, 527], 'Judy Gold'),
    ...pairs([80, 100, 120], B27, B29, [472, 492, 512], [490, 510, 530], 'Judy Gold'),
    ...pairs([80, 100], '26', null, [455, 475], null, 'Judy Silver'),
    ...pairs([80, 100, 120], '27_5', '29', [470, 490, 510], [489, 509, null], 'Judy Silver'),
    ...pairs([80, 100, 120, 130], B27, B29, [[470, 476], [490, 496], [510, 516], [520, 526]], [[490, 496], [510, 516], [530, 536], [540, 546]], 'Judy Silver'),
    ...pairs([80, 100, 120], '27_5', '29', [470, 490, 510], [489, 509, null], 'Judy'),
  ],
};
for (const [id, rows] of Object.entries(A2C)) {
  const c = byId(chassis, id);
  if (!c) throw new Error(`axle to crown target missing: ${id}`);
  c.axle_to_crown = rows;
}

// ---------- section 4 tokens, section 5 pressure bands, section 6 coil ----------
const SEVEN = [[null, 55], [55, 63], [63, 72], [72, 81], [81, 90], [90, 99], [99, null]];
const SIX = [[null, 55], [55, 63], [63, 72], [72, 81], [81, 90], [90, null]];
const FIVE = [[null, 63], [63, 72], [72, 81], [81, 90], [90, null]];
const psi = (s) => (s.startsWith('<') ? [null, +s.slice(1)] : s.endsWith('+') ? [+s.slice(0, -1), null] : s.split('-').map(Number));
const bands = (layout, cells) => {
  if (layout.length !== cells.length) throw new Error(`band count mismatch: ${cells}`);
  return layout.map(([kg_min, kg_max], i) => { const [psi_min, psi_max] = psi(cells[i]); return { kg_min, kg_max, psi_min, psi_max }; });
};
const P = {
  // seven-band
  a194: ['<75', '75-85', '85-95', '95-105', '105-115', '115-125', '125+'],
  a163: ['<55', '55-65', '65-75', '75-85', '85-95', '95-105', '105+'],
  bx180: ['<105', '105-115', '115-125', '125-135', '135-145', '145-155', '155+'],
  bx190: ['<95', '95-105', '105-115', '115-125', '125-135', '135-145', '145+'],
  d150: ['<45', '45-54', '54-62', '62-70', '70-78', '78-87', '87+'],
  d170: ['<37', '37-45', '45-54', '54-62', '62-70', '70-78', '78+'],
  z190: ['<29', '29-37', '37-46', '46-54', '54-62', '62-70', '70+'],
  l140: ['<60', '60-70', '70-80', '80-90', '90-100', '100-110', '110+'],
  l150: ['<50', '50-60', '60-70', '70-80', '80-90', '90-100', '100+'],
  p130: ['<45', '45-55', '55-65', '65-75', '75-85', '85-95', '95+'],
  r130: ['<65', '65-75', '75-85', '85-95', '95-105', '105-115', '115+'],
  y29p100: ['<85', '85-95', '95-105', '105-115', '115-125', '125-135', '135+'],
  // six-band
  s195: ['<70', '70-90', '90-105', '105-120', '120-135', '135+'],
  sid: ['<45', '45-59', '59-73', '73-87', '87-101', '101+'],
  // five-band
  f265: ['90-110', '110-125', '125-140', '140-160', '160+'],
  f205: ['50-70', '70-85', '85-100', '100-120', '120+'],
  f225: ['40-60', '60-75', '75-90', '90-105', '105+'],
};
const COIL = [
  { kg_min: null, kg_max: 63, label: 'X-Soft', colour: 'Silver' },
  { kg_min: 63, kg_max: 72, label: 'Soft', colour: 'Yellow' },
  { kg_min: 72, kg_max: 81, label: 'Medium', colour: 'Red' },
  { kg_min: 81, kg_max: 90, label: 'Firm', colour: 'Blue' },
  { kg_min: 90, kg_max: 99, label: 'X-Firm', colour: 'Black' },
];
const TIERS5 = ['ultimate_flight_attendant', 'ultimate', 'select_plus', 'select', 'base'];
const TIERS_SID = ['ultimate', 'select_plus', 'select', 'base'];

const PEND_SPRING = (hasTokens) => [
  { field: 'sag_target_pct', expected_source: 'RockShox Suspension Welcome Guide or user manual', tier: 'A' },
  { field: 'pressure_min_psi', expected_source: 'RockShox user manual', tier: 'A' },
  { field: 'negative', expected_source: 'RockShox user manual', tier: 'A' },
  ...(hasTokens ? [
    { field: 'spacer_pn', expected_source: 'RockShox spare parts catalog (Bottomless Token)', tier: 'A' },
    { field: 'spacer_volume_cc', expected_source: 'RockShox spare parts catalog (Bottomless Token)', tier: 'A' },
  ] : []),
];

/** [springId, chassisId, name, type, travel, tiers, tokens [installed, max] or null, pressure { layout, cells, max } or null, extra] */
const SPRINGS = [];
const add = (...a) => SPRINGS.push(a);
const air = (layout, cells, max, layoutName) => ({ layout, cells, max, layoutName });

for (const [t, tok, p] of [[120, [1, 6], air(SEVEN, P.a163, 194)], [130, [0, 6], air(SEVEN, P.p130, 163)], [140, [0, 5], air(SEVEN, P.p130, 163)]]) {
  // Pike 120 uses the 55-105 set at 194 max; 130-140 the 45-95 set at 163 max.
  add(`rockshox_debonair_plus_pike_${t}`, 'rockshox_pike_2023', 'DebonAir+', 'air', t, TIERS5, tok, t === 120 ? air(SEVEN, P.a163, 194) : p);
}
for (const [t, tok] of [[140, [1, 5]], [150, [0, 5]], [160, [0, 5]]]) add(`rockshox_debonair_plus_lyrik_${t}`, 'rockshox_lyrik_2023', 'DebonAir+', 'air', t, TIERS5, tok, t === 140 ? air(SEVEN, P.l140, 163) : air(SEVEN, P.l150, 163));
for (const [t, tok, cells] of [[150, [2, 5], P.d150], [160, [1, 5], P.d150], [170, [1, 4], P.d170], [180, [0, 4], P.d170], [190, [0, 4], P.z190]]) add(`rockshox_debonair_plus_zeb_${t}`, 'rockshox_zeb_2023', 'DebonAir+', 'air', t, TIERS5, tok, air(SEVEN, cells, 148));
for (const [t, tok, cells, max] of [[120, [4, 6], P.a194, 194], [130, [3, 6], P.r130, 163], [140, [2, 5], P.r130, 163], [150, [1, 4], P.a163, 163], [160, [0, 4], P.a163, 163]]) add(`rockshox_debonair_revelation_${t}`, 'rockshox_revelation_2023', 'DebonAir', 'air', t, ['rc'], tok, air(SEVEN, cells, max));
for (const [t, tok, cells, max] of [[150, [2, 5], P.a163, 163], [160, [2, 5], P.a163, 163], [170, [1, 4], P.p130, 148], [180, [0, 4], P.p130, 148]]) add(`rockshox_debonair_yari_${t}`, 'rockshox_yari_2023', 'DebonAir', 'air', t, ['rc'], tok, air(SEVEN, cells, max));
for (const [t, tok, cells, max] of [[100, [5, 7], P.y29p100, 194], [110, [5, 7], P.a194, 194], [120, [4, 7], P.a194, 194], [130, [3, 6], P.r130, 163], [140, [3, 6], P.r130, 163], [150, [2, 5], P.a163, 163], [160, [2, 5], P.a163, 163]]) add(`rockshox_debonair_yari_29plus_${t}`, 'rockshox_yari_2023', 'DebonAir (29+)', 'air', t, ['rc'], tok, air(SEVEN, cells, max));
for (const [t, tok, cells] of [[150, [2, 3], P.d150], [160, [2, 3], P.d150], [170, [1, 3], P.d170], [180, [0, 3], P.d170]]) add(`rockshox_debonair_domain_${t}`, 'rockshox_domain_2023', 'DebonAir', 'air', t, ['rc', 'r'], tok, air(SEVEN, cells, 148));
for (const [t, tok, cells] of [[180, [2, 6], P.bx180], [190, [1, 6], P.bx190], [200, [0, 6], P.bx190]]) add(`rockshox_debonair_boxxer_${t}`, 'rockshox_boxxer_2023', 'DebonAir', 'air', t, ['ultimate', 'select'], tok, air(SEVEN, cells, 200));
for (const [t, tok] of [[110, [1, 3]], [120, [0, 3]]]) add(`rockshox_debonair_sid_${t}`, 'rockshox_sid_2023', 'DebonAir', 'air', t, TIERS_SID, tok, air(SIX, P.sid, 146));
add('rockshox_debonair_sid_sl_100', 'rockshox_sid_sl_2023', 'DebonAir', 'air', 100, TIERS_SID, [0, 3], air(SIX, P.s195, 195));
for (const [t, tok] of [[100, [1, 2]], [120, [1, 2]], [130, [0, 2]], [140, [0, 2]], [150, [0, 2]], [160, [0, 2]]]) add(`rockshox_debonair_35_gold_${t}`, 'rockshox_35_2020', 'DebonAir', 'air', t, ['rl'], tok, t <= 120 ? air(SEVEN, P.a194, 194) : air(SEVEN, P.a163, 163));
const SILVER_TOKEN_NOTE = '02C section 8 conflict: page 14 shows 27.5 Boost tokens at 1 installed (100-120) and 0 (130-160), max 2; page 15 shows none on 29 Boost. Page 14 reading written; confidence lowered.';
for (const t of [100, 120, 130, 140, 150, 160]) {
  add(`rockshox_solo_air_35_silver_${t}`, 'rockshox_35_2020', 'Solo Air', 'air', t, ['tk'], t <= 120 ? [1, 2] : [0, 2], t <= 120 ? air(FIVE, P.f265, 265) : air(SIX, P.s195, 195), { confidence: 'estimated', confidence_note: SILVER_TOKEN_NOTE });
  add(`rockshox_coil_35_silver_${t}`, 'rockshox_35_2020', 'Coil', 'coil', t, ['tk', 'r'], null, null, { coil: true, confidence_note: 'Dual Position Coil option also listed: Red (Medium) at 63-72 kg, Black (X-Firm) at 90-99 kg. No spring listed over 99 kg.' });
}
for (const [t, tok] of [[100, [0, 3]], [110, [1, 4]], [120, [0, 4]]]) add(`rockshox_solo_air_reba_${t}`, 'rockshox_reba_2022', 'Solo Air', 'air', t, ['rl'], tok, air(SIX, P.s195, 195));
for (const t of [80, 100, 120, 130, 140, 150]) add(`rockshox_debonair_recon_gold_${t}`, 'rockshox_recon_2023', 'DebonAir', 'air', t, ['rl'], [0, 2], t === 80 ? air(FIVE, P.f265, 265) : t <= 120 ? air(FIVE, P.f205, 205) : air(FIVE, P.f225, 225));
for (const t of [100, 120, 130, 140, 150]) add(`rockshox_solo_air_recon_silver_${t}`, 'rockshox_recon_2023', 'Solo Air', 'air', t, ['rl'], [0, 0], air(FIVE, P.f205, 205));
for (const t of [80, 100, 120]) add(`rockshox_coil_recon_silver_${t}`, 'rockshox_recon_2023', 'Coil', 'coil', t, ['tk'], null, null, { coil: true, confidence_note: 'No spring listed over 99 kg.' });
add('rockshox_solo_air_recon_silver_26_100', 'rockshox_recon_2023', 'Solo Air (26in)', 'air', 100, ['tk'], [0, 0], air(FIVE, P.f205, 205));
for (const t of [80, 100, 120]) add(`rockshox_solo_air_judy_gold_${t}`, 'rockshox_judy_2023', 'Solo Air', 'air', t, ['rl'], [0, 0], t === 80 ? air(FIVE, P.f265, 265) : air(FIVE, P.f205, 205));
for (const t of [80, 100, 120, 130]) add(`rockshox_solo_air_judy_silver_${t}`, 'rockshox_judy_2023', 'Solo Air', 'air', t, ['tk'], [0, 0], t === 80 ? air(FIVE, P.f265, 265) : air(FIVE, P.f205, 205));
for (const t of [80, 100, 120, 130]) add(`rockshox_coil_judy_${t}`, 'rockshox_judy_2023', 'Coil', 'coil', t, ['tk'], null, null, { coil: true, confidence_note: 'Judy Silver TK and Judy TK coil. No spring listed over 99 kg.' });

const EXISTING_CHART = { rockshox_debonair_plus_pike_140: 'rockshox_pike_140_pressure', rockshox_debonair_plus_lyrik_150: 'rockshox_lyrik_150_pressure', rockshox_debonair_plus_zeb_160: 'rockshox_zeb_160_pressure' };

for (const [id, chassisId, name, type, travel, tiers, tok, pres, extra = {}] of SPRINGS) {
  let s = byId(springs, id);
  const noTokens = tok && tok[1] === 0;
  if (!s) {
    s = {
      id, brand: 'RockShox', name, type, negative: null, chassis_id: chassisId, tier_applies_to: tiers, travel_mm: travel,
      spacer_pn: null, spacer_volume_cc: null, spacer_factory: tok ? tok[0] : null, spacer_max: tok ? tok[1] : null,
      pressure_max_psi: pres ? pres.max : null, pressure_min_psi: null, sag_target_pct: null, equalise_note: null,
      ...(extra.coil ? { coil_chart: COIL } : {}),
      confidence: extra.confidence ?? 'published', ...(extra.confidence_note ? { confidence_note: extra.confidence_note } : {}),
      source: SRC,
      fields_pending: type === 'coil'
        ? [{ field: 'sag_target_pct', expected_source: 'RockShox Suspension Welcome Guide or user manual', tier: 'A' }]
        : PEND_SPRING(tok && !noTokens),
    };
    if (noTokens) s.fields_pending = s.fields_pending.filter((p) => !p.field.startsWith('spacer'));
    springs.push(s);
  } else {
    s.tier_applies_to = tiers;
    withSource(s);
  }
  if (!pres) continue;
  const chartId = EXISTING_CHART[id] ?? `${id}_pressure`;
  const chart = byId(charts, chartId);
  const body = {
    air_spring_id: id, bands: bands(pres.layout, pres.cells), basis: null, point_type: 'bracket', applies_to_travel_mm: [travel], ebike_offset_psi: 10,
    fields_pending: [{ field: 'basis', expected_source: 'RockShox user manual: chart headers give rider weight only, no mention of kit', tier: 'A' }],
  };
  if (chart) {
    // 02C section 5: the three existing charts are correct at their boundary points; re-expressed as bands.
    delete chart.points;
    Object.assign(chart, body);
    withSource(chart);
  } else charts.push({ id: chartId, ...body, confidence: 'published', source: SRC });
}

// ---------- section 2 model codes, section 7 oil -> fork units ----------
const OIL = {
  pike_lyrik_zeb: { damper_side: 'Maxima PLUSH 3wt (Flight Attendant, Select, Base) or 7wt (Ultimate, Select+), bleed', damper_lower_leg: 'Maxima PLUSH Light, 30 mL', spring_side: 'Maxima PLUSH Heavy, 3 mL positive / 1 mL negative', spring_lower_leg: 'Maxima PLUSH Light, 15 mL', grease: 'SRAM Butter or PM600' },
  boxxer: { damper_side: 'Maxima PLUSH 3wt, bleed', damper_lower_leg: 'Maxima PLUSH Light, 10 mL', spring_side: 'Maxima PLUSH Heavy, 3 mL positive / 1 mL negative', spring_lower_leg: 'Maxima PLUSH Light, 10 mL', grease: 'SRAM Butter or PM600' },
  domain: { damper_side: 'Maxima PLUSH 3wt, 235 mL, oil height 95-100 mm', damper_lower_leg: 'Maxima PLUSH Light, 10 mL', spring_side: 'Maxima PLUSH Heavy, 3 mL positive / 1 mL negative', spring_lower_leg: 'Maxima PLUSH Light, 10 mL', grease: 'RockShox Dynamic Seal Grease' },
  revelation: { damper_side: 'RockShox 5wt, 155 mL, oil height 100-106 mm', damper_lower_leg: 'Maxima PLUSH Light, 10 mL', spring_side: 'Maxima PLUSH Heavy, 3 mL positive / 1 mL negative', spring_lower_leg: 'Maxima PLUSH Light, 10 mL', grease: 'RockShox Dynamic Seal Grease' },
  yari: { damper_side: 'RockShox 5wt, 180 mL, oil height 100-106 mm', damper_lower_leg: 'Maxima PLUSH Light, 10 mL', spring_side: 'DebonAir: Maxima PLUSH Heavy, 3 mL positive / 1 mL negative', spring_lower_leg: 'Maxima PLUSH Light, 10 mL', grease: 'RockShox Dynamic Seal Grease' },
  sid: { damper_side: 'Maxima PLUSH 3wt, bleed', damper_lower_leg: 'Maxima PLUSH Heavy, 10 mL', spring_side: 'Maxima PLUSH Heavy, 3 mL positive / none negative', spring_lower_leg: 'Maxima PLUSH Heavy, 10 mL', grease: 'RockShox Dynamic Seal Grease' },
  gold35: { damper_side: 'RockShox 5wt, 170 mL, oil height 85-90 mm', damper_lower_leg: 'RockShox 15wt, 10 mL', spring_side: 'DebonAir: RockShox 5wt, 2 mL positive / none negative', spring_lower_leg: 'RockShox 15wt, 10 mL', grease: 'SRAM Butter or PM600' },
  silver35: { damper_side: 'RockShox 5wt, 210 mL, oil height 90-95 mm', damper_lower_leg: 'RockShox 15wt, 10 mL', spring_side: 'Solo Air: RockShox 5wt, 2 mL. Coil: none', spring_lower_leg: 'RockShox 15wt, 10 mL', grease: 'SRAM Butter or PM600' },
  reba: { damper_side: 'RockShox 5wt, 100 mL (100 mm) or 108 mL (110-120 mm), oil height 71-77 mm', damper_lower_leg: 'RockShox 15wt, 5 mL', spring_side: 'Solo Air: none listed', spring_lower_leg: 'RockShox 15wt, 5 mL', grease: 'SRAM Butter or PM600' },
  recon_gold: { damper_side: 'RockShox 5wt, 130 mL, oil height 80-85 mm', damper_lower_leg: 'RockShox 15wt, 6 mL', spring_side: 'DebonAir: RockShox 5wt, 2 mL', spring_lower_leg: 'RockShox 15wt, 6 mL', grease: 'SRAM Butter or PM600' },
  recon_silver_rl: { damper_side: 'RockShox 5wt: 118 mL at 100-120, 150 mL at 130-140 (oil height 80-85 mm); 140 mL on Boost (oil height 91-96 mm)', damper_lower_leg: 'RockShox 15wt, 6 mL', spring_side: 'Solo Air: RockShox 5wt, 2 mL', spring_lower_leg: 'RockShox 15wt, 6 mL', grease: 'SRAM Butter or PM600' },
  recon_silver_tk: { damper_side: 'RockShox 5wt: 118 mL (oil height 80-85 mm), 140 mL on Boost (oil height 86-91 mm), 150 mL on 26in', damper_lower_leg: 'RockShox 15wt, 6 mL', spring_side: 'Coil: none. 26in Solo Air: RockShox 5wt, 6 mL', spring_lower_leg: 'RockShox 15wt, 9 mL (coil) or 6 mL (26in)', grease: 'SRAM Butter or PM600' },
  judy_gold: { damper_side: 'RockShox 5wt, 85 mL (26) or 102 mL (27.5, 29, Boost), oil height 80-85 mm', damper_lower_leg: 'RockShox 15wt, 5 mL (non Boost) or 6 mL (Boost)', spring_side: 'RockShox 5wt, 2 mL', spring_lower_leg: 'RockShox 15wt, 10 mL (non Boost) or 6 mL (Boost)', grease: 'SRAM Butter or PM600' },
  judy_silver: { damper_side: 'RockShox 5wt, 100 mL (26), 123 mL (27.5), 122 mL (29 and Boost), oil height 80-85 mm', damper_lower_leg: 'RockShox 15wt, 5 mL or 6 mL (Boost)', spring_side: 'Solo Air: RockShox 5wt, 2 mL. Coil: none', spring_lower_leg: 'RockShox 15wt, 10 mL or 6 mL (Boost)', grease: 'SRAM Butter or PM600' },
  judy_tk: { damper_side: 'RockShox 5wt, 143 mL, oil height 80-85 mm', damper_lower_leg: 'none listed', spring_side: 'Coil: none', spring_lower_leg: 'none listed', grease: 'SRAM Butter or PM600' },
};
const D = (s) => `rockshox_${s}_2023`;
const TIER_NAME = { ultimate_flight_attendant: 'Ultimate Flight Attendant', ultimate: 'Ultimate', select_plus: 'Select+', select: 'Select', base: 'Base', rl: 'RL', tk: 'TK', r: 'R', rc: 'RC' };
const DAMPER_NAME = {
  motion_control_rl: 'Motion Control RL', motion_control_rc: 'Motion Control RC', turnkey: 'TurnKey', rebound: 'Rebound', charger_rc: 'Charger RC',
  charger_2_1_rc2: 'Charger 2.1 RC2', charger_3_rc2: 'Charger 3 RC2', charger_3_rc2_buttercup: 'Charger 3 RC2 w/ ButterCup',
  charger_flight_attendant: 'Charger Flight Attendant w/ ButterCup', rush_rc: 'Rush RC', charger_race_day: 'Charger Race Day',
  charger_2_rl: 'Charger 2 RL', charger_rl: 'Charger RL', rush_rl: 'Rush RL', zeb_base_unresolved: 'Rush RC or Charger R',
};
const FAMILY_TIERS = (fam, suffix, codes) => [
  ['ultimate_flight_attendant', `FS-${fam}-UFA-${suffix}`, 'charger_flight_attendant'],
  ['ultimate', `FS-${fam}-ULT-${suffix}`, 'charger_3_rc2_buttercup'],
  ['select_plus', `FS-${fam}-SELP-${suffix}`, 'charger_3_rc2'],
  ['select', `FS-${fam}-SEL-${suffix}`, 'charger_rc'],
  ['base', `FS-${fam}-BSE-${suffix}`, codes?.base ?? 'rush_rc'],
];
const SID_TIERS = (fam) => [
  ['ultimate', `FS-${fam}-ULT-C1`, 'charger_race_day'], ['select_plus', `FS-${fam}-SELP-C1`, 'charger_2_rl'],
  ['select', `FS-${fam}-SEL-C1`, 'charger_rl'], ['base', `FS-${fam}-BSE-C1`, 'rush_rl'],
];

/** [familySlug, familyName, chassisId, tiers [[tier, code, damper]], travels, springPrefix, oilKey, idSuffix, springLabel] */
const UNITS = [];
const u = (...a) => UNITS.push(a);
u('pike', 'Pike', 'rockshox_pike_2023', FAMILY_TIERS('PIKE', 'C1'), [120, 130, 140], 'rockshox_debonair_plus_pike_', 'pike_lyrik_zeb');
u('lyrik', 'Lyrik', 'rockshox_lyrik_2023', FAMILY_TIERS('LYRK', 'D1'), [140, 150, 160], 'rockshox_debonair_plus_lyrik_', 'pike_lyrik_zeb');
u('zeb', 'ZEB', 'rockshox_zeb_2023', FAMILY_TIERS('ZEB', 'A2', { base: 'zeb_base_unresolved' }), [150, 160, 170, 180, 190], 'rockshox_debonair_plus_zeb_', 'pike_lyrik_zeb');
u('boxxer', 'BoXXer', 'rockshox_boxxer_2023', [['ultimate', 'FS-BXR-ULT-C2', 'charger_2_1_rc2'], ['select', 'FS-BXR-SEL-C2', 'charger_rc']], [180, 190, 200], 'rockshox_debonair_boxxer_', 'boxxer');
u('domain', 'Domain', 'rockshox_domain_2023', [['rc', 'FS-DOMN-RC-B1', 'motion_control_rc'], ['r', 'FS-DOMN-R-B1', 'rebound']], [150, 160, 170, 180], 'rockshox_debonair_domain_', 'domain');
u('revelation', 'Revelation', 'rockshox_revelation_2023', [['rc', 'FS-RVL-RC-A3', 'motion_control_rc']], [120, 130, 140, 150, 160], 'rockshox_debonair_revelation_', 'revelation');
u('yari', 'Yari', 'rockshox_yari_2023', [['rc', 'FS-YARI-RC-B3', 'motion_control_rc']], [150, 160, 170, 180], 'rockshox_debonair_yari_', 'yari');
u('yari', 'Yari 29+', 'rockshox_yari_2023', [['rc', 'FS-YARI-RC-B3', 'motion_control_rc']], [100, 110, 120, 130, 140, 150, 160], 'rockshox_debonair_yari_29plus_', 'yari', '29plus');
u('sid', 'SID', 'rockshox_sid_2023', SID_TIERS('SID'), [110, 120], 'rockshox_debonair_sid_', 'sid');
u('sid_sl', 'SID SL', 'rockshox_sid_sl_2023', SID_TIERS('SIDS'), [100], 'rockshox_debonair_sid_sl_', 'sid');
u('35_gold', '35 Gold', 'rockshox_35_2020', [['rl', 'FS-35G-RL-A2', 'motion_control_rl']], [100, 120, 130, 140, 150, 160], 'rockshox_debonair_35_gold_', 'gold35');
u('35_silver', '35 Silver', 'rockshox_35_2020', [['tk', 'FS-35S-TK-A1', 'turnkey']], [100, 120, 130, 140, 150, 160], 'rockshox_solo_air_35_silver_', 'silver35', 'solo_air', 'Solo Air');
u('35_silver', '35 Silver', 'rockshox_35_2020', [['tk', 'FS-35S-TK-A1', 'turnkey'], ['r', 'FS-35S-R-A1', 'rebound']], [100, 120, 130, 140, 150, 160], 'rockshox_coil_35_silver_', 'silver35', 'coil', 'Coil');
u('reba', 'Reba', 'rockshox_reba_2022', [['rl', 'FS-Reba-RL-A9', 'motion_control_rl']], [100, 110, 120], 'rockshox_solo_air_reba_', 'reba');
u('recon_gold', 'Recon Gold', 'rockshox_recon_2023', [['rl', 'FS-RCNG-RL-C1', 'motion_control_rl']], [80, 100, 120, 130, 140, 150], 'rockshox_debonair_recon_gold_', 'recon_gold');
u('recon_silver', 'Recon Silver', 'rockshox_recon_2023', [['rl', 'FS-RCNS-RL-D1', 'motion_control_rl']], [100, 120, 130, 140, 150], 'rockshox_solo_air_recon_silver_', 'recon_silver_rl');
u('recon_silver', 'Recon Silver', 'rockshox_recon_2023', [['tk', 'FS-RCNS-TK-D1', 'turnkey']], [80, 100, 120], 'rockshox_coil_recon_silver_', 'recon_silver_tk', 'coil', 'Coil');
u('recon_silver', 'Recon Silver 26in', 'rockshox_recon_2023', [['tk', 'FS-RCNS-TK-C1', 'turnkey']], [100], 'rockshox_solo_air_recon_silver_26_', 'recon_silver_tk', '26', 'Solo Air');
u('judy_gold', 'Judy Gold', 'rockshox_judy_2023', [['rl', 'FS-JDYG-RL-A3', 'motion_control_rl']], [80, 100, 120], 'rockshox_solo_air_judy_gold_', 'judy_gold');
u('judy_silver', 'Judy Silver', 'rockshox_judy_2023', [['tk', 'FS-JDYS-TK-A3', 'turnkey']], [80, 100, 120, 130], 'rockshox_solo_air_judy_silver_', 'judy_silver', 'solo_air', 'Solo Air');
u('judy_silver', 'Judy Silver', 'rockshox_judy_2023', [['tk', 'FS-JDYS-TK-A3', 'turnkey']], [80, 100, 120, 130], 'rockshox_coil_judy_', 'judy_silver', 'coil', 'Coil');
u('judy', 'Judy', 'rockshox_judy_2023', [['tk', 'FS-JDY-TK-B1', 'turnkey']], [80, 100, 120], 'rockshox_coil_judy_', 'judy_tk');

const BUTTERCUP = new Set(['ultimate_flight_attendant', 'ultimate']);
let addedUnits = 0;
for (const [slug, famName, chassisId, tiers, travels, springPrefix, oilKey, idSuffix, springLabel] of UNITS) {
  for (const [tier, code, damper] of tiers) {
    for (const t of travels) {
      const id = `rockshox_${slug}_${tier}_${t}${idSuffix ? `_${idSuffix}` : ''}_2023`;
      if (byId(forks, id)) continue;
      const springId = `${springPrefix}${t}`;
      if (!byId(springs, springId)) throw new Error(`unit ${id} needs spring ${springId}`);
      const notes = [];
      if (BUTTERCUP.has(tier) && ['pike', 'lyrik', 'zeb'].includes(slug)) notes.push('Spring is DebonAir+ with ButterCup; token counts and pressure bands are shared with DebonAir+.');
      if (slug === 'domain' && tier === 'rc') notes.push('02C section 8: the oil table (p3) says "Motion Control", the technical specifications (p16) "Motion Control RC". Treated as the same damper.');
      const unresolved = damper === 'zeb_base_unresolved';
      if (unresolved) notes.push('02C section 8 conflict: ZEB Base damper is Rush RC in the oil table (p7) and Charger R in the technical specifications (p25). damper_id left pending until 02b settles it.');
      forks.push({
        id,
        display_name: `RockShox ${famName} ${TIER_NAME[tier]} ${t}${springLabel ? ` ${springLabel}` : ''} (${DAMPER_NAME[damper]})`,
        chassis_id: chassisId, damper_id: D(damper), air_spring_id: springId, travel_mm: t, offset_mm: null, tier, model_year: 2023,
        part_number: null, model_code: code, service_interval_h: null, oil: OIL[oilKey], known_issues: [], sa_availability: null,
        confidence: unresolved ? 'estimated' : 'published', ...(notes.length ? { confidence_note: notes.join(' ') } : {}),
        source: SRC,
        fields_pending: [
          unresolved ? { field: 'damper_id', expected_source: '02b: Rush RC (oil table p7) or Charger R (technical specifications p25)', tier: 'A' } : PENDING_02B,
          { field: 'part_number', expected_source: 'RockShox spare parts catalog', tier: 'A' },
        ],
      });
      addedUnits++;
    }
  }
}

save('chassis.json', chassis);
save('air_springs.json', springs);
save('pressure_charts.json', charts);
save('fork_units.json', forks);
console.log(JSON.stringify({ corrections, chassis: chassis.length, air_springs: springs.length, pressure_charts: charts.length, fork_units: forks.length, added_units: addedUnits }, null, 2));
