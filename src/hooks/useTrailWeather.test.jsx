import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTrailWeather, _clearWeatherCache } from './useTrailWeather';

// Minimal Open-Meteo response shape for fetchTrailWeather
function makeApiResponse({ precipitation = 0 } = {}) {
  const hours = [];
  const precips = [];
  const now = new Date();
  for (let i = 96; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600 * 1000);
    hours.push(t.toISOString().slice(0, 16));
    precips.push(precipitation);
  }
  return {
    current: {
      time: hours[hours.length - 1],
      temperature_2m: 22.4,
      apparent_temperature: 23.1,
      relative_humidity_2m: 40,
      wind_speed_10m: 12.3,
      wind_direction_10m: 90,
      weather_code: 1,
      surface_pressure: 1013.2,
    },
    hourly: {
      time: hours,
      precipitation: precips,
      visibility: hours.map(() => 20000),
    },
    daily: {
      sunrise: ['2026-07-03T06:30', '2026-07-04T06:30', '2026-07-05T06:30', '2026-07-06T06:31'],
      sunset: ['2026-07-03T17:30', '2026-07-04T17:30', '2026-07-05T17:30', '2026-07-06T17:31'],
    },
  };
}

const coords = { lat: -26.03, lng: 28.07 };

describe('useTrailWeather', () => {
  beforeEach(() => {
    _clearWeatherCache();
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => makeApiResponse(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches once and derives both condition and ridingConditions from the same data', async () => {
    const { result } = renderHook(() => useTrailWeather(coords));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.weather.temp).toBe(22);
    expect(result.current.weather.windDirection).toBe('E');
    expect(result.current.condition.grade).toBe('PRIME');
    expect(result.current.ridingConditions.status).toBe('good');
  });

  it('shares one fetch across multiple hook instances for the same coordinates', async () => {
    const a = renderHook(() => useTrailWeather(coords));
    const b = renderHook(() => useTrailWeather({ ...coords }));

    await waitFor(() => {
      expect(a.result.current.loading).toBe(false);
      expect(b.result.current.loading).toBe(false);
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(a.result.current.weather).toEqual(b.result.current.weather);
  });

  it('does not fetch while disabled, then fetches when enabled', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useTrailWeather(coords, { enabled }),
      { initialProps: { enabled: false } }
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);

    rerender({ enabled: true });
    await waitFor(() => expect(result.current.weather).not.toBeNull());
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns idle state when no coordinates are provided', () => {
    const { result } = renderHook(() => useTrailWeather(undefined));
    expect(result.current.loading).toBe(false);
    expect(result.current.weather).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('surfaces fetch errors', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 500 }));
    const { result } = renderHook(() => useTrailWeather(coords));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/500/);
    expect(result.current.weather).toBeNull();
  });
});
