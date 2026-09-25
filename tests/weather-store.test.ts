import assert from "node:assert/strict";
import { test } from "node:test";
import { createWeatherStore } from "../src/lib/client/weather-store.ts";
import type { WeatherSnapshot } from "../src/lib/client/weather.ts";
import { locationConfig } from "../src/data/location.ts";

const HOUR = 60 * 60 * 1000;
const initialTime = Date.parse("2026-09-25T02:00:00Z");
function snapshot(at = initialTime): WeatherSnapshot {
  return {
    city: locationConfig.city,
    timezone: locationConfig.timezone,
    temperatureUnit: "fahrenheit",
    temperature: 72,
    feelsLike: 74,
    high: 80,
    low: 60,
    humidity: 50,
    weatherCode: 2,
    isDay: false,
    uvIndex: 0,
    conditionsAt: new Date(at).toISOString(),
    uvAt: new Date(at).toISOString(),
    fetchedAt: new Date(at).toISOString(),
  };
}

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
}

test("reuses persisted weather across reloads, then refreshes at 30 minutes", async () => {
  let clock = initialTime;
  let calls = 0;
  const storage = memoryStorage();
  const options = {
    storage,
    now: () => clock,
    load: async () => {
      calls++;
      return snapshot(clock);
    },
  };
  await createWeatherStore(options).refresh();
  clock += 29 * 60_000;
  const reloaded = createWeatherStore(options);
  await reloaded.refresh();
  assert.equal(calls, 1);
  clock += 60_000;
  await reloaded.refresh();
  assert.equal(calls, 2);
});

test("overlapping callers share one network refresh", async () => {
  let calls = 0;
  const store = createWeatherStore({
    storage: memoryStorage(),
    now: () => initialTime,
    load: async () => {
      calls++;
      return snapshot();
    },
  });
  const first = store.refresh();
  const second = store.refresh();
  assert.equal(first, second);
  assert.equal(store.getState().status, "loading");
  await first;
  assert.equal(calls, 1);
  assert.equal(store.getState().status, "ready");
});

test("failed refresh retains weather, throttles retries, and ages it out", async () => {
  let clock = initialTime + HOUR;
  let calls = 0;
  const store = createWeatherStore({
    storage: memoryStorage(JSON.stringify(snapshot())),
    now: () => clock,
    load: async () => {
      calls++;
      throw new Error("offline");
    },
  });
  assert.equal((await store.refresh()).status, "ready");
  await store.refresh();
  assert.equal(calls, 1);
  clock = initialTime + 3 * HOUR;
  assert.equal(store.getState().status, "stale");
  clock = initialTime + 6 * HOUR;
  assert.equal(store.getState().status, "unavailable");
  assert.equal(store.getState().snapshot, null);
});

test("fresh download does not make old conditions fresh", async () => {
  const store = createWeatherStore({
    storage: memoryStorage(),
    now: () => initialTime + 7 * HOUR,
    load: async () => ({
      ...snapshot(),
      fetchedAt: new Date(initialTime + 7 * HOUR).toISOString(),
    }),
  });
  assert.equal((await store.refresh()).status, "unavailable");
});

test("invalid, wrong-location, and future cache entries are ignored", async () => {
  for (const cached of [
    "broken JSON",
    "null",
    JSON.stringify({ ...snapshot(), temperature: null }),
    JSON.stringify({ ...snapshot(), city: "Elsewhere" }),
    JSON.stringify(snapshot(initialTime + HOUR)),
  ]) {
    const store = createWeatherStore({
      storage: memoryStorage(cached),
      now: () => initialTime,
      load: async () => snapshot(),
    });
    assert.equal(store.getState().snapshot, null);
    assert.equal((await store.refresh()).status, "ready");
  }
});

test("blocked storage falls back to an in-memory cache", async () => {
  let calls = 0;
  const store = createWeatherStore({
    storage: {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("full");
      },
    },
    now: () => initialTime,
    load: async () => {
      calls++;
      return snapshot();
    },
  });
  assert.equal((await store.refresh()).status, "ready");
  await store.refresh();
  assert.equal(calls, 1);
});
