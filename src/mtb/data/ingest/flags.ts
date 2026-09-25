import { ADJUSTER_KEYS, type TableRecords } from '../schema/tables';
import type { DataFlag } from './types';

const LB_PER_KG = 2.20462;

/**
 * Data-quality flags: records that validate but carry something a reviewer should know about.
 * Detected from the data itself so they clear automatically when a harvest pass fixes the record.
 */
export function detectFlags(v: TableRecords): DataFlag[] {
  const flags: DataFlag[] = [];

  for (const d of v.dampers) {
    const adj = ADJUSTER_KEYS.map((k) => d.adjusters[k]).filter((a) => a != null);
    const note = d.confidence_note ?? '';

    // A lever the manual describes, but no adjuster slot models (FLOAT X climb lever).
    // Sweep, lever and lockout all express a position control, so only an all-clicks damper is missing it.
    if (/\b\d-position lever\b/i.test(note) && adj.every((a) => a.type === 'clicks')) {
      flags.push({
        code: 'lever_not_modelled', severity: 'warning', table: 'dampers', id: d.id,
        message: 'The note describes a position lever that no adjuster models, so the engine cannot offer it',
      });
    }
    // A nested fine adjuster described in the note but not written as sub_adjuster (FIT4 Open Mode Adjust).
    if (/open mode adjust/i.test(note) && !adj.some((a) => a.sub_adjuster)) {
      flags.push({
        code: 'sub_adjuster_not_modelled', severity: 'warning', table: 'dampers', id: d.id,
        message: 'Open Mode Adjust is described in the note but not modelled as a v0.3 sub_adjuster',
      });
    }
    if (d.type === 'shock' && d.adjusters.lsr == null) {
      flags.push({
        code: 'shock_without_rebound', severity: 'warning', table: 'dampers', id: d.id,
        message: 'Shock with no rebound adjuster recorded. Unusual; rebound advice will be ruled out for it',
      });
    }
  }

  for (const c of v.pressure_charts) {
    const kgs = c.points.map((p) => p[0]);
    const looksLb = kgs.length >= 5 && kgs.every((kg) => Math.abs(kg * LB_PER_KG - Math.round((kg * LB_PER_KG) / 10) * 10) <= 1.2);
    if (looksLb && !/\blb|pound/i.test(c.confidence_note ?? '')) {
      const lo = Math.round((kgs[0] * LB_PER_KG) / 10) * 10;
      const hi = Math.round((kgs[kgs.length - 1] * LB_PER_KG) / 10) * 10;
      flags.push({
        code: 'converted_from_lb', severity: 'warning', table: 'pressure_charts', id: c.id,
        message: `kg points match ${lo}-${hi} lb in 10 lb steps, with no conversion note`,
      });
    }
    if (c.basis == null) {
      flags.push({
        code: 'basis_unknown', severity: 'warning', table: 'pressure_charts', id: c.id,
        message: 'basis is null: unknown whether the weight column is rider only or rider in kit',
      });
    }
    if (c.point_type == null) {
      flags.push({
        code: 'point_type_absent', severity: 'info', table: 'pressure_charts', id: c.id,
        message: 'point_type absent, read as a curve',
      });
    }
  }

  for (const [table, rows] of [['air_springs', v.air_springs], ['shock_units', v.shock_units]] as const) {
    for (const r of rows) {
      const sag = r.sag_target_pct;
      if (sag && sag[0] === sag[1]) {
        flags.push({
          code: 'single_value_sag', severity: 'info', table, id: r.id,
          message: `sag target is a single value [${sag[0]}, ${sag[1]}], allowed since v0.3`,
        });
      }
    }
  }

  // Records marked estimated for missing or unrecorded fields rather than for an assumed value.
  // v0.3 fields_pending and count_basis now express those gaps, so the record-level downgrade overstates doubt.
  const tables = [
    ['chassis', v.chassis], ['dampers', v.dampers], ['air_springs', v.air_springs],
    ['fork_units', v.fork_units], ['shock_units', v.shock_units],
  ] as const;
  const notes = new Map<string, string>();
  for (const [, rows] of tables) for (const r of rows) notes.set(r.id, r.confidence_note ?? '');
  // "Same basis/caveats as fox_36_2024" inherits that record's note.
  const resolveNote = (note: string) => {
    const ref = /same (?:basis|caveats|correction)[^.]*? as ([a-z0-9_]+)/i.exec(note)?.[1];
    return ref && notes.has(ref) ? `${notes.get(ref)} ${note}` : note;
  };
  for (const [table, rows] of tables) {
    for (const r of rows) {
      if (r.confidence !== 'estimated') continue;
      // "left null rather than guessed" reports a gap, not an assumption, so drop negated phrases first.
      const note = resolveNote(r.confidence_note ?? '').replace(/(rather than|not) (guessed|assumed|inventing)[^.,;]*/gi, '');
      const assumed = /convention|assum|not rockshox-sourced|guess/i.test(note);
      const gapOnly = /needs_physical_count|left null|pending|\[30,30\]|single-value|not extractable/i.test(note);
      flags.push(
        assumed || !gapOnly
          ? { code: 'estimated', severity: 'info', table, id: r.id, message: 'estimated: contains an assumed value (see note)' }
          : {
              code: 'estimated_downgrade', severity: 'warning', table, id: r.id,
              message: 'Whole record marked estimated for missing counts or fields, not for an assumed value. Riders will see a low-confidence warning on documented hardware',
            },
      );
    }
  }

  // Records nothing selectable refers to.
  const usedDampers = new Set([...v.fork_units, ...v.shock_units].map((u) => u.damper_id));
  const usedSprings = new Set(v.fork_units.map((u) => u.air_spring_id));
  const usedChassis = new Set(v.fork_units.map((u) => u.chassis_id));
  for (const d of v.dampers) {
    if (!usedDampers.has(d.id)) {
      flags.push({ code: 'unused', severity: 'info', table: 'dampers', id: d.id, message: 'no fork or shock unit uses this damper, so riders cannot select it' });
    }
  }
  for (const s of v.air_springs) {
    if (!usedSprings.has(s.id)) {
      flags.push({ code: 'unused', severity: 'info', table: 'air_springs', id: s.id, message: 'no fork unit uses this air spring' });
    }
  }
  for (const c of v.chassis) {
    if (!usedChassis.has(c.id)) {
      flags.push({ code: 'unused', severity: 'info', table: 'chassis', id: c.id, message: 'no fork unit uses this chassis' });
    }
  }

  return flags;
}
