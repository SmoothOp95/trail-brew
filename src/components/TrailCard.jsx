import { useState, useEffect } from 'react';
import {
  MapPin,
  Cloud,
  Droplets,
  Wind,
  Eye,
  Thermometer,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
} from 'lucide-react';
import {
  getCurrentWeather,
  getRidingConditions,
  formatSunTime,
} from '../utils/weatherService';

const TIER_STYLES = {
  fitness: { label: 'Fitness', bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
  warrior: { label: 'Warrior', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  gold: { label: 'Gold', bg: 'bg-yellow-400/15', text: 'text-yellow-300', border: 'border-yellow-400/30' },
};

const DIFFICULTY_STYLES = {
  beginner: { label: 'Beginner', bg: 'bg-green-500/15', text: 'text-green-400' },
  intermediate: { label: 'Intermediate', bg: 'bg-blue-500/15', text: 'text-blue-400' },
  advanced: { label: 'Advanced', bg: 'bg-red-500/15', text: 'text-red-400' },
};

const CONDITION_COLORS = {
  good: { label: 'Good conditions', text: 'text-green-400', dot: 'bg-green-400', border: 'border-green-700/40', bg: 'bg-green-950/60' },
  caution: { label: 'Ride with caution', text: 'text-orange-400', dot: 'bg-orange-400', border: 'border-orange-700/40', bg: 'bg-orange-950/60' },
  poor: { label: 'Not recommended', text: 'text-red-400', dot: 'bg-red-500', border: 'border-red-700/40', bg: 'bg-red-950/60' },
};

const DESCRIPTION_TRUNCATE = 120;

export default function TrailCard({ trail, onSelect, isSelected }) {
  const [weather, setWeather] = useState(null);
  const [ridingConditions, setRidingConditions] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [showWeather, setShowWeather] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const tier = TIER_STYLES[trail.tier] || TIER_STYLES.fitness;
  const descriptionLong = trail.description && trail.description.length > DESCRIPTION_TRUNCATE;
  const descriptionText =
    trail.description && !showFullDescription && descriptionLong
      ? trail.description.slice(0, DESCRIPTION_TRUNCATE).trimEnd() + '…'
      : trail.description;

  // Fetch weather only when the toggle is turned on for the first time
  useEffect(() => {
    if (!showWeather || weather || !trail.coordinates) return;

    let cancelled = false;
    setWeatherLoading(true);
    setWeatherError(null);

    getCurrentWeather(trail.coordinates.lat, trail.coordinates.lng)
      .then((data) => {
        if (cancelled) return;
        setWeather(data);
        setRidingConditions(getRidingConditions(data));
        setWeatherLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setWeatherError(err.message);
        setWeatherLoading(false);
      });

    return () => { cancelled = true; };
  }, [showWeather, trail.coordinates, weather]);

  return (
    <div
      className={`bg-brew-card border rounded-xl p-5 transition-all duration-300 relative overflow-hidden group flex flex-col
        ${isSelected
          ? 'border-brew-accent/50 shadow-[0_0_0_1px_rgba(184,230,72,0.25)]'
          : 'border-brew-border hover:border-brew-accent/20 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]'
        }`}
    >
      {/* Top accent line on hover */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brew-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[17px] font-bold leading-snug mb-1">{trail.name}</h3>
          {trail.location && (
            <div className="flex items-center gap-1 text-brew-text-dim text-xs">
              <MapPin size={11} className="shrink-0" />
              <span>{trail.location}</span>
            </div>
          )}
        </div>
        {trail.tier && (
          <span
            className={`shrink-0 font-mono text-[11px] px-2 py-0.5 rounded-md border uppercase tracking-wide font-bold
              ${tier.bg} ${tier.text} ${tier.border}`}
          >
            {tier.label}
          </span>
        )}
      </div>

      {/* ── DESCRIPTION ── */}
      {trail.description && (
        <div className="mb-3">
          <p className="text-xs text-brew-text-dim leading-relaxed">{descriptionText}</p>
          {descriptionLong && (
            <button
              onClick={() => setShowFullDescription((v) => !v)}
              className="mt-1 flex items-center gap-1 text-[11px] text-brew-accent hover:opacity-70 transition-opacity font-mono tracking-wide"
            >
              {showFullDescription ? (
                <><ChevronUp size={12} /> Show less</>
              ) : (
                <><ChevronDown size={12} /> Read more</>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── SURFACE ── */}
      {trail.surface && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-brew-border">
          <p className="font-mono text-[10px] uppercase tracking-wider text-brew-text-dim mb-1">Surface</p>
          <p className="text-[11px] text-brew-text-dim leading-relaxed">{trail.surface}</p>
        </div>
      )}

      {/* ── STATS GRID ── */}
      <div className="flex flex-wrap gap-2 mb-3">
        {trail.distance && (
          <div className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-brew-border">
            <span className="font-mono text-[10px] uppercase tracking-wide text-brew-text-dim">Dist </span>
            <span className="text-[11px] font-semibold text-brew-text">{trail.distance}</span>
          </div>
        )}
        {trail.difficultyLevels?.map((d) => {
          const s = DIFFICULTY_STYLES[d] || { label: d, bg: 'bg-white/10', text: 'text-brew-text-dim' };
          return (
            <span key={d} className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${s.bg} ${s.text} capitalize`}>
              {s.label}
            </span>
          );
        })}
      </div>

      {/* ── FEATURE TAGS ── */}
      {trail.features?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {trail.features.map((f) => (
            <span
              key={f}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 capitalize tracking-wide"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* ── WEATHER TOGGLE ── */}
      {trail.coordinates && (
        <div className="mt-auto pt-3 border-t border-brew-border">
          <button
            onClick={() => setShowWeather((v) => !v)}
            className="flex items-center gap-2 font-mono text-[11px] text-brew-text-dim hover:text-brew-accent transition-colors tracking-wide uppercase"
          >
            <Cloud size={13} />
            {showWeather ? 'Hide Weather' : 'Show Current Weather'}
          </button>

          {showWeather && (
            <div className="mt-3">
              {weatherLoading && (
                <div className="space-y-2">
                  <div className="h-4 rounded bg-brew-border/40 animate-pulse w-3/4" />
                  <div className="h-4 rounded bg-brew-border/40 animate-pulse w-1/2" />
                </div>
              )}

              {weatherError && (
                <p className="text-[11px] text-red-400 leading-relaxed">{weatherError}</p>
              )}

              {weather && ridingConditions && !weatherLoading && (
                <div className="space-y-3">
                  {/* Temp + icon */}
                  <div className="flex items-center gap-3">
                    <span className="text-4xl leading-none select-none">{weather.icon}</span>
                    <div>
                      <p className="text-xl font-bold leading-none">{weather.temperature}°C</p>
                      <p className="text-xs text-brew-text-dim capitalize mt-0.5">{weather.description}</p>
                    </div>
                  </div>

                  {/* Riding conditions badge */}
                  {(() => {
                    const cs = CONDITION_COLORS[ridingConditions.status];
                    return (
                      <div className={`rounded-lg px-3 py-2 border ${cs.bg} ${cs.border}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${cs.dot}`} />
                          <span className={`font-mono text-[11px] font-bold uppercase tracking-wide ${cs.text}`}>
                            {cs.label}
                          </span>
                        </div>
                        <p className={`text-[11px] ${cs.text}`}>{ridingConditions.message}</p>
                        {ridingConditions.factors.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {ridingConditions.factors.map((f, i) => (
                              <li key={i} className={`text-[10px] ${cs.text} flex items-start gap-1`}>
                                <span className="mt-0.5">•</span>
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })()}

                  {/* Weather detail grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-brew-text-dim">
                    <div className="flex items-center gap-1.5">
                      <Thermometer size={11} className="text-brew-accent shrink-0" />
                      <span>Feels like <strong className="text-brew-text">{weather.feelsLike}°C</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Droplets size={11} className="text-brew-accent shrink-0" />
                      <span>Humidity <strong className="text-brew-text">{weather.humidity}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wind size={11} className="text-brew-accent shrink-0" />
                      <span>Wind <strong className="text-brew-text">{weather.windSpeed} km/h {weather.windDirection}</strong></span>
                    </div>
                    {weather.visibility != null && (
                      <div className="flex items-center gap-1.5">
                        <Eye size={11} className="text-brew-accent shrink-0" />
                        <span>Visibility <strong className="text-brew-text">{weather.visibility} km</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Sun times */}
                  <div className="flex gap-4 text-[11px] text-brew-text-dim border-t border-brew-border pt-2">
                    <div className="flex items-center gap-1.5">
                      <Sun size={11} className="text-yellow-400 shrink-0" />
                      <span>Sunrise <strong className="text-brew-text">{formatSunTime(weather.sunrise)}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Moon size={11} className="text-blue-400 shrink-0" />
                      <span>Sunset <strong className="text-brew-text">{formatSunTime(weather.sunset)}</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── ACTION BUTTON ── */}
      <div className="mt-3 pt-3 border-t border-brew-border flex items-center justify-between gap-3">
        <a
          href={trail.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] text-brew-text-dim flex items-center gap-1.5 hover:text-brew-accent transition-colors tracking-wide"
        >
          <MapPin size={11} />
          View on Maps →
        </a>
        {onSelect && (
          <button
            onClick={() => onSelect(trail)}
            className={`flex items-center gap-1.5 font-mono text-[11px] px-3 py-1.5 rounded-md transition-all tracking-wide uppercase font-bold
              ${isSelected
                ? 'bg-brew-accent/20 text-brew-accent border border-brew-accent/40'
                : 'bg-white/[0.06] text-brew-text-dim border border-brew-border hover:border-brew-accent/30 hover:text-brew-text'
              }`}
          >
            {isSelected ? <CheckCircle size={11} /> : <Circle size={11} />}
            {isSelected ? 'Selected' : 'Select Trail'}
          </button>
        )}
      </div>
    </div>
  );
}
