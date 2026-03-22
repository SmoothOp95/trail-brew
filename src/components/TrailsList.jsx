import { useState, useMemo, useCallback } from 'react';
import { MapPin, Navigation, BookOpen, X, Search, SlidersHorizontal } from 'lucide-react';
import { trails } from '../data/trails';
import TrailCard from './TrailCard';

const TIERS = ['all', 'fitness', 'warrior', 'gold'];
const DIFFICULTIES = ['all', 'beginner', 'intermediate', 'advanced'];

const TIER_LABELS = { all: 'All Tiers', fitness: 'Fitness', warrior: 'Warrior', gold: 'Gold' };
const DIFFICULTY_LABELS = { all: 'All Difficulties', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export default function TrailsList() {
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [filterTier, setFilterTier] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = useCallback((trail) => {
    setSelectedTrail((prev) => (prev?.id === trail.id ? null : trail));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterTier('all');
    setFilterDifficulty('all');
    setSearchQuery('');
  }, []);

  const filteredTrails = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return trails.filter((trail) => {
      if (filterTier !== 'all' && trail.tier !== filterTier) return false;
      if (filterDifficulty !== 'all' && !trail.difficultyLevels?.includes(filterDifficulty)) return false;
      if (q) {
        const haystack = [trail.name, trail.location, trail.description, trail.tier]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [filterTier, filterDifficulty, searchQuery]);

  const hasActiveFilters = filterTier !== 'all' || filterDifficulty !== 'all' || searchQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-brew-bg text-brew-text">
      {/* ── PAGE HEADER ── */}
      <div className="border-b border-brew-border bg-brew-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1100px] mx-auto px-5 py-4">
          <h1 className="text-xl font-bold leading-tight">Gauteng MTB Trails</h1>
          <p className="text-xs text-brew-text-dim mt-0.5">
            Explore {trails.length} trails across Gauteng with live weather
          </p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-5 py-8">
        {/* ── FILTERS ── */}
        <div className="mb-6 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brew-text-dim pointer-events-none" />
            <input
              type="text"
              placeholder="Search trails by name, location, or description…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brew-card border border-brew-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-brew-text placeholder:text-brew-text-dim/50 focus:outline-none focus:border-brew-accent/40 transition-colors"
            />
          </div>

          {/* Dropdowns */}
          <div className="flex flex-wrap gap-3 items-center">
            <SlidersHorizontal size={14} className="text-brew-text-dim shrink-0" />

            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="bg-brew-card border border-brew-border rounded-lg px-3 py-1.5 text-sm text-brew-text focus:outline-none focus:border-brew-accent/40 transition-colors cursor-pointer"
            >
              {TIERS.map((t) => (
                <option key={t} value={t} className="bg-brew-card">
                  {TIER_LABELS[t]}
                </option>
              ))}
            </select>

            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="bg-brew-card border border-brew-border rounded-lg px-3 py-1.5 text-sm text-brew-text focus:outline-none focus:border-brew-accent/40 transition-colors cursor-pointer"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d} className="bg-brew-card">
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>

            {/* Active filter summary */}
            <span className="text-xs text-brew-text-dim ml-1">
              {filteredTrails.length === trails.length
                ? `All ${trails.length} trails`
                : `${filteredTrails.length} of ${trails.length} trails`}
            </span>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 font-mono text-[11px] text-brew-text-dim hover:text-brew-accent transition-colors tracking-wide uppercase"
              >
                <X size={11} />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* ── TRAIL GRID ── */}
        {filteredTrails.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrails.map((trail) => (
              <TrailCard
                key={trail.id}
                trail={trail}
                onSelect={handleSelect}
                isSelected={selectedTrail?.id === trail.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-2xl mb-2">🚵</p>
            <p className="text-brew-text-dim mb-4">No trails match your filters.</p>
            <button
              onClick={clearFilters}
              className="font-mono text-[11px] text-brew-accent border border-brew-accent/30 rounded-lg px-4 py-2 hover:bg-brew-accent/10 transition-colors tracking-wide uppercase"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── SELECTED TRAIL PANEL ── */}
      {selectedTrail && (
        <div className="fixed bottom-4 right-4 z-20 w-72 bg-brew-card border border-brew-accent/30 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-4 animate-fade-slide">
          {/* Close */}
          <button
            onClick={() => setSelectedTrail(null)}
            className="absolute top-3 right-3 text-brew-text-dim hover:text-brew-text transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>

          <p className="font-mono text-[10px] text-brew-accent uppercase tracking-wider mb-2">Selected trail</p>
          <h3 className="text-[15px] font-bold leading-snug mb-1">{selectedTrail.name}</h3>
          {selectedTrail.location && (
            <div className="flex items-center gap-1 text-xs text-brew-text-dim mb-3">
              <MapPin size={11} />
              <span>{selectedTrail.location}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <a
              href={selectedTrail.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-brew-accent text-brew-bg font-bold text-xs rounded-lg py-2 hover:opacity-90 transition-opacity"
            >
              <MapPin size={12} />
              View on Map
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedTrail.coordinates?.lat},${selectedTrail.coordinates?.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white/[0.06] border border-brew-border text-brew-text text-xs rounded-lg py-2 hover:bg-white/10 transition-colors"
            >
              <Navigation size={12} />
              Get Directions
            </a>
            <button
              onClick={() => alert(`Log ride for ${selectedTrail.name} — coming soon!`)}
              className="flex items-center justify-center gap-2 bg-white/[0.06] border border-brew-border text-brew-text-dim text-xs rounded-lg py-2 hover:bg-white/10 transition-colors"
            >
              <BookOpen size={12} />
              Log Ride
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
