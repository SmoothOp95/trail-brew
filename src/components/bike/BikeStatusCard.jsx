import { useState } from 'react';
import { Settings, Wrench, Route, Clock } from 'lucide-react';
import { calculateServiceStatus, calculateProgressPcts } from '../../utils/serviceStatus';
import ServiceDetailsDialog from './ServiceDetailsDialog';
import BikeSettingsDialog from './BikeSettingsDialog';

/** Maps service status to badge display config using existing brew/trail tokens */
const STATUS_CONFIG = {
  good: {
    label: 'SERVICE OK',
    badge: 'bg-brew-accent/10 text-brew-accent border border-brew-accent/20',
    bar: 'bg-brew-accent',
  },
  warning: {
    label: 'DUE SOON',
    badge: 'bg-trail-technical/10 text-trail-technical border border-trail-technical/20',
    bar: 'bg-trail-technical',
  },
  overdue: {
    label: 'OVERDUE',
    badge: 'bg-trail-enduro/10 text-trail-enduro border border-trail-enduro/20',
    bar: 'bg-trail-enduro',
  },
};

/**
 * Primary bike service status card.
 * Shows nickname, status, distance/hours stats, progress bars, and action buttons.
 *
 * @param {{ bikeData: object, onUpdate: (updates) => Promise<void>, onAddService: (record, bikeUpdates) => Promise<void>, onToast: (msg: string, type?: string) => void }} props
 */
export default function BikeStatusCard({ bikeData, onUpdate, onAddService, onToast }) {
  const [serviceOpen, setServiceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const status = calculateServiceStatus(bikeData);
  const { distancePct, hoursPct } = calculateProgressPcts(bikeData);
  const config = STATUS_CONFIG[status.status];

  const lastServiced = bikeData.lastServiceDate
    ? new Date(bikeData.lastServiceDate).toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : 'Not set yet';

  const handleServiceConfirm = async (record, bikeUpdates) => {
    await onAddService(record, bikeUpdates);
    setServiceOpen(false);
    onToast('Service logged. Counters reset.');
  };

  const handleSettingsSave = async (updates) => {
    await onUpdate(updates);
    onToast('Settings saved.');
  };

  return (
    <>
      <div className="bg-brew-card border border-brew-border rounded-xl p-6">

        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-bold text-brew-text text-lg leading-tight">
              {bikeData.nickname}
            </h2>
            <p className="font-mono text-[10px] text-brew-text-muted mt-0.5">
              Last serviced: {lastServiced}
            </p>
          </div>
          {/* Status badge */}
          <span className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wide whitespace-nowrap ${config.badge}`}>
            {config.label}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatPill icon={Route} label="Distance" value={`${bikeData.totalDistance} km`} />
          <StatPill icon={Clock} label="Hours" value={`${bikeData.totalHours} hrs`} />
        </div>

        {/* Progress bars */}
        <div className="space-y-3 mb-6">
          <ProgressBar
            label="Distance"
            current={bikeData.totalDistance}
            max={bikeData.serviceIntervalDistance}
            unit="km"
            barClass={config.bar}
            pct={distancePct}
          />
          <ProgressBar
            label="Hours"
            current={bikeData.totalHours}
            max={bikeData.serviceIntervalHours}
            unit="hrs"
            barClass={config.bar}
            pct={hoursPct}
          />
        </div>

        {/* Action row */}
        <div className="flex gap-2">
          <button
            onClick={() => setServiceOpen(true)}
            className="flex-1 bg-brew-accent text-brew-bg font-bold text-sm rounded-lg py-2.5 hover:bg-[#D4F27A] transition-colors flex items-center justify-center gap-2"
          >
            <Wrench size={14} />
            Mark as Serviced
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="border border-brew-border text-brew-text-dim rounded-lg px-3.5 py-2.5 hover:bg-white/[0.04] hover:text-brew-text transition-colors"
            aria-label="Bike settings"
          >
            <Settings size={16} />
          </button>
        </div>

      </div>

      {serviceOpen && (
        <ServiceDetailsDialog
          bikeData={bikeData}
          onConfirm={handleServiceConfirm}
          onClose={() => setServiceOpen(false)}
        />
      )}

      {settingsOpen && (
        <BikeSettingsDialog
          bikeData={bikeData}
          onSave={handleSettingsSave}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="bg-brew-bg border border-brew-border rounded-lg px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={11} className="text-brew-text-muted" />
        <p className="font-mono text-[10px] text-brew-text-muted uppercase tracking-wide">{label}</p>
      </div>
      <p className="font-mono font-bold text-brew-text text-base">{value}</p>
    </div>
  );
}

function ProgressBar({ label, current, max, unit, barClass, pct }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] text-brew-text-muted mb-1.5">
        <span className="uppercase tracking-wide">{label}</span>
        <span>{current} / {max} {unit}</span>
      </div>
      <div className="w-full h-[3px] bg-brew-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
