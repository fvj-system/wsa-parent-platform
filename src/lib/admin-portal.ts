import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityCompletionRecord } from "@/lib/activity-completions";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import type { DiscoveryRecord } from "@/lib/discoveries";
import type { StudentRecord } from "@/lib/students";
import type { WaiverRecord } from "@/lib/waivers";

type HouseholdRecord = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

type ProfileRecord = {
  id: string;
  household_id: string;
  full_name: string | null;
  household_name: string | null;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
};

type HouseholdMembershipRecord = {
  household_id: string;
  user_id: string;
  role: "owner" | "coparent";
};

type StudentBadgeRecord = {
  student_id: string;
  earned_at?: string;
};

type PortfolioEntryRecord = {
  id: string;
  household_id: string;
  student_id: string | null;
  entry_type: string;
  title: string;
  occurred_at: string;
};

export type AdminUserDirectoryRecord = {
  id: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
};

export type AdminDateRangeOption = {
  key: string;
  label: string;
  days: number;
};

export const adminDateRangeOptions: AdminDateRangeOption[] = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "180d", label: "Last 6 months", days: 180 },
  { key: "365d", label: "Last year", days: 365 },
];

export type AdminHouseholdSummary = {
  householdId: string;
  householdName: string;
  parentNames: string[];
  parentEmails: string[];
  phoneNumbers: string[];
  studentNames: string[];
  classTitles: string[];
  studentCount: number;
  registrationCount: number;
  attendedCount: number;
  paidCount: number;
  waiverCount: number;
  waiverOnFile: boolean;
  discoveryCount: number;
  documentationCount: number;
  completionCount: number;
  badgeCount: number;
  recentClassTitle: string | null;
  recentClassDate: string | null;
  lastActivityAt: string | null;
};

export type AdminStudentEngagementRow = {
  studentId: string;
  householdId: string;
  studentName: string;
  householdName: string;
  currentRank: string;
  completedAdventures: number;
  badgesEarned: number;
  discoveriesLogged: number;
  classAttendance: number;
  documentationEntries: number;
  score: number;
};

export type AdminTrendPoint = {
  label: string;
  value: number;
};

export type AdminOperationsDataset = {
  households: HouseholdRecord[];
  memberships: HouseholdMembershipRecord[];
  profiles: ProfileRecord[];
  students: StudentRecord[];
  classes: ClassRecord[];
  bookings: ClassBookingRecord[];
  waivers: WaiverRecord[];
  discoveries: DiscoveryRecord[];
  completions: ActivityCompletionRecord[];
  badges: StudentBadgeRecord[];
  portfolioEntries: PortfolioEntryRecord[];
  authUsers: Map<string, AdminUserDirectoryRecord>;
};

function normalizeText(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

export function resolveAdminDateRange(rangeKey: string | undefined, fallbackDays = 90) {
  const match = adminDateRangeOptions.find((option) => option.key === rangeKey);
  const days = match?.days ?? fallbackDays;
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  return {
    key: match?.key ?? `${fallbackDays}d`,
    label: match?.label ?? `Last ${fallbackDays} days`,
    days,
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export async function listAdminUsers(
  supabase: SupabaseClient,
): Promise<Map<string, AdminUserDirectoryRecord>> {
  const directory = new Map<string, AdminUserDirectoryRecord>();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data.users ?? [];
    for (const user of users) {
      directory.set(user.id, {
        id: user.id,
        email: user.email ?? null,
        createdAt: user.created_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
      });
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return directory;
}

export async function loadAdminOperationsDataset(
  supabase: SupabaseClient,
): Promise<AdminOperationsDataset> {
  const [
    householdsResult,
    membershipsResult,
    profilesResult,
    studentsResult,
    classesResult,
    bookingsResult,
    waiversResult,
    discoveriesResult,
    completionsResult,
    badgesResult,
    portfolioEntriesResult,
    authUsers,
  ] = await Promise.all([
    supabase
      .from("households")
      .select("id, name, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("household_memberships")
      .select("household_id, user_id, role"),
    supabase
      .from("profiles")
      .select("id, household_id, full_name, household_name, phone, created_at, updated_at"),
    supabase
      .from("students")
      .select("id, user_id, household_id, name, age, interests, current_rank, completed_adventures_count, created_at, updated_at"),
    supabase
      .from("classes")
      .select("id, title, description, class_type, date, start_time, end_time, location, age_min, age_max, price_cents, max_capacity, spots_remaining, what_to_bring, weather_note, internal_notes, waiver_required, status, created_at, updated_at")
      .order("date", { ascending: false }),
    supabase
      .from("class_bookings")
      .select("id, class_id, user_id, household_id, student_id, registration_group_id, group_lead, attendee_count, pricing_mode, waiver_id, booking_status, payment_status, stripe_checkout_session_id, stripe_payment_intent_id, amount_paid_cents, booked_at, notes, created_at, updated_at")
      .order("booked_at", { ascending: false }),
    supabase
      .from("waivers")
      .select("id, user_id, household_id, student_id, child_name, emergency_contact, medical_notes, waiver_type, accepted_at, signature_name, signature_data, version, save_on_file")
      .order("accepted_at", { ascending: false }),
    supabase
      .from("discoveries")
      .select("id, user_id, household_id, student_id, category, common_name, scientific_name, confidence_level, image_url, image_alt, notes, result_json, location_label, latitude, longitude, observed_at, created_at, image_path")
      .order("observed_at", { ascending: false }),
    supabase
      .from("activity_completions")
      .select("id, user_id, household_id, student_id, generation_id, class_booking_id, activity_type, title, completed_at, notes, parent_rating, created_at")
      .order("completed_at", { ascending: false }),
    supabase
      .from("student_badges")
      .select("student_id, earned_at"),
    supabase
      .from("portfolio_entries")
      .select("id, household_id, student_id, entry_type, title, occurred_at")
      .order("occurred_at", { ascending: false }),
    listAdminUsers(supabase),
  ]);

  const errors = [
    householdsResult.error,
    membershipsResult.error,
    profilesResult.error,
    studentsResult.error,
    classesResult.error,
    bookingsResult.error,
    waiversResult.error,
    discoveriesResult.error,
    completionsResult.error,
    badgesResult.error,
    portfolioEntriesResult.error,
  ].filter(Boolean);

  if (errors.length) {
    throw new Error(errors[0]?.message || "Admin data could not be loaded.");
  }

  return {
    households: (householdsResult.data ?? []) as HouseholdRecord[],
    memberships: (membershipsResult.data ?? []) as HouseholdMembershipRecord[],
    profiles: (profilesResult.data ?? []) as ProfileRecord[],
    students: (studentsResult.data ?? []) as StudentRecord[],
    classes: (classesResult.data ?? []) as ClassRecord[],
    bookings: (bookingsResult.data ?? []) as ClassBookingRecord[],
    waivers: (waiversResult.data ?? []) as WaiverRecord[],
    discoveries: (discoveriesResult.data ?? []) as DiscoveryRecord[],
    completions: (completionsResult.data ?? []) as ActivityCompletionRecord[],
    badges: (badgesResult.data ?? []) as StudentBadgeRecord[],
    portfolioEntries: (portfolioEntriesResult.data ?? []) as PortfolioEntryRecord[],
    authUsers,
  };
}

export function matchesAdminQuery(query: string, values: Array<string | null | undefined>) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;
  return values.some((value) => normalizeText(value).includes(normalizedQuery));
}

export function buildHouseholdSummaries(input: {
  households: HouseholdRecord[];
  memberships: HouseholdMembershipRecord[];
  profiles: ProfileRecord[];
  students: StudentRecord[];
  bookings: ClassBookingRecord[];
  waivers: WaiverRecord[];
  discoveries: DiscoveryRecord[];
  completions: ActivityCompletionRecord[];
  badges: StudentBadgeRecord[];
  portfolioEntries: PortfolioEntryRecord[];
  classes: ClassRecord[];
  authUsers: Map<string, AdminUserDirectoryRecord>;
}) {
  const classMap = new Map(input.classes.map((item) => [item.id, item]));
  const profileMap = new Map(input.profiles.map((item) => [item.id, item]));

  return input.households.map<AdminHouseholdSummary>((household) => {
    const memberships = input.memberships.filter(
      (item) => item.household_id === household.id,
    );
    const profiles = memberships
      .map((item) => profileMap.get(item.user_id))
      .filter(Boolean) as ProfileRecord[];
    const students = input.students.filter(
      (student) => student.household_id === household.id,
    );
    const bookings = input.bookings.filter(
      (booking) => booking.household_id === household.id,
    );
    const waivers = input.waivers.filter(
      (waiver) => waiver.household_id === household.id,
    );
    const discoveries = input.discoveries.filter(
      (discovery) => discovery.household_id === household.id,
    );
    const completions = input.completions.filter(
      (completion) => completion.household_id === household.id,
    );
    const portfolioEntries = input.portfolioEntries.filter(
      (entry) => entry.household_id === household.id,
    );
    const studentIds = new Set(students.map((student) => student.id));
    const badgeCount = input.badges.filter((badge) => studentIds.has(badge.student_id)).length;

    const recentBooking = [...bookings]
      .sort(
        (left, right) =>
          new Date(right.booked_at).getTime() - new Date(left.booked_at).getTime(),
      )[0];
    const recentClass = recentBooking ? classMap.get(recentBooking.class_id) : null;

    const allDates = [
      ...bookings.map((item) => item.booked_at),
      ...waivers.map((item) => item.accepted_at),
      ...discoveries.map((item) => item.observed_at),
      ...completions.map((item) => item.completed_at),
      ...portfolioEntries.map((item) => item.occurred_at),
    ].filter(Boolean);

    return {
      householdId: household.id,
      householdName: household.name,
      parentNames: profiles
        .map((profile) => profile.full_name?.trim())
        .filter(Boolean) as string[],
      parentEmails: memberships
        .map((membership) => input.authUsers.get(membership.user_id)?.email)
        .filter(Boolean) as string[],
      phoneNumbers: profiles
        .map((profile) => profile.phone?.trim())
        .filter(Boolean) as string[],
      studentNames: students.map((student) => student.name),
      classTitles: bookings
        .map((booking) => classMap.get(booking.class_id)?.title)
        .filter(Boolean) as string[],
      studentCount: students.length,
      registrationCount: bookings.length,
      attendedCount: bookings.filter(
        (booking) => booking.booking_status === "attended",
      ).length,
      paidCount: bookings.filter((booking) => booking.payment_status === "paid").length,
      waiverCount: waivers.length,
      waiverOnFile: waivers.some((waiver) => waiver.save_on_file),
      discoveryCount: discoveries.length,
      documentationCount: portfolioEntries.length,
      completionCount: completions.length,
      badgeCount,
      recentClassTitle: recentClass?.title ?? null,
      recentClassDate: recentClass?.date ?? recentBooking?.booked_at ?? null,
      lastActivityAt: allDates.sort().at(-1) ?? null,
    };
  });
}

export function buildStudentEngagementRows(input: {
  households: HouseholdRecord[];
  students: StudentRecord[];
  discoveries: DiscoveryRecord[];
  completions: ActivityCompletionRecord[];
  badges: StudentBadgeRecord[];
  portfolioEntries: PortfolioEntryRecord[];
}) {
  const householdMap = new Map(input.households.map((item) => [item.id, item]));

  return input.students.map<AdminStudentEngagementRow>((student) => {
    const discoveriesLogged = input.discoveries.filter(
      (item) => item.student_id === student.id,
    ).length;
    const completionRows = input.completions.filter(
      (item) => item.student_id === student.id,
    );
    const classAttendance = completionRows.filter(
      (item) => item.activity_type === "in_person_class",
    ).length;
    const completedAdventures = completionRows.filter(
      (item) => item.activity_type !== "in_person_class",
    ).length;
    const badgesEarned = input.badges.filter(
      (item) => item.student_id === student.id,
    ).length;
    const documentationEntries = input.portfolioEntries.filter(
      (item) => item.student_id === student.id,
    ).length;
    const score =
      badgesEarned * 5 +
      discoveriesLogged * 2 +
      completedAdventures * 3 +
      classAttendance * 4 +
      documentationEntries * 2;

    return {
      studentId: student.id,
      householdId: student.household_id ?? "",
      studentName: student.name,
      householdName:
        householdMap.get(student.household_id ?? "")?.name ?? "WSA Household",
      currentRank: student.current_rank,
      completedAdventures,
      badgesEarned,
      discoveriesLogged,
      classAttendance,
      documentationEntries,
      score,
    };
  });
}

function formatBucketLabel(date: Date, weekly: boolean) {
  return weekly
    ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function buildAttendanceTrend(input: {
  bookings: ClassBookingRecord[];
  classes: ClassRecord[];
  start: Date;
  end: Date;
}) {
  const classMap = new Map(input.classes.map((item) => [item.id, item]));
  const rangeDays = Math.max(
    1,
    Math.ceil((input.end.getTime() - input.start.getTime()) / 86400000),
  );
  const useWeeklyBuckets = rangeDays > 60;
  const buckets = new Map<string, number>();

  for (const booking of input.bookings) {
    const classRow = classMap.get(booking.class_id);
    const sourceDate = classRow?.date
      ? new Date(`${classRow.date}T12:00:00`)
      : new Date(booking.booked_at);

    if (sourceDate < input.start || sourceDate > input.end) {
      continue;
    }

    const bucketDate = useWeeklyBuckets
      ? startOfWeek(sourceDate)
      : new Date(
          sourceDate.getFullYear(),
          sourceDate.getMonth(),
          sourceDate.getDate(),
        );
    const key = bucketDate.toISOString();
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const points: AdminTrendPoint[] = [];
  const cursor = new Date(input.start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= input.end) {
    const bucketDate = useWeeklyBuckets ? startOfWeek(cursor) : new Date(cursor);
    const key = bucketDate.toISOString();

    if (!points.find((item) => item.label === formatBucketLabel(bucketDate, useWeeklyBuckets))) {
      points.push({
        label: formatBucketLabel(bucketDate, useWeeklyBuckets),
        value: buckets.get(key) ?? 0,
      });
    }

    cursor.setDate(cursor.getDate() + (useWeeklyBuckets ? 7 : 1));
  }

  return points;
}
