import { describe, it, expect } from 'vitest';
import { normalizeSAPhoneNumber, isValidSAPhoneNumber } from './phoneNumber';

describe('normalizeSAPhoneNumber', () => {
  it('normalizes a local 0-prefixed number', () => {
    expect(normalizeSAPhoneNumber('0821234567')).toBe('+27821234567');
  });

  it('normalizes a number already in E.164 form', () => {
    expect(normalizeSAPhoneNumber('+27821234567')).toBe('+27821234567');
  });

  it('normalizes a bare country-code number missing the +', () => {
    expect(normalizeSAPhoneNumber('27821234567')).toBe('+27821234567');
  });

  it('strips spaces, dashes and parentheses before validating', () => {
    expect(normalizeSAPhoneNumber('082 123 4567')).toBe('+27821234567');
    expect(normalizeSAPhoneNumber('+27 82-123-4567')).toBe('+27821234567');
    expect(normalizeSAPhoneNumber('(082) 123 4567')).toBe('+27821234567');
  });

  it('rejects numbers of the wrong length', () => {
    expect(normalizeSAPhoneNumber('082123456')).toBeNull();
    expect(normalizeSAPhoneNumber('08212345678')).toBeNull();
  });

  it('rejects a local number missing the leading 0', () => {
    expect(normalizeSAPhoneNumber('821234567')).toBeNull();
  });

  it('rejects non-SA country codes', () => {
    expect(normalizeSAPhoneNumber('+1 821 234 5678')).toBeNull();
  });

  it('rejects a local number with a leading-zero subscriber part', () => {
    expect(normalizeSAPhoneNumber('0021234567')).toBeNull();
  });

  it('rejects empty, non-string, or garbage input', () => {
    expect(normalizeSAPhoneNumber('')).toBeNull();
    expect(normalizeSAPhoneNumber(undefined)).toBeNull();
    expect(normalizeSAPhoneNumber('not a number')).toBeNull();
  });
});

describe('isValidSAPhoneNumber', () => {
  it('mirrors normalizeSAPhoneNumber success/failure', () => {
    expect(isValidSAPhoneNumber('0821234567')).toBe(true);
    expect(isValidSAPhoneNumber('123')).toBe(false);
  });
});
