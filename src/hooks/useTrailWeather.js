import { useState, useEffect } from 'react';
import { gradeConditions } from '../utils/trailCondition';

// Module-level cache shared across all hook instances — avoids duplicate fetches
// for trails that are close together and are fetched on the same render cycle.
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
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lng,
      current: 'temperature_2m,precipitation,weather_code,wind_speed_10m',
      hourly: 'precipitation',
      past_days: 3,
      forecast_days: 1,
      timezone: 'Africa/Johannesburg',
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    const json = await res.json();

    const now = new Date();

    // Sum precipitation over rolling windows from hourly history
    const times = json.hourly.time;
    const precips = json.hourly.precipitation;

    let rain1h = 0;
    let rain24h = 0;
    let rain48h = 0;

    for (let i = 0; i < times.length; i++) {
      const t = new Date(times[i]);
      if (t > now) continue; // skip future hours
      const age = now - t;
      if (age <= 1 * 3600 * 1000) rain1h += precips[i];
      if (age <= 24 * 3600 * 1000) rain24h += precips[i];
      if (age <= 48 * 3600 * 1000) rain48h += precips[i];
    }

    const data = {
      temp: Math.round(json.current.temperature_2m),
      wind: Math.round(json.current.wind_speed_10m),
      weatherCode: json.current.weather_code,
      rain1h: Math.round(rain1h * 10) / 10,
      rain24h: Math.round(rain24h * 10) / 10,
      rain48h: Math.round(rain48h * 10) / 10,
    };

    cache.set(key, { data, fetchedAt: Date.now() });
    inFlight.delete(key);
    return data;
  })();

  inFlight.set(key, promise);
  return promise;
}

/**
 * Fetches weather + computes trail condition grade for a given set of coordinates.
 *
 * @param {{ lat: number, lng: number } | undefined} coordinates
 * @returns {{ weather: object|null, condition: object|null, loading: boolean, error: string|null }}
 */
export function useTrailWeather(coordinates) {
  const [state, setState] = useState({ weather: null, condition: null, loading: true, error: null });

  useEffect(() => {
    if (!coordinates) {
      setState({ weather: null, condition: null, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetchWeatherForCoords(coordinates.lat, coordinates.lng)
      .then((weather) => {
        if (cancelled) return;
        const condition = gradeConditions(weather);
        setState({ weather, condition, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({ weather: null, condition: null, loading: false, error: err.message });
      });

    return () => { cancelled = true; };
  }, [coordinates?.lat, coordinates?.lng]);

  return state;
}
