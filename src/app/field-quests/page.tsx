import { FieldQuestDirectory } from "@/components/field-quest-directory";
import { GeocacheBoard } from "@/components/geocache-board";
import { PublicSiteShell } from "@/components/public-site-shell";
import { createClient } from "@/lib/supabase/server";
import {
  attachFieldQuestDistances,
  getFieldQuestSelect,
  type FieldQuestRecord,
  type FieldQuestFilter,
  type FieldQuestWithDistance,
} from "@/lib/field-quests";
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
import { createSignedStorageUrl } from "@/lib/storage";

function getSafeFilter(value: string | string[] | undefined): FieldQuestFilter | "all" {
  if (typeof value !== "string") return "all";
  return ([
    "nearby",
    "backyard",
    "park",
    "creek",
    "history",
    "animal",
    "young-kids",
  ] as const).includes(value as FieldQuestFilter)
    ? (value as FieldQuestFilter)
    : "all";
}

export default async function FieldQuestsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: questRows, error: questError } = await supabase
    .from("field_quests")
    .select(getFieldQuestSelect())
    .eq("status", "published")
    .order("title", { ascending: true });

  if (questError) {
    throw new Error(questError.message);
  }

  const baseQuests = (questRows ?? []) as unknown as FieldQuestRecord[];
  let questsWithDistance: FieldQuestWithDistance[] = baseQuests.map((quest) => ({
    ...quest,
    distance_miles: null,
  }));

  let communitySection: React.ReactNode = null;

  if (user) {
    const household = await getHouseholdContext(supabase, user.id);
    const preferences = await getUserLocationPreferences(supabase, user.id);
    const resolvedLocation = resolveUserLocationPreference(preferences);

    questsWithDistance = attachFieldQuestDistances(baseQuests, resolvedLocation.location);

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

    const [hydratedNearbyGeocaches, hydratedRegionalGeocaches, hydratedOwnGeocaches] =
      await Promise.all([
        Promise.all(
          nearbyGeocaches.map(async (item) => ({
            ...item,
            image_url:
              item.image_path
                ? (await createSignedStorageUrl(supabase, "leaf-photos", item.image_path)) ??
                  item.image_url
                : item.image_url,
          })),
        ),
        Promise.all(
          regionalGeocaches.map(async (item) => ({
            ...item,
            image_url:
              item.image_path
                ? (await createSignedStorageUrl(supabase, "leaf-photos", item.image_path)) ??
                  item.image_url
                : item.image_url,
          })),
        ),
        Promise.all(
          ownGeocaches.map(async (item) => ({
            ...item,
            image_url:
              item.image_path
                ? (await createSignedStorageUrl(supabase, "leaf-photos", item.image_path)) ??
                  item.image_url
                : item.image_url,
          })),
        ),
      ]);

    communitySection = (
      <section className="stack" id="community-trail">
        <section className="panel stack">
          <div>
            <p className="eyebrow">Community clue trail</p>
            <h2 style={{ marginBottom: 10 }}>Family-made hidden clues and tiny treasures</h2>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              This keeps the original geocache-style magic alive inside Field Quests. Families can still hide clues for one another while the new curated quest system handles badges, student records, and homeschool review exports.
            </p>
          </div>
        </section>
        <GeocacheBoard
          countyLabel={countyContext?.label ?? null}
          defaultCountyName={countyContext?.countyName ?? ""}
          defaultStateCode={countyContext?.stateCode ?? "MD"}
          nearbyCaches={hydratedNearbyGeocaches}
          regionalCaches={hydratedRegionalGeocaches}
          ownCaches={hydratedOwnGeocaches}
          locationStatusLabel={resolvedLocation.statusLabel}
        />
      </section>
    );
  }

  return (
    <PublicSiteShell userEmail={user?.email ?? null}>
      <section className="page-header panel">
        <div className="page-header-copy">
          <p className="eyebrow">Field Quests</p>
          <h1 className="page-title">Outdoor missions that turn curiosity into real learning proof</h1>
          <p className="lede">
            Open a quest from Facebook, finish the checklist as a family, then save the badge inside WSA so it shows up in student profiles, homeschool review packets, and future class invitations.
          </p>
        </div>
      </section>

      <FieldQuestDirectory
        quests={questsWithDistance}
        defaultFilter={getSafeFilter(params.filter)}
        showCommunityAnchor={Boolean(user)}
      />

      {communitySection}
    </PublicSiteShell>
  );
}
