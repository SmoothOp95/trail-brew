import { useState, useEffect } from 'react';
import { gradeConditions } from '../utils/trailCondition';
import { fetchTrailWeather, getRidingConditions } from '../utils/weatherService';

// Module-level cache shared across all hook instances — every card variant on
// every screen shares one fetch per unique coordinate pair.
const cache = new Map(); // key: "lat,lng" → { data, fetchedAt }
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// In-flight promise cache so concurrent calls for the same coords share one fetch
const inFlight = new Map();

async function fetchWeatherForCoords(lat, lng) {
  const key = `${lat},${lng}`;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  if (inFlight.has(key)) {
    return inFlight.get(key);
  }

  const promise = (async () => {
    const data = await fetchTrailWeather(lat, lng);
    cache.set(key, { data, fetchedAt: Date.now() });
    inFlight.delete(key);
    return data;
  })();

  inFlight.set(key, promise);
  return promise;
}

/** Test-only: reset module-level caches between test cases. */
export function _clearWeatherCache() {
  cache.clear();
  inFlight.clear();
}

/**
 * Fetches weather for a trail and derives both assessments from the same data:
 *   - condition: rain-based trail surface grade (PRIME…AVOID)
 *   - ridingConditions: comfort/safety verdict (good/caution/poor + factors)
 *
 * @param {{ lat: number, lng: number } | undefined} coordinates
 * @param {{ enabled?: boolean }} [options] set enabled: false to defer the
 *   fetch (e.g. behind a "show weather" toggle) — no request until true.
 * @returns {{ weather: object|null, condition: object|null, ridingConditions: object|null, loading: boolean, error: string|null }}
 */
export function useTrailWeather(coordinates, { enabled = true } = {}) {
  const [state, setState] = useState({
    weather: null,
    condition: null,
    ridingConditions: null,
    loading: Boolean(coordinates && enabled),
    error: null,
  });

  const lat = coordinates?.lat;
  const lng = coordinates?.lng;

  useEffect(() => {
    if (lat == null || lng == null || !enabled) {
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchWeatherForCoords(lat, lng)
      .then((weather) => {
        if (cancelled) return;
        setState({
          weather,
          condition: gradeConditions(weather),
          ridingConditions: getRidingConditions(weather),
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          weather: null,
          condition: null,
          ridingConditions: null,
          loading: false,
          error: err.message,
        });
      });

    return () => { cancelled = true; };
  }, [lat, lng, enabled]);

  return state;
}
