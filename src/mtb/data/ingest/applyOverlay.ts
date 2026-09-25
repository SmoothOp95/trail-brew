import type { TableName } from '../schema/tables';
import type { Annotation, DataFlag, Overlay, RawTables } from './types';

type Rec = Record<string, unknown> & { id?: unknown; fields_pending?: unknown };

const get = (o: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((x, k) => (x && typeof x === 'object' ? (x as Record<string, unknown>)[k] : undefined), o);

/** Sets a dotted path. Returns false when an intermediate object does not exist (for example a null adjuster). */
function set(o: Rec, path: string, value: unknown): boolean {
  const keys = path.split('.');
  let cur: Record<string, unknown> = o;
  for (const k of keys.slice(0, -1)) {
    const next = cur[k];
    if (!next || typeof next !== 'object') return false;
    cur = next as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
  return true;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Applies the gap-filling overlay to a deep copy of the raw tables, before validation, so overlay values
 * are validated like any other. Each entry retires itself once the harvest supplies the value.
 */
export function applyOverlay(raw: RawTables, overlay: Overlay | undefined) {
  const annotations: Annotation[] = [];
  const flags: DataFlag[] = [];
  const out: RawTables = JSON.parse(JSON.stringify(raw));
  if (!overlay) return { raw: out, annotations, flags };

  const flag = (table: TableName, id: string, code: string, message: string) =>
    flags.push({ code, severity: 'info', table, id, message });

  for (const p of overlay.patches) {
    const rows = out[p.table];
    const rec = Array.isArray(rows) ? (rows as Rec[]).find((r) => r && r.id === p.id) : undefined;
    if (!rec) {
      flag(p.table, p.id, 'overlay_target_missing', 'overlay patch targets a record that is not in the raw data');
      continue;
    }
    const note = (path: string, original: unknown, value: unknown) =>
      annotations.push({ table: p.table, id: p.id, path, kind: 'overlay', original, value, reason: p.reason, basis: p.basis });

    for (const [path, value] of Object.entries(p.fill ?? {})) {
      const current = get(rec, path);
      if (current != null) {
        flag(p.table, p.id, 'overlay_superseded', `${path} now has a harvested value; overlay fill no longer applied`);
      } else if (set(rec, path, value)) note(path, current ?? null, value);
      else flag(p.table, p.id, 'overlay_path_missing', `cannot fill ${path}: parent does not exist`);
    }
    for (const [path, value] of Object.entries(p.override ?? {})) {
      const current = get(rec, path);
      if (p.expect && path in p.expect && !same(current, p.expect[path])) {
        flag(p.table, p.id, 'overlay_superseded', `${path} changed in the raw data; overlay override no longer applied`);
      } else if (set(rec, path, value)) note(path, current ?? null, value);
    }
    if (p.pending?.length) {
      const list = (Array.isArray(rec.fields_pending) ? rec.fields_pending : []) as { field: string }[];
      const added = p.pending.filter((x) => !list.some((l) => l.field === x.field) && get(rec, x.field) == null);
      if (added.length) {
        rec.fields_pending = [...list, ...added];
        note('fields_pending', null, added.map((a) => a.field));
      }
    }
  }

  for (const [table, entries] of Object.entries(overlay.records) as [TableName, NonNullable<Overlay['records'][TableName]>][]) {
    const rows = (Array.isArray(out[table]) ? out[table] : (out[table] = [])) as Rec[];
    for (const e of entries) {
      const id = String(e.record.id);
      if (rows.some((r) => r && r.id === id)) {
        flag(table, id, 'overlay_superseded', 'a harvested record now exists with this id; overlay record dropped');
        continue;
      }
      rows.push(JSON.parse(JSON.stringify(e.record)));
      annotations.push({ table, id, path: '(record)', kind: 'overlay', original: null, value: null, reason: e.reason, basis: e.basis });
    }
  }
  return { raw: out, annotations, flags };
}
