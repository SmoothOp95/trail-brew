import { getTypeColor, getMatchClass } from '../../data/trailTypes';

export default function TrailCard({ trail }) {
  const matchClass = getMatchClass(trail.score);

  return (
    <div className="bg-brew-card border border-brew-border rounded-xl p-6 transition-all duration-300 relative overflow-hidden hover:border-brew-accent/20 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] group">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brew-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Name + match badge */}
      <div className="flex items-start justify-between mb-3.5">
        <h3 className="text-[17px] font-bold leading-snug flex-1 mr-3">
          {trail.name}
        </h3>
        <span
          className={`font-mono text-[11px] px-2 py-0.5 rounded-md whitespace-nowrap font-bold ${matchClass}`}
        >
          {trail.score}% match
        </span>
      </div>

      {/* Type tags */}
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {trail.types.length > 0 ? (
          trail.types.map((type) => {
            const colors = getTypeColor(type);
            return (
              <span
                key={type}
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded ${colors.bg} ${colors.text} uppercase tracking-wide`}
              >
                {type}
              </span>
            );
          })
        ) : (
          <span className="text-brew-text-muted text-xs">No type info</span>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-brew-text-dim">
        <span className="flex items-center gap-1.5">
          <span className="text-sm">{trail.ridden ? '✅' : '⬜'}</span>
          {trail.ridden ? 'Ridden' : 'Not yet ridden'}
        </span>
        {trail.ridingMonth && (
          <span className="flex items-center gap-1.5">
            <span className="text-sm">📅</span>
            {trail.ridingMonth}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3.5 border-t border-brew-border flex items-center justify-between">
        <a
          href={trail.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-brew-accent flex items-center gap-1.5 hover:opacity-70 transition-opacity tracking-wide"
        >
          📍 View on Maps →
        </a>
        <DifficultyPips difficulty={trail.difficulty} />
      </div>
    </div>
  );
}

function DifficultyPips({ difficulty }) {
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-red-500', 'bg-neutral-800 border border-neutral-500'];

  return (
    <div className="flex gap-[3px]">
      {difficulty.map((filled, i) => {
        if (filled > 0) {
          return Array.from({ length: filled }, (_, j) => (
            <div key={`${i}-${j}`} className={`w-3.5 h-3.5 rounded-sm ${colors[i]}`} />
          ));
        }
        return (
          <div key={i} className={`w-3.5 h-3.5 rounded-sm ${colors[i]} opacity-25`} />
        );
      })}
    </div>
  );
}
