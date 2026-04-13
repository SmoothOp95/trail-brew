import { useState } from 'react';
import { MapPin, CheckSquare, Square, Plus } from 'lucide-react';
import { trails } from '../data/trails';
import { useRiddenTrails } from '../hooks/useRiddenTrails';
import { getTypeColor } from '../data/trailTypes';
import LogRideModal from '../components/trails/LogRideModal';

export default function MyTrailsPage() {
  const { toggleRidden, isRidden, loading, riddenTrails } = useRiddenTrails();
  const [activeModal, setActiveModal] = useState(null); // { trail, mode: 'log'|'history' }

  const riddenCount = riddenTrails.size;
  const totalCount = trails.length;
  const progressPct = totalCount > 0 ? (riddenCount / totalCount) * 100 : 0;

  const openLog = (trail) => setActiveModal({ trail, mode: 'log' });
  const openHistory = (trail) => setActiveModal({ trail, mode: 'history' });
  const closeModal = () => setActiveModal(null);

  const handleRideLogged = (trail) => {
    // Ensure the trail is marked as ridden in the list after logging
    if (!isRidden(trail.id)) {
      toggleRidden(trail.id);
    }
  };

  return (
    <div className="min-h-screen bg-brew-bg text-brew-text">
      {/* Page header */}
      <div className="border-b border-brew-border bg-brew-card/60 backdrop-blur-sm sticky top-[49px] lg:top-0 z-10">
        <div className="max-w-[800px] mx-auto px-5 py-5">
          <h1 className="text-xl font-bold leading-tight">My Trails</h1>
          <p className="text-xs text-brew-text-dim mt-0.5">
            {loading ? 'Loading…' : `${riddenCount} of ${totalCount} trails ridden`}
          </p>
          {/* Progress bar */}
          <div className="w-full h-[3px] bg-brew-border rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-brew-accent rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trail list */}
      <div className="max-w-[800px] mx-auto px-5 py-6 space-y-2">
        {trails.map((trail) => (
          <TrailRow
            key={trail.id}
            trail={trail}
            ridden={isRidden(trail.id)}
            onToggle={() => toggleRidden(trail.id)}
            onLogRide={() => openLog(trail)}
            onViewHistory={() => openHistory(trail)}
            disabled={loading}
          />
        ))}
      </div>

      {/* Log ride modal */}
      {activeModal && (
        <LogRideModal
          trail={activeModal.trail}
          initialMode={activeModal.mode}
          onClose={closeModal}
          onRideLogged={() => handleRideLogged(activeModal.trail)}
        />
      )}
    </div>
  );
}

function TrailRow({ trail, ridden, onToggle, onLogRide, onViewHistory, disabled }) {
  return (
    <div
      className={`
        flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
        ${ridden
          ? 'bg-brew-accent/[0.04] border-brew-accent/20'
          : 'bg-brew-card border-brew-border hover:border-brew-accent/15'
        }
      `}
    >
      {/* Trail info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[15px] leading-snug">{trail.name}</p>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          {trail.location && (
            <span className="text-xs text-brew-text-dim flex items-center gap-1">
              <MapPin size={10} />
              {trail.location}
            </span>
          )}
          {trail.types?.slice(0, 2).map((type) => {
            const colors = getTypeColor(type);
            return (
              <span
                key={type}
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} uppercase tracking-wide`}
              >
                {type}
              </span>
            );
          })}
          {trail.difficultyLevels?.slice(0, 1).map((d) => (
            <span key={d} className="font-mono text-[10px] text-brew-text-muted capitalize">
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Ridden toggle */}
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`
            flex items-center gap-1.5 font-mono text-[11px] px-3 py-2 rounded-lg border
            transition-all duration-200 uppercase tracking-wide font-bold
            disabled:opacity-40 disabled:cursor-not-allowed
            ${ridden
              ? 'bg-brew-accent/15 text-brew-accent border-brew-accent/30 hover:bg-brew-accent/25'
              : 'bg-white/[0.04] text-brew-text-dim border-brew-border hover:border-brew-accent/30 hover:text-brew-text'
            }
          `}
          style={{ minHeight: '44px' }}
        >
          {ridden ? <CheckSquare size={13} /> : <Square size={13} />}
          {ridden ? 'Ridden' : 'Not Ridden'}
        </button>

        {/* Log ride / history button */}
        {ridden ? (
          <button
            onClick={onViewHistory}
            disabled={disabled}
            className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-2 rounded-lg border border-brew-border text-brew-text-dim hover:border-brew-accent/30 hover:text-brew-text transition-all duration-200 uppercase tracking-wide font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ minHeight: '44px' }}
            title="View / log ride"
          >
            <Plus size={13} />
            Ride
          </button>
        ) : (
          <button
            onClick={onLogRide}
            disabled={disabled}
            className="flex items-center gap-1.5 font-mono text-[11px] px-3 py-2 rounded-lg border border-brew-border text-brew-text-dim hover:border-brew-accent/30 hover:text-brew-text transition-all duration-200 uppercase tracking-wide font-bold disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ minHeight: '44px' }}
            title="Log a ride"
          >
            <Plus size={13} />
            Ride
          </button>
        )}
      </div>
    </div>
  );
}
