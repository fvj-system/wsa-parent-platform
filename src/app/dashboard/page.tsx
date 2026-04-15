import { BadgeProgressWidget } from "@/components/badge-progress-widget";
import { DashboardDailyConditions } from "@/components/dashboard-daily-conditions";
import { DashboardDailyBriefing } from "@/components/dashboard-daily-briefing";
import { DashboardTodayNextStep } from "@/components/dashboard-today-next-step";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/auth";
import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import { getEnvironmentalContext } from "@/lib/context/engine";
import { deriveWeatherContext } from "@/lib/context/weather";
import { getTideSummary } from "@/lib/context/tides";
import { getHistoryFactForDate } from "@/lib/daily-brief/history-fact";
import { getNatureQuoteForDate } from "@/lib/daily-brief/nature-quote";
import { ensureHouseholdBriefing } from "@/lib/daily-briefing";
import type { GenerationRecord } from "@/lib/generations";
import { getHouseholdContext } from "@/lib/households";
import { getUserLocationPreferences, resolveUserLocationPreference } from "@/lib/location-preferences";
import { getFamilyOpportunityEventsForDate } from "@/lib/nearby/family-opportunities";
import { rankLevels, type StudentRecord } from "@/lib/students";

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedStudentId = typeof resolvedSearchParams.student === "string" ? resolvedSearchParams.student : "";
  const selectedAudience = typeof resolvedSearchParams.audience === "string" ? resolvedSearchParams.audience : "";
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);

  const [{ data: generations }, { data: students }, { data: studentBadges }, { data: recentAchievements }, { data: completions }, locationPreferences] =
    await Promise.all([
      supabase
        .from("generations")
        .select("id, user_id, student_id, tool_type, title, input_json, output_json, created_at")
        .eq("household_id", household.householdId)
        .order("created_at", { ascending: false })
        .limit(14),
      supabase
        .from("students")
        .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at")
        .eq("household_id", household.householdId)
        .order("created_at", { ascending: false }),
      supabase
        .from("student_badges")
        .select("id, student_id, badge_id, earned_at, source_completion_id, created_at, badges:badges(id, name, description, category, icon, criteria_json, created_at)")
        .order("earned_at", { ascending: false })
        .limit(50),
      supabase
        .from("student_achievements")
        .select("id, user_id, student_id, achievement_id, earned_at, achievements:achievements(id, key, name, description, earning_criteria, created_at)")
        .eq("household_id", household.householdId)
        .order("earned_at", { ascending: false })
        .limit(6),
      supabase
        .from("activity_completions")
        .select("id, user_id, student_id, generation_id, class_booking_id, activity_type, title, completed_at, notes, parent_rating, created_at")
        .eq("household_id", household.householdId)
        .order("completed_at", { ascending: false })
        .limit(12),
      getUserLocationPreferences(supabase, user.id)
    ]);

  const generationRows = (generations ?? []) as GenerationRecord[];
  const studentRows = (students ?? []) as StudentRecord[];
  const resolvedLocationPreference = resolveUserLocationPreference(locationPreferences);
  const completionRows = (completions ?? []) as ActivityCompletionRecord[];
  const badgeCounts = (studentBadges ?? []).reduce<Record<string, number>>((acc, item) => {
    const row = item as { student_id?: string };
    if (row.student_id) acc[row.student_id] = (acc[row.student_id] ?? 0) + 1;
    return acc;
  }, {});

  const activeStudent =
    (selectedStudentId ? studentRows.find((student) => student.id === selectedStudentId) : null) ??
    (studentRows.length === 1 ? studentRows[0] : studentRows[0] ?? null);
  const briefingStudent =
    selectedAudience === "household"
      ? null
      : (selectedStudentId ? studentRows.find((student) => student.id === selectedStudentId) : null) ??
        (studentRows.length === 1 ? studentRows[0] : null);

  const today = new Date().toISOString().slice(0, 10);
  let environmental: {
    location: typeof resolvedLocationPreference.location;
    weather: Awaited<ReturnType<typeof getEnvironmentalContext>>["weather"];
    fallbackWeatherSummary: Awaited<ReturnType<typeof getEnvironmentalContext>>["fallbackWeatherSummary"];
  } = {
    location: resolvedLocationPreference.location,
    weather: null,
    fallbackWeatherSummary: deriveWeatherContext({
      requestDate: today,
      weatherCondition: "clear"
    })
  };

  try {
    const loadedEnvironmental = await getEnvironmentalContext(supabase, {
      requestDate: today,
      locationLabel: resolvedLocationPreference.location.displayLabel,
      latitude: resolvedLocationPreference.location.latitude,
      longitude: resolvedLocationPreference.location.longitude,
      radiusMiles: resolvedLocationPreference.location.radiusMiles,
      weatherCondition: "clear"
    });

    environmental = {
      location: loadedEnvironmental.location,
      weather: loadedEnvironmental.weather,
      fallbackWeatherSummary: loadedEnvironmental.fallbackWeatherSummary
    };
  } catch {
    // Fall back to lightweight local conditions so the dashboard still loads.
  }

  const todayEvents = getFamilyOpportunityEventsForDate(environmental.location, today);
  const tideSummary = getTideSummary(today, environmental.location);
  const historyFact = getHistoryFactForDate(today);
  const natureQuote = getNatureQuoteForDate(today);
  let householdBriefing: Awaited<ReturnType<typeof ensureHouseholdBriefing>> | null = null;
  let dashboardWarning = "";

  if (studentRows.length > 0) {
    try {
      householdBriefing = await ensureHouseholdBriefing(
        supabase,
        user.id,
        generationRows,
        resolvedLocationPreference.location.displayLabel
      );
    } catch {
      dashboardWarning = "Today's family briefing is still getting ready. The rest of the dashboard is safe to use.";
    }
  }

  const allGenerationRows = [
    ...(householdBriefing
      ? [
          householdBriefing.animalGeneration,
          householdBriefing.birdGeneration,
          householdBriefing.plantGeneration,
          householdBriefing.fishGeneration
        ]
      : []),
    ...generationRows
  ].filter((item, index, items) => items.findIndex((entry) => entry.id === item.id) === index);

  const todayAdventure =
    allGenerationRows.find(
      (item) =>
        item.tool_type === "daily_adventure" &&
        item.student_id === (activeStudent?.id ?? item.student_id) &&
        ((item.input_json as Record<string, unknown>)?.requestDate as string | undefined) === today
    ) ??
    allGenerationRows.find(
      (item) =>
        item.tool_type === "daily_adventure" &&
        ((item.input_json as Record<string, unknown>)?.requestDate as string | undefined) === today
    ) ??
    null;
  const todayAdventureCompleted = todayAdventure
    ? completionRows.some((completion) => completion.generation_id === todayAdventure.id)
    : false;

  const totalCompletedAdventures = studentRows.reduce((sum, student) => sum + student.completed_adventures_count, 0);
  const totalBadgeCount = Object.values(badgeCounts).reduce((sum, count) => sum + count, 0);
  const totalSavedLessons = allGenerationRows.filter((item) => item.tool_type === "lesson" || item.tool_type === "week_plan").length;
  const printableItemsCreated = allGenerationRows.length;
  const topStudentRank =
    studentRows
      .map((student) => student.current_rank)
      .sort((a, b) => rankLevels.indexOf(b) - rankLevels.indexOf(a))[0] ?? "Colt";
  const recentBadgeName =
    (studentBadges?.[0] as { badges?: { name?: string } } | undefined)?.badges?.name ??
    "No badges earned yet";
  const startAdventureHref =
    studentRows.length > 0
      ? todayAdventure
        ? `/generations/${todayAdventure.id}`
        : `/daily-adventure${activeStudent ? `?studentId=${activeStudent.id}` : ""}`
      : null;
  const startAdventureLabel = todayAdventure
    ? todayAdventureCompleted
      ? "Open today's adventure"
      : "Continue today's adventure"
    : "Start today's adventure";

  return (
    <AppShell userLabel={user.email ?? "WSA family"}>
      <DashboardDailyConditions
        weather={environmental.weather}
        fallbackSummary={environmental.fallbackWeatherSummary.summary}
        tide={tideSummary}
        todayEvents={todayEvents}
        startAdventureHref={startAdventureHref}
        startAdventureLabel={startAdventureLabel}
      />

      {studentRows.length === 0 ? (
        <DashboardTodayNextStep
          students={studentRows}
          activeStudent={null}
          todayAdventure={null}
          todayAdventureCompleted={false}
        />
      ) : householdBriefing ? (
        <DashboardDailyBriefing
          briefing={householdBriefing}
          activeStudent={briefingStudent}
          totalCompletedAdventures={totalCompletedAdventures}
          totalSavedLessons={totalSavedLessons}
          printableItemsCreated={printableItemsCreated}
          todayAdventureHref={
            todayAdventure
              ? `/generations/${todayAdventure.id}`
              : `/daily-adventure${briefingStudent ? `?studentId=${briefingStudent.id}` : ""}`
          }
          historyFact={historyFact}
          natureQuote={natureQuote}
        />
      ) : (
        <section className="panel stack">
          <div>
            <p className="eyebrow">Today&apos;s briefing</p>
            <h3>Dashboard basics are ready</h3>
          </div>
          <p className="panel-copy" style={{ margin: 0 }}>
            {dashboardWarning || "The family briefing is still loading, but the rest of the dashboard is ready."}
          </p>
        </section>
      )}

      {dashboardWarning && studentRows.length > 0 && !householdBriefing ? <p className="error">{dashboardWarning}</p> : null}

      <BadgeProgressWidget
        badgeCount={totalBadgeCount}
        achievementCount={recentAchievements?.length ?? 0}
        recentBadge={recentBadgeName}
      />
    </AppShell>
  );
}
