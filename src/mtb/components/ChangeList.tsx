import type { Goal } from '../rules/rules.schema';
import { describeMove } from '../engine/describe';
import type { Change, RuledOut } from '../engine/goals';

/** The ordered change list and the ruled-out block, as in the prototype, plus clamp and headroom disclosures. */
export function ChangeList({ changes, ruledOut, headroomUnknown, goals }: { changes: Change[]; ruledOut: RuledOut[]; headroomUnknown: string[]; goals: Goal[] }) {
  const name = (id: string) => goals.find((g) => g.id === id)?.name ?? id;
  return (
    <div>
      {changes.length === 0 ? (
        <p className="text-sm text-brew-text-muted py-5">
          Pick what you want from the bike above and the changes will appear here, in the order to make them.
        </p>
      ) : (
        <ol>
          {changes.map((c, i) => (
            <li key={c.field} className="grid grid-cols-[26px_minmax(0,1fr)] gap-3.5 py-4 border-t border-white/10 last:border-b">
              <span className="text-[13px] text-brew-text-muted pt-0.5 tabular-nums">{i + 1}</span>
              <div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[15px] font-semibold">{c.label}</span>
                  {c.state === 'coarse' && <span className="font-mono text-[9.5px] uppercase tracking-wider text-trail-technical">coarse</span>}
                  {c.netZero && <span className="font-mono text-[9.5px] uppercase tracking-wider text-trail-technical">nets near zero</span>}
                </div>
                <div className="text-sm font-semibold text-brew-accent mt-0.5">{describeMove(c)}</div>
                {(c.rationale.length > 0 || c.coarseNote) && (
                  <p className="text-[13.5px] text-brew-text-dim mt-1.5">
                    {c.rationale.join(' ')}
                    {c.coarseNote ? ` ${c.coarseNote}` : ''}
                  </p>
                )}
                {c.clamp && (
                  <p className="text-[12.5px] text-trail-technical mt-1.5">
                    Limited to {c.clamp.limit}: {c.clamp.source}. The goals asked for {c.requested > 0 ? '+' : ''}
                    {c.requested}.
                  </p>
                )}
                <p className="text-xs text-brew-text-muted mt-1.5">Driven by: {c.goals.map(name).join(', ')}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {headroomUnknown.length > 0 && changes.length > 0 && (
        <p className="mt-4 text-[12.5px] text-brew-text-muted">
          Adjustment headroom for the {headroomUnknown.join(', ')} is not published, so there is no known end stop. If a dial stops turning, you are at the end of its range.
        </p>
      )}

      {ruledOut.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-brew-text-muted mb-1">Ruled out, your hardware cannot do this</p>
          {ruledOut.map((r) => (
            <div key={r.field} className="grid grid-cols-[26px_minmax(0,1fr)] gap-3.5 py-4 border-t border-white/10 last:border-b opacity-85">
              <span className="text-[13px] text-brew-text-muted">&times;</span>
              <div>
                <div className="text-[15px] text-brew-text-muted">{r.label}</div>
                <p className="text-[13.5px] text-brew-text-dim mt-1">{r.reason}</p>
                <p className="text-xs text-brew-text-muted mt-1">Wanted by: {r.goals.map(name).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
