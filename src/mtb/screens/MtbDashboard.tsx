import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { MtbProvider, type MtbUser, type MtbContextValue } from '../ui/MtbContext';
import { Bench } from './Bench';
import { Coverage } from './Coverage';
import { Garage } from './Garage';
import { Method } from './Method';
import { SessionLog } from './SessionLog';

export const BASE = '/mtb-dashboard';

// Absolute paths: the host enables v7_relativeSplatPath, under which relative links inside this splat
// route would resolve against the current sub-page (for example /mtb-dashboard/garage/coverage).
const TABS = [
  { to: BASE, label: 'Bench', end: true },
  { to: `${BASE}/garage`, label: 'Garage' },
  { to: `${BASE}/log`, label: 'Session log' },
  { to: `${BASE}/method`, label: 'Method' },
  { to: `${BASE}/coverage`, label: 'What is on file' },
];

/**
 * MTB Setup Dashboard, mounted by the host at /mtb-dashboard/*. The Bench, Method and Coverage work signed
 * out with in-memory state; saving a bike or keeping the log asks for sign-in.
 */
export default function MtbDashboard({ user, SignIn }: { user: MtbUser | null | undefined; SignIn: MtbContextValue['SignIn'] }) {
  return (
    <MtbProvider user={user} SignIn={SignIn}>
      <div className="min-h-screen bg-brew-bg text-brew-text tabular-nums">
        <nav aria-label="Setup dashboard" className="border-b border-brew-border bg-brew-card/60 backdrop-blur-sm sticky top-[49px] lg:top-0 z-10">
          <div className="max-w-[1180px] mx-auto px-5 flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-3.5 text-sm border-b-2 -mb-px transition-colors ${
                    isActive ? 'border-brew-accent text-brew-text font-semibold' : 'border-transparent text-brew-text-dim hover:text-brew-text'
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="max-w-[1180px] mx-auto px-5 pt-6 pb-24">
          <Routes>
            <Route index element={<Bench />} />
            <Route path="garage" element={<Garage />} />
            <Route path="log" element={<SessionLog />} />
            <Route path="method" element={<Method />} />
            <Route path="coverage" element={<Coverage />} />
            <Route path="*" element={<Navigate to={BASE} replace />} />
          </Routes>
        </div>
      </div>
    </MtbProvider>
  );
}
