import { useMemo, type ReactNode } from 'react';
import { RULES } from '../rules';
import {
  attributeScores,
  authoredConflicts,
  compose,
  formatValue,
  lapFromProposal,
  nowValues,
  pendingNotices,
  readoutRows,
  resolveBike,
  resolveCapability,
  dialsOf,
  isGeneric,
  setupFields,
  setupMissing,
  springAdvice,
  travelOf,
  startingValues,
  visibleGoals,
  type BikeContext,
  type BikeSpec,
  type SettingField,
  type Settings,
  type GenericDials,
  type SetupMode,
} from '../engine';
import { BikeDiagram, type Callout } from '../components/BikeDiagram';
import { ChangeList } from '../components/ChangeList';
import { ConflictList } from '../components/ConflictList';
import { GoalToggles } from '../components/GoalToggles';
import { LapLog } from '../components/LapLog';
import { Radar } from '../components/Radar';
import { Readout } from '../components/Readout';
import { defaultSpec, useMtb, newId } from '../ui/MtbContext';
import { Button, ProvenanceTag, Section, Segmented, inputCls } from '../ui/primitives';


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
        This bike cannot be shown: {bike.error}.{' '}
        <button type="button" className="text-brew-accent underline" onClick={() => m.openOnBench(defaultSpec())}>Start again</button>.
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
  const fields = useMemo(() => setupFields(bench.mode), [bench.mode]);
  const proposal = useMemo(() => compose(bench.goals, RULES, bike, now, { fields }), [bench.goals, bike, now, fields]);
  const conflicts = useMemo(() => authoredConflicts(proposal.goals.map((g) => g.id), RULES), [proposal.goals]);
  const attrs = useMemo(() => attributeScores(RULES, proposal.changes, bike.suspension), [proposal.changes, bike.suspension]);
  const rows = useMemo(() => readoutRows(bike, bench.mode), [bike, bench.mode]);
  const missing = setupMissing(spec, bench.mode);
  const ready = missing.length === 0;
  const goals = useMemo(() => visibleGoals(RULES, bike), [bike]);
  const changed = new Set<SettingField>(proposal.changes.filter((c) => c.to != null && c.to !== c.from).map((c) => c.field));
  const lapsHere = m.laps.filter((l) => l.bike_key === m.bikeKey);

  const cap = (f: SettingField) => resolveCapability(f, bike);
  const show = (f: SettingField, s: Settings) => {
    if (!fields.includes(f)) return null;
    const v = s[f];
    return v == null ? null : formatValue(f, v, cap(f));
  };
  const spring = useMemo(() => springAdvice(bike, bench.riderKg), [bike, bench.riderKg]);
  // Pending damper data only matters once rebound and compression are on screen.
  const notices = useMemo(() => (bench.mode === 'advanced' ? pendingNotices(bike) : []), [bike, bench.mode]);
  const callout = (f: SettingField, sub?: string): Callout => ({
    value:
      show(f, proposal.next) ??
      (proposal.changes.some((c) => c.field === f)
        ? 'change staged'
        : f === 'fork_psi' && spring
          ? spring.spring ?? 'coil spring'
          : starts[f].range?.text ?? 'not known'),
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
      <RiderBar />

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

      <PartNotices bike={bike} notices={notices} />

      <div className="grid gap-11 mt-9 items-start grid-cols-1 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <aside>
          <div className="lg:sticky lg:top-6">
            <Section letter="A" title="Current bike" hint={ready ? (bench.goals.length ? `${bench.goals.length} goal${bench.goals.length > 1 ? 's' : ''} staged` : 'no changes staged') : 'set up to start tuning'}>
              <BikeSetup bike={bike} spec={spec} />
              <BikeDiagram
                hardtail={hardtail}
                fork={callout('fork_psi', joinKnown([show('fork_spacers', proposal.next), show('fork_lsr', proposal.next)]))}
                shock={hardtail ? null : callout('shock_psi', joinKnown([show('shock_lsr', proposal.next), show('shock_lsc', proposal.next)]))}
                tyreFront={callout('tyre_front')}
                tyreRear={callout('tyre_rear')}
                forkPsiDelta={proposal.changes.find((c) => c.field === 'fork_psi')?.delta ?? 0}
              />
              {bench.mode && <Readout
                rows={rows}
                starts={starts}
                entered={bench.entered}
                now={now}
                next={proposal.next}
                changed={changed}
                onEnter={(field, value) => dispatch({ type: 'enter', field, value })}
              />}
              {bench.mode && spring && <SpringRow advice={spring} />}
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
          {!ready ? <TuningLocked missing={missing} /> : <>
          <Section letter="B" title="Tuning: what do you want from the bike" hint="pick up to three">
            <GoalToggles goals={goals} selected={bench.goals} onToggle={(id) => dispatch({ type: 'toggleGoal', id })} />
          </Section>

          <Section letter="C" title="What that does to the bike" hint="dashed is now, solid is proposed">
            <ConflictList authored={conflicts} mechanical={proposal.netZero} goals={RULES.goals} />
            <Radar result={attrs} />
          </Section>

          <Section letter="D" title="Changes to make" hint="one at a time, same trail section">
            <ChangeList changes={proposal.changes} ruledOut={proposal.ruledOut} headroomUnknown={proposal.headroomUnknown} goals={RULES.goals} />
            {proposal.advanced.length > 0 && (
              <p className="mt-4 text-[12.5px] text-brew-text-dim">
                Basic setup changes pressures only. Advanced setup would also change: {proposal.advanced.map((p) => p.label.toLowerCase()).join(', ')}.{' '}
                <button type="button" className="underline decoration-dotted hover:text-brew-accent" onClick={() => dispatch({ type: 'setMode', mode: 'advanced' })}>
                  Switch to Advanced
                </button>
              </p>
            )}
            {proposal.pending.length > 0 && (
              <p className="mt-4 text-[12.5px] text-trail-xc">
                Held back until the damper is documented: {proposal.pending.map((p) => p.label.toLowerCase()).join(', ')}. Neither offered nor ruled out.
              </p>
            )}
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
          </>}
        </main>
      </div>

      <footer className="border-t border-white/10 mt-14 pt-5 text-[12.5px] text-brew-text-muted max-w-[78ch] space-y-2">
        <p>
          Every number is tagged: <em>published</em> is read from a manufacturer document, <em>derived</em> is computed from one, <em>estimate</em> is a best guess
          you should check, and <em>unknown</em> means nobody publishes it, so enter your own. Recommended changes are fixed steps, not computed from your frame's
          leverage curve.
        </p>
        <p>
          Damper adjuster inventories decide which changes are offered. Method notes drawn from published setup guides by Canyon, Simplon and BikeRadar.
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

function RiderBar() {
  const m = useMtb();
  return (
    <header className="flex flex-wrap items-end gap-6 pt-2 pb-5 border-b border-white/20">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight">Setup bench</h1>
        <p className="text-sm text-brew-text-dim mt-1 max-w-[46ch]">
          Set up your bike, then tell it what you want from it. It works out which settings to change and by how much.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 items-end lg:ml-auto">
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
      </div>
    </header>
  );
}

const TRAVEL_MIN = 60;
const TRAVEL_MAX = 250;

/** Bike type, travel, then Basic or Advanced. No brand or model to pick. */
function BikeSetup({ bike, spec }: { bike: BikeContext; spec: BikeSpec }) {
  const m = useMtb();
  const { bench, dispatch } = m;
  const set = (next: Partial<BikeSpec>) => m.editSpec({ ...spec, ...next });
  const hardtail = spec.suspension === 'hardtail';
  // A Garage bike carries named parts; show them, with a way back to travel only.
  const named = !isGeneric(spec.fork) || (!hardtail && !isGeneric(spec.shock));

  return (
    <div className="space-y-4 mb-5">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-brew-text-muted">Bike type</span>
        <Segmented
          label="Bike type"
          value={spec.suspension}
          options={[{ value: 'hardtail', label: 'Hardtail' }, { value: 'full_suspension', label: 'Full suspension' }]}
          onChange={(suspension) => set({ suspension, shock: spec.shock ?? { generic: true, travel: null } })}
        />
      </div>

      {named ? (
        <div className="text-[13px] text-brew-text-dim">
          <p>
            {bike.fork?.label ?? 'No fork'}
            {!hardtail && bike.shock ? ` · ${bike.shock.label}` : ''}
          </p>
          <button
            type="button"
            className="mt-1 text-xs underline decoration-dotted hover:text-brew-accent"
            onClick={() => m.editSpec({ suspension: spec.suspension, fork: { generic: true, travel: null }, shock: { generic: true, travel: null } })}
          >
            Enter travel instead
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4">
          <TravelInput label="Fork travel (mm)" value={travelOf(spec.fork)} onChange={(travel) => set({ fork: { generic: true, travel, dials: dialsOf(spec.fork) } })} />
          {!hardtail && (
            <TravelInput label="Rear travel (mm)" value={travelOf(spec.shock)} onChange={(travel) => set({ shock: { generic: true, travel, dials: dialsOf(spec.shock) } })} />
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-brew-text-muted">Setup</span>
        <Segmented<SetupMode>
          label="Setup"
          value={bench.mode}
          options={[{ value: 'basic', label: 'Basic' }, { value: 'advanced', label: 'Advanced' }]}
          onChange={(mode) => dispatch({ type: 'setMode', mode })}
        />
        <p className="text-[12px] text-brew-text-muted">
          {bench.mode === 'advanced'
            ? `Every setting: air pressure, rebound, compression and volume spacers${hardtail ? '' : ' on the fork and shock'}, plus tyres.`
            : bench.mode === 'basic'
              ? `Tyre pressures and ${hardtail ? 'fork' : 'fork and shock'} air pressure only. Switch to Advanced for rebound, compression and spacers.`
              : 'Basic covers tyre and air pressures. Advanced adds rebound, compression and spacers.'}
        </p>
      </div>

      {bench.mode === 'advanced' && !named && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs text-brew-text-muted mb-1.5">Which high speed dials do you have?</legend>
          <DialChecks part="Fork" dials={dialsOf(spec.fork)} onChange={(dials) => set({ fork: { generic: true, travel: travelOf(spec.fork), dials } })} />
          {!hardtail && (
            <DialChecks part="Shock" dials={dialsOf(spec.shock)} onChange={(dials) => set({ shock: { generic: true, travel: travelOf(spec.shock), dials } })} />
          )}
          <p className="text-[12px] text-brew-text-muted">
            Most forks and shocks have rebound and low speed compression. High speed dials are usually a second, smaller dial on top of the low speed one. If you are
            not sure, leave them unticked and the Bench will not ask you to turn them.
          </p>
        </fieldset>
      )}
    </div>
  );
}

function DialChecks({ part, dials, onChange }: { part: string; dials: GenericDials; onChange: (d: GenericDials) => void }) {
  const box = (key: keyof GenericDials, label: string) => (
    <label className="inline-flex items-center gap-2 text-sm text-brew-text-dim cursor-pointer">
      <input
        type="checkbox"
        className="accent-brew-accent h-4 w-4"
        checked={!!dials[key]}
        onChange={(e) => onChange({ ...dials, [key]: e.target.checked })}
      />
      {label}
    </label>
  );
  return (
    <div className="grid grid-cols-[3.25rem_1fr] items-start gap-x-2">
      <span className="text-sm pt-px">{part}</span>
      <div className="flex flex-col gap-1.5">
        {box('hsc', 'High speed compression')}
        {box('hsr', 'High speed rebound')}
      </div>
    </div>
  );
}

function TravelInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <Field label={label}>
      <input
        type="number"
        inputMode="numeric"
        min={TRAVEL_MIN}
        max={TRAVEL_MAX}
        step={5}
        placeholder="mm"
        className={`${inputCls} w-28`}
        defaultValue={value ?? ''}
        key={value ?? 'none'}
        onBlur={(e) => {
          const v = Math.round(Number(e.target.value));
          onChange(e.target.value.trim() && v >= TRAVEL_MIN && v <= TRAVEL_MAX ? v : null);
        }}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      />
    </Field>
  );
}

/** Tuning stays hidden until the bike is set up, with the remaining steps listed. */
function TuningLocked({ missing }: { missing: string[] }) {
  return (
    <Section letter="B" title="Tuning" hint="opens once your bike is set up">
      <div className="border border-dashed border-white/15 rounded-md px-5 py-5 text-sm text-brew-text-dim">
        <p className="text-brew-text font-medium">Set up your bike under Current bike to start tuning.</p>
        <ul className="mt-3 space-y-1.5">
          {missing.map((s) => (
            <li key={s} className="flex items-baseline gap-2">
              <span aria-hidden className="text-brew-text-muted">○</span>
              {s}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** Closest-match and pending-damper notices: one line each, above the bench, so the rider knows what is borrowed. */
function PartNotices({ bike, notices }: { bike: BikeContext; notices: string[] }) {
  const parts = [bike.fork, bike.shock].filter((p): p is NonNullable<typeof p> => !!p && !!p.standIn);
  if (!parts.length && !notices.length) return null;
  return (
    <div className="mt-4 space-y-2">
      {parts.map((p) => (
        <div key={p.standIn!.id} className="border-l-[3px] border-trail-enduro bg-brew-card px-4 py-3 text-[13.5px] text-brew-text-dim rounded-r-md">
          <strong className="text-trail-enduro font-semibold">Closest match: {p.standIn!.label}.</strong>{' '}
          {p.standIn!.id.startsWith('travel:') ? p.standIn!.reason : (
            <>
              Not on file yet, so the Bench uses the dials of the {p.standIn!.targetLabel}. {p.standIn!.reason} No pressure, token or setting figures are borrowed. Check
              each dial exists on yours before turning it.
            </>
          )}
        </div>
      ))}
      {notices.map((n) => (
        <div key={n} className="border-l-[3px] border-trail-xc bg-brew-card px-4 py-3 text-[13.5px] text-brew-text-dim rounded-r-md">{n}</div>
      ))}
    </div>
  );
}

function SpringRow({ advice }: { advice: NonNullable<ReturnType<typeof springAdvice>> }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/10 text-sm">
      <span className="text-brew-text-dim">Fork spring</span>
      <span className="flex items-center gap-2 font-semibold text-right">
        {advice.spring ? `${advice.spring} for ${advice.forWeight}` : 'not listed'}
        <ProvenanceTag provenance={advice.spring ? advice.provenance : 'unknown'} title={advice.note} />
      </span>
    </div>
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
