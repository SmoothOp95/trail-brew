import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Map, CalendarDays, CheckSquare, LayoutDashboard, Users, ExternalLink, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useJoinStatus } from '../../hooks/useJoinStatus';
import SignInButton from '../auth/SignInButton';

const NAV_LINKS_BEFORE_TOOLS = [{ to: '/', icon: Home, label: 'Home', exact: true }];

const TOOL_LINKS = [
  { to: '/trail-finder', icon: Compass, label: 'Find Trail' },
  { to: '/trails', icon: Map, label: 'Trails' },
  { to: '/calendar', icon: CalendarDays, label: 'Ride Calendar' },
  { to: '/my-trails', icon: CheckSquare, label: 'My Trails' },
  { to: '/my-bike', icon: LayoutDashboard, label: 'Service Dashboard' },
];

function NavLink({ link, active }) {
  const Icon = link.icon;
  return (
    <Link
      to={link.to}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
        ${active
          ? 'text-brew-accent bg-brew-accent/[0.08] border-l-2 border-brew-accent pl-[10px]'
          : 'text-brew-text-dim hover:text-brew-text hover:bg-white/[0.04] border-l-2 border-transparent pl-[10px]'
        }
      `}
    >
      <Icon size={16} className="shrink-0" />
      {link.label}
    </Link>
  );
}

/** Swaps to an external "WhatsApp Group" link once the rider has already joined. */
function JoinNavItem({ active }) {
  const { completed, whatsappUrl } = useJoinStatus();

  if (completed && whatsappUrl) {
    return (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-brew-text-dim hover:text-brew-text hover:bg-white/[0.04] border-l-2 border-transparent pl-[10px]"
      >
        <Users size={16} className="shrink-0" />
        WhatsApp Group
        <ExternalLink size={12} className="shrink-0 ml-auto text-brew-text-muted" />
      </a>
    );
  }

  return <NavLink link={{ to: '/join', icon: Users, label: 'Join the Crew' }} active={active} />;
}

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Auto-close on route change (mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (link) =>
    link.exact ? location.pathname === link.to : location.pathname.startsWith(link.to);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-60 bg-[#0F1210] border-r border-brew-border
          flex flex-col z-40 transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-brew-border">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-xl">⛰️</span>
            <span className="font-black text-lg tracking-tight bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">
              Trail Brew
            </span>
          </Link>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden text-brew-text-dim hover:text-brew-text transition-colors"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_LINKS_BEFORE_TOOLS.map((link) => (
            <NavLink key={link.to} link={link} active={isActive(link)} />
          ))}

          <JoinNavItem active={location.pathname.startsWith('/join')} />

          {TOOL_LINKS.map((link) => (
            <NavLink key={link.to} link={link} active={isActive(link)} />
          ))}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-brew-border">
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-brew-border shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full border border-brew-border shrink-0 bg-brew-accent/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-brew-accent uppercase">
                    {(user.displayName || user.email || '?')[0]}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-brew-text truncate">
                  {user.displayName || user.email}
                </p>
                <button
                  onClick={signOut}
                  className="font-mono text-[10px] text-brew-text-dim hover:text-brew-accent transition-colors tracking-wide uppercase"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <SignInButton className="w-full justify-center text-[11px] py-2" />
          )}
        </div>
      </aside>
    </>
  );
}
