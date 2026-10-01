import { useState } from 'react';
import type { GarageStep } from '../search/search';
import type { RequestEntry } from '../storage/requests';
import { useMtb } from '../ui/MtbContext';
import { Button, inputCls } from '../ui/primitives';

export interface RequestPrefill {
  kind?: RequestEntry['kind'];
  brand?: string;
  model?: string;
  query?: string | null;
  step?: GarageStep;
}

/** "We do not have this yet." Saved on the device, exportable, and read as the harvest priority list. */
export function RequestForm({ prefill, compact = false }: { prefill?: RequestPrefill; compact?: boolean }) {
  const m = useMtb();
  const [kind, setKind] = useState<RequestEntry['kind']>(prefill?.kind ?? 'fork');
  const [brand, setBrand] = useState(prefill?.brand ?? '');
  const [model, setModel] = useState(prefill?.model ?? '');
  const [year, setYear] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<RequestEntry | null>(null);

  const submit = () => {
    try {
      const y = Number(year);
      const entry = m.addRequest({
        kind, brand, model, year: year.trim() && Number.isFinite(y) ? y : null, text,
        step_reached: prefill?.step ?? 'request', query: prefill?.query ?? null,
      });
      setSaved(entry);
      setError(null);
      setBrand('');
      setModel('');
      setYear('');
      setText('');
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {!compact && (
        <p className="text-sm text-brew-text-dim">
          Tell us what you ride. Requests decide which bikes and parts get added next, so the most-asked-for go first.
        </p>
      )}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-brew-text-muted">
          What
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as RequestEntry['kind'])}>
            <option value="bike">Whole bike</option>
            <option value="fork">Fork</option>
            <option value="shock">Rear shock</option>
            <option value="other">Something else</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-brew-text-muted">
          Brand
          <input className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="RockShox" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-brew-text-muted">
          Model
          <input className={inputCls} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Pike Select+" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-brew-text-muted">
          Year
          <input className={inputCls} value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" placeholder="2024" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-brew-text-muted">
        Anything else (bike it is on, sticker text, where you ride)
        <textarea className={`${inputCls} min-h-[64px]`} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {error && <p className="text-sm text-trail-enduro">{error}</p>}
      {saved && (
        <p className="text-sm text-brew-accent">
          Saved{m.user ? '' : ' on this device'}. Thanks: {[saved.brand, saved.model].filter(Boolean).join(' ') || 'your request'} is on the list.
        </p>
      )}
      <Button type="submit">Request it</Button>
    </form>
  );
}
