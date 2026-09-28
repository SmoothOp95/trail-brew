import type { DeferredItem } from './ingest/types';

/**
 * Damper ids reserved by 02C_ROCKSHOX_FRONT_SPEC_2023.md section 2 and produced by 02B_HARVEST_ROCKSHOX.md.
 * Fork units point at these before the damper records exist; under the pending damper rule (02C section 10)
 * they stay selectable and their adjusters resolve `pending`. This map only supplies rider-facing names.
 */
export const RESERVED_DAMPERS: Record<string, { name: string; note?: string }> = {
  rockshox_motion_control_rl_2023: { name: 'Motion Control RL', note: 'Judy Gold, Recon, Reba and 35 Gold: most SA bikes under R40k' },
  rockshox_motion_control_rc_2023: { name: 'Motion Control RC' },
  rockshox_turnkey_2023: { name: 'TurnKey' },
  rockshox_rebound_2023: { name: 'Rebound' },
  rockshox_charger_rc_2023: { name: 'Charger RC' },
  rockshox_charger_2_1_rc2_2023: { name: 'Charger 2.1 RC2' },
  rockshox_charger_3_rc2_2023: { name: 'Charger 3 RC2' },
  rockshox_charger_3_rc2_buttercup_2023: { name: 'Charger 3 RC2 with ButterCup' },
  rockshox_charger_flight_attendant_2023: { name: 'Charger Flight Attendant', note: 'electronically controlled; may not fit the adjuster object' },
  rockshox_rush_rc_2023: { name: 'Rush RC' },
  rockshox_charger_r_2023: { name: 'Charger R' },
  rockshox_charger_race_day_2023: { name: 'Charger Race Day' },
  rockshox_charger_2_rl_2023: { name: 'Charger 2 RL' },
  rockshox_charger_rl_2023: { name: 'Charger RL' },
  rockshox_rush_rl_2023: { name: 'Rush RL' },
  /** 02C section 8: the spec sheet says Rush RC on page 7 and Charger R on page 25. 02b settles it. */
  rockshox_zeb_base_unresolved_2023: { name: 'Rush RC or Charger R (source conflict)' },
};

/** 02C section 9: in the source document but out of scope for v1. Listed in coverage, never omitted silently. */
export const DEFERRED: DeferredItem[] = [
  { item: 'RockShox Paragon Gold', reason: 'Gravel, 700c' },
  { item: 'RockShox Rudy XPLR', reason: 'Gravel, 700c' },
  { item: 'RockShox Pike DJ', reason: 'Dirt jump' },
  { item: 'RockShox Reba 26 (FS-Reba-26-A2)', reason: 'Weight bands run from under 27 kg to 54 kg: junior sizing' },
  { item: 'RockShox Dual Position Air on Yari and ZEB', reason: 'Charts marked "featured on E-MTB models only"; e-MTB is deferred' },
  { item: 'E-Bikes add 10 psi', reason: 'Captured as ebike_offset_psi on each chart, not applied in v1' },
];
