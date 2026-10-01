import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { BikeSpec, ForkSpec, ShockSpec } from '../engine/bike';
import type { SuspensionType } from '../engine/types';
import {
  manualAirSprings,
  manualChassis,
  manualDampers,
  manualGap,
  matchIdentifier,
  searchBikes,
  searchComponents,
  type GarageStep,
} from '../search/search';
import type { GarageBike } from '../storage/garage';
import { RequestForm, type RequestPrefill } from '../components/RequestForm';
import { StatusTag } from '../components/ComponentPicker';
import { forkCatalogue, searchCatalogue, shockCatalogue, type CatalogueModel, type EntryStatus } from '../search/catalogue';
import { useMtb } from '../ui/MtbContext';
import { Button, EmptyNotice, Section, inputCls } from '../ui/primitives';

interface Picked<T> {
  spec: T;
  label: string;
  via: GarageBike['found_via'];
  status: EntryStatus;
}

/**
 * Garage: from "I have a bike" to Bench by the shortest path the data allows, degrading through bike search,
 * component search, identifier match, manual pick and Request. No step ends silently.
 */
export function Garage() {
  const m = useMtb();
  const navigate = useNavigate();
  const [suspension, setSuspension] = useState<SuspensionType>('full_suspension');
  const [fork, setFork] = useState<Picked<ForkSpec> | null>(null);
  const [shock, setShock] = useState<Picked<ShockSpec> | null>(null);
  const [name, setName] = useState('');
  const [request, setRequest] = useState<RequestPrefill>({ step: 'request' });
  const requestRef = useRef<HTMLDivElement>(null);

  const askFor = (p: RequestPrefill) => {
    setRequest(p);
    requestRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const spec: BikeSpec | null = fork ? { suspension, fork: fork.spec, shock: suspension === 'hardtail' ? null : shock?.spec ?? null } : null;
  const found_via = fork?.via ?? 'manual';

  const pick: OnPick = (kind, spec, label, via, status) => {
    if (kind === 'fork') setFork({ spec: spec as ForkSpec, label, via, status });
    else setShock({ spec: spec as ShockSpec, label, via, status });
  };

  return (
    <div className="max-w-4xl">
      <header className="pt-2 pb-5 border-b border-white/20 mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight">Garage</h1>
        <p className="text-sm text-brew-text-dim mt-1 max-w-[60ch]">
          Find your fork and shock so the Bench only suggests changes your hardware can make. Start at the top; each step falls back to the next.
        </p>
      </header>

      <SavedBikes />

      <Section letter="1" title="Search for your bike" hint="brand, model, year">
        <BikeSearch />
      </Section>

      <Section letter="2" title="Search for your fork and shock" hint="brand, model, travel, tier">
        <ComponentSearch onPick={pick} onRequest={askFor} hardtail={suspension === 'hardtail'} />
      </Section>

      <Section letter="3" title="Match the part number on the sticker" hint="fork leg or shock body">
        <IdentifierSearch onPick={pick} onRequest={askFor} />
      </Section>

      <Section letter="4" title="Pick the parts by hand" hint="always available">
        <ManualPick onFork={setFork} onShock={setShock} onRequest={askFor} hardtail={suspension === 'hardtail'} />
      </Section>

      <div ref={requestRef}>
        <Section letter="5" title="Not here? Ask for it" hint="this is how the list gets built">
          <RequestForm key={JSON.stringify(request)} prefill={request} />
        </Section>
      </div>

      <div className="sticky bottom-0 -mx-5 px-5 py-4 bg-brew-bg/95 backdrop-blur border-t border-white/10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <select className={`${inputCls} py-1`} value={suspension} onChange={(e) => setSuspension(e.target.value as SuspensionType)} aria-label="Bike type">
                <option value="full_suspension">Full suspension</option>
                <option value="hardtail">Hardtail</option>
              </select>
              <span className="text-brew-text-dim">Fork:</span> <span>{fork?.label ?? 'none picked'}</span>
              {fork && <StatusTag status={fork.status} />}
              {suspension === 'full_suspension' && (
                <>
                  <span className="text-brew-text-dim ml-2">Shock:</span> <span>{shock?.label ?? 'none picked'}</span>
                  {shock && <StatusTag status={shock.status} />}
                </>
              )}
            </div>
          </div>
          <Button
            disabled={!spec}
            onClick={() => {
              if (!spec) return;
              m.openOnBench(spec);
              navigate('/mtb-dashboard');
            }}
          >
            Open on Bench
          </Button>
          {m.user ? (
            <span className="flex items-center gap-2">
              <input className={`${inputCls} w-40`} placeholder="Name, e.g. Trance" value={name} onChange={(e) => setName(e.target.value)} aria-label="Bike name" />
              <Button
                variant="ghost"
                disabled={!spec}
                onClick={() => {
                  if (!spec) return;
                  const saved = m.saveBike({ name: name.trim() || fork!.label, spec, entered: {}, found_via });
                  if (saved) {
                    m.openOnBench(saved.spec, { garageKey: saved.key });
                    navigate('/mtb-dashboard');
                  }
                }}
              >
                Save to Garage
              </Button>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xs text-brew-text-dim">
              Sign in to save bikes <m.SignIn className="text-[11px] py-1.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SavedBikes() {
  const m = useMtb();
  const navigate = useNavigate();
  if (m.user === undefined) return null;
  return (
    <Section title="Your bikes" hint={m.user ? `${m.bikes.length} saved` : 'sign in to save'}>
      {!m.user ? (
        <div className="flex flex-wrap items-center gap-3 text-sm text-brew-text-dim">
          <span>The Bench works without an account. Sign in to save bikes and keep your session log on this device.</span>
          <m.SignIn className="text-[11px] py-1.5" />
        </div>
      ) : (
        <div className="space-y-2">
          {m.bikes.length === 0 && <p className="text-sm text-brew-text-muted">No bikes saved yet. Find your parts below.</p>}
          {m.bikes.map((b) => (
            <div key={b.key} className="flex flex-wrap items-center gap-3 bg-brew-card border border-white/10 rounded-md px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{b.name}</div>
                <div className="text-xs text-brew-text-dim">{b.spec.suspension === 'hardtail' ? 'Hardtail' : 'Full suspension'} · saved {b.saved_at.slice(0, 10)}</div>
              </div>
              <Button variant="ghost" onClick={() => { m.openOnBench(b.spec, { entered: b.entered, garageKey: b.key }); navigate('/mtb-dashboard'); }}>
                Open on Bench
              </Button>
              {m.bikeKey === b.key && (
                <Button variant="ghost" onClick={() => m.saveBike({ ...b, entered: m.bench.entered })} title="Save the settings currently on the Bench to this bike">
                  Save Bench settings
                </Button>
              )}
              <Button variant="quiet" onClick={() => m.removeBike(b.key)}>Remove</Button>
            </div>
          ))}
          {!m.activeBike && (
            <Button
              variant="ghost"
              onClick={() => m.saveBike({ name: 'Bike on the Bench', spec: m.spec, entered: m.bench.entered, found_via: 'component_search' })}
            >
              Save the bike on the Bench with its settings
            </Button>
          )}
        </div>
      )}
    </Section>
  );
}

function BikeSearch() {
  const [q, setQ] = useState('');
  const [ran, setRan] = useState(false);
  const r = searchBikes(q);
  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setRan(true); }}>
        <input className={`${inputCls} flex-1`} placeholder="e.g. Trek Fuel EX 2024" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Bike search" />
        <Button type="submit" variant="ghost">Search</Button>
      </form>
      {ran && r.empty && <EmptyNotice reason={r.empty} />}
    </div>
  );
}

type OnPick = (kind: 'fork' | 'shock', spec: ForkSpec | ShockSpec, label: string, via: GarageBike['found_via'], status: EntryStatus) => void;

function ComponentSearch({ onPick, onRequest, hardtail }: { onPick: OnPick; onRequest: (p: RequestPrefill) => void; hardtail: boolean }) {
  return (
    <div className={`grid gap-6 ${hardtail ? '' : 'md:grid-cols-2'}`}>
      <ComponentColumn kind="fork" onPick={onPick} onRequest={onRequest} />
      {!hardtail && <ComponentColumn kind="shock" onPick={onPick} onRequest={onRequest} />}
    </div>
  );
}

/** One catalogue model per row, with its travels as chips. Covers on-file parts, pending dampers and closest matches. */
function ComponentColumn({ kind, onPick, onRequest }: { kind: 'fork' | 'shock'; onPick: OnPick; onRequest: (p: RequestPrefill) => void }) {
  const m = useMtb();
  const [q, setQ] = useState('');
  const models = useMemo(() => (kind === 'fork' ? forkCatalogue(m.index) : shockCatalogue(m.index)) as CatalogueModel[], [m.index, kind]);
  const results = useMemo(() => (q.trim() ? searchCatalogue(models, q) : []), [models, q]);
  const empty = q.trim() && !results.length ? searchComponents(m.index, kind, q).empty : null;
  return (
    <div className="space-y-2">
      <input className={`${inputCls} w-full`} placeholder={kind === 'fork' ? 'Fork, e.g. Pike Select, FOX 34, Suntour XCR' : 'Shock, e.g. FLOAT X, Deluxe'} value={q} onChange={(e) => setQ(e.target.value)} aria-label={`${kind} search`} />
      {results.slice(0, 8).map((model) => (
        <div key={model.key} className="bg-brew-card border border-white/10 rounded-md px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex-1 min-w-0">{model.brand} {model.model}</span>
            <StatusTag status={model.status} />
          </div>
          {model.statusNote && <p className="text-[11.5px] text-brew-text-muted mt-1">{model.statusNote}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {model.options.map((o) => (
              <button
                key={String(o.travel)}
                type="button"
                title={o.note}
                onClick={() => onPick(kind, o.spec, `${model.brand} ${model.model}${o.travel ? ` ${o.travel}` : ''}`, 'component_search', o.exact ? model.status : 'closest')}
                className={`text-xs rounded px-2 py-1 border hover:border-brew-accent hover:text-brew-accent ${o.exact ? 'border-white/20' : 'border-dashed border-white/20 text-brew-text-dim'}`}
              >
                {o.travel ? `${o.travel} mm` : 'Use this'}
              </button>
            ))}
          </div>
        </div>
      ))}
      {results.length > 8 && <p className="text-xs text-brew-text-muted">{results.length - 8} more: type more of the name to narrow it.</p>}
      {empty && (
        <EmptyNotice
          reason={empty}
          action={
            <Button variant="quiet" className="text-xs underline" onClick={() => onRequest({ kind, model: q, query: q, step: 'component_search' })}>
              Ask for it
            </Button>
          }
        />
      )}
    </div>
  );
}

function IdentifierSearch({ onPick, onRequest }: { onPick: OnPick; onRequest: (p: RequestPrefill) => void }) {
  const m = useMtb();
  const [q, setQ] = useState('');
  const [ran, setRan] = useState(false);
  const r = matchIdentifier(m.index, q);
  const status = (pending: boolean): EntryStatus => (pending ? 'pending' : 'on_file');
  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setRan(true); }}>
        <input className={`${inputCls} flex-1 font-mono`} placeholder="e.g. FS-PIKE-SEL-C1 or 910-26-821" value={q} onChange={(e) => { setQ(e.target.value); setRan(false); }} aria-label="Part number" />
        <Button type="submit" variant="ghost">Match</Button>
      </form>
      {ran && r.status === 'family' && (
        <div className="bg-brew-card border border-white/10 rounded-md px-3 py-2 text-sm">
          <p className="text-xs text-brew-text-muted">Model code match: one code covers every travel of this fork. Pick yours.</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="font-semibold">{r.family}</span>
            {r.results[0]?.pending && <StatusTag status="pending" />}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {r.results.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onPick(h.kind, { unitId: h.id }, h.display_name, 'identifier', status(h.pending))}
                className="text-xs rounded px-2 py-1 border border-white/20 hover:border-brew-accent hover:text-brew-accent"
              >
                {h.travel_mm} mm
              </button>
            ))}
          </div>
        </div>
      )}
      {ran && (r.status === 'exact' || r.status === 'prefix') && (
        <div className="space-y-2">
          <p className="text-xs text-brew-text-muted">{r.status === 'exact' ? 'Exact match' : 'Starts with what you typed'}</p>
          {r.results.slice(0, 12).map((h) => (
            <button
              key={h.id}
              type="button"
              className="w-full text-left bg-brew-card border border-white/10 hover:border-brew-accent/60 rounded-md px-3 py-2 text-sm"
              onClick={() => onPick(h.kind, { unitId: h.id }, h.display_name, 'identifier', status(h.pending))}
            >
              {h.display_name} <span className="font-mono text-xs text-brew-text-muted ml-2">{h.matched}</span>
            </button>
          ))}
        </div>
      )}
      {ran && r.status === 'none' && (
        <EmptyNotice
          reason={r.empty}
          action={<Button variant="quiet" className="text-xs underline" onClick={() => onRequest({ query: q, step: 'identifier', model: q })}>Ask for it</Button>}
        />
      )}
      <p className="text-xs text-brew-text-muted">
        RockShox prints a model code starting FS- on the fork leg sticker (for example FS-PIKE-SEL-C1); it identifies the fork family and tier exactly. FOX prints part
        numbers like 910-26-821, which are not on file yet.
      </p>
    </div>
  );
}

function ManualPick({ onFork, onShock, onRequest, hardtail }: {
  onFork: (p: Picked<ForkSpec>) => void; onShock: (p: Picked<ShockSpec>) => void; onRequest: (p: RequestPrefill) => void; hardtail: boolean;
}) {
  const m = useMtb();
  const chassisList = manualChassis(m.index);
  const [chassisId, setChassisId] = useState('');
  const [damperId, setDamperId] = useState('');
  const [springId, setSpringId] = useState('');
  const [shockDamperId, setShockDamperId] = useState('');
  const chassis = m.index.chassis[chassisId];
  const gap = manualGap(m.index, chassis);
  const dampers = chassis ? manualDampers(m.index, 'fork', chassis.brand) : [];
  const springs = chassis ? manualAirSprings(m.index, chassis.id) : [];
  const shockDampers = manualDampers(m.index, 'shock');

  return (
    <div className={`grid gap-6 ${hardtail ? '' : 'md:grid-cols-2'}`}>
      <div className="space-y-2">
        <p className="text-xs text-brew-text-muted">Fork</p>
        <select className={`${inputCls} w-full`} value={chassisId} onChange={(e) => { setChassisId(e.target.value); setDamperId(''); setSpringId(''); }} aria-label="Fork chassis">
          <option value="">Chassis</option>
          {chassisList.map((c) => <option key={c.id} value={c.id}>{c.brand} {c.model}{c.year_range ? ` (${c.year_range[0]}–${c.year_range[1]})` : ''}</option>)}
        </select>
        {gap ? (
          <EmptyNotice
            reason={gap}
            action={<Button variant="quiet" className="text-xs underline" onClick={() => onRequest({ kind: 'fork', brand: chassis?.brand, model: chassis?.model, step: 'manual' })}>Ask for it</Button>}
          />
        ) : chassis && (
          <>
            <select className={`${inputCls} w-full`} value={damperId} onChange={(e) => setDamperId(e.target.value)} aria-label="Fork damper">
              <option value="">Damper</option>
              {dampers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className={`${inputCls} w-full`} value={springId} onChange={(e) => setSpringId(e.target.value)} aria-label="Air spring">
              <option value="">Air spring (not listed / not sure)</option>
              {springs.map((s) => <option key={s.id} value={s.id}>{s.name} {s.travel_mm}mm{s.tier_applies_to ? ` · ${s.tier_applies_to.join('/')}` : ''}</option>)}
            </select>
            {!springs.length && <p className="text-xs text-brew-text-muted">No air spring on file for this chassis yet, so fork pressure will start unknown. Enter yours on the Bench.</p>}
            <Button
              variant="ghost"
              disabled={!damperId}
              onClick={() => {
                const d = m.index.dampers[damperId];
                onFork({
                  spec: { chassisId, damperId, airSpringId: springId || null },
                  label: `${chassis.brand} ${chassis.model} (${d.name})`,
                  via: 'manual',
                  status: d.confidence === 'estimated' ? 'estimate' : 'on_file',
                });
              }}
            >
              Use this fork
            </Button>
          </>
        )}
      </div>
      {!hardtail && (
        <div className="space-y-2">
          <p className="text-xs text-brew-text-muted">Rear shock</p>
          <select className={`${inputCls} w-full`} value={shockDamperId} onChange={(e) => setShockDamperId(e.target.value)} aria-label="Shock damper">
            <option value="">Shock damper</option>
            {shockDampers.map((d) => <option key={d.id} value={d.id}>{d.brand} {d.name}</option>)}
          </select>
          <Button
            variant="ghost"
            disabled={!shockDamperId}
            onClick={() => {
              const d = m.index.dampers[shockDamperId];
              onShock({ spec: { damperId: shockDamperId }, label: `${d.brand} ${d.name}`, via: 'manual', status: d.confidence === 'estimated' ? 'estimate' : 'on_file' });
            }}
          >
            Use this shock
          </Button>
          <p className="text-xs text-brew-text-muted">Picking a damper by hand skips the air can, so shock pressure limits and spacer counts are not known.</p>
        </div>
      )}
    </div>
  );
}

export type { GarageStep };
