import { fetchJsonWithTimeout } from "@/lib/context/http";
import { mapForecastToWeatherCondition } from "@/lib/context/weather";

export type WeatherContext = {
  temperature: number | null;
  lowTemperature: number | null;
  windSpeed: string | null;
  windDirection: string | null;
  precipitationChance: number | null;
  shortForecast: string;
  hazards: string[];
  sunrise: string | null;
  sunset: string | null;
  sourceLabel: string;
};

export type WeeklyForecastDay = {
  date: string;
  dayLabel: string;
  shortForecast: string;
  weatherCondition: string;
  recommendedSetting: "indoor" | "outdoor" | "mixed";
  highTemperature: number | null;
  lowTemperature: number | null;
  precipitationChance: number | null;
  windSpeed: string | null;
  windDirection: string | null;
  hazards: string[];
  sourceLabel: string;
};

type NwsPointsResponse = {
  properties?: {
    forecast?: string;
  };
};

type NwsForecastResponse = {
  properties?: {
    periods?: Array<{
      temperature?: number;
      windSpeed?: string;
      windDirection?: string;
      shortForecast?: string;
      probabilityOfPrecipitation?: { value?: number | null };
      isDaytime?: boolean;
      startTime?: string;
    }>;
  };
};

type NwsAlertsResponse = {
  features?: Array<{
    properties?: {
      headline?: string;
    };
  }>;
};

export async function getNwsWeatherContext(latitude: number, longitude: number) {
  const userAgent = process.env.WSA_ENV_DATA_USER_AGENT || "WildStallionAcademyAI/1.0 (support@example.com)";

  try {
    const points = await fetchJsonWithTimeout<NwsPointsResponse>(
      `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      {
        headers: { "User-Agent": userAgent }
      }
    );

    const forecastUrl = points.properties?.forecast;
    if (!forecastUrl) throw new Error("No forecast URL returned from NWS.");

    const [forecast, alerts] = await Promise.all([
      fetchJsonWithTimeout<NwsForecastResponse>(forecastUrl, {
        headers: { "User-Agent": userAgent }
      }),
      fetchJsonWithTimeout<NwsAlertsResponse>(
        `https://api.weather.gov/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`,
        {
          headers: { "User-Agent": userAgent }
        }
      ).catch(() => ({ features: [] }))
    ]);

    const period = forecast.properties?.periods?.[0];

    return {
      temperature: period?.temperature ?? null,
      lowTemperature:
        forecast.properties?.periods?.find((item) => item?.isDaytime === false)?.temperature ??
        forecast.properties?.periods?.[1]?.temperature ??
        null,
      windSpeed: period?.windSpeed ?? null,
      windDirection: period?.windDirection ?? null,
      precipitationChance: period?.probabilityOfPrecipitation?.value ?? null,
      shortForecast: period?.shortForecast ?? "Forecast data available.",
      hazards: (alerts.features ?? [])
        .map((item) => item.properties?.headline)
        .filter((value): value is string => Boolean(value))
        .slice(0, 3),
      sunrise: null,
      sunset: null,
      sourceLabel: "NWS / NOAA"
    } satisfies WeatherContext;
  } catch {
    return null;
  }
}

function getRecommendedSetting(weatherCondition: string): WeeklyForecastDay["recommendedSetting"] {
  if (weatherCondition === "stormy") return "indoor";
  if (weatherCondition === "rainy" || weatherCondition === "windy") return "mixed";
  if (weatherCondition === "clear") return "outdoor";
  return "mixed";
}

export async function getNwsWeeklyForecast(latitude: number, longitude: number, days = 7) {
  const userAgent = process.env.WSA_ENV_DATA_USER_AGENT || "WildStallionAcademyAI/1.0 (support@example.com)";

  try {
    const points = await fetchJsonWithTimeout<NwsPointsResponse>(
      `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`,
      {
        headers: { "User-Agent": userAgent }
      }
    );

    const forecastUrl = points.properties?.forecast;
    if (!forecastUrl) throw new Error("No forecast URL returned from NWS.");

    const [forecast, alerts] = await Promise.all([
      fetchJsonWithTimeout<NwsForecastResponse>(forecastUrl, {
        headers: { "User-Agent": userAgent }
      }),
      fetchJsonWithTimeout<NwsAlertsResponse>(
        `https://api.weather.gov/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`,
        {
          headers: { "User-Agent": userAgent }
        }
      ).catch(() => ({ features: [] }))
    ]);

    const periods = forecast.properties?.periods ?? [];
    const daytimePeriods = periods.filter((period) => period?.isDaytime).slice(0, days);
    const hazardHeadlines = (alerts.features ?? [])
      .map((item) => item.properties?.headline)
      .filter((value): value is string => Boolean(value))
      .slice(0, 3);

    return daytimePeriods.map((period, index) => {
      const startTime = period.startTime?.slice(0, 10) ?? new Date(Date.now() + index * 86400000).toISOString().slice(0, 10);
      const nightPeriod =
        periods.find(
          (candidate) =>
            candidate?.isDaytime === false &&
            candidate.startTime?.slice(0, 10) === startTime
        ) ??
        periods.find(
          (candidate, candidateIndex) =>
            candidate?.isDaytime === false &&
            candidateIndex > periods.indexOf(period)
        );
      const weatherCondition = mapForecastToWeatherCondition(period.shortForecast, hazardHeadlines);
      const date = new Date(`${startTime}T12:00:00`);

      return {
        date: startTime,
        dayLabel: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date),
        shortForecast: period.shortForecast ?? "Forecast data available.",
        weatherCondition,
        recommendedSetting: getRecommendedSetting(weatherCondition),
        highTemperature: period.temperature ?? null,
        lowTemperature: nightPeriod?.temperature ?? null,
        precipitationChance: period.probabilityOfPrecipitation?.value ?? null,
        windSpeed: period.windSpeed ?? null,
        windDirection: period.windDirection ?? null,
        hazards: hazardHeadlines,
        sourceLabel: "NWS / NOAA"
      } satisfies WeeklyForecastDay;
    });
  } catch {
    return null;
  }
}
