/**
 * Weather service for Trail Brew — fetches live weather data for trail locations.
 *
 * Uses OpenWeather API (api.openweathermap.org) if VITE_OPENWEATHER_API_KEY is set.
 * Get a free key (1 000 calls/day) at https://openweathermap.org/api
 *
 * Add to your .env:
 *   VITE_OPENWEATHER_API_KEY=your_key_here
 */

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

function apiKey() {
  return import.meta.env.VITE_OPENWEATHER_API_KEY;
}

/**
 * Fetch current weather conditions at given GPS coordinates.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<object>} weather object
 */
export async function getCurrentWeather(lat, lon) {
  const key = apiKey();
  if (!key) throw new Error('OpenWeather API key not configured. Add VITE_OPENWEATHER_API_KEY to your .env file.');

  const res = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${key}`
  );
  if (!res.ok) throw new Error(`Weather request failed (${res.status}). Check your API key.`);
  const d = await res.json();

  return {
    temperature: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    condition: d.weather[0].main,
    description: d.weather[0].description,
    icon: d.weather[0].icon,
    humidity: d.main.humidity,
    // OpenWeather returns m/s — convert to km/h
    windSpeed: Math.round(d.wind.speed * 3.6),
    windDirection: getWindDirection(d.wind.deg),
    // Convert metres to kilometres
    visibility: Math.round((d.visibility / 1000) * 10) / 10,
    pressure: d.main.pressure,
    // Unix timestamps (seconds)
    sunrise: d.sys.sunrise,
    sunset: d.sys.sunset,
  };
}

/**
 * Fetch 5-day / 3-hour forecast and group results by calendar day.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<Array>} array of daily forecast objects
 */
export async function getWeatherForecast(lat, lon) {
  const key = apiKey();
  if (!key) throw new Error('OpenWeather API key not configured. Add VITE_OPENWEATHER_API_KEY to your .env file.');

  const res = await fetch(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`
  );
  if (!res.ok) throw new Error(`Forecast request failed (${res.status}).`);
  const d = await res.json();

  // Group the 3-hour slots by local date string
  const days = {};
  for (const item of d.list) {
    const date = new Date(item.dt * 1000).toLocaleDateString('en-ZA');
    if (!days[date]) {
      days[date] = { temps: [], conditions: [], precipitation: 0, humidity: [], windSpeed: [] };
    }
    days[date].temps.push(item.main.temp);
    days[date].conditions.push(item.weather[0].main);
    // 3-hour rain accumulation (may be absent when dry)
    days[date].precipitation += item.rain?.['3h'] || 0;
    days[date].humidity.push(item.main.humidity);
    days[date].windSpeed.push(item.wind.speed * 3.6);
  }

  return Object.entries(days).map(([date, data]) => {
    const mid = data.conditions[Math.floor(data.conditions.length / 2)];
    return {
      date,
      minTemp: Math.round(Math.min(...data.temps)),
      maxTemp: Math.round(Math.max(...data.temps)),
      avgTemp: Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length),
      condition: mid,
      precipitation: Math.round(data.precipitation * 10) / 10,
      humidity: Math.round(data.humidity.reduce((a, b) => a + b, 0) / data.humidity.length),
      windSpeed: Math.round(Math.max(...data.windSpeed)),
    };
  });
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

  // Temperature extremes
  if (weather.temperature > 35) {
    factors.push(`Very hot — ${weather.temperature}°C. Carry extra water.`);
    if (status === 'good') status = 'caution';
  }
  if (weather.temperature < 5) {
    factors.push(`Very cold — ${weather.temperature}°C. Layer up.`);
    if (status === 'good') status = 'caution';
  }

  // Active precipitation
  const wetConditions = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'];
  if (wetConditions.includes(weather.condition)) {
    factors.push(`${weather.condition} — trails will be wet and slippery.`);
    status = 'poor';
  }

  // Wind
  if (weather.windSpeed > 40) {
    factors.push(`Strong winds — ${weather.windSpeed} km/h.`);
    if (status === 'good') status = 'caution';
  }

  // Visibility
  if (weather.visibility < 5) {
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
 * Return the full URL for an OpenWeather icon code.
 * e.g. getWeatherIconUrl('10d') → 'https://openweathermap.org/img/wn/10d@2x.png'
 *
 * @param {string} iconCode
 * @returns {string}
 */
export function getWeatherIconUrl(iconCode) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
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
  return new Date(unixSeconds * 1000).toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Johannesburg',
  });
}
