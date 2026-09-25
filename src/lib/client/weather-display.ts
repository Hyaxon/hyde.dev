/** Open-Meteo's WMO weather interpretation codes. */
export function conditionLabel(code: number, isDay: boolean): string {
  switch (code) {
    case 0:
      return isDay ? "Sunny" : "Clear";
    case 1:
      return "Mostly clear";
    case 2:
      return "Partly cloudy";
    case 3:
      return "Overcast";
    case 45:
    case 48:
      return "Foggy";
    case 51:
    case 53:
    case 55:
      return "Drizzle";
    case 56:
    case 57:
      return "Freezing drizzle";
    case 61:
    case 63:
    case 65:
      return "Raining";
    case 66:
    case 67:
      return "Freezing rain";
    case 71:
    case 73:
    case 75:
    case 77:
      return "Snowing";
    case 80:
    case 81:
    case 82:
      return "Rain showers";
    case 85:
    case 86:
      return "Snow showers";
    case 95:
    case 97:
      return "Thunderstorms";
    case 96:
    case 99:
      return "Storms with hail";
    default:
      return "Unknown";
  }
}

/** Closest available artwork; labels above retain the actual condition. */
export function conditionIcon(code: number, isDay: boolean): string {
  switch (code) {
    case 0:
      return isDay ? "clear" : "clear-night";
    case 1:
      return isDay ? "mostly-clear" : "clear-night";
    case 2:
      // Keep the asset's existing spelling. No partly-cloudy night art yet.
      return isDay ? "party-cloudy" : "cloudy";
    case 45:
    case 48:
      return "foggy";
    case 51:
    case 53:
    case 55:
    case 61:
    case 63:
    case 65:
    case 80:
    case 81:
    case 82:
    case 95:
    case 97:
      return "raining";
    case 56:
    case 57:
    case 66:
    case 67:
      return "freezing-rain";
    case 71:
    case 73:
    case 75:
    case 77:
      return "snowing";
    case 85:
    case 86:
      return "snow-showers";
    case 96:
    case 99:
      return "hail";
    default:
      return "cloudy";
  }
}
