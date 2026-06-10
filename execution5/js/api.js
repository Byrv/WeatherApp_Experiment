// API layer — Open-Meteo (free, no API key: TR-1, TR-2, TR-3)
//
// Sample geocoding response (validated Milestone 0):
//   { results: [{ name: "London", country: "United Kingdom",
//                 latitude: 51.50853, longitude: -0.12574, ... }] }
// Sample forecast response:
//   { current: { temperature_2m: 18.3, relative_humidity_2m: 65,
//                wind_speed_10m: 12.4, weather_code: 3 } }

class CityNotFoundError extends Error {
  constructor(query) { super(`City not found: ${query}`); this.name = "CityNotFoundError"; }
}
class NetworkError extends Error {
  constructor(detail) { super(`Network error: ${detail}`); this.name = "NetworkError"; }
}

async function geocodeCity(name) {
  const query = (name || "").trim();
  if (!query) throw new CityNotFoundError("(empty input)");
  let res;
  try {
    res = await fetch(
      "https://geocoding-api.open-meteo.com/v1/search?name=" +
      encodeURIComponent(query) + "&count=5"
    );
  } catch (e) {
    throw new NetworkError("geocoding request failed");
  }
  if (!res.ok) throw new NetworkError("geocoding HTTP " + res.status);
  const data = await res.json();
  if (!data.results || data.results.length === 0) throw new CityNotFoundError(query);
  const top = data.results[0];
  return {
    name: top.name,
    country: top.country || "",
    latitude: top.latitude,
    longitude: top.longitude,
  };
}

async function fetchWeather(latitude, longitude) {
  let res;
  try {
    res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=" + latitude +
      "&longitude=" + longitude +
      "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code"
    );
  } catch (e) {
    throw new NetworkError("weather request failed");
  }
  if (!res.ok) throw new NetworkError("weather HTTP " + res.status);
  const data = await res.json();
  const c = data.current;
  return {
    temperature: c.temperature_2m,   // °C
    humidity: c.relative_humidity_2m, // %
    windSpeed: c.wind_speed_10m,      // km/h
    weatherCode: c.weather_code,      // WMO code
  };
}

// FR-1 + FR-2: city name in, full weather record out.
async function getCityWeather(cityName) {
  const city = await geocodeCity(cityName);
  const weather = await fetchWeather(city.latitude, city.longitude);
  return { city, weather };
}
