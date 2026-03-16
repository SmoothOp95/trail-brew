import { useState, useMemo } from 'react';
import TrailCard from './TrailCard';
import FilterChips from './FilterChips';
import SignInButton from '../auth/SignInButton';
import { useAuth } from '../../hooks/useAuth';

export default function ResultsScreen({ scored, matched, answers, threshold, onRetake }) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const { user, signOut } = useAuth();

  // Preference tags for summary
  const prefLabels = useMemo(() => {
    const labels = [];
    if (answers.style && answers.style !== 'any') labels.push(answers.style.toUpperCase());
    if (answers.terrain && answers.terrain !== 'any') labels.push(answers.terrain.toUpperCase());
    if (answers.difficulty && answers.difficulty !== 'any') labels.push(answers.difficulty.toUpperCase());
    if (answers.experience && answers.experience !== 'any') labels.push(answers.experience.toUpperCase());
    return labels;
  }, [answers]);

  // All unique trail types
  const allTypes = useMemo(() => {
    const types = new Set();
    scored.forEach((t) => t.types.forEach((ty) => types.add(ty)));
    return [...types].sort();
  }, [scored]);

  // Filter logic
  const displayTrails = useMemo(() => {
    let list = showAll ? scored : matched;
    if (typeFilter !== 'all') {
      list = list.filter((t) =>
        t.types.some((ty) => ty.toLowerCase() === typeFilter)
      );
    }
    return list;
  }, [scored, matched, showAll, typeFilter]);

  const otherCount = scored.length - matched.length;

  return (
    <div className="min-h-screen px-5 py-8 pb-20 animate-fade-slide">
      {/* Header */}
      <div className="max-w-[1100px] mx-auto flex items-center justify-between flex-wrap gap-4 mb-8">
        <button onClick={onRetake} className="flex items-center gap-3 cursor-pointer">
          <span className="text-3xl">⛰️</span>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">
            Trail Brew
          </span>
        </button>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-8 h-8 rounded-full border border-brew-border"
              />
              <span className="text-sm text-brew-text-dim hidden sm:block">{user.displayName}</span>
              <button
                onClick={signOut}
                className="font-mono text-xs text-brew-text-dim border border-brew-border px-3 py-2 rounded-lg hover:border-brew-accent hover:text-brew-accent transition-all uppercase tracking-wider"
              >
                Sign out
              </button>
            </>
          ) : (
            <SignInButton />
          )}
          <button
            onClick={onRetake}
            className="font-mono text-xs text-brew-text-dim border border-brew-border px-4 py-2 rounded-lg hover:border-brew-accent hover:text-brew-accent transition-all uppercase tracking-wider"
          >
            ↺ Retake Quiz
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="max-w-[1100px] mx-auto bg-brew-card border border-brew-border rounded-2xl p-7 flex items-center gap-6 flex-wrap mb-10">
        <span className="text-4xl">🎯</span>
        <div>
          <h2 className="text-xl font-bold">
            {matched.length} trail{matched.length !== 1 ? 's' : ''}{' '}
            {matched.length === 1 ? 'matches' : 'match'} your vibe
          </h2>
          <p className="text-brew-text-dim text-sm">
            {showAll
              ? `Showing all ${scored.length} trails`
              : `Showing your best matches${otherCount > 0 ? ` • ${otherCount} more available` : ''}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap ml-auto">
          {prefLabels.map((l) => (
            <span
              key={l}
              className="font-mono text-[11px] px-3 py-1 rounded-md bg-brew-accent/[0.08] text-brew-accent border border-brew-accent/[0.15]"
            >
              {l}
            </span>
          ))}
        </div>
      </div>

      {/* Filters */}
      <FilterChips
        types={allTypes}
        active={typeFilter}
        onChange={setTypeFilter}
      />

      {/* Trail grid */}
      {displayTrails.length > 0 ? (
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTrails.map((trail) => (
            <TrailCard key={trail.id} trail={trail} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 max-w-[1100px] mx-auto">
          <p className="text-5xl mb-4">🤔</p>
          <h3 className="text-xl font-bold mb-2">No strong matches for that combo</h3>
          <p className="text-brew-text-dim text-sm">
            Try a different filter, or check out all the trails below.
          </p>
        </div>
      )}

      {/* Show all / show matches toggle */}
      {otherCount > 0 && (
        <div className="text-center mt-6">
          <button
            onClick={() => setShowAll((s) => !s)}
            className="font-mono text-sm text-brew-accent bg-brew-accent/[0.06] border-[1.5px] border-brew-accent/20 px-7 py-3 rounded-xl hover:bg-brew-accent/[0.12] hover:border-brew-accent hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(184,230,72,0.1)] transition-all"
          >
            {showAll ? 'Show matches only' : `Show all ${scored.length} trails`}
          </button>
        </div>
      )}
    </div>
  );
}
