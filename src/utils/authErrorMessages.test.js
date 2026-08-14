import { describe, it, expect } from 'vitest';
import { getAuthErrorMessage } from './authErrorMessages';

describe('getAuthErrorMessage', () => {
  it('maps email-already-in-use', () => {
    expect(getAuthErrorMessage('auth/email-already-in-use')).toBe(
      "There's already an account with this email. Try signing in instead."
    );
  });

  it('maps invalid-credential, wrong-password, and user-not-found to the same enumeration-safe message', () => {
    const msg = "Email or password doesn't match. Try again, or use Forgot password.";
    expect(getAuthErrorMessage('auth/invalid-credential')).toBe(msg);
    expect(getAuthErrorMessage('auth/wrong-password')).toBe(msg);
    expect(getAuthErrorMessage('auth/user-not-found')).toBe(msg);
  });

  it('maps too-many-requests', () => {
    expect(getAuthErrorMessage('auth/too-many-requests')).toBe(
      'Too many attempts — take a breather and try again in a few minutes.'
    );
  });

  it('maps network-request-failed', () => {
    expect(getAuthErrorMessage('auth/network-request-failed')).toBe(
      'Network wobble. Check your connection and try again.'
    );
  });

  it('maps account-exists-with-different-credential', () => {
    expect(getAuthErrorMessage('auth/account-exists-with-different-credential')).toBe(
      'This email is linked to Google sign-in. Use the Google button above.'
    );
  });

  it('falls back to a generic message for unknown codes', () => {
    expect(getAuthErrorMessage('auth/some-unmapped-code')).toBe(
      'Something went sideways. Try again — if it keeps happening, shout in the WhatsApp group or mail us.'
    );
  });

  it('falls back for undefined/null codes', () => {
    expect(getAuthErrorMessage(undefined)).toBe(
      'Something went sideways. Try again — if it keeps happening, shout in the WhatsApp group or mail us.'
    );
    expect(getAuthErrorMessage(null)).toBe(
      'Something went sideways. Try again — if it keeps happening, shout in the WhatsApp group or mail us.'
    );
  });
});
