import { useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

/**
 * Toast notification — fixed bottom-center, auto-dismisses after 3s.
 * Uses existing brew tokens and animate-fade-slide from index.css.
 *
 * @param {{ message: string, type?: 'success'|'error', onDismiss: () => void }} props
 */
export default function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  const iconColor = type === 'success' ? 'text-brew-accent' : 'text-trail-enduro';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-slide">
      <div className="flex items-center gap-3 bg-brew-card border border-brew-border rounded-xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] min-w-[220px] max-w-xs">
        <Icon size={16} className={`shrink-0 ${iconColor}`} />
        <p className="text-sm text-brew-text flex-1">{message}</p>
        <button
          onClick={onDismiss}
          className="text-brew-text-muted hover:text-brew-text transition-colors shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
