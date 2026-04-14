import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';

// Tab options
const TAB_SIGNIN = 'signin';
const TAB_SIGNUP = 'signup';

export default function AuthModal({ onClose }) {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [tab, setTab] = useState(TAB_SIGNIN);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const clearError = () => setError('');

  const friendlyError = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    clearError();
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      await signInWithEmail(email, password);
      onClose();
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      await signUpWithEmail(email, password, name.trim());
      onClose();
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above, then click forgot password.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    clearError();
    setResetSent(false);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm bg-[#0F1210] border border-brew-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-brew-border">
          <div>
            <p className="font-black text-base tracking-tight bg-gradient-to-br from-brew-accent to-[#D4F27A] bg-clip-text text-transparent">
              Trail Brew
            </p>
            <p className="text-xs text-brew-text-dim mt-0.5">
              {tab === TAB_SIGNIN ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-brew-text-dim hover:text-brew-text transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex mx-6 mt-5 bg-white/5 rounded-lg p-0.5">
          {[TAB_SIGNIN, TAB_SIGNUP].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-1.5 text-xs font-mono uppercase tracking-wider rounded-md transition-all ${
                tab === t
                  ? 'bg-brew-accent text-black font-semibold'
                  : 'text-brew-text-dim hover:text-brew-text'
              }`}
            >
              {t === TAB_SIGNIN ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Google button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 border border-brew-border rounded-lg py-2.5 text-sm text-brew-text hover:border-brew-accent hover:text-brew-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-brew-border" />
            <span className="text-[10px] font-mono text-brew-text-dim uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-brew-border" />
          </div>

          {/* Email/Password form */}
          <form onSubmit={tab === TAB_SIGNIN ? handleSignIn : handleSignUp} className="space-y-3">
            {tab === TAB_SIGNUP && (
              <div>
                <label className="block text-[11px] font-mono text-brew-text-dim uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError(); }}
                  placeholder="Your name"
                  required
                  autoComplete="name"
                  className="w-full bg-white/5 border border-brew-border rounded-lg px-3 py-2.5 text-sm text-brew-text placeholder-brew-text-dim focus:outline-none focus:border-brew-accent transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-brew-text-dim uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full bg-white/5 border border-brew-border rounded-lg px-3 py-2.5 text-sm text-brew-text placeholder-brew-text-dim focus:outline-none focus:border-brew-accent transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-brew-text-dim uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder={tab === TAB_SIGNUP ? 'Min. 6 characters' : '••••••••'}
                  required
                  autoComplete={tab === TAB_SIGNIN ? 'current-password' : 'new-password'}
                  className="w-full bg-white/5 border border-brew-border rounded-lg px-3 py-2.5 pr-10 text-sm text-brew-text placeholder-brew-text-dim focus:outline-none focus:border-brew-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brew-text-dim hover:text-brew-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-xs text-red-400 font-mono">{error}</p>
            )}

            {/* Reset sent confirmation */}
            {resetSent && (
              <p className="text-xs text-green-400 font-mono">
                Reset email sent — check your inbox.
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brew-accent hover:bg-brew-accent/90 text-black font-semibold text-sm py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {tab === TAB_SIGNIN ? 'Sign In' : 'Create Account'}
            </button>

            {/* Forgot password — only on sign in tab */}
            {tab === TAB_SIGNIN && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full text-center text-[11px] font-mono text-brew-text-dim hover:text-brew-accent transition-colors uppercase tracking-wider disabled:opacity-50"
              >
                Forgot password?
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
