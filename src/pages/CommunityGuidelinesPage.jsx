import { Link } from 'react-router-dom';

// DRAFT copy — placeholder pending Tumi's real Community Guidelines text.
// Structure/tone follows the onboarding survey brief ("we ride, we look
// after each other, helmets always"); replace freely.
const sections = [
  {
    title: 'Helmets, always',
    body: 'No exceptions, no "just this once." Every ride, every trail, every skill level.',
  },
  {
    title: 'We look after each other',
    body: "Nobody gets left behind on a group ride. If someone's struggling, the group slows down — we're not racing each other, we're riding together. Know your ride leader and let them know if something's wrong.",
  },
  {
    title: 'Ride within yourself',
    body: "Walk what you're not comfortable riding — no shame in it, ever. Trail Brew is about progression at your own pace, not proving anything to anyone.",
  },
  {
    title: 'Respect the trail',
    body: 'Stay on marked lines, pack out what you pack in, and give way to hikers and other trail users. We ride these trails because people look after them — help keep it that way.',
  },
  {
    title: 'Keep the group chat friendly',
    body: 'WhatsApp is for ride logistics, trail chat, and the occasional bad joke. Be decent. Repeated disrespect gets you a quiet word, then removed.',
  },
];

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-16 relative">
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(184,230,72,0.12),transparent_70%)] pointer-events-none opacity-50" />

      <div className="max-w-[560px] w-full relative">
        <Link
          to="/"
          className="font-mono text-[11px] text-brew-text-dim hover:text-brew-accent transition-colors uppercase tracking-wider mb-8 inline-block"
        >
          ← Trail Brew
        </Link>

        <p className="font-mono text-[11px] text-brew-accent uppercase tracking-[3px] mb-3">
          Community
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
          Community Guidelines
        </h1>
        <p className="text-brew-text-dim text-sm leading-relaxed mb-10">
          We ride, we look after each other, helmets always. The short version above covers
          most of it — here's the fuller picture.
        </p>

        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title} className="border-b border-brew-border pb-6 last:border-b-0">
              <h2 className="font-bold text-[16px] mb-2">{s.title}</h2>
              <p className="text-brew-text-dim text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
