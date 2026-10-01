import { LapLog } from '../components/LapLog';
import { RULES } from '../rules';
import { useMtb } from '../ui/MtbContext';
import { Button, Section, downloadText } from '../ui/primitives';

/** Every logged lap, by bike. Each lap keeps the goals and field deltas, which is what stage 6 fits the radar against. */
export function SessionLog() {
  const m = useMtb();
  const byBike = new Map<string, typeof m.laps>();
  for (const l of m.laps) byBike.set(l.bike_key, [...(byBike.get(l.bike_key) ?? []), l]);
  const bikeName = (key: string) => m.bikes.find((b) => b.key === key)?.name ?? (key.startsWith('adhoc:') ? 'Bike not saved to Garage' : key);

  return (
    <div className="max-w-4xl">
      <header className="pt-2 pb-5 border-b border-white/20 mb-8 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-[28px] font-semibold tracking-tight leading-tight">Session log</h1>
          <p className="text-sm text-brew-text-dim mt-1 max-w-[60ch]">
            Lap, change, how it felt, verdict. One change at a time on the same section is what makes the verdict mean something.
          </p>
        </div>
        {m.laps.length > 0 && (
          <Button variant="ghost" onClick={() => downloadText('mtb-triage-session-log.json', JSON.stringify({ laps: m.laps }, null, 2))}>
            Export log (JSON)
          </Button>
        )}
      </header>

      {!m.lapsPersistent && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-brew-text-dim mb-6">
          <span>Signed out: laps last until you leave the page. Sign in to keep your log on this device.</span>
          <m.SignIn className="text-[11px] py-1.5" />
        </div>
      )}

      {m.laps.length === 0 && (
        <p className="text-sm text-brew-text-muted">Nothing logged yet. On the Bench, pick a goal, press Apply and log, ride, then come back and record what it did.</p>
      )}
      {[...byBike.entries()].map(([key, laps]) => (
        <Section key={key} title={bikeName(key)} hint={`${laps.length} lap${laps.length === 1 ? '' : 's'}`}>
          <LapLog laps={laps} goals={RULES.goals} onUpdate={m.putLap} onRemove={m.removeLap} />
        </Section>
      ))}
    </div>
  );
}
