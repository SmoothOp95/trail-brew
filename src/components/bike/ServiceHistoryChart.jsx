import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// Brew token hex values for recharts (can't read CSS vars directly)
const COLOR_SERVICE = '#B8E648'; // brew-accent
const COLOR_REPAIR  = '#48B9E6'; // trail-xc
const COLOR_MUTED   = '#6B7B6E'; // brew-text-muted
const COLOR_BORDER  = '#2A332C'; // brew-border
const COLOR_CARD    = '#161A18'; // brew-card
const COLOR_TEXT    = '#E8EDE9'; // brew-text

/**
 * Bar chart of cost per maintenance event over time.
 * Only renders when records.length >= 3.
 * Styled entirely with brew color tokens.
 *
 * @param {{ records: import('../../types/index').MaintenanceRecord[] }} props
 */
export default function ServiceHistoryChart({ records }) {
  if (records.length < 3) return null;

  // Sort ascending by date for chronological display
  const data = [...records]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((r) => ({
      date: formatShortDate(r.date),
      cost: r.cost,
      type: r.type,
      label: r.type === 'service' ? r.serviceType : 'repair',
    }));

  return (
    <div className="bg-brew-card border border-brew-border rounded-xl p-4 mt-1">
      <p className="font-mono text-[10px] text-brew-text-muted uppercase tracking-widest mb-4">
        Cost Over Time
      </p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barSize={16} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fill: COLOR_MUTED, fontSize: 9, fontFamily: 'Space Mono, monospace' }}
            axisLine={{ stroke: COLOR_BORDER }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: COLOR_MUTED, fontSize: 9, fontFamily: 'Space Mono, monospace' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R${v}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar dataKey="cost" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.type === 'service' ? COLOR_SERVICE : COLOR_REPAIR}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        <LegendDot color={COLOR_SERVICE} label="Service" />
        <LegendDot color={COLOR_REPAIR}  label="Repair" />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: COLOR_CARD,
        border: `1px solid ${COLOR_BORDER}`,
        borderRadius: 10,
        padding: '8px 12px',
      }}
    >
      <p style={{ color: COLOR_MUTED, fontSize: 9, fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
        {d.date} · {d.label}
      </p>
      <p style={{ color: COLOR_TEXT, fontSize: 13, fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>
        R{d.cost}
      </p>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="font-mono text-[10px] text-brew-text-muted uppercase tracking-wide">{label}</span>
    </div>
  );
}

function formatShortDate(isoDate) {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}
