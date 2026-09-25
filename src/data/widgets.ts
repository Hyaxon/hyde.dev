import { locationConfig } from "./location.ts";

export const weatherConfig = {
  ...locationConfig,
  temperatureUnit: "fahrenheit",
  refreshIntervalMs: 30 * 60 * 1000,
  staleAfterMs: 3 * 60 * 60 * 1000,
  unavailableAfterMs: 6 * 60 * 60 * 1000,
} as const;

// Design fixture only. Replace with fetched weather when connected.
export const weatherPreview = {
  city: locationConfig.city,
  timezone: locationConfig.timezone,
  observedAt: "2026-01-15T22:49:00-06:00",
  condition: "Snowing",
  temperature: 67,
  high: 999,
  low: -999,
  humidity: 100,
  uvIndex: 10,
  feelsLike: 67,
};
