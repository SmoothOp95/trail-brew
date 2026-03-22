import { useState, useCallback } from 'react';
import { Wrench, Clock, X } from 'lucide-react';
import { useBikeData } from '../hooks/useBikeData';
import { useAuth } from '../hooks/useAuth';
import BikeStatusCard from '../components/bike/BikeStatusCard';
import ManualEntryCard from '../components/bike/ManualEntryCard';
import StravaIntegrationCard from '../components/bike/StravaIntegrationCard';
import ServiceHistoryChart from '../components/bike/ServiceHistoryChart';
import SignInButton from '../components/auth/SignInButton';
import Toast from '../components/bike/Toast';

export default function MyBikePage() {
  const { user } = useAuth();
  const { bikeData, loading, updateBikeData, addServiceRecord, serviceHistory, repairHistory } = useBikeData();
  const [toast, setToast] = useState(null);
  const [guestBannerDismissed, setGuestBannerDismissed] = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Auth loading ───────────────────────────────────────────────────────────
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-brew-bg text-brew-text flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-brew-border border-t-brew-accent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  if (loading || !bikeData) {
    return (
      <div className="min-h-screen bg-brew-bg text-brew-text flex flex-col">
        <PageHeader />
        <div className="max-w-lg mx-auto w-full px-5 py-6 space-y-3">
          <SkeletonCard tall />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Combine and sort all records newest-first
  const allRecords = [...serviceHistory, ...repairHistory]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // ── Authenticated & loaded ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brew-bg text-brew-text">
      <PageHeader bikeData={bikeData} />

      <div className="max-w-lg mx-auto w-full px-5 py-6 space-y-3">

        {/* Guest mode banner */}
        {!user && !guestBannerDismissed && (
          <div className="flex items-start gap-3 bg-brew-card border border-brew-accent/20 rounded-xl px-4 py-3.5">
            <Wrench size={15} className="text-brew-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brew-text leading-snug">Guest mode</p>
              <p className="text-xs text-brew-text-dim mt-0.5 leading-relaxed">
                Data is saved locally on this device. Sign in to sync across devices.
              </p>
              <div className="mt-2.5">
                <SignInButton />
              </div>
            </div>
            <button
              onClick={() => setGuestBannerDismissed(true)}
              className="text-brew-text-dim hover:text-brew-text transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Bike status card */}
        <BikeStatusCard
          bikeData={bikeData}
          onUpdate={updateBikeData}
          onAddService={addServiceRecord}
          onToast={showToast}
        />

        {/* Manual ride entry */}
        <ManualEntryCard
          bikeData={bikeData}
          onAdd={updateBikeData}
          onToast={showToast}
        />

        {/* Strava sync (wired in Phase 3) */}
        <StravaIntegrationCard />

        {/* ── Service History ─────────────────────────────────────────────── */}
        <div className="pt-4">
          <p className="font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-3">
            Service History
          </p>

          {allRecords.length === 0 ? (
            <div className="bg-brew-card border border-brew-border rounded-xl px-5 py-8 flex flex-col items-center text-center">
              <Clock size={28} className="text-brew-text-muted mb-3" />
              <p className="text-sm font-semibold text-brew-text mb-0.5">No records yet</p>
              <p className="text-xs text-brew-text-dim">
                Mark a service above and it will appear here.
              </p>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <StatPill label="Services" value={serviceHistory.length} accent />
                <StatPill label="Repairs"  value={repairHistory.length} />
                <StatPill
                  label="Total Spend"
                  value={`R${allRecords.reduce((s, r) => s + (r.cost || 0), 0).toLocaleString('en-ZA')}`}
                />
              </div>

              {/* Chart — only when 3+ records */}
              <ServiceHistoryChart records={allRecords} />

              {/* Records list */}
              <div className="space-y-2 mt-3">
                {allRecords.map((record) => (
                  <RecordRow key={`${record.type}-${record.id}`} record={record} />
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismissToast} />
      )}
    </div>
  );
}

/** Sticky page header */
function PageHeader({ bikeData }) {
  return (
    <div className="border-b border-brew-border bg-brew-card/60 backdrop-blur-sm sticky top-[49px] lg:top-0 z-10">
      <div className="max-w-lg mx-auto px-5 py-5">
        <h1 className="text-xl font-bold leading-tight">Service Dashboard</h1>
        <p className="text-xs text-brew-text-dim mt-0.5">
          {bikeData ? `${bikeData.nickname} · tracker & history` : 'Tracker & history'}
        </p>
      </div>
    </div>
  );
}

/** Single maintenance record row */
function RecordRow({ record }) {
  const isService = record.type === 'service';
  return (
    <div className="bg-brew-card border border-brew-border rounded-xl px-4 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`
          shrink-0 font-mono text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide
          ${isService
            ? 'bg-brew-accent/10 text-brew-accent border border-brew-accent/20'
            : 'bg-trail-xc/10 text-trail-xc border border-trail-xc/20'
          }
        `}>
          {isService ? record.serviceType : 'Repair'}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brew-text truncate">{record.shopName}</p>
          {!isService && record.description && (
            <p className="text-xs text-brew-text-dim truncate">{record.description}</p>
          )}
          <p className="font-mono text-[10px] text-brew-text-muted mt-0.5">{record.date}</p>
        </div>
      </div>
      <p className="font-mono font-bold text-brew-text shrink-0">R{record.cost}</p>
    </div>
  );
}

/** Compact summary stat pill */
function StatPill({ label, value, accent }) {
  return (
    <div className="bg-brew-card border border-brew-border rounded-xl px-3 py-2.5 text-center">
      <p className={`font-mono font-bold text-base leading-none mb-1 ${accent ? 'text-brew-accent' : 'text-brew-text'}`}>
        {value}
      </p>
      <p className="font-mono text-[10px] text-brew-text-muted uppercase tracking-wide">{label}</p>
    </div>
  );
}

/** Loading skeleton */
function SkeletonCard({ tall }) {
  return (
    <div className={`bg-brew-card border border-brew-border rounded-xl p-6 animate-pulse ${tall ? 'h-56' : 'h-24'}`}>
      <div className="h-3 bg-brew-border rounded w-1/3 mb-3" />
      <div className="h-2 bg-brew-border rounded w-1/2" />
    </div>
  );
}
