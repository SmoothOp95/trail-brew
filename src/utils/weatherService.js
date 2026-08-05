/**
 * Weather service for Trail Brew — fetches live weather data for trail locations.
 * Uses Open-Meteo (open-meteo.com) — free, no API key required.
 *
 * This module is the single request/format path for trail weather. One call to
 * fetchTrailWeather() returns everything both card variants need: current
 * conditions, comfort details (feels-like, humidity, visibility, sun times),
 * and the rolling rainfall totals that drive trail-condition grading.
 */

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO Weather Interpretation Codes → { condition, description, emoji }
const WMO = {
  0:  { condition: 'Clear',        description: 'Clear sky',                emoji: '☀️' },
  1:  { condition: 'Clear',        description: 'Mainly clear',             emoji: '🌤️' },
  2:  { condition: 'Clouds',       description: 'Partly cloudy',            emoji: '⛅' },
  3:  { condition: 'Clouds',       description: 'Overcast',                 emoji: '☁️' },
  45: { condition: 'Fog',          description: 'Fog',                      emoji: '🌫️' },
  48: { condition: 'Fog',          description: 'Rime fog',                 emoji: '🌫️' },
  51: { condition: 'Drizzle',      description: 'Light drizzle',            emoji: '🌦️' },
  53: { condition: 'Drizzle',      description: 'Moderate drizzle',         emoji: '🌦️' },
  55: { condition: 'Drizzle',      description: 'Dense drizzle',            emoji: '🌦️' },
  61: { condition: 'Rain',         description: 'Slight rain',              emoji: '🌧️' },
  63: { condition: 'Rain',         description: 'Moderate rain',            emoji: '🌧️' },
  65: { condition: 'Rain',         description: 'Heavy rain',               emoji: '🌧️' },
  71: { condition: 'Snow',         description: 'Slight snow',              emoji: '❄️' },
  73: { condition: 'Snow',         description: 'Moderate snow',            emoji: '❄️' },
  75: { condition: 'Snow',         description: 'Heavy snow',               emoji: '❄️' },
  77: { condition: 'Snow',         description: 'Snow grains',              emoji: '🌨️' },
  80: { condition: 'Rain',         description: 'Slight showers',           emoji: '🌦️' },
  81: { condition: 'Rain',         description: 'Moderate showers',         emoji: '🌦️' },
  82: { condition: 'Rain',         description: 'Violent showers',          emoji: '⛈️' },
  85: { condition: 'Snow',         description: 'Slight snow showers',      emoji: '🌨️' },
  86: { condition: 'Snow',         description: 'Heavy snow showers',       emoji: '🌨️' },
  95: { condition: 'Thunderstorm', description: 'Thunderstorm',             emoji: '⛈️' },
  96: { condition: 'Thunderstorm', description: 'Thunderstorm with hail',   emoji: '⛈️' },
  99: { condition: 'Thunderstorm', description: 'Thunderstorm with hail',   emoji: '⛈️' },
};

function decodeWMO(code) {
  return WMO[code] ?? { condition: 'Clear', description: 'Unknown', emoji: '🌡️' };
}

/**
 * Fetch full weather data for a trail's GPS coordinates in a single request:
 * current conditions + comfort details + 48h rainfall history.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} unified weather object
 */
export async function fetchTrailWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'wind_direction_10m',
      'weather_code',
      'surface_pressure',
    ].join(','),
    hourly: 'visibility,precipitation',
    daily: 'sunrise,sunset',
    past_days: 3,
    forecast_days: 1,
    timezone: 'Africa/Johannesburg',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather request failed (${res.status}).`);
  const d = await res.json();

  const cur = d.current;
  const wmo = decodeWMO(cur.weather_code);
  const now = new Date();

  // Sum precipitation over rolling windows from hourly history
  const times = d.hourly.time;
  const precips = d.hourly.precipitation;
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

  // Match current time to closest hourly visibility entry
  const hourIndex = times.findIndex((t) => t >= cur.time);
  const visibilityM = d.hourly.visibility?.[hourIndex >= 0 ? hourIndex : 0] ?? null;

  // Sunrise/sunset for "today" — with past_days=3 the daily arrays start 3 days
  // back, so today's entry is the last one.
  const lastDay = d.daily.sunrise.length - 1;
  const toUnix = (iso) => (iso ? Math.floor(new Date(iso).getTime() / 1000) : null);

  return {
    temp: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    condition: wmo.condition,
    description: wmo.description,
    icon: wmo.emoji,
    humidity: cur.relative_humidity_2m,
    wind: Math.round(cur.wind_speed_10m),
    windDirection: getWindDirection(cur.wind_direction_10m),
    visibility: visibilityM != null ? Math.round((visibilityM / 1000) * 10) / 10 : null,
    pressure: Math.round(cur.surface_pressure),
    weatherCode: cur.weather_code,
    sunrise: toUnix(d.daily.sunrise[lastDay]),
    sunset: toUnix(d.daily.sunset[lastDay]),
    rain1h: Math.round(rain1h * 10) / 10,
    rain24h: Math.round(rain24h * 10) / 10,
    rain48h: Math.round(rain48h * 10) / 10,
  };
}

/**
 * Assess whether current weather is suitable for an MTB ride.
 *
 * @param {object} weather - result from fetchTrailWeather()
 * @returns {{ status: 'good'|'caution'|'poor', message: string, factors: string[] }}
 */
export function getRidingConditions(weather) {
  const factors = [];
  let status = 'good';

  if (weather.temp > 35) {
    factors.push(`Very hot — ${weather.temp}°C. Carry extra water.`);
    if (status === 'good') status = 'caution';
  }
  if (weather.temp < 5) {
    factors.push(`Very cold — ${weather.temp}°C. Layer up.`);
    if (status === 'good') status = 'caution';
  }

  const wetConditions = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'];
  if (wetConditions.includes(weather.condition)) {
    factors.push(`${weather.condition} — trails will be wet and slippery.`);
    status = 'poor';
  }

  if (weather.wind > 40) {
    factors.push(`Strong winds — ${weather.wind} km/h.`);
    if (status === 'good') status = 'caution';
  }

  if (weather.visibility != null && weather.visibility < 5) {
    factors.push(`Low visibility — ${weather.visibility} km.`);
    if (status === 'good') status = 'caution';
  }

  const messages = {
    good: 'Conditions look great — go ride!',
    caution: 'Rideable, but check conditions before heading out.',
    poor: 'Not recommended today — trails or weather unsafe.',
  };

  return { status, message: messages[status], factors };
}

/**
 * Convert wind bearing degrees to a compass direction label.
 *
 * @param {number} degrees - 0–360
 * @returns {string} e.g. 'NE', 'SW'
 */
export function getWindDirection(degrees) {
  if (degrees == null) return '—';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(degrees / 45) % 8];
}

/**
 * Format a Unix timestamp as a local HH:MM string (South African time).
 *
 * @param {number} unixSeconds
 * @returns {string}
 */
export function formatSunTime(unixSeconds) {
  if (!unixSeconds) return '—';
  return new Date(unixSeconds * 1000).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
  });
}
