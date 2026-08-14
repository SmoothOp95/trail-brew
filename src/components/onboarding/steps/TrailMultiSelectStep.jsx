import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTrails } from '../../../hooks/useTrails';

export default function TrailMultiSelectStep({ value, onChange }) {
  const { trails, loading, error } = useTrails();
  const [noneChecked, setNoneChecked] = useState(false);

  const selected = value || [];

  const toggleTrail = (id) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange(next);
  };

  const handleNoneChange = (checked) => {
    setNoneChecked(checked);
    if (checked) onChange([]);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-brew-text-dim text-sm py-6">
        <Loader2 size={16} className="animate-spin" />
        Loading trails…
      </div>
    );
  }

  if (error || trails.length === 0) {
    return (
      <p className="text-sm text-brew-text-dim py-4">
        Couldn't load the trail list right now — no problem, you can skip this one and add
        ridden trails later.
      </p>
    );
  }

  return (
    <div>
      <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
        {trails.map((trail) => (
          <label
            key={trail.id}
            className={`flex items-center gap-3 rounded-lg border-[1.5px] px-4 py-3 cursor-pointer transition-all ${
              noneChecked
                ? 'border-brew-border opacity-40 cursor-not-allowed'
                : selected.includes(trail.id)
                  ? 'border-brew-accent bg-brew-accent/[0.06]'
                  : 'border-brew-border bg-brew-card hover:border-brew-accent'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(trail.id)}
              disabled={noneChecked}
              onChange={() => toggleTrail(trail.id)}
              className="accent-brew-accent w-4 h-4 shrink-0"
            />
            <span className="text-[14px] text-brew-text">{trail.name}</span>
          </label>
        ))}
      </div>

      <label className="flex items-center gap-3 rounded-lg border-[1.5px] border-brew-border px-4 py-3 mt-3 cursor-pointer hover:border-brew-accent transition-all">
        <input
          type="checkbox"
          checked={noneChecked}
          onChange={(e) => handleNoneChange(e.target.checked)}
          className="accent-brew-accent w-4 h-4 shrink-0"
        />
        <span className="text-[14px] text-brew-text-dim">None of these yet</span>
      </label>
    </div>
  );
}
