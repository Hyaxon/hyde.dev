import assert from "node:assert/strict";
import { test } from "node:test";
import { conditionLabel } from "../src/lib/client/weather-display.ts";

test("weather descriptions distinguish day, night, precipitation and unknown codes", () => {
  assert.equal(conditionLabel(0, true), "Sunny");
  assert.equal(conditionLabel(0, false), "Clear");
  assert.equal(conditionLabel(73, true), "Snowing");
  assert.equal(conditionLabel(67, false), "Freezing rain");
  assert.equal(conditionLabel(97, false), "Thunderstorms");
  assert.equal(conditionLabel(99, true), "Storms with hail");
  assert.equal(conditionLabel(1000, true), "Unknown");
});
