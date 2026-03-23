import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { todayISO } from '../../utils/formatters';

const INPUT_CLASS =
  'w-full bg-brew-bg border border-brew-border rounded-lg px-3 py-2.5 text-brew-text placeholder:text-brew-text-muted text-sm focus:outline-none focus:border-brew-accent transition-colors';

/**
 * Modal dialog to log a completed service event.
 * On confirm: writes ServiceRecord + resets bike distance/hours to 0.
 *
 * @param {{ bikeData: object, onConfirm: (record, bikeUpdates) => Promise<void>, onClose: () => void }} props
 */
export default function ServiceDetailsDialog({ bikeData, onConfirm, onClose }) {
  const [shopName, setShopName] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(todayISO());
  const [serviceType, setServiceType] = useState('minor');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!shopName.trim()) return;
    setSubmitting(true);

    const record = {
      date,
      shopName: shopName.trim(),
      cost: Number(cost) || 0,
      distanceAtService: bikeData?.totalDistance ?? 0,
      hoursAtService: bikeData?.totalHours ?? 0,
      serviceType,
    };

    const bikeUpdates = {
      totalDistance: 0,
      totalHours: 0,
      lastServiceDate: date,
    };

    await onConfirm(record, bikeUpdates);
    setSubmitting(false);
  };

  // Close on backdrop click
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
          <div>
            <h2 className="font-bold text-brew-text text-base">Mark as Serviced</h2>
            <p className="text-xs text-brew-text-muted mt-0.5">
              Resets distance &amp; hours counters to zero.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-brew-text-muted hover:text-brew-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-3">
          {/* Shop name */}
          <div>
            <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
              Shop / Mechanic
            </label>
            <input
              type="text"
              placeholder="e.g. Trail Bikes JHB, Self"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className={INPUT_CLASS}
              autoFocus
            />
          </div>

          {/* Cost */}
          <div>
            <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
              Cost (R)
            </label>
            <input
              type="number"
              placeholder="0"
              min="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${INPUT_CLASS} font-mono`}
            />
          </div>

          {/* Service type toggle */}
          <div>
            <label className="block font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-1.5">
              Service Type
            </label>
            <div className="flex gap-2">
              {['minor', 'major'].map((type) => (
                <button
                  key={type}
                  onClick={() => setServiceType(type)}
                  className={`
                    flex-1 font-mono text-[11px] py-2 rounded-lg border uppercase tracking-wide font-bold transition-all
                    ${serviceType === type
                      ? 'bg-brew-accent text-brew-bg border-brew-accent'
                      : 'border-brew-border text-brew-text-dim hover:border-brew-text-dim hover:text-brew-text'
                    }
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Snapshot info */}
          <p className="font-mono text-[10px] text-brew-text-muted pt-1">
            Recording at&nbsp;
            <span className="text-brew-text-dim">{bikeData?.totalDistance ?? 0} km</span>
            &nbsp;/&nbsp;
            <span className="text-brew-text-dim">{bikeData?.totalHours ?? 0} hrs</span>
          </p>
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
            onClick={handleConfirm}
            disabled={!shopName.trim() || submitting}
            className="flex-1 bg-brew-accent text-brew-bg font-bold text-sm rounded-lg py-2.5 hover:bg-[#D4F27A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
