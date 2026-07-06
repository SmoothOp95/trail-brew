import { describe, it, expect } from 'vitest';
import { getRidingConditions, getWindDirection, formatSunTime } from './weatherService';

const baseWeather = {
  temperature: 22,
  condition: 'Clear',
  windSpeed: 10,
  visibility: 10,
};

describe('getRidingConditions', () => {
  it('reports good in mild, dry, calm weather', () => {
    const result = getRidingConditions(baseWeather);
    expect(result.status).toBe('good');
    expect(result.factors).toHaveLength(0);
  });

  it('flags caution when very hot', () => {
    const result = getRidingConditions({ ...baseWeather, temperature: 38 });
    expect(result.status).toBe('caution');
    expect(result.factors[0]).toMatch(/hot/i);
  });

  it('flags caution when very cold', () => {
    const result = getRidingConditions({ ...baseWeather, temperature: 2 });
    expect(result.status).toBe('caution');
  });

  it('reports poor in any wet condition', () => {
    for (const condition of ['Rain', 'Drizzle', 'Thunderstorm', 'Snow']) {
      expect(getRidingConditions({ ...baseWeather, condition }).status).toBe('poor');
    }
  });

  it('wet conditions outrank a caution factor', () => {
    const result = getRidingConditions({
      ...baseWeather,
      condition: 'Rain',
      temperature: 38,
    });
    expect(result.status).toBe('poor');
  });

  it('flags caution for strong wind and low visibility', () => {
    expect(getRidingConditions({ ...baseWeather, windSpeed: 45 }).status).toBe('caution');
    expect(getRidingConditions({ ...baseWeather, visibility: 2 }).status).toBe('caution');
  });

  it('tolerates null visibility (no crash, no factor)', () => {
    const result = getRidingConditions({ ...baseWeather, visibility: null });
    expect(result.status).toBe('good');
  });
});

describe('getWindDirection', () => {
  it('maps bearings to compass points', () => {
    expect(getWindDirection(0)).toBe('N');
    expect(getWindDirection(90)).toBe('E');
    expect(getWindDirection(180)).toBe('S');
    expect(getWindDirection(270)).toBe('W');
    expect(getWindDirection(45)).toBe('NE');
  });

  it('wraps 360 back to N and handles null', () => {
    expect(getWindDirection(360)).toBe('N');
    expect(getWindDirection(null)).toBe('—');
  });
});

describe('formatSunTime', () => {
  it('formats a unix timestamp in South African time', () => {
    // 2026-01-15 04:30 UTC = 06:30 SAST
    expect(formatSunTime(1768451400)).toMatch(/06:30/);
  });

  it('returns a dash for missing values', () => {
    expect(formatSunTime(null)).toBe('—');
    expect(formatSunTime(0)).toBe('—');
  });
});
