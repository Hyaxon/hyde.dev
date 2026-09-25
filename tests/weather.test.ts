import assert from "node:assert/strict";
import { test } from "node:test";
import { fetchWeather } from "../src/lib/client/weather.ts";
import { locationConfig } from "../src/data/location.ts";

const weather = {
  current: {
    time: 1790290800,
    temperature_2m: 72.4,
    apparent_temperature: 74.8,
    relative_humidity_2m: 48,
    weather_code: 2,
    is_day: 1,
  },
  daily: { temperature_2m_max: [81.2], temperature_2m_min: [59.7] },
};
const air = { current: { time: 1790287200, uv_index: 0 } };

function mockFetch(
  airResponse: () => Response = () => Response.json(air),
  weatherBody: unknown = weather,
): typeof fetch {
  return async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("timezone"), locationConfig.timezone);
    assert.equal(
      url.searchParams.get("latitude"),
      String(locationConfig.latitude),
    );
    assert.equal(
      url.searchParams.get("longitude"),
      String(locationConfig.longitude),
    );
    assert.equal(url.searchParams.get("forecast_days"), "1");
    assert.equal(url.searchParams.get("timeformat"), "unixtime");
    assert.equal(init?.credentials, "omit");
    if (url.hostname === "air-quality-api.open-meteo.com") return airResponse();
    assert.equal(url.searchParams.get("temperature_unit"), "fahrenheit");
    return Response.json(weatherBody);
  };
}

test("returns unrounded Fahrenheit values and distinct UTC condition timestamps", async () => {
  const data = await fetchWeather({ fetcher: mockFetch() });
  assert.equal(data.temperature, 72.4);
  assert.equal(data.high, 81.2);
  assert.equal(data.low, 59.7);
  assert.equal(data.uvIndex, 0);
  assert.equal(data.feelsLike, 74.8);
  assert.equal(data.isDay, true);
  assert.equal(
    data.conditionsAt,
    new Date(weather.current.time * 1000).toISOString(),
  );
  assert.notEqual(data.conditionsAt, data.uvAt);
});

test("UV HTTP, network, and malformed-response failures preserve weather", async () => {
  for (const response of [
    () => new Response(null, { status: 429 }),
    () => {
      throw new TypeError("Network unavailable");
    },
    () => Response.json({ current: { time: "invalid" } }),
    () => new Response("not JSON"),
  ]) {
    const data = await fetchWeather({ fetcher: mockFetch(response) });
    assert.equal(data.temperature, 72.4);
    assert.equal(data.uvIndex, null);
    assert.equal(data.feelsLike, 74.8);
    assert.equal(data.uvAt, null);
  }
});

test("rejects missing temperatures rather than coercing null to zero", async () => {
  await assert.rejects(
    fetchWeather({
      fetcher: mockFetch(undefined, {
        ...weather,
        current: { ...weather.current, temperature_2m: null },
      }),
    }),
    /temperature_2m/,
  );
});

test("rejects weather HTTP failures and caller cancellation", async () => {
  await assert.rejects(
    fetchWeather({ fetcher: async () => new Response(null, { status: 503 }) }),
    /503/,
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    fetchWeather({ fetcher: mockFetch(), signal: controller.signal }),
    { name: "AbortError" },
  );
});
