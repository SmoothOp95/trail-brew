import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from '../../utils/authValidation';
import { getAuthErrorMessage } from '../../utils/authErrorMessages';

const MODE_SIGNIN = 'signin';
const MODE_SIGNUP = 'signup';
const MODE_FORGOT = 'forgot';

const inputClasses =
  'w-full bg-white/5 border border-brew-border rounded-lg px-3 py-2.5 text-sm text-brew-text placeholder-brew-text-dim focus:outline-none focus:border-brew-accent transition-colors';

/**
 * Inline (non-modal) email/password auth block for /join. Sits below the
 * Google button as a fallback for riders without a Google account. Once
 * signed in, JoinLandingPage's own effect (driven by useAuth's `user`
 * state) handles routing to the survey or success screen — this component
 * only ever calls the auth service functions, no navigation of its own.
 */
export default function InlineEmailAuth() {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState(MODE_SIGNIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [resetSent, setResetSent] = useState(false);

  const clearMessages = () => {
    setError('');
    setResetSent(false);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    clearMessages();
    setFieldErrors({});
    setPassword('');
    setConfirmPassword('');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      await resetPassword(normalizeEmail(email));
    } catch {
      // Same confirmation regardless of outcome — don't reveal whether an
      // account exists for this email.
    } finally {
      setLoading(false);
      setResetSent(true);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    const errors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    if (mode === MODE_SIGNUP) {
      const passwordError = validatePassword(password);
      if (passwordError) errors.password = passwordError;
      const confirmError = validatePasswordConfirm(password, confirmPassword);
      if (confirmError) errors.confirmPassword = confirmError;
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const normalizedEmail = normalizeEmail(email);
      if (mode === MODE_SIGNUP) {
        await signUpWithEmail(normalizedEmail, password);
      } else {
        await signInWithEmail(normalizedEmail, password);
      }
      // Success — useAuth's `user` updates and JoinLandingPage reacts.
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setMode(MODE_SIGNIN);
        setPassword('');
      }
      setError(getAuthErrorMessage(err.code));
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  if (mode === MODE_FORGOT) {
    return (
      <form onSubmit={handleForgotSubmit} noValidate className="space-y-3 text-left">
        <div>
          <label className="block text-[11px] font-mono text-brew-text-dim uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors({});
            }}
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClasses}
          />
          {fieldErrors.email && <p className="text-xs text-red-400 mt-1.5">{fieldErrors.email}</p>}
        </div>

        {resetSent ? (
          <p className="text-xs text-brew-text-dim">
            If that email has an account, a reset link is on its way. Check spam — sorry in
            advance.
          </p>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brew-accent hover:bg-brew-accent/90 text-black font-semibold text-sm py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Send reset link
          </button>
        )}

        <button
          type="button"
          onClick={() => switchMode(MODE_SIGNIN)}
          className="w-full text-center text-[11px] font-mono text-brew-text-dim hover:text-brew-accent transition-colors uppercase tracking-wider"
        >
          ← Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleAuthSubmit} noValidate className="space-y-3 text-left">
      <div>
        <label className="block text-[11px] font-mono text-brew-text-dim uppercase tracking-wider mb-1.5">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="you@example.com"
          autoComplete="email"
          className={inputClasses}
        />
        {fieldErrors.email && <p className="text-xs text-red-400 mt-1.5">{fieldErrors.email}</p>}
      </div>

      <div>
        <label className="block text-[11px] font-mono text-brew-text-dim uppercase tracking-wider mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            placeholder="••••••••"
            autoComplete={mode === MODE_SIGNIN ? 'current-password' : 'new-password'}
            className={`${inputClasses} pr-10`}
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
        {fieldErrors.password && (
          <p className="text-xs text-red-400 mt-1.5">{fieldErrors.password}</p>
        )}
        {mode === MODE_SIGNUP && !fieldErrors.password && (
          <p className="text-xs text-brew-text-dim mt-1.5">
            8+ characters. Your bike's name plus your birth year is not a good password.
          </p>
        )}
      </div>

      {mode === MODE_SIGNUP && (
        <div>
          <label className="block text-[11px] font-mono text-brew-text-dim uppercase tracking-wider mb-1.5">
            Confirm password
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            placeholder="••••••••"
            autoComplete="new-password"
            className={inputClasses}
          />
          {fieldErrors.confirmPassword && (
            <p className="text-xs text-red-400 mt-1.5">{fieldErrors.confirmPassword}</p>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brew-accent hover:bg-brew-accent/90 text-black font-semibold text-sm py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {mode === MODE_SIGNIN ? 'Sign in' : 'Create account'}
      </button>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => switchMode(mode === MODE_SIGNIN ? MODE_SIGNUP : MODE_SIGNIN)}
          className="text-[11px] font-mono text-brew-text-dim hover:text-brew-accent transition-colors uppercase tracking-wider"
        >
          {mode === MODE_SIGNIN ? 'Create an account →' : '← Already have an account? Sign in'}
        </button>

        {mode === MODE_SIGNIN && (
          <button
            type="button"
            onClick={() => switchMode(MODE_FORGOT)}
            className="text-[11px] font-mono text-brew-text-dim hover:text-brew-accent transition-colors uppercase tracking-wider"
          >
            Forgot password?
          </button>
        )}
      </div>
    </form>
  );
}
