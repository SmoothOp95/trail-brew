import { describe, it, expect } from 'vitest';
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
  validatePasswordConfirm,
} from './authValidation';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Rider@Example.COM  ')).toBe('rider@example.com');
  });

  it('handles empty/undefined input', () => {
    expect(normalizeEmail('')).toBe('');
    expect(normalizeEmail(undefined)).toBe('');
  });
});

describe('validateEmail', () => {
  it('accepts a normal email', () => {
    expect(validateEmail('rider@example.com')).toBeNull();
  });

  it('accepts an email with surrounding whitespace', () => {
    expect(validateEmail('  rider@example.com  ')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(validateEmail('Rider@Example.COM')).toBeNull();
  });

  it('rejects missing @', () => {
    expect(validateEmail('rider.example.com')).toBe("That doesn't look like an email address.");
  });

  it('rejects missing domain', () => {
    expect(validateEmail('rider@')).toBe("That doesn't look like an email address.");
  });

  it('rejects missing TLD', () => {
    expect(validateEmail('rider@example')).toBe("That doesn't look like an email address.");
  });

  it('rejects internal whitespace', () => {
    expect(validateEmail('ri der@example.com')).toBe("That doesn't look like an email address.");
  });

  it('rejects empty input', () => {
    expect(validateEmail('')).toBe("That doesn't look like an email address.");
  });
});

describe('validatePassword', () => {
  it('rejects 7 characters', () => {
    expect(validatePassword('1234567')).toBe('Password needs at least 8 characters.');
  });

  it('accepts exactly 8 characters', () => {
    expect(validatePassword('12345678')).toBeNull();
  });

  it('accepts more than 8 characters', () => {
    expect(validatePassword('a-very-long-password')).toBeNull();
  });

  it('rejects empty input', () => {
    expect(validatePassword('')).toBe('Password needs at least 8 characters.');
  });
});

describe('validatePasswordConfirm', () => {
  it('accepts a match', () => {
    expect(validatePasswordConfirm('password123', 'password123')).toBeNull();
  });

  it('rejects a mismatch', () => {
    expect(validatePasswordConfirm('password123', 'password124')).toBe("Passwords don't match.");
  });

  it('rejects when confirm is empty', () => {
    expect(validatePasswordConfirm('password123', '')).toBe("Passwords don't match.");
  });

  it('is case-sensitive', () => {
    expect(validatePasswordConfirm('Password123', 'password123')).toBe("Passwords don't match.");
  });
});
