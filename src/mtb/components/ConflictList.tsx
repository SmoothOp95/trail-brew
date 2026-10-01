import type { Conflict, Goal } from '../rules/rules.schema';
import type { NetZero } from '../engine/goals';

/** Authored conflicts, loudest first, then the mechanical net-zero case so a change never silently vanishes. */
export function ConflictList({ authored, mechanical, goals }: { authored: Conflict[]; mechanical: NetZero[]; goals: Goal[] }) {
  const name = (id: string) => goals.find((g) => g.id === id)?.name ?? id;
  if (!authored.length && !mechanical.length) return null;
  return (
    <div className="space-y-3 mb-5">
      {authored.map((c) => (
        <div key={c.id} className="border-l-[3px] border-trail-enduro bg-brew-card px-4 py-3 text-[13.5px] text-brew-text-dim rounded-r-md">
          <strong className="text-trail-enduro font-semibold">
            {name(c.goal_a)} pulls against {name(c.goal_b)}.
          </strong>{' '}
          {c.text}
          <span className="ml-2 font-mono text-[9.5px] uppercase tracking-wider text-brew-text-muted">{c.severity}</span>
        </div>
      ))}
      {mechanical.map((m) => (
        <div key={m.field} className="border-l-[3px] border-trail-technical bg-brew-card px-4 py-3 text-[13.5px] text-brew-text-dim rounded-r-md">
          <strong className="text-trail-technical font-semibold">{m.label} nets to almost nothing.</strong>{' '}
          {m.goals.map(name).join(' and ')} push it in opposite directions, so the combined change is {m.net > 0 ? '+' : ''}
          {m.net} out of {m.gross} asked for. Pick the goal that matters more if you want this dial to move.
        </div>
      ))}
    </div>
  );
}
