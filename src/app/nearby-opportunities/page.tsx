import { DashboardFamilyOpportunities } from "@/components/dashboard-family-opportunities";
import { LocationPreferencesCard } from "@/components/location-preferences-card";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import { getEnvironmentalContext } from "@/lib/context/engine";
import { getUserLocationPreferences, resolveUserLocationPreference } from "@/lib/location-preferences";
import { getNearbyFamilyOpportunities } from "@/lib/nearby/family-opportunities";

export default async function NearbyOpportunitiesPage() {
  const { supabase, user } = await requireUser();
  const today = new Date().toISOString().slice(0, 10);
  const preferences = await getUserLocationPreferences(supabase, user.id);
  const resolvedPreference = resolveUserLocationPreference(preferences);
  const environmental = await getEnvironmentalContext(supabase, {
    requestDate: today,
    locationLabel: resolvedPreference.location.displayLabel,
    latitude: resolvedPreference.location.latitude,
    longitude: resolvedPreference.location.longitude,
    radiusMiles: resolvedPreference.location.radiusMiles,
    weatherCondition: "clear"
  });
  const items = getNearbyFamilyOpportunities(environmental.location);

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Family Planning"
      title="Nearby Opportunities"
      description="A local-guide mix of nearby nature stops, museums, event calendars, family programs, festivals, and public learning ideas close to home."
    >
      <LocationPreferencesCard initialPreferences={preferences} resolvedLocation={resolvedPreference} />
      <DashboardFamilyOpportunities items={items} showHeader={false} />
    </PageShell>
  );
}
