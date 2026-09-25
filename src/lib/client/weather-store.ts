import { weatherConfig } from "../../data/widgets.ts";
import { fetchWeather, type WeatherSnapshot } from "./weather.ts";

export interface WeatherState {
  status: "loading" | "ready" | "stale" | "unavailable";
  snapshot: WeatherSnapshot | null;
  refreshing: boolean;
  error: string | null;
}

const CACHE_KEY = `weather:v2:${weatherConfig.latitude}:${weatherConfig.longitude}:${weatherConfig.timezone}:${weatherConfig.temperatureUnit}`;
type CacheStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): CacheStorage | undefined {
  try {
    return typeof localStorage === "undefined" ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

// Persisted data is untrusted and may come from an older version of the site.
function validSnapshot(value: unknown): value is WeatherSnapshot {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  const finite = (key: string) =>
    typeof data[key] === "number" && Number.isFinite(data[key]);
  const date = (key: string) =>
    typeof data[key] === "string" && Number.isFinite(Date.parse(data[key]));
  return (
    data.city === weatherConfig.city &&
    data.timezone === weatherConfig.timezone &&
    data.temperatureUnit === weatherConfig.temperatureUnit &&
    [
      "temperature",
      "feelsLike",
      "high",
      "low",
      "humidity",
      "weatherCode",
    ].every(finite) &&
    (data.low as number) <= (data.high as number) &&
    (data.humidity as number) >= 0 &&
    (data.humidity as number) <= 100 &&
    Number.isInteger(data.weatherCode) &&
    (data.weatherCode as number) >= 0 &&
    (data.weatherCode as number) <= 99 &&
    typeof data.isDay === "boolean" &&
    ["uvIndex"].every(
      (key) =>
        data[key] === null || (finite(key) && (data[key] as number) >= 0),
    ) &&
    date("conditionsAt") &&
    date("fetchedAt") &&
    (data.uvAt === null || date("uvAt"))
  );
}

/** A cache and request coordinator, independent of the widget and its markup. */
export function createWeatherStore({
  storage = browserStorage(),
  load = fetchWeather,
  now = Date.now,
}: {
  storage?: CacheStorage;
  load?: () => Promise<WeatherSnapshot>;
  now?: () => number;
} = {}) {
  let snapshot: WeatherSnapshot | null = null;
  let pending: Promise<WeatherState> | undefined;
  let lastAttempt = -Infinity;
  let error: string | null = null;

  function acceptable(data: unknown): data is WeatherSnapshot {
    return (
      validSnapshot(data) &&
      Date.parse(data.fetchedAt) <= now() + 60_000 &&
      Date.parse(data.conditionsAt) <= now() + 60_000
    );
  }

  function readCache() {
    try {
      const cached: unknown = JSON.parse(storage?.getItem(CACHE_KEY) ?? "null");
      if (
        acceptable(cached) &&
        (!snapshot ||
          Date.parse(cached.fetchedAt) > Date.parse(snapshot.fetchedAt))
      ) {
        snapshot = cached;
      }
    } catch {
      // Disabled storage or malformed JSON must not break weather fetching.
    }
  }
  readCache();

  function getState(): WeatherState {
    const age = snapshot ? now() - Date.parse(snapshot.conditionsAt) : Infinity;
    const status =
      age >= weatherConfig.unavailableAfterMs
        ? "unavailable"
        : age >= weatherConfig.staleAfterMs
          ? "stale"
          : "ready";
    return {
      status: !snapshot && pending ? "loading" : status,
      snapshot: status === "unavailable" ? null : snapshot,
      refreshing: !!pending,
      error,
    };
  }

  function refresh(): Promise<WeatherState> {
    if (pending) return pending;
    readCache(); // Another tab may have updated the shared localStorage entry.
    const checkedAt = snapshot ? Date.parse(snapshot.fetchedAt) : -Infinity;
    if (
      now() - Math.max(checkedAt, lastAttempt) <
      weatherConfig.refreshIntervalMs
    ) {
      return Promise.resolve(getState());
    }
    lastAttempt = now();
    // Defer loading so pending is assigned even if load throws synchronously.
    pending = Promise.resolve()
      .then(load)
      .then((data) => {
        if (!acceptable(data)) throw new Error("Invalid weather snapshot");
        snapshot = data;
        error = null;
        try {
          storage?.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
          // Keep the in-memory result when storage is blocked or full.
        }
      })
      .catch(() => {
        error = "Weather refresh failed";
      })
      .then(() => {
        pending = undefined;
        return getState();
      });
    return pending;
  }

  return { getState, refresh };
}

let sharedStore: ReturnType<typeof createWeatherStore> | undefined;

/** Start on mount; call the returned cleanup function on unmount. */
export function watchWeather(
  onChange: (state: WeatherState) => void,
): () => void {
  const store = (sharedStore ??= createWeatherStore());
  let active = true;
  const emit = () => {
    if (active) onChange(store.getState());
  };
  const tick = () => {
    if (document.visibilityState !== "visible") return;
    const refresh = store.refresh();
    emit();
    void refresh.then(emit);
  };

  emit();
  tick();
  // This checks display age every minute; refresh() limits network work to 30m.
  const timer = setInterval(tick, 60_000);
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("pageshow", tick);
  return () => {
    active = false;
    clearInterval(timer);
    document.removeEventListener("visibilitychange", tick);
    window.removeEventListener("pageshow", tick);
  };
}
