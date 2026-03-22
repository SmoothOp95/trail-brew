import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

const INPUT_CLASS =
  'flex-1 bg-brew-bg border border-brew-border rounded-lg px-3 py-2.5 text-brew-text placeholder:text-brew-text-muted font-mono text-sm focus:outline-none focus:border-brew-accent transition-colors min-w-0';

/**
 * Card for adding ride distance and hours manually (without Strava).
 * Adds to running totals — does not reset them.
 *
 * @param {{ bikeData: object, onAdd: (updates: object) => Promise<void>, onToast: (msg: string) => void }} props
 */
export default function ManualEntryCard({ bikeData, onAdd, onToast }) {
  const [km, setKm] = useState('');
  const [hrs, setHrs] = useState('');
  const [saving, setSaving] = useState(false);

  const hasInput = km !== '' || hrs !== '';

  const handleAdd = async () => {
    if (!hasInput) return;
    setSaving(true);

    await onAdd({
      totalDistance: (bikeData?.totalDistance ?? 0) + (Number(km) || 0),
      totalHours: (bikeData?.totalHours ?? 0) + (Number(hrs) || 0),
    });

    setKm('');
    setHrs('');
    setSaving(false);
    onToast('Ride added.');
  };

  return (
    <div className="bg-brew-card border border-brew-border rounded-xl p-5">
      <p className="font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-3">
        Add Ride Manually
      </p>

      <div className="flex gap-2 items-center">
        <input
          type="number"
          placeholder="km"
          min="0"
          value={km}
          onChange={(e) => setKm(e.target.value)}
          className={INPUT_CLASS}
        />
        <input
          type="number"
          placeholder="hrs"
          min="0"
          step="0.1"
          value={hrs}
          onChange={(e) => setHrs(e.target.value)}
          className={INPUT_CLASS}
        />
        <button
          onClick={handleAdd}
          disabled={!hasInput || saving}
          className="shrink-0 bg-brew-accent text-brew-bg font-bold rounded-lg px-4 py-2.5 hover:bg-[#D4F27A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {saving
            ? <Loader2 size={14} className="animate-spin" />
            : <Plus size={14} />
          }
        </button>
      </div>

      <p className="font-mono text-[10px] text-brew-text-muted mt-2">
        Current totals — {bikeData?.totalDistance ?? 0} km · {bikeData?.totalHours ?? 0} hrs
      </p>
    </div>
  );
}
