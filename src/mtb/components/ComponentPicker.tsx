import { useMemo } from 'react';
import type { ForkSpec, ShockSpec } from '../engine/bike';
import { brandRank, findOption, type CatalogueModel, type EntryStatus } from '../search/catalogue';
import { inputCls } from '../ui/primitives';

const STATUS_LABEL: Record<EntryStatus, string> = { on_file: '', estimate: ' · estimate', pending: ' · damper pending', closest: ' · closest match' };

export function StatusTag({ status }: { status: EntryStatus }) {
  if (status === 'on_file') return null;
  const cls = {
    estimate: 'text-trail-technical border-trail-technical/40',
    pending: 'text-trail-xc border-trail-xc/40',
    closest: 'text-trail-enduro border-trail-enduro/40',
  }[status];
  const text = { estimate: 'estimate', pending: 'damper pending', closest: 'closest match' }[status];
  return <span className={`inline-flex font-mono text-[9.5px] uppercase tracking-wider border rounded px-1.5 py-[1px] leading-4 ${cls}`}>{text}</span>;
}

/**
 * Brand, then model, then travel. Every combination the picker offers resolves on the Bench: documented
 * parts first, then estimates, pending dampers and closest matches, each labelled.
 */
export function ComponentPicker<S extends ForkSpec | ShockSpec>({
  label, models, value, onChange,
}: { label: string; models: CatalogueModel<S>[]; value: S | null; onChange: (spec: S) => void }) {
  const current = useMemo(() => findOption(models, value), [models, value]);
  const brands = useMemo(() => [...new Set(models.map((m) => m.brand))].sort((a, b) => brandRank(a) - brandRank(b) || a.localeCompare(b)), [models]);
  const brand = current?.model.brand ?? brands[0];
  const inBrand = models.filter((m) => m.brand === brand);
  const model = current?.model ?? null;
  const showTravel = !!model && model.options.length > 1;

  const pickModel = (m: CatalogueModel<S>) => {
    // Keep the travel the rider had, or the nearest the new model offers.
    const t = current?.option.travel ?? null;
    const opt = t == null ? m.options.find((o) => o.exact) ?? m.options[0] : [...m.options].sort((a, b) => Math.abs((a.travel ?? 0) - t) - Math.abs((b.travel ?? 0) - t))[0];
    onChange(opt.spec);
  };

  return (
    <fieldset className="flex flex-col gap-1 min-w-0">
      <legend className="text-xs text-brew-text-muted mb-1">{label}</legend>
      <div className="flex flex-wrap gap-1.5 items-center">
        <select
          aria-label={`${label} brand`}
          className={`${inputCls} max-w-[130px]`}
          value={brand}
          onChange={(e) => {
            const first = models.find((m) => m.brand === e.target.value);
            if (first) pickModel(first);
          }}
        >
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select
          aria-label={`${label} model`}
          className={`${inputCls} max-w-[340px]`}
          value={model?.key ?? ''}
          onChange={(e) => {
            const m = inBrand.find((x) => x.key === e.target.value);
            if (m) pickModel(m);
          }}
        >
          {!model && <option value="">Choose</option>}
          {inBrand.map((m) => <option key={m.key} value={m.key}>{m.model}{STATUS_LABEL[m.status]}</option>)}
        </select>
        {showTravel && (
          <select
            aria-label={`${label} travel`}
            className={`${inputCls} w-auto`}
            value={String(current?.option.travel ?? '')}
            onChange={(e) => {
              const o = model!.options.find((x) => String(x.travel) === e.target.value);
              if (o) onChange(o.spec);
            }}
          >
            {model!.options.map((o) => (
              <option key={String(o.travel)} value={String(o.travel)}>
                {o.travel} mm{o.note ? ` (${o.note})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>
    </fieldset>
  );
}
