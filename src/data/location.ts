// Shared by the weather widget and clocks. Update all four values when moving.
// Use city-center coordinates, not your home address. These values are public.
export const locationConfig = {
  city: "Norman, OK",
  latitude: 35.2226,
  longitude: -97.4395,
  // IANA timezone; handles daylight saving time automatically.
  timezone: "America/Chicago",
} as const;
