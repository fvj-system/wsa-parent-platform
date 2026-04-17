import { DailyAdventureGenerator } from "@/components/daily-adventure-generator";
import { AppShell } from "@/components/app-shell";
import { getDailyAdventurePreset } from "@/lib/daily-adventure-presets";
import { requireUser } from "@/lib/auth";
import { mapForecastToWeatherCondition } from "@/lib/context/weather";
import { getNwsWeatherContext } from "@/lib/context/weather/nws";
import type { GenerationRecord } from "@/lib/generations";
import { getHouseholdContext } from "@/lib/households";
import { getUserLocationPreferences, resolveUserLocationPreference } from "@/lib/location-preferences";
import type { StudentRecord } from "@/lib/students";

export default async function DailyAdventurePage({
  searchParams
}: {
  searchParams: Promise<{ studentId?: string; preset?: string }>;
}) {
  const { studentId, preset } = await searchParams;
  const presetConfig = getDailyAdventurePreset(preset);
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);

  const [{ data }, { data: students }, locationPreferences] = await Promise.all([
    supabase
      .from("generations")
      .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
      .eq("household_id", household.householdId)
      .eq("tool_type", "daily_adventure")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("students")
      .select("id, user_id, household_id, name, age, interests, reading_level, current_rank, completed_adventures_count, created_at, updated_at")
      .eq("household_id", household.householdId)
      .order("created_at", { ascending: false }),
    getUserLocationPreferences(supabase, user.id)
  ]);

  const resolvedLocationPreference = resolveUserLocationPreference(locationPreferences);
  const initialLatitude = resolvedLocationPreference.location.latitude ?? null;
  const initialLongitude = resolvedLocationPreference.location.longitude ?? null;
  const initialWeather =
    initialLatitude !== null && initialLongitude !== null
      ? await getNwsWeatherContext(initialLatitude, initialLongitude)
      : null;
  const initialWeatherCondition = initialWeather
    ? mapForecastToWeatherCondition(initialWeather.shortForecast, initialWeather.hazards)
    : "clear";

  return (
    <AppShell userLabel={user.email ?? "WSA family"}>
      <DailyAdventureGenerator
        userId={user.id}
        initialHistory={(data ?? []) as GenerationRecord[]}
        students={(students ?? []) as StudentRecord[]}
        preselectedStudentId={studentId}
        preselectedPreset={presetConfig?.key}
        initialLocationLabel={resolvedLocationPreference.location.displayLabel}
        initialRadiusMiles={resolvedLocationPreference.location.radiusMiles}
        initialWeatherCondition={initialWeatherCondition}
        initialLatitude={initialLatitude}
        initialLongitude={initialLongitude}
        weatherHelperText="Auto-filled from today's forecast"
        homeZipcode={locationPreferences.homeZipcode}
      />
    </AppShell>
  );
}
