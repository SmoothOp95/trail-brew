import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCommunityConfig } from '../../services/onboardingService';

export default function SuccessScreen() {
  const [whatsappUrl, setWhatsappUrl] = useState(undefined); // undefined = loading

  useEffect(() => {
    let cancelled = false;
    fetchCommunityConfig()
      .then((config) => {
        if (!cancelled) setWhatsappUrl(config?.whatsappGeneralInviteUrl || null);
      })
      .catch(() => {
        if (!cancelled) setWhatsappUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative text-center">
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(184,230,72,0.15),transparent_70%)] pointer-events-none opacity-50" />

      <div className="max-w-[480px] w-full relative animate-fade-slide">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-8">
          Lekker — welcome to Trail Brew! 🚵
        </h1>

        {whatsappUrl === undefined ? (
          <div className="h-[52px]" />
        ) : whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-brew-accent hover:bg-[#D4F27A] text-brew-bg font-bold text-sm px-7 py-3 rounded-lg transition-colors tracking-wide mb-10"
          >
            Join the WhatsApp group →
          </a>
        ) : (
          <p className="font-mono text-xs text-brew-text-dim uppercase tracking-wider mb-10">
            WhatsApp link coming soon — check back shortly.
          </p>
        )}

        <div className="text-left bg-brew-card border border-brew-border rounded-xl p-6 mb-8">
          <p className="text-sm text-brew-text-dim mb-3">Two things before you tap:</p>
          <ol className="space-y-3 text-[15px] text-brew-text list-decimal list-inside">
            <li>
              Say howzit when you land — tell the group what you ride and where you like
              riding.
            </li>
            <li>
              Have a read of the{' '}
              <Link to="/community-guidelines" className="text-brew-accent hover:underline">
                Community Guidelines
              </Link>{' '}
              — short version: we ride, we look after each other, helmets always.
            </li>
          </ol>
        </div>

        <p className="text-brew-text-dim text-sm leading-relaxed">
          Your first group ride is where we really get to know your riding. Watch the group
          for the next one. 🍻
        </p>
      </div>
    </div>
  );
}
