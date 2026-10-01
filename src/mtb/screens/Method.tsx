import { RULES } from '../rules';
import { Section } from '../ui/primitives';
import { DialGuide } from './Bench';

/** The sag procedure and the diagnostic tests from 05 §8, plus the fixed order of changes from 05 §7. */
export function Method() {
  return (
    <div className="max-w-3xl">
      <header className="pt-2 pb-5 border-b border-white/20 mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight">Method</h1>
        <p className="text-sm text-brew-text-dim mt-1 max-w-[60ch]">How to measure, how to test, and in what order to change things.</p>
      </header>

      <Section letter="1" title="Measure sag first" hint="it gates everything else">
        <p className="text-sm text-brew-text-dim mb-3">{RULES.sag_method.summary}</p>
        <ol className="list-decimal ml-5 space-y-1.5 text-sm">
          {RULES.sag_method.steps.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </Section>

      <Section letter="2" title="Test before you change anything">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[480px]">
            <thead>
              <tr className="text-left text-xs text-brew-text-muted">
                <th className="font-medium pb-2 pr-4 border-b border-white/10 w-[42%]">Test</th>
                <th className="font-medium pb-2 border-b border-white/10">What it tells you</th>
              </tr>
            </thead>
            <tbody>
              {RULES.diagnostics.map((d) => (
                <tr key={d.test} className="align-top">
                  <td className="py-2.5 pr-4 border-b border-white/10 font-medium">{d.test}</td>
                  <td className="py-2.5 border-b border-white/10 text-brew-text-dim">{d.reads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section letter="3" title="Change things in this order">
        <ol className="list-decimal ml-5 space-y-1 text-sm">
          {RULES.ordering.map((o) => <li key={o.group}>{o.label}</li>)}
        </ol>
        <p className="text-sm text-brew-text-dim mt-3">
          This is the order in which a change to one invalidates your read on the next. Setting compression before sag is the most common way riders chase their own tail.
        </p>
      </Section>

      <Section letter="4" title="Which dial to reach for, and how to tell">
        <DialGuide />
      </Section>
    </div>
  );
}
