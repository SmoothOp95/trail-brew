import type { AttributeResult } from '../engine/attributes';

/**
 * Six-axis radar, dashed now against solid proposed, as in the prototype. The viewBox is wider than the
 * prototype's so side labels ("Bottom out") are not clipped. One decimal at most, and the expert-prior
 * disclosure always shows.
 */
export function Radar({ result }: { result: AttributeResult }) {
  const cx = 180, cy = 142, R = 96, n = result.scores.length;
  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, (R * v) / 10).map((x) => x.toFixed(1)).join(',')).join(' ');
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_190px] gap-6 items-center">
      <svg viewBox="0 0 360 290" role="img" aria-labelledby="mtb-radar-title" className="w-full h-auto block">
        <title id="mtb-radar-title">Radar chart comparing six ride attributes now and with the proposed changes</title>
        {[2, 4, 6, 8, 10].map((lv) => (
          <polygon key={lv} points={poly(result.scores.map(() => lv))} className="fill-none stroke-white/10" strokeWidth="1" />
        ))}
        {result.scores.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="stroke-white/10" strokeWidth="1" />;
        })}
        <polygon points={poly(result.scores.map((s) => s.now))} className="fill-brew-text-dim/10 stroke-brew-text-dim" strokeWidth="1.6" strokeDasharray="4 3" />
        <polygon points={poly(result.scores.map((s) => s.proposed))} className="fill-brew-accent/20 stroke-brew-accent" strokeWidth="2.2" />
        {result.scores.map((s, i) => {
          const [x, y] = pt(i, R + 18);
          const anchor = x > cx + 6 ? 'start' : x < cx - 6 ? 'end' : 'middle';
          return (
            <text key={s.id} x={x} y={y + 4} textAnchor={anchor} className="fill-brew-text-dim text-[11px]">
              {s.label}
            </text>
          );
        })}
      </svg>
      <div className="text-[13px]">
        {result.scores.map((s) => {
          const flat = Math.abs(s.delta) < 0.15;
          return (
            <div key={s.id} className="flex justify-between py-1.5 border-b border-white/10">
              <span>{s.label}</span>
              <span className={flat ? 'text-brew-text-muted' : s.delta > 0 ? 'text-brew-accent font-semibold' : 'text-trail-enduro font-semibold'}>
                {flat ? 'no change' : `${s.delta > 0 ? '+' : ''}${s.delta.toFixed(1)}`}
              </span>
            </div>
          );
        })}
        <p className="mt-3 text-[11.5px] leading-snug text-brew-text-muted">
          <span className="font-mono uppercase tracking-wider text-[9.5px] text-trail-technical mr-1">{result.fitBasis.replace('_', ' ')}</span>
          {result.disclosure}
        </p>
      </div>
    </div>
  );
}
