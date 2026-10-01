import type { Goal } from '../rules/rules.schema';

/** Goal buttons, up to three. Goals that do not apply to this bike are not rendered at all. */
export function GoalToggles({ goals, selected, onToggle }: { goals: Goal[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
      {goals.map((g) => {
        const on = selected.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(g.id)}
            className={`text-left rounded-md px-4 py-3 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brew-accent ${
              on ? 'bg-brew-accent border-brew-accent text-brew-bg' : 'bg-brew-card border-white/10 hover:border-white/30'
            }`}
          >
            <span className="block text-[14.5px] font-semibold">{g.name}</span>
            <span className={`block text-[12.5px] mt-0.5 ${on ? 'text-brew-bg/75' : 'text-brew-text-dim'}`}>{g.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
