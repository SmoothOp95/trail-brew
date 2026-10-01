import type { Change } from './goals';
import type { Capability, SettingField } from './types';

const isRebound = (f: SettingField) => /_(lsr|hsr)$/.test(f);
const isCompression = (f: SettingField) => /_(lsc|hsc)$/.test(f);

function turn(cap: Capability, faster: boolean): string {
  // Rebound values count from fully closed, so a positive delta opens it (faster).
  // Compression values count from fully open, so a positive delta closes it (firmer).
  const dir = cap.direction;
  if (!dir) return '';
  if (dir === 'cw_slower' || dir === 'ccw_slower') {
    const slowerCw = dir === 'cw_slower';
    return faster === slowerCw ? 'anticlockwise' : 'clockwise';
  }
  const firmerCw = dir === 'cw_firmer';
  return faster === firmerCw ? 'clockwise' : 'anticlockwise';
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function formatValue(field: SettingField, v: number | null, cap: Capability): string {
  if (v == null) return 'not known';
  if (cap.state === 'coarse') return cap.positions?.[v] ?? `position ${v + 1}`;
  if (field.startsWith('tyre_')) return `${v.toFixed(1)} psi`;
  if (cap.unit === 'psi') return `${v} psi`;
  if (cap.unit === 'spacers') return plural(v, 'spacer');
  if (isRebound(field)) return `${plural(v, 'click')} from closed`;
  if (isCompression(field)) return `${plural(v, 'click')} from open`;
  return String(v);
}

/**
 * The move, in words a rider can follow at the bike. A positive rebound delta always reads as opening
 * or speeding up, never slowing down (05 §10). Never renders a denominator.
 */
export function describeMove(c: Change): string {
  const cap = c.capability;
  const n = Math.abs(c.delta);
  if (c.state === 'coarse' && !c.subAdjuster) {
    const toward = c.delta > 0 ? cap.positions?.[cap.positions.length - 1] : cap.positions?.[0];
    if (c.from != null && c.to != null) {
      if (c.to === c.from) return `Already at ${formatValue(c.field, c.to, cap)}`;
      return `${formatValue(c.field, c.from, cap)} to ${formatValue(c.field, c.to, cap)}`;
    }
    return `Move toward ${toward ?? (c.delta > 0 ? 'firm' : 'open')}`;
  }
  if (c.unit === 'psi') {
    const s = `${c.delta > 0 ? 'Add' : 'Remove'} ${c.field.startsWith('tyre_') ? n.toFixed(1) : n} psi`;
    return c.from != null && c.to != null ? `${formatValue(c.field, c.from, cap)} to ${formatValue(c.field, c.to, cap)}` : `${s} from your current`;
  }
  if (c.unit === 'spacers') {
    const s = `${c.delta > 0 ? 'Add' : 'Remove'} ${plural(n, 'spacer')}`;
    return c.from != null && c.to != null ? `${formatValue(c.field, c.from, cap)} to ${formatValue(c.field, c.to, cap)}` : `${s} from your current`;
  }
  const faster = c.delta > 0;
  let verb: string;
  if (isRebound(c.field)) verb = faster ? 'Open' : 'Close';
  else verb = faster ? 'Firm up' : 'Open';
  const quality = isRebound(c.field) ? (faster ? 'faster' : 'slower') : faster ? 'firmer' : 'softer';
  const how = `${verb} ${plural(n, 'click')} ${turn(cap, faster)}`.trim() + ` (${quality})`;
  if (c.subAdjuster) return `${how} on ${c.subAdjuster}`;
  return c.from != null && c.to != null ? `${how}: ${formatValue(c.field, c.from, cap)} to ${formatValue(c.field, c.to, cap)}` : `${how} from your current`;
}
