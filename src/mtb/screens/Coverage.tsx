import { RequestForm } from '../components/RequestForm';
import { brandRank, forkCatalogue, shockCatalogue } from '../search/catalogue';
import { useMtb } from '../ui/MtbContext';
import { Button, ProvenanceTag, Section, downloadText } from '../ui/primitives';

const BRAND_STATUS: Record<string, string> = {
  FOX: 'Factory, Performance, Performance Elite and Rhythm forks and shocks. Some units are composed from documented parts and marked as estimates.',
  RockShox: 'Every 2023 fork family with its model code, pressure bands and token limits. Damper adjuster data arrives with harvest 02b, so damping advice is held back until then. Rear shocks use closest matches.',
  Marzocchi: 'Not on file yet. Closest matches use the FOX dampers Marzocchi shares.',
  'X-Fusion': 'Not on file yet (harvest 02 batch 2). Closest matches by adjuster layout.',
  'SR Suntour': 'Not on file yet (harvest 02 batch 2). Closest matches by adjuster layout; lockout forks get spring and tyre advice only.',
};

const STEP_LABEL: Record<string, string> = {
  bike_search: 'gave up at bike search',
  component_search: 'gave up at component search',
  identifier: 'gave up at part number match',
  manual: 'gave up at manual pick',
  request: 'asked directly',
};


/** Rider-facing: what the dataset contains, what is pending, and a way to ask. Developer detail behind DEV. */
export function Coverage() {
  const m = useMtb();
  const c = m.coverage;
  const counts = c.adjuster_counts;
  const estimatedUnits = [...Object.values(m.index.fork_units), ...Object.values(m.index.shock_units)].filter((u) => u.confidence === 'estimated');
  const pressureCharts = Object.values(m.index.pressure_charts).length;
  const forkModels = forkCatalogue(m.index);
  const shockModels = shockCatalogue(m.index);
  const brands = [...new Set([...forkModels, ...shockModels].map((x) => x.brand))].sort((a, b) => brandRank(a) - brandRank(b) || a.localeCompare(b));
  const settingCharts = Object.values(m.index.setting_charts).length;

  return (
    <div className="max-w-4xl">
      <header className="pt-2 pb-5 border-b border-white/20 mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight">What is on file</h1>
        <p className="text-sm text-brew-text-dim mt-1 max-w-[62ch]">
          The honest answer to "why is my bike not here". The dataset is built by reading manufacturer documents one by one, starting with what is most common on South
          African trails. Your requests decide what comes next.
        </p>
      </header>

      <Section title="Brands" hint="what the picker offers">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[680px]">
            <thead>
              <tr className="text-left text-xs text-brew-text-muted">
                <th className="font-medium pb-2 pr-3 border-b border-white/10">Brand</th>
                <th className="font-medium pb-2 pr-3 border-b border-white/10 text-right">Forks documented</th>
                <th className="font-medium pb-2 pr-3 border-b border-white/10 text-right">Forks, damper pending</th>
                <th className="font-medium pb-2 pr-3 border-b border-white/10 text-right">Shocks documented</th>
                <th className="font-medium pb-2 pr-3 border-b border-white/10 text-right">Closest matches</th>
                <th className="font-medium pb-2 border-b border-white/10">Status</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => {
                const f = forkModels.filter((x) => x.brand === brand);
                const sh = shockModels.filter((x) => x.brand === brand);
                const documented = (xs: { status: string }[]) => xs.filter((x) => x.status === 'on_file' || x.status === 'estimate').length;
                return (
                  <tr key={brand} className="align-top">
                    <td className="py-2.5 pr-3 border-b border-white/10 font-semibold">{brand}</td>
                    <td className="py-2.5 pr-3 border-b border-white/10 text-right tabular-nums">{documented(f)}</td>
                    <td className="py-2.5 pr-3 border-b border-white/10 text-right tabular-nums">{f.filter((x) => x.status === 'pending').length}</td>
                    <td className="py-2.5 pr-3 border-b border-white/10 text-right tabular-nums">{documented(sh)}</td>
                    <td className="py-2.5 pr-3 border-b border-white/10 text-right tabular-nums">{[...f, ...sh].filter((x) => x.status === 'closest').length}</td>
                    <td className="py-2.5 border-b border-white/10 text-brew-text-dim">{BRAND_STATUS[brand] ?? ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12.5px] text-brew-text-muted max-w-[70ch]">
          Counts are models (family and tier), not travels. A closest match borrows only the dials of the nearest documented part, never its pressure or token
          figures, and the Bench says so whenever one is selected.
        </p>
      </Section>

      <Section title="What works today">
        <ul className="space-y-2 text-sm">
          {c.readiness.map((g) => (
            <li key={g.feature} className="flex flex-wrap items-baseline gap-2">
              <span className={`font-mono text-[10px] uppercase tracking-wider ${g.ready ? 'text-brew-accent' : 'text-brew-text-muted'}`}>{g.ready ? 'working' : 'coming'}</span>
              <span>{g.feature}</span>
              {!g.ready && <span className="text-brew-text-muted text-xs">arrives with harvest {g.meaningful_after}</span>}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="What is still missing">
        <ul className="space-y-2.5 text-sm text-brew-text-dim max-w-[70ch]">
          <li>
            <strong className="text-brew-text">Click ranges.</strong> {counts.count_with_basis} of {counts.adjusters_present - counts.count_not_applicable} click adjusters have a
            documented total. Manufacturers publish recommended settings, not how many clicks a dial has, so the Bench gives changes relative to where you are and never
            shows a "7 of 10".
          </li>
          <li>
            <strong className="text-brew-text">Recommended settings.</strong> {pressureCharts} air pressure charts and {settingCharts} rebound charts are on file. Where there is
            no chart, the starting value is unknown and you enter your own.
          </li>
          <li>
            <strong className="text-brew-text">Shock pressure and tyres.</strong> Shock pressure depends on your frame's leverage and tyres need a tyre model; both come later
            (harvest stages 3 and 4). Set them by sag and feel, and enter them.
          </li>
          {estimatedUnits.length > 0 && (
            <li>
              <strong className="text-brew-text">Estimates.</strong> These are on file as best estimates, not manufacturer figures:{' '}
              {estimatedUnits.map((u) => u.display_name).join(', ')} <ProvenanceTag provenance="estimated" />
            </li>
          )}
        </ul>
      </Section>

      <Section title="Ask for your bike or parts" hint={`${m.requests.length} request${m.requests.length === 1 ? '' : 's'} on this device`}>
        <RequestForm prefill={{ step: 'request' }} />
        {m.requests.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-brew-text-muted mb-2">Your requests</p>
            <ul className="space-y-1.5 text-sm">
              {m.requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-baseline gap-2 border-b border-white/10 pb-1.5">
                  <span className="font-semibold">{[r.brand, r.model, r.year].filter(Boolean).join(' ') || r.text}</span>
                  <span className="text-xs text-brew-text-muted">{r.kind} · {STEP_LABEL[r.step_reached] ?? r.step_reached} · {r.created_at.slice(0, 10)}</span>
                  <button type="button" className="ml-auto text-xs text-brew-text-muted underline decoration-dotted" onClick={() => m.removeRequest(r.id)}>remove</button>
                </li>
              ))}
            </ul>
            <Button variant="ghost" className="mt-3" onClick={() => downloadText('mtb-triage-requests.json', m.exportRequests())}>
              Export requests (JSON)
            </Button>
          </div>
        )}
      </Section>

      {import.meta.env.DEV && (
        <details className="border-t border-white/10 pt-4 text-xs">
          <summary className="cursor-pointer text-brew-text-dim">Developer detail: coverage.json</summary>
          <p className="text-brew-text-muted mt-2">
            {c.flags.length} data flags, {c.annotations.length} ingest annotations, {c.exclusions.length} exclusions.
          </p>
          <pre className="mt-2 max-h-[480px] overflow-auto bg-brew-card p-3 rounded-md text-[11px] leading-snug">{JSON.stringify(c, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}
