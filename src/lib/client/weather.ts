import { weatherConfig } from "../../data/widgets.ts";

export interface WeatherSnapshot {
  city: string;
  timezone: string;
  temperatureUnit: "fahrenheit";
  temperature: number;
  feelsLike: number;
  high: number;
  low: number;
  humidity: number;
  weatherCode: number;
  isDay: boolean;
  uvIndex: number | null;
  conditionsAt: string;
  uvAt: string | null;
  fetchedAt: string;
}

type FetchOptions = {
  signal?: AbortSignal;
  // Injection lets us verify failures without contacting the provider.
  fetcher?: typeof fetch;
};

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid Open-Meteo response: expected an object");
  }
  return value as Record<string, unknown>;
}

function number(
  value: unknown,
  name: string,
  min = -Infinity,
  max = Infinity,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    throw new Error(`Invalid Open-Meteo field: ${name}`);
  }
  return value;
}

function timestamp(value: unknown): string {
  const seconds = number(value, "time", 0);
  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime()))
    throw new Error("Invalid Open-Meteo timestamp");
  return date.toISOString();
}

function dailyValue(value: unknown, name: string): number {
  if (!Array.isArray(value) || value.length !== 1) {
    throw new Error(`Invalid Open-Meteo daily field: ${name}`);
  }
  return number(value[0], name);
}

function url(base: string, parameters: Record<string, string>): URL {
  const result = new URL(base);
  result.search = new URLSearchParams({
    latitude: String(weatherConfig.latitude),
    longitude: String(weatherConfig.longitude),
    timezone: weatherConfig.timezone,
    timeformat: "unixtime",
    forecast_days: "1",
    ...parameters,
  }).toString();
  return result;
}

async function request(url: URL, fetcher: typeof fetch, signal: AbortSignal) {
  const response = await fetcher(url, {
    signal,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed (${response.status})`);
  }
  return object(await response.json());
}

/** One refresh only. Storage, retry policy, and scheduling belong to the caller. */
export async function fetchWeather({
  signal,
  fetcher = fetch,
}: FetchOptions = {}): Promise<WeatherSnapshot> {
  const timeout = AbortSignal.timeout(10_000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

  const weatherUrl = url("https://api.open-meteo.com/v1/forecast", {
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day",
    daily: "temperature_2m_max,temperature_2m_min",
    temperature_unit: weatherConfig.temperatureUnit,
  });
  const airUrl = url("https://air-quality-api.open-meteo.com/v1/air-quality", {
    current: "uv_index",
  });

  // Settle independently: optional UV failure must not discard weather.
  const [weatherResult, airResult] = await Promise.allSettled([
    request(weatherUrl, fetcher, requestSignal),
    request(airUrl, fetcher, requestSignal),
  ]);
  signal?.throwIfAborted();
  if (weatherResult.status === "rejected") throw weatherResult.reason;

  const current = object(weatherResult.value.current);
  const daily = object(weatherResult.value.daily);
  const high = dailyValue(daily.temperature_2m_max, "temperature_2m_max");
  const low = dailyValue(daily.temperature_2m_min, "temperature_2m_min");
  if (low > high) throw new Error("Invalid Open-Meteo daily temperature range");
  const day = number(current.is_day, "is_day", 0, 1);
  if (day !== 0 && day !== 1) throw new Error("Invalid Open-Meteo day flag");
  const weatherCode = number(current.weather_code, "weather_code", 0, 99);
  if (!Number.isInteger(weatherCode))
    throw new Error("Invalid Open-Meteo weather code");

  let uvIndex: number | null = null;
  let uvAt: string | null = null;
  if (airResult.status === "fulfilled") {
    try {
      const air = object(airResult.value.current);
      const at = timestamp(air.time);
      const uv =
        air.uv_index == null ? null : number(air.uv_index, "uv_index", 0);
      uvIndex = uv;
      uvAt = at;
    } catch {
      // Malformed optional data is unavailable, never substituted with zero.
    }
  }

  return {
    city: weatherConfig.city,
    timezone: weatherConfig.timezone,
    temperatureUnit: weatherConfig.temperatureUnit,
    temperature: number(current.temperature_2m, "temperature_2m"),
    feelsLike: number(current.apparent_temperature, "apparent_temperature"),
    humidity: number(
      current.relative_humidity_2m,
      "relative_humidity_2m",
      0,
      100,
    ),
    high,
    low,
    weatherCode,
    isDay: day === 1,
    uvIndex,
    conditionsAt: timestamp(current.time),
    uvAt,
    fetchedAt: new Date().toISOString(),
  };
}
