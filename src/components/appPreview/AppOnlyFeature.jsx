import { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { fetchCommunityConfig } from '../../services/onboardingService';
import { joinTestflightWaitlist } from '../../services/waitlistService';
import { getPreviewScreenshots } from '../../utils/appPreviewAssets';
import { validateEmail } from '../../utils/authValidation';
import { useAuth } from '../../hooks/useAuth';
import { PRIMARY_BTN_CLASS } from '../../styles/buttonStyles';

/**
 * Reusable "this feature lives in the app" page — one component, driven by
 * per-feature config from src/data/appPreviews.js. Renders real screenshots
 * from src/assets/app-previews/{slug}/ when present, otherwise a
 * same-size placeholder frame so dropping real images in later needs zero
 * layout changes.
 */
export default function AppOnlyFeature({ icon: Icon, name, pitch, bullets, slug }) {
  const [iosUrl, setIosUrl] = useState(undefined); // undefined = loading

  useEffect(() => {
    let cancelled = false;
    fetchCommunityConfig()
      .then((config) => {
        if (!cancelled) setIosUrl(config?.iosTestflightUrl || null);
      })
      .catch(() => {
        if (!cancelled) setIosUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const screenshots = getPreviewScreenshots(slug);

  return (
    <div className="min-h-screen bg-brew-bg text-brew-text">
      <div className="max-w-[640px] mx-auto px-5 py-14">
        {/* Header block */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brew-accent/10 border border-brew-accent/20 flex items-center justify-center mx-auto mb-4">
            <Icon size={26} className="text-brew-accent" />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">{name}</h1>
          <p className="text-brew-text-dim text-base">{pitch}</p>
        </div>

        {/* Screenshot showcase */}
        <ScreenshotShowcase screenshots={screenshots} icon={Icon} />

        {/* Benefit bullets */}
        <ul className="space-y-2.5 my-10 max-w-[420px] mx-auto">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5 text-sm text-brew-text-dim">
              <Check size={15} className="text-brew-accent shrink-0 mt-0.5" />
              {bullet}
            </li>
          ))}
        </ul>

        {/* CTA block */}
        <div className="text-center border-t border-brew-border pt-8">
          <p className="font-mono text-[11px] text-brew-text-dim uppercase tracking-wider mb-4">
            This one lives in the app.
          </p>

          {iosUrl === undefined ? (
            <div className="h-[46px] flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-brew-text-muted" />
            </div>
          ) : iosUrl ? (
            <>
              <a href={iosUrl} target="_blank" rel="noopener noreferrer" className={PRIMARY_BTN_CLASS}>
                Get the iOS app →
              </a>
              <p className="text-xs text-brew-text-muted mt-4 max-w-sm mx-auto leading-relaxed">
                Currently iOS via TestFlight. Android riders — it's on the roadmap, hang tight.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-brew-text-dim mb-4 max-w-sm mx-auto leading-relaxed">
                TestFlight is invite-only right now — pop your email in and we'll send you an
                invite as spots open up.
              </p>
              <WaitlistForm feature={slug} />
              <p className="text-xs text-brew-text-muted mt-5 max-w-sm mx-auto leading-relaxed">
                Android riders — it's on the roadmap, hang tight.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Email capture for the invite-only TestFlight waiting list. */
function WaitlistForm({ feature }) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Prefill from the signed-in user's email once, without fighting further edits.
  useEffect(() => {
    if (user?.email && !prefilled) {
      setEmail(user.email);
      setPrefilled(true);
    }
  }, [user, prefilled]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await joinTestflightWaitlist({ email, uid: user?.uid, feature });
      setSubmitted(true);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <p className="text-sm text-brew-accent flex items-center justify-center gap-2">
        <Check size={16} className="shrink-0" />
        You're on the list — we'll email you an invite as spots open up.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-[320px] mx-auto">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          placeholder="you@example.com"
          autoComplete="email"
          className="flex-1 min-w-0 bg-brew-card border border-brew-border rounded-lg px-3 py-2.5 text-sm text-brew-text placeholder-brew-text-dim focus:outline-none focus:border-brew-accent transition-colors"
        />
        <button
          type="submit"
          disabled={submitting}
          className="shrink-0 bg-brew-accent hover:bg-[#D4F27A] text-brew-bg font-bold text-sm px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[64px]"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Join →'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </form>
  );
}

function PhoneFrame({ src, icon: Icon }) {
  return (
    <div
      className="relative w-[220px] shrink-0 rounded-[28px] border-[3px] border-brew-border bg-brew-card overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
      style={{ aspectRatio: '9 / 19.5' }}
    >
      {/* Notch */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#0F1210] rounded-full z-10" />
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-4 text-center">
          <Icon size={28} className="text-brew-text-muted" />
          <p className="font-mono text-[10px] text-brew-text-muted uppercase tracking-wide">
            Screenshot coming soon
          </p>
        </div>
      )}
    </div>
  );
}

function ScreenshotShowcase({ screenshots, icon }) {
  const frames = screenshots.length > 0 ? screenshots : [null];

  if (frames.length === 1) {
    return (
      <div className="flex justify-center my-10">
        <PhoneFrame src={frames[0]} icon={icon} />
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto my-10 px-1 py-2 snap-x snap-mandatory">
      {frames.map((src, i) => (
        <div key={src || i} className="snap-center">
          <PhoneFrame src={src} icon={icon} />
        </div>
      ))}
    </div>
  );
}
