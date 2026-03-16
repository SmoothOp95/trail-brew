export default function FilterChips({ types, active, onChange }) {
  return (
    <div className="max-w-[1100px] mx-auto flex gap-2.5 flex-wrap items-center mb-6">
      <button
        onClick={() => onChange('all')}
        className={`font-mono text-[11px] px-3.5 py-[7px] rounded-lg border transition-all uppercase tracking-wide ${
          active === 'all'
            ? 'bg-brew-accent text-brew-bg border-brew-accent font-bold'
            : 'border-brew-border text-brew-text-dim hover:border-brew-text-dim hover:text-brew-text'
        }`}
      >
        All
      </button>

      <div className="w-px h-6 bg-brew-border" />

      {types.map((type) => {
        const key = type.toLowerCase();
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`font-mono text-[11px] px-3.5 py-[7px] rounded-lg border transition-all uppercase tracking-wide ${
              active === key
                ? 'bg-brew-accent text-brew-bg border-brew-accent font-bold'
                : 'border-brew-border text-brew-text-dim hover:border-brew-text-dim hover:text-brew-text'
            }`}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}
