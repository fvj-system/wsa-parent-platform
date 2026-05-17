import { GeocacheBoard } from "@/components/geocache-board";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import {
  getNearbyGeocaches,
  listHouseholdGeocaches,
  listVisibleGeocaches,
  resolveCountyContextFromLocation,
} from "@/lib/geocaches";
import { getHouseholdContext } from "@/lib/households";
import {
  getUserLocationPreferences,
  resolveUserLocationPreference,
} from "@/lib/location-preferences";

export default async function GeocachePage() {
  const { supabase, user } = await requireUser();
  const household = await getHouseholdContext(supabase, user.id);
  const preferences = await getUserLocationPreferences(supabase, user.id);
  const resolvedLocation = resolveUserLocationPreference(preferences);

  const [visibleGeocaches, ownGeocaches] = await Promise.all([
    listVisibleGeocaches(supabase, 80),
    listHouseholdGeocaches(supabase, household.householdId, 20),
  ]);

  let countyContext = null;
  if (!resolvedLocation.needsSetup) {
    try {
      countyContext = await resolveCountyContextFromLocation(resolvedLocation.location);
    } catch {
      countyContext = null;
    }
  }

  const nearbyGeocaches = getNearbyGeocaches(
    visibleGeocaches.filter((item) => item.status === "active"),
    resolvedLocation.location,
    countyContext,
    8,
  );
  const nearbyIds = new Set(nearbyGeocaches.map((item) => item.id));
  const regionalGeocaches = visibleGeocaches
    .filter((item) => item.status === "active" && !nearbyIds.has(item.id))
    .slice(0, 12);

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Geocache Trail"
      title="Hide clues and tiny treasures across the region"
      description="Families can hide a message, note, or small treasure, leave a clue, and let nearby households discover it. The dashboard will surface fresh caches near your county."
    >
      <GeocacheBoard
        countyLabel={countyContext?.label ?? null}
        defaultCountyName={countyContext?.countyName ?? ""}
        defaultStateCode={countyContext?.stateCode ?? "MD"}
        nearbyCaches={nearbyGeocaches}
        regionalCaches={regionalGeocaches}
        ownCaches={ownGeocaches}
        locationStatusLabel={resolvedLocation.statusLabel}
      />
    </PageShell>
  );
}
