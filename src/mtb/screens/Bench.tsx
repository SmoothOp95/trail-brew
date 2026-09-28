import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { RULES } from '../rules';
import {
  attributeScores,
  authoredConflicts,
  compose,
  formatValue,
  lapFromProposal,
  nowValues,
  readoutRows,
  resolveBike,
  resolveCapability,
  startingValues,
  visibleGoals,
  type BikeContext,
  type BikeSpec,
  type SettingField,
  type Settings,
} from '../engine';
import { BikeDiagram, type Callout } from '../components/BikeDiagram';
import { ChangeList } from '../components/ChangeList';
import { ConflictList } from '../components/ConflictList';
import { GoalToggles } from '../components/GoalToggles';
import { LapLog } from '../components/LapLog';
import { Radar } from '../components/Radar';
import { Readout } from '../components/Readout';
import { useMtb, newId } from '../ui/MtbContext';
import { Button, Section, inputCls } from '../ui/primitives';

const OTHER = '__other__';

/** The prototype, faithfully: preconditions, bike with live callouts, goals, conflicts, radar, ordered changes, ruled out, log. */
export function Bench() {
  const m = useMtb();
  const { spec } = m;

  const bike: BikeContext | { error: string } = useMemo(() => {
    try {
      return resolveBike(m.index, spec);
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [m.index, spec]);

  if ('error' in bike) {
    return (
      <div className="py-10 text-sm text-brew-text-dim">
        This bike cannot be shown: {bike.error}. <Link to="/mtb-dashboard/garage" className="text-brew-accent underline">Pick it again in Garage</Link>.
      </div>
    );
  }
  return <BenchFor bike={bike} spec={spec} />;
}

function BenchFor({ bike, spec }: { bike: BikeContext; spec: BikeSpec }) {
  const m = useMtb();
  const { bench, dispatch } = m;
  const hardtail = bike.suspension === 'hardtail';

  const starts = useMemo(() => startingValues(bike, bench.riderKg), [bike, bench.riderKg]);
  const now = useMemo(() => nowValues(starts, bench.entered), [starts, bench.entered]);
  const proposal = useMemo(() => compose(bench.goals, RULES, bike, now), [bench.goals, bike, now]);
  const conflicts = useMemo(() => authoredConflicts(proposal.goals.map((g) => g.id), RULES), [proposal.goals]);
  const attrs = useMemo(() => attributeScores(RULES, proposal.changes, bike.suspension), [proposal.changes, bike.suspension]);
  const rows = useMemo(() => readoutRows(bike), [bike]);
  const goals = useMemo(() => visibleGoals(RULES, bike), [bike]);
  const changed = new Set<SettingField>(proposal.changes.filter((c) => c.to != null && c.to !== c.from).map((c) => c.field));
  const lapsHere = m.laps.filter((l) => l.bike_key === m.bikeKey);

  const cap = (f: SettingField) => resolveCapability(f, bike);
  const show = (f: SettingField, s: Settings) => {
    const v = s[f];
    return v == null ? null : formatValue(f, v, cap(f));
  };
  const callout = (f: SettingField, sub?: string): Callout => ({
    value: show(f, proposal.next) ?? (proposal.changes.some((c) => c.field === f) ? 'change staged' : 'not known'),
    sub,
    changed: changed.has(f) || proposal.changes.some((c) => c.field === f),
  });
  const joinKnown = (parts: (string | null)[]) => parts.filter(Boolean).join(', ') || undefined;

  const apply = () => {
    const applied: Settings = {};
    for (const c of proposal.changes) if (c.to != null) applied[c.field] = c.to;
    const lap = lapFromProposal(proposal, { id: newId(), bikeKey: m.bikeKey, date: new Date().toISOString(), lap: lapsHere.length + 1 }, now);
    m.putLap(lap);
    dispatch({ type: 'apply', next: applied });
  };

  return (
    <div>
      <RiderBar bike={bike} spec={spec} />

      {!bench.preconditionsDismissed && (
        <div className="border-l-[3px] border-brew-accent bg-brew-card mt-5 px-4 py-3.5 flex gap-4 items-start rounded-r-md">
          <p className="text-sm text-brew-text-dim flex-1">
            <strong className="text-brew-text font-semibold">Before any of this.</strong> Fork{hardtail ? '' : ' and shock'} clean, holding air, adjusters responding. Tyre
            pressure checked cold. Cockpit set: saddle height and angle, bar height and roll, lever reach. A harsh fork is mechanical more often than it is a click, and no
            setting change fixes a binding bushing.
          </p>
          <Button variant="ghost" className="text-[13px] px-3 py-1" onClick={() => dispatch({ type: 'dismissPreconditions' })}>
            Checked
          </Button>
        </div>
      )}

      <div className="grid gap-11 mt-9 items-start grid-cols-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <aside>
          <div className="lg:sticky lg:top-6">
            <Section letter="A" title="Current bike" hint={bench.goals.length ? `${bench.goals.length} goal${bench.goals.length > 1 ? 's' : ''} staged` : 'no changes staged'}>
              <p className="text-xs text-brew-text-muted -mt-2 mb-2">
                {bike.fork?.label ?? 'No fork'}
                {bike.shock ? ` · ${bike.shock.label}` : hardtail ? ' · hardtail' : ''}
              </p>
              <BikeDiagram
                hardtail={hardtail}
                fork={callout('fork_psi', joinKnown([show('fork_spacers', proposal.next), show('fork_lsr', proposal.next)]))}
                shock={hardtail ? null : callout('shock_psi', joinKnown([show('shock_lsr', proposal.next), show('shock_lsc', proposal.next)]))}
                tyreFront={callout('tyre_front')}
                tyreRear={callout('tyre_rear')}
                forkPsiDelta={proposal.changes.find((c) => c.field === 'fork_psi')?.delta ?? 0}
              />
              <Readout
                rows={rows}
                starts={starts}
                entered={bench.entered}
                now={now}
                next={proposal.next}
                changed={changed}
                onEnter={(field, value) => dispatch({ type: 'enter', field, value })}
              />
              <details className="border-t border-white/10 pt-4 mt-4 group">
                <summary className="cursor-pointer text-sm font-semibold list-none before:content-['+_'] group-open:before:content-['–_'] before:text-brew-text-muted">
                  How to measure sag properly
                </summary>
                <div className="text-[13.5px] text-brew-text-dim pt-3 space-y-2">
                  <p>{RULES.sag_method.summary}</p>
                  <ul className="list-disc ml-5 space-y-1">
                    {RULES.sag_method.steps.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              </details>
            </Section>
          </div>
        </aside>

        <main className="min-w-0">
          <Section letter="B" title="What do you want from the bike" hint="pick up to three">
            <GoalToggles goals={goals} selected={bench.goals} onToggle={(id) => dispatch({ type: 'toggleGoal', id })} />
          </Section>

          <Section letter="C" title="What that does to the bike" hint="dashed is now, solid is proposed">
            <ConflictList authored={conflicts} mechanical={proposal.netZero} goals={RULES.goals} />
            <Radar result={attrs} />
          </Section>

          <Section letter="D" title="Changes to make" hint="one at a time, same trail section">
            <ChangeList changes={proposal.changes} ruledOut={proposal.ruledOut} headroomUnknown={proposal.headroomUnknown} goals={RULES.goals} />
            <div className="flex flex-wrap gap-2.5 mt-6">
              <Button onClick={apply} disabled={!proposal.changes.some((c) => c.delta !== 0)}>
                Apply and log
              </Button>
              <Button variant="ghost" onClick={() => dispatch({ type: 'clearGoals' })}>
                Clear goals
              </Button>
              <Button variant="ghost" onClick={() => dispatch({ type: 'reset', entered: m.activeBike?.entered ?? {} })}>
                Reset to baseline
              </Button>
            </div>
          </Section>

          <Section letter="E" title="Session log" hint={m.lapsPersistent ? 'saved on this device' : undefined}>
            {!m.lapsPersistent && (
              <div className="flex flex-wrap items-center gap-3 text-[13px] text-brew-text-dim mb-3">
                <span>Signed out: this log lasts until you leave the page. Sign in to keep it.</span>
                <m.SignIn className="text-[11px] py-1.5" />
              </div>
            )}
            <LapLog laps={lapsHere} goals={RULES.goals} onUpdate={m.putLap} />
          </Section>

          <details className="border-t border-white/10 pt-4 group">
            <summary className="cursor-pointer text-sm font-semibold list-none before:content-['+_'] group-open:before:content-['–_'] before:text-brew-text-muted">
              Which dial to reach for, and how to tell
            </summary>
            <DialGuide />
          </details>
        </main>
      </div>

      <footer className="border-t border-white/10 mt-14 pt-5 text-[12.5px] text-brew-text-muted max-w-[78ch] space-y-2">
        <p>
          Every number is tagged: <em>published</em> is read from a manufacturer document, <em>derived</em> is computed from one, <em>estimate</em> is a best guess
          you should check, and <em>unknown</em> means nobody publishes it, so enter your own. Recommended changes are fixed steps, not computed from your frame's
          leverage curve.
        </p>
        <p>
          Damper adjuster inventories decide which changes are offered. Method notes drawn from published setup guides by Canyon, Simplon and BikeRadar.{' '}
          <Link to="/mtb-dashboard/coverage" className="underline hover:text-brew-text">What the dataset contains</Link>.
        </p>
      </footer>
    </div>
  );
}

export function DialGuide() {
  return (
    <div className="text-[13.5px] text-brew-text-dim pt-3 max-w-[72ch] space-y-2.5">
      <p><strong className="text-brew-text">Rebound.</strong> As fast as possible, as slow as necessary. Press the bars down hard and release: if the front wheel leaves the ground, rebound is too fast. Too slow and the fork packs down through repeated hits, riding low and harsh. Too fast and the bike feels nervous and loses traction.</p>
      <p><strong className="text-brew-text">High speed compression.</strong> Judge it on square edges and landings. Harsh on quick impacts while barely using travel means it is too closed. Soft and using all the travel means it is too open.</p>
      <p><strong className="text-brew-text">Low speed compression.</strong> Judge it entering corners and on jump faces. If the bike feels sluggish and stacks up under you, LSC is too open. Wind it in for support, but too much makes the suspension harsh and unresponsive to small inputs.</p>
      <p><strong className="text-brew-text">Volume spacers.</strong> These change the shape of the spring curve without changing sag. Add one if you bottom out easily at correct sag. Remove one if you never reach full travel. Note the pressure before you release the air so you can put exactly the same pressure back and compare fairly.</p>
      <p><strong className="text-brew-text">Method.</strong> Change one thing, two to four clicks, then ride the same section. If it went the wrong way, come back one click rather than jumping back to where you started. Write down every setting before you begin so you can always return to it.</p>
    </div>
  );
}

function RiderBar({ bike, spec }: { bike: BikeContext; spec: BikeSpec }) {
  const m = useMtb();
  const forks = m.coverage.showable.fork_units;
  const shocks = m.coverage.showable.shock_units;
  const forkValue = spec.fork && 'unitId' in spec.fork ? spec.fork.unitId : spec.fork ? OTHER : '';
  const shockValue = spec.shock && 'unitId' in spec.shock ? spec.shock.unitId : spec.shock ? OTHER : '';
  const set = (next: Partial<BikeSpec>) => m.openOnBench({ ...spec, ...next });

  return (
    <header className="flex flex-wrap items-end gap-6 pt-2 pb-5 border-b border-white/20">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight">Setup bench</h1>
        <p className="text-sm text-brew-text-dim mt-1 max-w-[46ch]">
          Tell it what you want from the bike. It works out which settings to change, and rules out the ones your hardware cannot do.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 lg:ml-auto">
        {m.bikes.length > 0 && (
          <Field label="Garage bike">
            <select
              className={inputCls}
              value={m.activeBike?.key ?? ''}
              onChange={(e) => {
                const b = m.bikes.find((x) => x.key === e.target.value);
                if (b) m.openOnBench(b.spec, { entered: b.entered, garageKey: b.key });
              }}
            >
              <option value="">Not from Garage</option>
              {m.bikes.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Kitted weight (kg)">
          <input
            type="number"
            inputMode="decimal"
            min={35}
            max={180}
            step={1}
            placeholder="kg"
            className={`${inputCls} w-24`}
            defaultValue={m.bench.riderKg ?? ''}
            key={m.bench.riderKg ?? 'none'}
            onBlur={(e) => {
              const v = Number(e.target.value);
              m.setWeight(e.target.value.trim() && v >= 35 && v <= 180 ? v : null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          />
        </Field>
        <Field label="Bike">
          <select aria-label="Bike type" className={inputCls} value={spec.suspension} onChange={(e) => set({ suspension: e.target.value as BikeSpec['suspension'] })}>
            <option value="full_suspension">Full suspension</option>
            <option value="hardtail">Hardtail</option>
          </select>
        </Field>
        <Field label="Fork">
          <select
            aria-label="Fork"
            className={`${inputCls} max-w-[260px]`}
            value={forkValue}
            onChange={(e) => (e.target.value === OTHER ? null : set({ fork: { unitId: e.target.value } }))}
          >
            {forks.map((f) => <option key={f.id} value={f.id}>{f.display_name}</option>)}
            {forkValue === OTHER && <option value={OTHER}>{bike.fork?.label} (from Garage)</option>}
          </select>
        </Field>
        {spec.suspension === 'full_suspension' && (
          <Field label="Rear shock">
            <select
              aria-label="Rear shock"
              className={`${inputCls} max-w-[260px]`}
              value={shockValue}
              onChange={(e) => (e.target.value === OTHER ? null : set({ shock: { unitId: e.target.value } }))}
            >
              {!spec.shock && <option value="">Choose a shock</option>}
              {shocks.map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
              {shockValue === OTHER && <option value={OTHER}>{bike.shock?.label} (from Garage)</option>}
            </select>
          </Field>
        )}
        <Link to="/mtb-dashboard/garage" className="self-end text-xs text-brew-text-dim hover:text-brew-accent underline decoration-dotted pb-2">
          Not listed? Find your parts
        </Link>
      </div>
    </header>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-brew-text-muted">{label}</span>
      {children}
    </label>
  );
}
