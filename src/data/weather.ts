import { fetchWithRetry } from "../utils/fetchWrapper.js";
import { logger } from "../utils/logger.js";

export type CurrentWeather = {
  source: "openweathermap";
  lat: number;
  lon: number;
  tempK: number; // Kelvin
  tempC: number; // Celsius
  windSpeedMs?: number;
  windDeg?: number;
  humidity?: number;
  description?: string;
  raw: any;
};

function ensureApiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new Error("Missing OPENWEATHER_API_KEY. Get a free key from https://openweathermap.org/api and set it in your environment.");
  }
  return key;
}

function isIncompleteOpenWeather(data: any): boolean {
  if (!data || typeof data !== "object") return true;
  // Treat as incomplete if critical fields are null/undefined
  if (!data.coord || data.main == null) return true;
  if (data.main && (data.main.temp == null)) return true;
  return false;
}

export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
  const key = ensureApiKey();
  const url = new URL("https://api.openweathermap.org/data/2.5/weather");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("appid", key);
  // You can add units=metric if you prefer Celsius directly, but we keep Kelvin for baseline

  const data = await fetchWithRetry(url.toString(), undefined, {
    retries: 3,
    backoffMs: 600,
    parseAs: "json",
    isIncomplete: isIncompleteOpenWeather,
  });

  if (data.cod && data.cod !== 200) {
    logger.warn("OpenWeather returned non-200 code", data);
  }

  const tempK = Number(data?.main?.temp);
  const tempC = tempK - 273.15;

  return {
    source: "openweathermap",
    lat,
    lon,
    tempK,
    tempC,
    windSpeedMs: data?.wind?.speed,
    windDeg: data?.wind?.deg,
    humidity: data?.main?.humidity,
    description: data?.weather?.[0]?.description,
    raw: data,
  };
}
