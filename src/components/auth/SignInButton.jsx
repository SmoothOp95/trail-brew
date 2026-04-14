import { useState } from 'react';
import AuthModal from './AuthModal';

export default function SignInButton({ className = '' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 font-mono text-xs border border-brew-border px-4 py-2 rounded-lg hover:border-brew-accent hover:text-brew-accent transition-all uppercase tracking-wider ${className}`}
      >
        Sign in
      </button>

      {open && <AuthModal onClose={() => setOpen(false)} />}
    </>
  );
}
