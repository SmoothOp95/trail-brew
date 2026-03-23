import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

const INPUT_CLASS =
  'w-full bg-brew-bg border border-brew-border rounded-lg px-3 py-2.5 text-brew-text placeholder:text-brew-text-muted text-sm focus:outline-none focus:border-brew-accent transition-colors';

/**
 * Modal dialog for editing bike configuration.
 * Updates: nickname, service interval distance, service interval hours.
 *
 * @param {{ bikeData: object, onSave: (updates: object) => Promise<void>, onClose: () => void }} props
 */
export default function BikeSettingsDialog({ bikeData, onSave, onClose }) {
  const [nickname, setNickname] = useState(bikeData?.nickname ?? '');
  const [intervalDistance, setIntervalDistance] = useState(
    bikeData?.serviceIntervalDistance ?? 500
  );
  const [intervalHours, setIntervalHours] = useState(
    bikeData?.serviceIntervalHours ?? 50
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      nickname: nickname.trim() || 'Trail Blazer',
      serviceIntervalDistance: Number(intervalDistance) || 500,
      serviceIntervalHours: Number(intervalHours) || 50,
    });
    setSaving(false);
    onClose();
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-brew-bg/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-brew-card border border-brew-border rounded-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-brew-border">
          <h2 className="font-bold text-brew-text text-base">Bike Settings</h2>
          <button
            onClick={onClose}
            className="text-brew-text-muted hover:text-brew-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          {/* Nickname */}
          <div>
            <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
              Bike Nickname
            </label>
            <input
              type="text"
              placeholder="Trail Blazer"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className={INPUT_CLASS}
              autoFocus
            />
          </div>

          {/* Service interval distance */}
          <div>
            <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
              Service Interval (km)
            </label>
            <input
              type="number"
              placeholder="500"
              min="1"
              value={intervalDistance}
              onChange={(e) => setIntervalDistance(e.target.value)}
              className={`${INPUT_CLASS} font-mono`}
            />
            <p className="font-mono text-[10px] text-brew-text-muted mt-1">
              Default: 500 km
            </p>
          </div>

          {/* Service interval hours */}
          <div>
            <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
              Service Interval (hours)
            </label>
            <input
              type="number"
              placeholder="50"
              min="1"
              value={intervalHours}
              onChange={(e) => setIntervalHours(e.target.value)}
              className={`${INPUT_CLASS} font-mono`}
            />
            <p className="font-mono text-[10px] text-brew-text-muted mt-1">
              Default: 50 hrs
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 border border-brew-border text-brew-text-dim text-sm font-medium rounded-lg py-2.5 hover:bg-white/[0.04] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-brew-accent text-brew-bg font-bold text-sm rounded-lg py-2.5 hover:bg-[#D4F27A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
