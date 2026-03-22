import { getTypeColor, getMatchClass } from '../../data/trailTypes';
import { useTrailWeather } from '../../hooks/useTrailWeather';

export default function TrailCard({ trail }) {
  const matchClass = getMatchClass(trail.score);
  const { weather, condition, loading: weatherLoading } = useTrailWeather(trail.coordinates);

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

      {/* Trail condition */}
      <div className="mt-3.5 mb-1">
        {weatherLoading ? (
          <div className="h-7 w-36 rounded-md bg-brew-border/40 animate-pulse" />
        ) : condition ? (
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-md border uppercase tracking-wide ${condition.colorClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${condition.dotClass}`} />
              {condition.shortLabel}
            </span>
            <span className="text-[11px] text-brew-text-dim">{condition.label}</span>
            {weather && (
              <span className="ml-auto text-[11px] text-brew-text-dim font-mono">
                {weather.temp}°C · {weather.wind} km/h
              </span>
            )}
          </div>
        ) : null}
        {weather && weather.rain24h > 0 && (
          <p className="text-[10px] text-brew-text-dim mt-1.5">
            {weather.rain24h}mm in last 24h · {weather.rain48h}mm in last 48h
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3.5 border-t border-brew-border">
        <a
          href={trail.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-brew-accent flex items-center gap-1.5 hover:opacity-70 transition-opacity tracking-wide"
        >
          📍 View on Maps →
        </a>
      </div>
    </div>
  );
}
