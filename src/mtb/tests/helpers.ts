import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ingest } from '../data/ingest/ingest';
import { OVERLAY } from '../data/overlay/overlay';
import { TABLES, TABLE_NAMES } from '../data/schema/tables';
import type { DataIndex, RawTables } from '../data/ingest/types';

export function loadRaw(): RawTables {
  const raw: RawTables = {};
  for (const t of TABLE_NAMES) {
    try {
      raw[t] = JSON.parse(readFileSync(join(__dirname, '../data/raw', TABLES[t].file), 'utf8'));
    } catch {
      /* file absent */
    }
  }
  return raw;
}

/** The index the app ships: raw harvest plus overlay. */
export function realIndex(): DataIndex {
  return ingest(loadRaw(), OVERLAY).index;
}

/**
 * Real index plus invented test-only records (never bundled): a RockShox 35 Gold RL with Motion Control
 * and a FOX unit with a part number. Replaced by real records as harvest stages land.
 */
export function fixtureIndex(): DataIndex {
  const raw = loadRaw();
  const source = { url: 'fixture://tests', document: 'test fixture', retrieved: '2026-09-25', method: 'manual_entry' };
  raw.dampers = [
    ...(raw.dampers as unknown[]),
    {
      id: 'fixture_motion_control_rl', brand: 'RockShox', name: 'Motion Control RL', tier: 'base', type: 'fork',
      adjusters: {
        lsc: { type: 'lockout', count: null, positions: ['open', 'locked'], detented: true, direction: 'cw_firmer' },
        hsc: null,
        lsr: { type: 'clicks', count: 10, count_basis: 'stated_total', positions: null, detented: true, direction: 'cw_slower' },
        hsr: null,
      },
      year_range: [2020, 2022], confidence: 'estimated', confidence_note: 'test fixture', source,
    },
    {
      id: 'fixture_counted_damper', brand: 'FOX', name: 'Fixture Counted', tier: 'factory', type: 'fork',
      adjusters: {
        lsc: { type: 'clicks', count: 16, count_basis: 'stated_total', positions: null, detented: true, direction: 'cw_firmer' },
        hsc: null,
        lsr: { type: 'clicks', count: 20, count_basis: 'stated_total', positions: null, detented: true, direction: 'cw_slower' },
        hsr: null,
      },
      year_range: [2024, 2024], confidence: 'estimated', confidence_note: 'test fixture', source,
    },
  ];
  raw.fork_units = [
    ...(raw.fork_units as unknown[]),
    {
      id: 'fixture_fox_36_part_numbered', display_name: 'FOX 36 Factory 150 (fixture with part number)', chassis_id: 'fox_36_2024',
      damper_id: 'fox_grip2_2024', air_spring_id: 'fox_float_evol_36_2024', travel_mm: 150, offset_mm: 44, tier: 'factory',
      model_year: 2024, part_number: '910-26-821', service_interval_h: null, oil: null, known_issues: [], sa_availability: null,
      confidence: 'estimated', confidence_note: 'test fixture', source,
    },
  ];
  return ingest(raw, OVERLAY).index;
}
