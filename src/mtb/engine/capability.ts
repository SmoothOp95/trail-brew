import type { Adjuster, AdjusterKey } from '../data/schema/tables';
import type { BikeContext, Bound, Capability, SettingField } from './types';

const ADJ_NAMES: Record<AdjusterKey, string> = {
  lsc: 'low speed compression',
  hsc: 'high speed compression',
  lsr: 'low speed rebound',
  hsr: 'high speed rebound',
};

/** Rider-facing row labels. Matches the prototype readout where it had one. */
export const FIELD_LABELS: Record<SettingField, string> = {
  fork_psi: 'Fork air pressure',
  fork_spacers: 'Fork volume spacers',
  fork_lsr: 'Fork rebound',
  fork_hsr: 'Fork high speed rebound',
  fork_lsc: 'Fork low speed compression',
  fork_hsc: 'Fork high speed compression',
  shock_psi: 'Shock air pressure',
  shock_spacers: 'Shock volume spacers',
  shock_lsr: 'Shock rebound',
  shock_hsr: 'Shock high speed rebound',
  shock_lsc: 'Shock low speed compression',
  shock_hsc: 'Shock high speed compression',
  tyre_front: 'Front tyre',
  tyre_rear: 'Rear tyre',
  flip_chip: 'Flip chip',
};

const absent = (field: SettingField, reason: string, unit: Capability['unit'] = 'clicks'): Capability => ({
  field, state: 'absent', unit, label: FIELD_LABELS[field], reason, min: null, max: null, headroomUnknown: false,
});

/**
 * Resolve a setting field against the rider's hardware: counted, coarse or absent (01_SCHEMA v0.3,
 * 07 v0.2 Capability). Every absent reason names the hardware.
 */
export function resolveCapability(field: SettingField, bike: BikeContext): Capability {
  if (field === 'tyre_front' || field === 'tyre_rear') {
    // No tyre model in v1, so no bounds beyond zero. Never a hard-coded psi limit.
    return {
      field, state: 'counted', unit: 'psi', label: FIELD_LABELS[field],
      min: { value: 0, source: 'zero' }, max: null, headroomUnknown: false,
    };
  }
  if (field === 'flip_chip') {
    return absent(field, 'Flip chip settings need your frame on file. Bikes are added with harvest stage 3.', 'state');
  }

  const end = field.startsWith('fork_') ? 'fork' : 'shock';
  const what = field.slice(end.length + 1);

  if (end === 'shock' && bike.suspension === 'hardtail') {
    return absent(field, 'Hardtail: there is no rear shock.', what === 'psi' ? 'psi' : what === 'spacers' ? 'spacers' : 'clicks');
  }
  if (end === 'fork' && !bike.fork) return absent(field, 'No fork selected.');
  if (end === 'shock' && !bike.shock) return absent(field, 'No rear shock selected.');

  if (what === 'psi') return end === 'fork' ? forkPsi(bike) : shockPsi(bike);
  if (what === 'spacers') return end === 'fork' ? forkSpacers(bike) : shockSpacers(bike);

  const key = what as AdjusterKey;
  const damper = end === 'fork' ? bike.fork!.damper : bike.shock!.damper;
  return adjusterCapability(field, key, damper.adjusters[key], damper.name);
}

function forkPsi(bike: BikeContext): Capability {
  const s = bike.fork!.airSpring;
  if (s?.type === 'coil') return absent('fork_psi', `The ${s.name} is a coil spring, so there is no air pressure to set.`, 'psi');
  return {
    field: 'fork_psi', state: 'counted', unit: 'psi', label: FIELD_LABELS.fork_psi,
    min: s?.pressure_min_psi != null ? { value: s.pressure_min_psi, source: `${s.name} minimum pressure` } : { value: 0, source: 'zero' },
    max: s?.pressure_max_psi != null ? { value: s.pressure_max_psi, source: `${s.name} maximum pressure` } : null,
    headroomUnknown: false, owner: s?.name,
  };
}

function shockPsi(bike: BikeContext): Capability {
  const u = bike.shock!.unit;
  if (u?.air_can === 'coil') return absent('shock_psi', `The ${u.display_name} is a coil shock. Spring rate is not modelled in v1.`, 'psi');
  return {
    field: 'shock_psi', state: 'counted', unit: 'psi', label: FIELD_LABELS.shock_psi,
    min: { value: 0, source: 'zero' },
    max: u?.pressure_max_psi != null ? { value: u.pressure_max_psi, source: `${u.display_name} maximum pressure` } : null,
    headroomUnknown: false, owner: u?.display_name,
  };
}

function forkSpacers(bike: BikeContext): Capability {
  const s = bike.fork!.airSpring;
  if (s?.type === 'coil') return absent('fork_spacers', `The ${s.name} is a coil spring, so it takes no volume spacers.`, 'spacers');
  return spacerCap('fork_spacers', s?.spacer_max ?? null, s?.name ?? bike.fork!.label);
}

function shockSpacers(bike: BikeContext): Capability {
  const u = bike.shock!.unit;
  if (u?.air_can === 'coil') return absent('shock_spacers', `The ${u.display_name} is a coil shock, so it takes no volume spacers.`, 'spacers');
  return spacerCap('shock_spacers', u?.spacer_max ?? null, u?.display_name ?? bike.shock!.label);
}

function spacerCap(field: SettingField, max: number | null, owner: string): Capability {
  return {
    field, state: 'counted', unit: 'spacers', label: FIELD_LABELS[field],
    min: { value: 0, source: 'zero' },
    max: max != null ? { value: max, source: `${owner} maximum spacers` } : null,
    headroomUnknown: max == null, owner,
  };
}

function totalBound(a: { count?: number | null; count_basis?: string | null; usable_range?: [number, number] | null }, owner: string, what: string): Bound | null {
  // Only a count with a count_basis is a real total (07 v0.2). usable_range narrows it further.
  if (a.count == null || !a.count_basis) return null;
  const top = a.usable_range ? Math.min(a.usable_range[1], a.count) : a.count;
  return { value: top, source: `${owner} ${what}: ${top} clicks (${a.count_basis === 'functional_total' ? 'documented functional limit' : 'documented total'})` };
}

function adjusterCapability(field: SettingField, key: AdjusterKey, a: Adjuster | null, damperName: string): Capability {
  const name = ADJ_NAMES[key];
  if (!a) return absent(field, `No ${name} adjuster on the ${damperName} damper.`);
  if (a.type === 'lockout') {
    return absent(
      field,
      key === 'lsc' || key === 'hsc'
        ? `The ${damperName} has a lockout lever, not a compression dial. There is nothing to fine tune.`
        : `The ${damperName} ${name} control is a lockout, not a tuning adjuster.`,
    );
  }
  if (a.type === 'sweep' || a.type === 'lever') {
    const positions = a.positions ?? [];
    const sub = a.sub_adjuster && a.sub_adjuster.type === 'clicks'
      ? {
          withinIndex: positions.indexOf(a.sub_adjuster.within_position),
          withinPosition: a.sub_adjuster.within_position,
          label: a.sub_adjuster.label,
          max: totalBound(a.sub_adjuster, damperName, a.sub_adjuster.label),
          headroomUnknown: !(a.sub_adjuster.count != null && a.sub_adjuster.count_basis),
        }
      : undefined;
    return {
      field, state: 'coarse', unit: 'position', label: FIELD_LABELS[field].replace(/ low speed compression$/, ' compression'),
      positions,
      coarseNote:
        a.type === 'sweep'
          ? `${damperName} uses a sweep between ${positions.join(' and ')}, so this is a coarse move rather than counted clicks.`
          : `${positions.length} position lever only, so you are stepping between ${positions.join(', ')}.`,
      min: { value: 0, source: positions[0] ?? 'first position' },
      max: { value: Math.max(0, positions.length - 1), source: positions[positions.length - 1] ?? 'last position' },
      headroomUnknown: false, owner: damperName, sub,
    };
  }
  const max = totalBound(a, damperName, name);
  return {
    field, state: 'counted', unit: 'clicks', label: FIELD_LABELS[field],
    min: { value: a.usable_range ? a.usable_range[0] : 0, source: a.usable_range ? `${damperName} usable range` : 'fully closed/open' },
    max, headroomUnknown: max == null, direction: a.direction, owner: damperName,
  };
}
