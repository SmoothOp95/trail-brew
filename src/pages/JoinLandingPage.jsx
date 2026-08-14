import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { getUserProfile, hasCompletedSurvey } from '../services/onboardingService';
import SuccessScreen from '../components/onboarding/SuccessScreen';
import CenteredSpinner from '../components/onboarding/CenteredSpinner';
import InlineEmailAuth from '../components/auth/InlineEmailAuth';

/**
 * Public landing for /join. Signed-out riders sign in with Google; signed-in
 * riders either get sent to the survey (no profile yet) or shown the
 * success screen again (re-entry — surveyCompletedAt already set).
 */
export default function JoinLandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState(null);

  useEffect(() => {
    if (user === undefined) return; // auth state still resolving
    if (!user) {
      setCheckingProfile(false);
      return;
    }

    let cancelled = false;
    setCheckingProfile(true);
    getUserProfile(user.uid)
      .then((profile) => {
        if (cancelled) return;
        if (hasCompletedSurvey(profile)) {
          setCompleted(true);
        } else {
          navigate('/join/survey', { replace: true });
        }
      })
      .catch(() => {
        if (!cancelled) navigate('/join/survey', { replace: true });
      })
      .finally(() => {
        if (!cancelled) setCheckingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setSignInError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // The effect above reacts once `user` updates.
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setSignInError('Something went wrong signing in — please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (user === undefined || checkingProfile) {
    return <CenteredSpinner />;
  }

  if (user && completed) {
    return <SuccessScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 relative text-center">
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(184,230,72,0.15),transparent_70%)] pointer-events-none opacity-50" />

      <div className="max-w-[440px] w-full relative animate-fade-slide">
        <span className="text-5xl block mb-4">⛰️</span>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent mb-4">
          Join Trail Brew
        </h1>
        <p className="text-brew-text-dim text-base leading-relaxed mb-10">
          A couple of quick questions about how you ride, then you're in. Takes under two
          minutes.
        </p>

        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="w-full flex items-center justify-center gap-2.5 bg-brew-accent hover:bg-[#D4F27A] text-brew-bg font-bold text-sm py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {signingIn ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          Continue with Google
        </button>

        {signInError && <p className="text-xs text-red-400 mt-3">{signInError}</p>}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-brew-border" />
          <span className="text-[10px] font-mono text-brew-text-dim uppercase tracking-wider">
            or
          </span>
          <div className="flex-1 h-px bg-brew-border" />
        </div>

        <InlineEmailAuth />
      </div>
    </div>
  );
}
