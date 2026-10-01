import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Provenance } from '../engine/types';
import type { EmptyReason } from '../search/search';

/** Prototype section header: letter, title, hint on the right. */
export function Section({ letter, title, hint, children, className = '' }: { letter?: string; title: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`mb-11 ${className}`}>
      <h2 className="flex items-baseline gap-2.5 text-[15px] font-semibold tracking-tight pb-2 mb-4 border-b border-white/10">
        {letter && <span className="font-mono text-xs font-normal text-brew-text-muted">{letter}</span>}
        <span>{title}</span>
        {hint && <span className="ml-auto text-xs font-normal text-brew-text-muted text-right">{hint}</span>}
      </h2>
      {children}
    </section>
  );
}

const PROV: Record<Provenance | 'yours', { label: string; cls: string; title: string }> = {
  published: {
    label: 'published', cls: 'text-brew-accent border-brew-accent/40 bg-brew-accent/[0.06]',
    title: 'Read from a manufacturer document.',
  },
  derived: {
    label: 'derived', cls: 'text-trail-xc border-trail-xc/40 bg-trail-xc/[0.06]',
    title: 'Computed from a model with real inputs.',
  },
  estimated: {
    label: 'estimate', cls: 'text-trail-technical border-trail-technical/40 bg-trail-technical/[0.06]',
    title: 'A best estimate, not a manufacturer figure. Check it against your bike.',
  },
  unknown: {
    label: 'unknown', cls: 'text-brew-text-dim border-dashed border-brew-text-muted',
    title: 'Not known. Enter your own value.',
  },
  yours: { label: 'yours', cls: 'text-brew-text border-white/20', title: 'The value you entered.' },
};

/** Visually distinct provenance: published, derived, estimate, unknown, or the rider's own value. */
export function ProvenanceTag({ provenance, title }: { provenance: Provenance | 'yours'; title?: string }) {
  const p = PROV[provenance];
  return (
    <span
      title={title ? `${p.title} ${title}` : p.title}
      className={`inline-flex items-center font-mono text-[9.5px] uppercase tracking-wider border rounded px-1.5 py-[1px] leading-4 ${p.cls}`}
    >
      {p.label}
    </span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'solid' | 'ghost' | 'quiet' };

export function Button({ variant = 'solid', className = '', ...rest }: BtnProps) {
  const base =
    'inline-flex items-center justify-center gap-2 text-sm rounded-md px-4 py-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brew-accent disabled:opacity-40 disabled:cursor-not-allowed';
  const styles = {
    solid: 'bg-brew-accent text-brew-bg font-semibold hover:bg-brew-accent-dim',
    ghost: 'border border-white/15 text-brew-text hover:border-brew-accent hover:text-brew-accent',
    quiet: 'text-brew-text-dim hover:text-brew-text px-2',
  };
  return <button type="button" className={`${base} ${styles[variant]} ${className}`} {...rest} />;
}

export const inputCls =
  'bg-brew-card border border-white/10 rounded-md px-2.5 py-1.5 text-sm text-brew-text tabular-nums focus:outline-none focus:border-brew-accent/70 placeholder:text-brew-text-muted';

/** An empty step never dead-ends silently: it says why, which harvest fills it, and what to do next. */
export function EmptyNotice({ reason, action }: { reason: EmptyReason; action?: ReactNode }) {
  return (
    <div className="border-l-2 border-trail-technical/60 bg-brew-card px-4 py-3 text-sm text-brew-text-dim rounded-r-md">
      <p>{reason.message}</p>
      {(reason.stage || action) && (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {reason.stage && <span className="font-mono text-[10px] uppercase tracking-wider text-brew-text-muted">Filled by harvest {reason.stage}</span>}
          {action}
        </div>
      )}
    </div>
  );
}

export function downloadText(filename: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
