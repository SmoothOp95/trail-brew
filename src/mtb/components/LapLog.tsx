import type { LapEntry, Verdict } from '../engine/bench';
import { FIELD_LABELS } from '../engine/capability';
import type { SettingField } from '../engine/types';
import type { Goal } from '../rules/rules.schema';

const VERDICTS: Verdict[] = ['better', 'worse', 'same'];

export function lapSummary(lap: LapEntry): string {
  const parts = (Object.entries(lap.deltas) as [SettingField, NonNullable<LapEntry['deltas'][SettingField]>][]).map(([f, d]) => {
    const sign = d.delta > 0 ? '+' : '';
    return d.to != null ? `${FIELD_LABELS[f]} to ${d.to}` : `${FIELD_LABELS[f]} ${sign}${d.delta}`;
  });
  return parts.join(', ') || 'No field changes';
}

/** Session log table: lap, change, how it felt, verdict. Saves the goal ids and deltas with each lap. */
export function LapLog({ laps, goals, onUpdate, onRemove }: { laps: LapEntry[]; goals: Goal[]; onUpdate: (l: LapEntry) => void; onRemove?: (id: string) => void }) {
  const name = (id: string) => goals.find((g) => g.id === id)?.name ?? id;
  if (!laps.length) {
    return <p className="text-sm text-brew-text-muted py-5">Nothing logged yet. Apply a change, ride the same section, then record what it did.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13.5px] border-collapse min-w-[520px]">
        <thead>
          <tr className="text-left text-xs text-brew-text-muted">
            <th className="font-medium pb-2 pr-3 border-b border-white/10 w-10">Lap</th>
            <th className="font-medium pb-2 pr-3 border-b border-white/10">Change</th>
            <th className="font-medium pb-2 pr-3 border-b border-white/10 w-[32%]">How it felt</th>
            <th className="font-medium pb-2 border-b border-white/10 w-[150px]">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {laps.map((lap) => (
            <tr key={lap.id} className="align-top">
              <td className="py-2.5 pr-3 border-b border-white/10 tabular-nums">{lap.lap}</td>
              <td className="py-2.5 pr-3 border-b border-white/10">
                {lapSummary(lap)}
                <div className="text-[11.5px] text-brew-text-muted mt-0.5">
                  {lap.goal_ids.map(name).join(', ')} · {lap.date.slice(0, 10)}
                  {onRemove && (
                    <button type="button" className="ml-2 underline decoration-dotted hover:text-brew-text" onClick={() => onRemove(lap.id)}>
                      remove
                    </button>
                  )}
                </div>
              </td>
              <td className="py-2.5 pr-3 border-b border-white/10">
                <input
                  type="text"
                  aria-label={`Lap ${lap.lap}, how it felt`}
                  placeholder="what it did"
                  defaultValue={lap.note}
                  onBlur={(e) => e.target.value !== lap.note && onUpdate({ ...lap, note: e.target.value })}
                  className="w-full bg-transparent border-0 border-b border-dotted border-white/20 focus:outline-none focus:border-brew-accent py-0.5"
                />
              </td>
              <td className="py-2.5 border-b border-white/10">
                <span className="inline-flex gap-1">
                  {VERDICTS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={lap.verdict === v}
                      onClick={() => onUpdate({ ...lap, verdict: lap.verdict === v ? null : v })}
                      className={`text-[11.5px] px-2 py-0.5 rounded-sm border ${
                        lap.verdict === v ? 'bg-brew-text text-brew-bg border-brew-text' : 'border-white/15 text-brew-text-dim hover:border-white/40'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
