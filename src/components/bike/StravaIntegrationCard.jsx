import { Activity } from 'lucide-react';

/**
 * Strava integration card — UI shell built in Phase 2.
 * OAuth flow and sync logic wired in Phase 3.
 */
export default function StravaIntegrationCard() {
  return (
    <div className="bg-brew-card border border-brew-border rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <Activity size={16} className="text-trail-enduro shrink-0" />
        <p className="font-bold text-brew-text text-sm">Strava Sync</p>
        <span className="ml-auto font-mono text-[10px] px-2 py-0.5 rounded-md bg-brew-card border border-brew-border text-brew-text-muted font-bold uppercase tracking-wide">
          Coming soon
        </span>
      </div>

      <p className="text-xs text-brew-text-dim leading-relaxed mb-4">
        Connect Strava to automatically update your distance and hours after every ride. No manual entries needed.
      </p>

      <button
        disabled
        className="w-full border border-brew-border text-brew-text-muted font-mono text-[11px] uppercase tracking-wide rounded-lg py-2.5 opacity-50 cursor-not-allowed"
      >
        Connect Strava
      </button>
    </div>
  );
}
