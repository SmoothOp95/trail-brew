/**
 * Closest-match stand-ins: forks and shocks that riders in South Africa ride but the dataset does not have
 * yet. Each points at the closest documented unit family, so the picker never has a gap and the Bench
 * still knows which kind of dials to talk about.
 *
 * Rules, so a stand-in can never make advice worse than "no data":
 *  - Only the adjuster layout is borrowed. Pressure charts, token limits, setting charts, coil charts and
 *    pressure maxima of the target are NOT carried over: those figures belong to the real part.
 *  - Prefer a target with fewer adjusters than the real part over one with more. Under-offering a dial is
 *    safe; offering a dial the rider does not have is exactly what this product exists to prevent.
 *  - Lockout-only budget forks map to RockShox Motion Control or TurnKey families, whose dampers are pending,
 *    so the Bench offers spring and tyre changes only.
 *  - Every stand-in is labelled "closest match" in the picker and on the Bench, with the reason.
 *
 * Mappings are judgments about adjuster layouts made at Tumi's instruction (2026-10-01), not harvested data.
 * They are replaced, not edited, when a harvest adds the real record: remove the stand-in, keep the request.
 */
export interface StandIn {
  id: string;
  kind: 'fork' | 'shock';
  brand: string;
  model: string;
  /** Travel options the rider can pick (forks). */
  travels?: number[];
  /** Model label of the target family in the catalogue, for example "FOX 34 Performance (GRIP)". */
  target: string;
  /** Spring type of the real part, when it differs from the target's. */
  spring?: 'air' | 'coil';
  reason: string;
  /** Harvest that would replace it. */
  stage: string;
}

const T_100_150 = [100, 110, 120, 130, 140, 150];
const T_120_160 = [120, 130, 140, 150, 160];

export const STAND_INS: StandIn[] = [
  // ---------- forks ----------
  {
    id: 'standin_marzocchi_bomber_z1', kind: 'fork', brand: 'Marzocchi', model: 'Bomber Z1 (air)', travels: [130, 140, 150, 160, 170],
    target: 'FOX 36 Performance (GRIP)', reason: '36 mm Marzocchi with a FOX GRIP sweep damper: the FOX 36 Performance GRIP is the same damper family.', stage: '02 batch 2',
  },
  {
    id: 'standin_marzocchi_bomber_z1_coil', kind: 'fork', brand: 'Marzocchi', model: 'Bomber Z1 Coil', travels: [150, 160, 170, 180],
    target: 'FOX 36 Performance (GRIP)', spring: 'coil', reason: '36 mm coil Marzocchi with a GRIP sweep damper: damper layout from the FOX 36 Performance GRIP; spring is coil, so no air pressure.', stage: '02 batch 2',
  },
  {
    id: 'standin_marzocchi_bomber_z2', kind: 'fork', brand: 'Marzocchi', model: 'Bomber Z2', travels: T_100_150,
    target: 'FOX 34 Rhythm (RAIL Sweep-Adjust)', reason: '34 mm Marzocchi with a RAIL sweep damper: the FOX 34 Rhythm uses the same RAIL damper.', stage: '02 batch 2',
  },
  {
    id: 'standin_marzocchi_bomber_58', kind: 'fork', brand: 'Marzocchi', model: 'Bomber 58', travels: [180, 190, 200],
    target: 'FOX 38 Performance (GRIP)', reason: 'Long-travel Marzocchi with a GRIP sweep damper: closest documented is the FOX 38 Performance GRIP.', stage: '02 batch 2',
  },
  {
    id: 'standin_xfusion_trace', kind: 'fork', brand: 'X-Fusion', model: 'Trace 36', travels: [140, 150, 160, 170],
    target: 'FOX 36 Performance (GRIP)', reason: '36 mm fork with rebound and a compression dial. Mapped to a sweep compression so no extra dials are offered.', stage: '02 batch 2',
  },
  {
    id: 'standin_xfusion_sweep_manic', kind: 'fork', brand: 'X-Fusion', model: 'Sweep / Manic', travels: T_100_150,
    target: 'FOX 34 Performance (GRIP)', reason: '34-35 mm fork with rebound and a compression dial. Mapped to a sweep compression so no extra dials are offered.', stage: '02 batch 2',
  },
  {
    id: 'standin_xfusion_velvet_slide', kind: 'fork', brand: 'X-Fusion', model: 'Velvet / Slide (lockout)', travels: [80, 100, 120, 130, 140],
    target: 'RockShox Recon Silver RL (Motion Control RL)', reason: 'Lockout fork with a rebound dial: closest family is the RockShox Recon Silver RL. Its damper data is pending, so only spring and tyre changes are offered.', stage: '02 batch 2',
  },
  {
    id: 'standin_suntour_xct_xcm', kind: 'fork', brand: 'SR Suntour', model: 'XCT / XCM (coil)', travels: [80, 100, 120],
    target: 'RockShox Judy TK (TurnKey)', spring: 'coil', reason: 'Entry coil fork with lockout and preload: closest family is the RockShox Judy TK coil. Damper data is pending, so tyre changes and set-up checks only.', stage: '02 batch 2',
  },
  {
    id: 'standin_suntour_xcr_air', kind: 'fork', brand: 'SR Suntour', model: 'XCR Air', travels: [80, 100, 120],
    target: 'RockShox Recon Silver RL (Motion Control RL)', reason: 'Air fork with lockout and rebound: closest family is the RockShox Recon Silver RL. Damper data is pending.', stage: '02 batch 2',
  },
  {
    id: 'standin_suntour_raidon', kind: 'fork', brand: 'SR Suntour', model: 'Raidon / Aion (RL)', travels: [100, 120, 130, 140, 150],
    target: 'RockShox Recon Gold RL (Motion Control RL)', reason: 'Air fork with lockout and rebound: closest family is the RockShox Recon Gold RL. Damper data is pending.', stage: '02 batch 2',
  },
  {
    id: 'standin_suntour_auron_zeron', kind: 'fork', brand: 'SR Suntour', model: 'Auron / Zeron / Durolux', travels: [140, 150, 160, 170, 180],
    target: 'FOX 36 Performance (GRIP)', reason: '35-36 mm fork with rebound and compression dials. Mapped to a sweep compression so no extra dials are offered.', stage: '02 batch 2',
  },
  {
    id: 'standin_suntour_axon', kind: 'fork', brand: 'SR Suntour', model: 'Axon', travels: [100, 110, 120],
    target: 'FOX 32 Performance (GRIP)', reason: '32-34 mm XC fork with rebound and compression: mapped to a sweep compression so no extra dials are offered.', stage: '02 batch 2',
  },
  {
    id: 'standin_rockshox_psylo_sektor', kind: 'fork', brand: 'RockShox', model: 'Psylo / Sektor (older)', travels: T_120_160,
    target: 'RockShox Revelation RC (Motion Control RC)', reason: 'Older RockShox air fork with Motion Control: closest current family is the Revelation RC. Damper data is pending.', stage: '02b',
  },

  // ---------- shocks ----------
  {
    id: 'standin_rockshox_deluxe', kind: 'shock', brand: 'RockShox', model: 'Deluxe (Select, Select+, Ultimate)',
    target: 'FOX FLOAT DPS (EVOL, 3-Position Lever)', reason: 'Rebound dial plus a compression lever: the FLOAT DPS has the same layout. Lever positions may differ (Deluxe levers are often two-position).', stage: '02b',
  },
  {
    id: 'standin_rockshox_super_deluxe_select', kind: 'shock', brand: 'RockShox', model: 'Super Deluxe Select+ (air)',
    target: 'FOX FLOAT DPS (EVOL, 3-Position Lever)', reason: 'Rebound dial plus a compression lever: closest layout is the FLOAT DPS.', stage: '02b',
  },
  {
    id: 'standin_rockshox_super_deluxe_ultimate', kind: 'shock', brand: 'RockShox', model: 'Super Deluxe Ultimate (air)',
    target: 'FOX FLOAT X', reason: 'Rebound and a low speed compression dial: closest layout is the FLOAT X. Its threshold lever is not modelled.', stage: '02b',
  },
  {
    id: 'standin_rockshox_super_deluxe_coil', kind: 'shock', brand: 'RockShox', model: 'Super Deluxe Coil',
    target: 'FOX DHX2 (Performance Elite, coil)', reason: 'Coil shock with rebound and compression: closest documented coil layout is the DHX2 Performance Elite. Select+ models may have only a lever, so check the compression dial exists.', stage: '02b',
  },
  {
    id: 'standin_rockshox_vivid_air', kind: 'shock', brand: 'RockShox', model: 'Vivid (air)',
    target: 'FOX FLOAT X2 (Performance Elite)', reason: 'Long-travel air shock with rebound and compression: mapped to the two-way FLOAT X2 Performance Elite so no high speed dials are offered.', stage: '02b',
  },
  {
    id: 'standin_rockshox_vivid_coil', kind: 'shock', brand: 'RockShox', model: 'Vivid Coil',
    target: 'FOX DHX2 (Performance Elite, coil)', reason: 'Coil shock with rebound and compression: closest documented coil layout is the DHX2 Performance Elite.', stage: '02b',
  },
  {
    id: 'standin_rockshox_monarch', kind: 'shock', brand: 'RockShox', model: 'Monarch (older)',
    target: 'FOX FLOAT DPS (EVOL, 3-Position Lever)', reason: 'Rebound dial plus a compression lever: closest layout is the FLOAT DPS.', stage: '02b',
  },
  {
    id: 'standin_marzocchi_bomber_air', kind: 'shock', brand: 'Marzocchi', model: 'Bomber Air',
    target: 'FOX FLOAT DPS (EVOL, 3-Position Lever)', reason: 'Rebound dial plus a compression lever: closest layout is the FLOAT DPS.', stage: '02 batch 2',
  },
  {
    id: 'standin_marzocchi_bomber_cr', kind: 'shock', brand: 'Marzocchi', model: 'Bomber CR (coil)',
    target: 'FOX DHX2 (Performance Elite, coil)', reason: 'Coil shock with rebound and low speed compression: closest documented coil layout is the DHX2 Performance Elite.', stage: '02 batch 2',
  },
  {
    id: 'standin_xfusion_o2', kind: 'shock', brand: 'X-Fusion', model: 'O2 Pro / Microlite',
    target: 'FOX FLOAT DPS (EVOL, 3-Position Lever)', reason: 'Rebound dial plus a lockout or platform lever: closest layout is the FLOAT DPS.', stage: '02 batch 2',
  },
  {
    id: 'standin_xfusion_h3c', kind: 'shock', brand: 'X-Fusion', model: 'H3C (coil)',
    target: 'FOX DHX2 (Performance Elite, coil)', reason: 'Coil shock with rebound and compression: closest documented coil layout is the DHX2 Performance Elite.', stage: '02 batch 2',
  },
  {
    id: 'standin_suntour_edge_raidon', kind: 'shock', brand: 'SR Suntour', model: 'Edge / Raidon / TriAir',
    target: 'FOX FLOAT DPS (EVOL, 3-Position Lever)', reason: 'Rebound dial plus a lockout or platform lever: closest layout is the FLOAT DPS.', stage: '02 batch 2',
  },
];
