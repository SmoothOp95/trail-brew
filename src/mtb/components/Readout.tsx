import { useState } from 'react';
import { formatValue } from '../engine/describe';
import { rangeStatus } from '../engine/baseline';
import type { Capability, SettingField, Settings, StartingValue } from '../engine/types';
import { ProvenanceTag, inputCls } from '../ui/primitives';

interface Props {
  rows: Capability[];
  starts: Record<SettingField, StartingValue>;
  entered: Settings;
  now: Settings;
  next: Settings;
  changed: Set<SettingField>;
  onEnter: (field: SettingField, value: number | null) => void;
}

/**
 * The baseline block: every setting the hardware has, its provenance, and the proposed value. The rider can
 * type their own current value into any row; unknown rows ask for it. Absent fields never appear.
 */
export function Readout({ rows, starts, entered, now, next, changed, onEnter }: Props) {
  const unknown = rows.filter((r) => entered[r.field] == null && starts[r.field].value == null);
  const notes = [...new Set(rows.flatMap((r) => (entered[r.field] == null ? starts[r.field].notes : [])))];
  return (
    <div>
      <div className="border-t border-white/10 mt-2">
        {rows.map((cap) => (
          <Row
            key={cap.field}
            cap={cap}
            start={starts[cap.field]}
            entered={entered[cap.field] ?? null}
            now={now[cap.field] ?? null}
            next={next[cap.field] ?? null}
            changed={changed.has(cap.field)}
            onEnter={(v) => onEnter(cap.field, v)}
          />
        ))}
      </div>
      {unknown.length > 0 && (
        <details className="mt-4 text-[12.5px] text-brew-text-dim leading-relaxed group">
          <summary className="cursor-pointer text-brew-text font-medium list-none before:content-['+_'] group-open:before:content-['–_'] before:text-brew-text-muted">
            {unknown.length} setting{unknown.length === 1 ? '' : 's'} not known yet: enter your current
          </summary>
          <ul className="space-y-1 mt-2">
            {unknown.map((r) => (
              <li key={r.field}>
                <span className="text-brew-text">{r.label}.</span> {starts[r.field].settleWith}
              </li>
            ))}
          </ul>
        </details>
      )}
      {unknown.length > 0 && (
        <p className="mt-2 text-[12px] text-brew-text-muted">Changes still work without these: they are given relative to where you are now.</p>
      )}
      {notes.length > 0 && (
        <div className="mt-4 text-[12px] text-brew-text-muted leading-relaxed">
          <p className="text-brew-text-dim font-medium mb-1">About these numbers</p>
          <ul className="list-disc ml-4 space-y-1">
            {notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ cap, start, entered, now, next, changed, onEnter }: {
  cap: Capability; start: StartingValue; entered: number | null; now: number | null; next: number | null; changed: boolean;
  onEnter: (v: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const provenance = entered != null ? 'yours' : start.value != null ? start.provenance : 'unknown';
  const showChange = changed && next != null && now != null && next !== now;
  const step = cap.field.startsWith('tyre_') ? 0.5 : 1;
  const editor =
    cap.state === 'coarse' ? (
      <select
        aria-label={`${cap.label}, your current setting`}
        className={`${inputCls} py-1`}
        value={now ?? ''}
        onChange={(e) => onEnter(e.target.value === '' ? null : Number(e.target.value))}
        onBlur={() => setEditing(false)}
        autoFocus={editing}
      >
        <option value="">not known</option>
        {cap.positions?.map((p, i) => <option key={p} value={i}>{p}</option>)}
      </select>
    ) : (
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={cap.min?.value ?? 0}
        max={cap.max?.value}
        aria-label={`${cap.label}, your current setting`}
        placeholder="enter"
        className={`${inputCls} w-24 py-1 text-right`}
        defaultValue={now ?? ''}
        autoFocus={editing}
        onBlur={(e) => {
          const raw = e.target.value.trim();
          onEnter(raw === '' ? null : Number(raw));
          setEditing(false);
        }}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    );

  const range = start.range ?? null;
  const status = rangeStatus(now, range);
  return (
    <div className={`py-2 border-b border-white/10 text-sm ${showChange ? 'bg-gradient-to-r from-brew-accent/[0.12] to-transparent' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-brew-text-dim">{cap.label}</span>
        <span className="flex items-center gap-2 font-semibold tabular-nums text-right">
          {now == null && range && !editing && <span title={`Published for ${range.forWeight}`}>{range.text}</span>}
          {editing || now == null ? (
            editor
          ) : (
            <button type="button" onClick={() => setEditing(true)} title="Edit your current setting" className="hover:underline decoration-dotted underline-offset-4">
              {showChange ? (
                <>
                  <span className="text-brew-text-muted font-normal line-through mr-1.5">{formatValue(cap.field, now, cap)}</span>
                  <span className="text-brew-accent">{formatValue(cap.field, next, cap)}</span>
                </>
              ) : (
                formatValue(cap.field, now, cap)
              )}
            </button>
          )}
          <ProvenanceTag
            provenance={range && entered == null ? start.provenance : provenance}
            title={entered == null && start.source ? start.source : undefined}
          />
        </span>
      </div>
      {range && status && (
        <p className={`mt-1 text-[11.5px] text-right ${status === 'inside' ? 'text-brew-text-muted' : 'text-trail-technical'}`}>
          {status === 'inside' ? 'Inside' : status === 'below' ? 'Below' : 'Above'} the published {range.text} for {range.forWeight}
        </p>
      )}
    </div>
  );
}
