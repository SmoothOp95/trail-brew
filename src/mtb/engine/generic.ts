import type { Adjuster, AirSpring, Chassis, Damper, ShockUnit } from '../data/schema/tables';
import type { GenericDials } from './bike';
import type { ResolvedFork, ResolvedShock } from './types';

/**
 * The rider's own fork or shock, known only by travel. No brand or model is picked, so nothing is read
 * from the dataset: rebound and low speed compression are offered as unbounded clicks, and the high speed
 * dials only when the rider says the part has them. No pressure, token or setting figure is assumed.
 * Starting values are unknown until the rider enters them.
 */
const SOURCE = { url: 'rider', document: 'Entered by the rider', retrieved: 'n/a', method: 'manual_entry' as const };
const NOTE = 'Generic part: the rider gave travel only.';

const clicks = (direction: Adjuster['direction']): Adjuster => ({ type: 'clicks', count: null, count_basis: null, positions: null, detented: true, direction });
const adjusters = (d: GenericDials = {}) => ({
  lsr: clicks('cw_slower'),
  lsc: clicks('cw_firmer'),
  hsr: d.hsr ? clicks('cw_slower') : null,
  hsc: d.hsc ? clicks('cw_firmer') : null,
});

const travelText = (t: number | null) => (t == null ? '' : `, ${t} mm`);

export function genericFork(travel: number | null, dials?: GenericDials): ResolvedFork {
  const chassis: Chassis = {
    id: 'generic_fork', confidence: 'estimated', confidence_note: NOTE, source: SOURCE,
    brand: 'Your', model: 'fork', stanchion_mm: null, travel_options_mm: travel == null ? null : [travel], axle_std: null,
    offset_options_mm: null, steerer: null, wheel_sizes: null, max_rotor_mm: null, brake_mount: null, year_range: null,
  };
  const damper: Damper = {
    id: 'generic_fork_damper', confidence: 'estimated', confidence_note: NOTE, source: SOURCE,
    brand: 'Your', name: 'fork damper', tier: 'generic', type: 'fork', adjusters: adjusters(dials), year_range: null,
  };
  const airSpring: AirSpring = {
    id: 'generic_fork_air', confidence: 'estimated', confidence_note: NOTE, source: SOURCE,
    brand: 'Your', name: 'fork air spring', type: 'air', negative: null, chassis_id: chassis.id, travel_mm: travel ?? 0,
    spacer_pn: null, spacer_volume_cc: null, spacer_factory: null, spacer_max: null, pressure_max_psi: null, pressure_min_psi: null,
    sag_target_pct: null, equalise_note: null,
  };
  return {
    unit: null, label: `Fork${travelText(travel)}`, chassis, damper, pendingDamper: null, airSpring,
    pressureChart: null, settingCharts: [], standIn: null, generic: { travel },
  };
}

export function genericShock(travel: number | null, dials?: GenericDials): ResolvedShock {
  const damper: Damper = {
    id: 'generic_shock_damper', confidence: 'estimated', confidence_note: NOTE, source: SOURCE,
    brand: 'Your', name: 'shock damper', tier: 'generic', type: 'shock', adjusters: adjusters(dials), year_range: null,
  };
  const unit: ShockUnit = {
    id: 'generic_shock', confidence: 'estimated', confidence_note: NOTE, source: SOURCE,
    display_name: 'rear shock', brand: 'Your', model: 'rear shock', tier: 'generic', model_year: 0, damper_id: damper.id,
    mount: null, sizes: [], air_can: 'standard', spacer_pn: null, spacer_volume_cc: null, spacer_factory: null, spacer_max: null,
    sag_target_pct: null, pressure_max_psi: null, service_interval_h: null, oem_tune: null, part_number: null, sa_availability: null,
  };
  return { unit, label: `Rear shock${travelText(travel)}`, damper, pendingDamper: null, settingCharts: [], standIn: null, generic: { travel } };
}
