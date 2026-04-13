/**
 * Weather service for Trail Brew — fetches live weather data for trail locations.
 * Uses Open-Meteo (open-meteo.com) — free, no API key required.
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
 * Fetch current weather conditions at given GPS coordinates.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} weather object
 */
export async function getCurrentWeather(lat, lon) {
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
    hourly: 'visibility',
    daily: 'sunrise,sunset',
    forecast_days: 1,
    timezone: 'Africa/Johannesburg',
  });

  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather request failed (${res.status}).`);
  const d = await res.json();

  const cur = d.current;
  const wmo = decodeWMO(cur.weather_code);

  // Match current time to closest hourly visibility entry
  const currentTimeStr = cur.time; // e.g. "2026-04-13T14:00"
  const hourIndex = d.hourly.time.findIndex((t) => t >= currentTimeStr);
  const visibilityM = d.hourly.visibility[hourIndex >= 0 ? hourIndex : 0] ?? null;

  // daily sunrise/sunset are ISO strings like "2026-04-13T06:15" — convert to Unix seconds
  const sunrise = d.daily.sunrise[0]
    ? Math.floor(new Date(d.daily.sunrise[0]).getTime() / 1000)
    : null;
  const sunset = d.daily.sunset[0]
    ? Math.floor(new Date(d.daily.sunset[0]).getTime() / 1000)
    : null;

  return {
    temperature: Math.round(cur.temperature_2m),
    feelsLike: Math.round(cur.apparent_temperature),
    condition: wmo.condition,
    description: wmo.description,
    icon: wmo.emoji,
    humidity: cur.relative_humidity_2m,
    windSpeed: Math.round(cur.wind_speed_10m),
    windDirection: getWindDirection(cur.wind_direction_10m),
    visibility: visibilityM != null ? Math.round((visibilityM / 1000) * 10) / 10 : null,
    pressure: Math.round(cur.surface_pressure),
    sunrise,
    sunset,
  };
}

/**
 * Assess whether current weather is suitable for an MTB ride.
 *
 * @param {object} weather - result from getCurrentWeather()
 * @returns {{ status: 'good'|'caution'|'poor', message: string, factors: string[] }}
 */
export function getRidingConditions(weather) {
  const factors = [];
  let status = 'good';

  if (weather.temperature > 35) {
    factors.push(`Very hot — ${weather.temperature}°C. Carry extra water.`);
    if (status === 'good') status = 'caution';
  }
  if (weather.temperature < 5) {
    factors.push(`Very cold — ${weather.temperature}°C. Layer up.`);
    if (status === 'good') status = 'caution';
  }

  const wetConditions = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'];
  if (wetConditions.includes(weather.condition)) {
    factors.push(`${weather.condition} — trails will be wet and slippery.`);
    status = 'poor';
  }

  if (weather.windSpeed > 40) {
    factors.push(`Strong winds — ${weather.windSpeed} km/h.`);
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
