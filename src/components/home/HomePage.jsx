import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import SignInButton from '../auth/SignInButton';

const pillars = [
  {
    emoji: '🚵',
    label: 'Ride',
    desc: 'Join rides and explore new trails.',
  },
  {
    emoji: '🔧',
    label: 'Build',
    desc: 'Use MTB tools to track and manage your bike.',
  },
  {
    emoji: '☕',
    label: 'Brew',
    desc: 'Celebrate post-ride with great coffee and community.',
  },
];

const tools = [
  {
    id: 'trail-finder',
    href: '/trail-finder',
    external: false,
    emoji: '🧭',
    label: 'Trail Finder',
    tag: 'Live',
    tagStyle: 'bg-brew-accent/10 text-brew-accent border border-brew-accent/20',
    description: 'Answer 4 quick questions and get a personalised ranked list of Gauteng MTB trails that match your riding style.',
    types: ['Flow', 'Enduro', 'XC', 'Technical'],
    typeColors: ['text-trail-flow', 'text-trail-enduro', 'text-trail-xc', 'text-trail-technical'],
    cta: 'Find my trail →',
    active: true,
  },
  {
    id: 'mtb-tracker',
    href: 'https://mtbtracker.vercel.app',
    external: true,
    emoji: '🔧',
    label: 'MTB Tracker',
    tag: 'Live',
    tagStyle: 'bg-brew-accent/10 text-brew-accent border border-brew-accent/20',
    description: 'Track services, repairs, and expenses across all your bikes. Never miss a service interval again.',
    types: ['Services', 'Repairs', 'Expenses'],
    typeColors: ['text-trail-xc', 'text-trail-enduro', 'text-trail-jump'],
    cta: 'Open tracker →',
    active: true,
  },
  {
    id: 'find-my-bike',
    href: 'https://findmybikesa.vercel.app',
    external: true,
    emoji: '🚲',
    label: 'Find My Bike',
    tag: 'Live',
    tagStyle: 'bg-brew-accent/10 text-brew-accent border border-brew-accent/20',
    description: 'Discover the right bike for your budget and riding style. South Africa\'s MTB buyer guide.',
    types: ['Budget', 'Hardtail', 'Full Sus'],
    typeColors: ['text-trail-flow', 'text-trail-trail', 'text-trail-downhill'],
    cta: 'Find my bike →',
    active: true,
  },
  {
    id: 'dashboard',
    href: null,
    external: false,
    emoji: '📊',
    label: 'Dashboard',
    tag: 'Coming soon',
    tagStyle: 'bg-brew-card text-brew-text-muted border border-brew-border',
    description: 'Track and improve your riding quality with suspension tuning and tyre pressure insights.',
    types: ['Suspension', 'Tyre pressure', 'Insights'],
    typeColors: ['text-trail-trail', 'text-trail-flow', 'text-trail-jump'],
    cta: null,
    active: false,
  },
];

export default function HomePage() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Global glow */}
      <div className="fixed top-[-300px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[radial-gradient(circle,rgba(184,230,72,0.07),transparent_65%)] pointer-events-none" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-brew-border">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">⛰️</span>
          <span className="font-black text-lg tracking-tight bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">
            Trail Brew
          </span>
        </div>
        <span className="font-mono text-[11px] text-brew-text-muted tracking-[0.2em] uppercase hidden sm:block">
          Gauteng MTB
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/trail-finder"
            className="font-mono text-[11px] text-brew-accent border border-brew-accent/30 px-3.5 py-1.5 rounded-md hover:bg-brew-accent/10 transition-colors tracking-wide"
          >
            Find a trail
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-7 h-7 rounded-full border border-brew-border"
              />
              <button
                onClick={signOut}
                className="font-mono text-[11px] text-brew-text-dim border border-brew-border px-3 py-1.5 rounded-md hover:border-brew-accent hover:text-brew-accent transition-colors tracking-wide"
              >
                Sign out
              </button>
            </div>
          ) : (
            <SignInButton className="text-[11px] px-3.5 py-1.5 rounded-md" />
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-5 pt-24 pb-16 animate-fade-slide">
        <p className="font-mono text-[11px] text-brew-accent uppercase tracking-[0.3em] mb-5">
          Gauteng Mountain Biking
        </p>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[0.95] mb-6 max-w-3xl">
          Riders who earn their{' '}
          <span className="bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">
            coffees &amp; beers.
          </span>
        </h1>
        <p className="max-w-[500px] text-brew-text-dim text-base sm:text-lg leading-relaxed mb-10">
          A community for mountain bikers who love great trails, great company, and great coffee.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            to="/trail-finder"
            className="bg-brew-accent text-brew-bg font-bold text-sm px-7 py-3 rounded-lg hover:bg-[#D4F27A] transition-colors tracking-wide"
          >
            Find my trail
          </Link>
          <a
            href="#tools"
            className="font-mono text-[12px] text-brew-text-dim hover:text-brew-accent transition-colors tracking-widest uppercase"
          >
            Explore tools ↓
          </a>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-5 sm:px-10 pb-20 max-w-4xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-8 sm:gap-16 border-t border-b border-brew-border py-8">
          {pillars.map((p) => (
            <div key={p.label} className="flex items-center gap-3">
              <span className="text-xl">{p.emoji}</span>
              <div>
                <p className="font-bold text-[14px] leading-none mb-1">{p.label}</p>
                <p className="text-brew-text-muted text-xs leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tools grid */}
      <section id="tools" className="relative px-5 sm:px-10 pb-24 max-w-5xl mx-auto w-full">
        <div className="text-center mb-12">
          <p className="font-mono text-[11px] text-brew-accent uppercase tracking-[0.3em] mb-3">
            The toolkit
          </p>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tighter leading-[0.95]">
            Tools for every rider.
          </h2>
          <p className="text-brew-text-dim text-sm mt-3 max-w-sm mx-auto">
            Everything you need before, during, and after the ride.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brew-border px-6 sm:px-10 py-6 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <span className="text-base">⛰️</span>
          <span className="font-black text-sm tracking-tight bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">
            Trail Brew
          </span>
        </div>
        <span className="font-mono text-[10px] text-brew-text-muted tracking-widest uppercase">
          Gauteng MTB · {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}

function ToolCard({ tool }) {
  const inner = (
    <div
      className={`
        bg-brew-card border border-brew-border rounded-xl p-6 h-full flex flex-col transition-all duration-300 relative overflow-hidden group
        ${tool.active
          ? 'hover:border-brew-accent/20 hover:-translate-y-[3px] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] cursor-pointer'
          : 'opacity-55 cursor-default'}
      `}
    >
      {/* Top accent line */}
      {tool.active && (
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-brew-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{tool.emoji}</span>
          <h3 className="font-bold text-[16px]">{tool.label}</h3>
        </div>
        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md whitespace-nowrap font-bold ${tool.tagStyle}`}>
          {tool.tag}
        </span>
      </div>

      {/* Description */}
      <p className="text-brew-text-dim text-sm leading-relaxed flex-1 mb-4">
        {tool.description}
      </p>

      {/* Type tags */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        {tool.types.map((type, i) => (
          <span key={type} className="flex items-center">
            <span className={`font-mono text-[10px] font-semibold uppercase tracking-wide ${tool.typeColors[i]}`}>
              {type}
            </span>
            {i < tool.types.length - 1 && (
              <span className="text-brew-text-muted font-mono text-[10px] ml-1.5">·</span>
            )}
          </span>
        ))}
      </div>

      {/* CTA */}
      <span className={`font-mono text-[11px] tracking-wide mt-auto ${tool.active ? 'text-brew-accent' : 'text-brew-text-muted'}`}>
        {tool.cta ?? 'Coming soon →'}
      </span>
    </div>
  );

  if (tool.active && tool.href) {
    if (tool.external) {
      return (
        <a href={tool.href} target="_blank" rel="noopener noreferrer" className="block h-full">
          {inner}
        </a>
      );
    }
    return <Link to={tool.href} className="block h-full">{inner}</Link>;
  }

  return <div className="h-full">{inner}</div>;
}
