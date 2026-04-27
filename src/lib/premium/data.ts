import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCoverageCard, type CoverageCard } from "@/lib/compliance/coverageRules";
import { marylandSubjects, normalizeSubjectName, type MarylandSubject } from "@/lib/compliance/marylandSubjects";
import { getHouseholdContext } from "@/lib/households";
import type {
  PremiumContext,
  PremiumRole,
  PremiumStudent,
  PrintableReviewPacketData,
  ReviewPacketRecord,
} from "@/lib/premium/types";

type SubjectAreaRow = {
  id: string;
  slug: string;
  name: string;
};

type CoverageAccumulator = {
  count: number;
  lastDate: string | null;
  latestTitle: string | null;
  titles: string[];
};

type ReviewQueueItem = {
  id: string;
  family_id: string;
  student_id: string;
  review_packet_id: string;
  decision: string;
  reviewer_user_id?: string | null;
  reviewer_summary?: string | null;
  correction_notes?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at?: string | null;
  families?: {
    name?: string | null;
  } | null;
  students?: {
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
    grade_level?: string | null;
  } | null;
};

export const homeschoolDisclaimer =
  "WSA Premium Homeschool helps families plan and document home instruction. Parents remain responsible for providing regular, thorough instruction. AI-generated summaries are organizational tools only. Final review decisions must be made by a qualified human reviewer when WSA UmbrellaOS review services are used.";

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function getDefaultReviewWindow() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 89);

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export function formatPremiumStudentName(student: Partial<PremiumStudent> | null | undefined) {
  if (!student) return "Student";

  const first = student.first_name?.trim();
  const last = student.last_name?.trim();
  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (student.name?.trim()) return student.name.trim();
  return "Student";
}

export function formatGradeLevel(gradeLevel: string | null | undefined) {
  if (!gradeLevel) return "Mixed";
  if (gradeLevel === "kindergarten") return "Kindergarten";
  if (/^\d+$/.test(gradeLevel)) return `Grade ${gradeLevel}`;
  return gradeLevel
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatLevelLabel(value: string | null | undefined) {
  if (!value) return "Not set";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function ensurePremiumContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<PremiumContext> {
  const household = await getHouseholdContext(supabase, userId);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, display_name, role, family_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  let family = await supabase
    .from("families")
    .select("id, household_id, name")
    .eq("household_id", household.householdId)
    .maybeSingle();

  if (family.error) {
    throw new Error(family.error.message);
  }

  if (!family.data) {
    family = await supabase
      .from("families")
      .insert({
        household_id: household.householdId,
        name: household.householdName,
        primary_contact_user_id: userId,
      })
      .select("id, household_id, name")
      .single();

    if (family.error) {
      throw new Error(family.error.message);
    }
  }

  const familyRow = family.data;

  if (!familyRow) {
    throw new Error("Unable to load or create a premium family record.");
  }

  if (profile?.family_id !== familyRow.id) {
    await supabase
      .from("profiles")
      .update({
        family_id: familyRow.id,
        display_name: profile?.display_name ?? profile?.full_name ?? household.profileName,
      })
      .eq("id", userId);
  }

  await supabase
    .from("students")
    .update({ family_id: familyRow.id })
    .eq("household_id", household.householdId)
    .is("family_id", null);

  const role = (profile?.role ?? "parent") as PremiumRole;

  return {
    userId,
    familyId: familyRow.id,
    familyName: familyRow.name,
    householdId: household.householdId,
    displayName: profile?.display_name?.trim() || profile?.full_name?.trim() || household.profileName,
    role,
    isReviewer: role === "reviewer" || role === "admin" || role === "super_admin",
    isStaff: role === "admin" || role === "super_admin",
  };
}

export async function listPremiumStudents(supabase: SupabaseClient, familyId: string) {
  const { data, error } = await supabase
    .from("students")
    .select("id, family_id, household_id, first_name, last_name, name, birthdate, age, grade_level, reading_level, math_level, science_level, writing_level, active, notes, created_at, updated_at")
    .eq("family_id", familyId)
    .order("active", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PremiumStudent[];
}

export function resolveActiveStudent(students: PremiumStudent[], selectedStudentId?: string | null) {
  return (
    (selectedStudentId ? students.find((student) => student.id === selectedStudentId) : null) ??
    students.find((student) => student.active) ??
    students[0] ??
    null
  );
}

export async function listSubjectAreas(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("subject_areas")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SubjectAreaRow[];
}

function createCoverageAccumulatorMap() {
  return marylandSubjects.reduce<Record<MarylandSubject, CoverageAccumulator>>((acc, subject) => {
    acc[subject] = {
      count: 0,
      lastDate: null,
      latestTitle: null,
      titles: [],
    };
    return acc;
  }, {} as Record<MarylandSubject, CoverageAccumulator>);
}

function registerEvidence(
  accumulator: Record<MarylandSubject, CoverageAccumulator>,
  subject: MarylandSubject | null,
  date: string | null | undefined,
  title: string,
) {
  if (!subject) return;

  const target = accumulator[subject];
  target.count += 1;

  if (!target.lastDate || (date && date > target.lastDate)) {
    target.lastDate = date ?? target.lastDate;
    target.latestTitle = title;
  }

  if (title && !target.titles.includes(title)) {
    target.titles.push(title);
  }
}

export async function buildCoverageSnapshot(input: {
  supabase: SupabaseClient;
  familyId: string;
  studentId: string;
  startDate: string;
  endDate: string;
}) {
  const { supabase, familyId, studentId, startDate, endDate } = input;
  const accumulator = createCoverageAccumulatorMap();

  const [portfolioResult, worksheetResult, attendanceResult, readingResult, assignmentResult] =
    await Promise.all([
      supabase
        .from("portfolio_items")
        .select("id, title, activity_date, tags:portfolio_subject_tags(subject_area_id, subject_areas(name))")
        .eq("family_id", familyId)
        .eq("student_id", studentId)
        .gte("activity_date", startDate)
        .lte("activity_date", endDate)
        .order("activity_date", { ascending: false }),
      supabase
        .from("worksheets")
        .select("id, subject, topic, created_at")
        .eq("family_id", familyId)
        .eq("student_id", studentId)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false }),
      supabase
        .from("attendance_logs")
        .select("id, attended_on, notes, subject_areas(name)")
        .eq("family_id", familyId)
        .eq("student_id", studentId)
        .gte("attended_on", startDate)
        .lte("attended_on", endDate)
        .order("attended_on", { ascending: false }),
      supabase
        .from("reading_logs")
        .select("id, activity_date, title")
        .eq("family_id", familyId)
        .eq("student_id", studentId)
        .gte("activity_date", startDate)
        .lte("activity_date", endDate)
        .order("activity_date", { ascending: false }),
      supabase
        .from("daily_assignments")
        .select("id, subject_name, activity_title, created_at")
        .eq("family_id", familyId)
        .eq("student_id", studentId)
        .gte("created_at", `${startDate}T00:00:00`)
        .lte("created_at", `${endDate}T23:59:59`)
        .order("created_at", { ascending: false }),
    ]);

  if (portfolioResult.error) throw new Error(portfolioResult.error.message);
  if (worksheetResult.error) throw new Error(worksheetResult.error.message);
  if (attendanceResult.error) throw new Error(attendanceResult.error.message);
  if (readingResult.error) throw new Error(readingResult.error.message);
  if (assignmentResult.error) throw new Error(assignmentResult.error.message);

  for (const item of portfolioResult.data ?? []) {
    const tags = ((item as Record<string, unknown>).tags ?? []) as Array<{
      subject_areas?: { name?: string | null } | null;
    }>;

    for (const tag of tags) {
      registerEvidence(
        accumulator,
        normalizeSubjectName(tag.subject_areas?.name),
        String((item as { activity_date?: string }).activity_date ?? ""),
        String((item as { title?: string }).title ?? "Portfolio item"),
      );
    }
  }

  for (const worksheet of worksheetResult.data ?? []) {
    registerEvidence(
      accumulator,
      normalizeSubjectName((worksheet as { subject?: string }).subject),
      String((worksheet as { created_at?: string }).created_at ?? "").slice(0, 10),
      String((worksheet as { topic?: string }).topic ?? "Worksheet"),
    );
  }

  for (const attendance of attendanceResult.data ?? []) {
    const row = attendance as { attended_on?: string; notes?: string | null; subject_areas?: { name?: string | null } | null };
    registerEvidence(
      accumulator,
      normalizeSubjectName(row.subject_areas?.name),
      row.attended_on ?? null,
      row.notes?.trim() || "Attendance log",
    );
  }

  for (const reading of readingResult.data ?? []) {
    const row = reading as { activity_date?: string; title?: string };
    registerEvidence(accumulator, "English", row.activity_date ?? null, row.title ?? "Reading log");
  }

  for (const assignment of assignmentResult.data ?? []) {
    const row = assignment as { subject_name?: string; created_at?: string; activity_title?: string };
    registerEvidence(
      accumulator,
      normalizeSubjectName(row.subject_name),
      row.created_at?.slice(0, 10) ?? null,
      row.activity_title ?? "Daily assignment",
    );
  }

  const coverage = marylandSubjects.map((subject) =>
    buildCoverageCard({
      subject,
      evidenceCount: accumulator[subject].count,
      lastEvidenceDate: accumulator[subject].lastDate,
    }),
  );

  return {
    coverage,
    evidenceMap: accumulator,
  };
}

export function buildOutdoorMission(coverage: CoverageCard[]) {
  const weakOrMissing = coverage.filter((item) => item.status !== "covered").map((item) => item.subject);
  const highlighted = weakOrMissing.slice(0, 2);
  const linkedSubjects = highlighted.length ? highlighted : ["Science", "Physical Education"];

  return {
    title: "Creekside Mapping Walk",
    description:
      "Take a 30-45 minute outdoor walk, map the route together, sketch one living thing, and write two facts or observations afterward.",
    countsToward: linkedSubjects,
    evidenceToSave: "Save a route sketch, one photo, one short narration, and a movement log with time spent outside.",
  };
}

export async function getPremiumDashboardSnapshot(input: {
  supabase: SupabaseClient;
  context: PremiumContext;
  selectedStudentId?: string | null;
}) {
  const students = await listPremiumStudents(input.supabase, input.context.familyId);
  const activeStudent = resolveActiveStudent(students, input.selectedStudentId);
  const reviewWindow = getDefaultReviewWindow();

  const [recentWorksheets, recentPortfolio, recentPackets, todayPlan] = await Promise.all([
    activeStudent
      ? input.supabase
          .from("worksheets")
          .select("id, subject, topic, created_at")
          .eq("family_id", input.context.familyId)
          .eq("student_id", activeStudent.id)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
    activeStudent
      ? input.supabase
          .from("portfolio_items")
          .select("id, title, activity_date, evidence_type")
          .eq("family_id", input.context.familyId)
          .eq("student_id", activeStudent.id)
          .order("activity_date", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [], error: null }),
    activeStudent
      ? input.supabase
          .from("review_packets")
          .select("id, review_period_start, review_period_end, current_status, created_at")
          .eq("family_id", input.context.familyId)
          .eq("student_id", activeStudent.id)
          .order("created_at", { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [], error: null }),
    activeStudent
      ? input.supabase
          .from("lesson_plans")
          .select("id, title, theme, estimated_total_minutes, plan_date, daily_assignments(subject_name, activity_title, estimated_minutes, evidence_to_save)")
          .eq("family_id", input.context.familyId)
          .eq("student_id", activeStudent.id)
          .eq("plan_date", getTodayIsoDate())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (recentWorksheets.error) throw new Error(recentWorksheets.error.message);
  if (recentPortfolio.error) throw new Error(recentPortfolio.error.message);
  if (recentPackets.error) throw new Error(recentPackets.error.message);
  if (todayPlan.error) throw new Error(todayPlan.error.message);

  const coverageBundle = activeStudent
    ? await buildCoverageSnapshot({
        supabase: input.supabase,
        familyId: input.context.familyId,
        studentId: activeStudent.id,
        startDate: reviewWindow.startDate,
        endDate: reviewWindow.endDate,
      })
    : { coverage: [] as CoverageCard[], evidenceMap: createCoverageAccumulatorMap() };

  const evidenceBySubject = coverageBundle.coverage.reduce<Record<string, number>>((acc, item) => {
    acc[item.subject] = item.evidenceCount;
    return acc;
  }, {});

  return {
    students,
    activeStudent,
    coverage: coverageBundle.coverage,
    recentWorksheets: recentWorksheets.data ?? [],
    portfolioItemCount: (recentPortfolio.data ?? []).length,
    recentPortfolioItems: recentPortfolio.data ?? [],
    recentReviewPackets: recentPackets.data ?? [],
    reviewWindow,
    todayPlan: todayPlan.data,
    evidenceBySubject,
    outdoorMission: buildOutdoorMission(coverageBundle.coverage),
  };
}

export async function listLessonsForStudent(supabase: SupabaseClient, familyId: string, studentId: string) {
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("id, title, theme, plan_type, estimated_total_minutes, plan_date, created_at, daily_assignments(subject_name, activity_title, estimated_minutes, evidence_to_save)")
    .eq("family_id", familyId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listWorksheetsForStudent(supabase: SupabaseClient, familyId: string, studentId: string) {
  const { data, error } = await supabase
    .from("worksheets")
    .select("id, subject, topic, difficulty, number_of_questions, include_answer_key, created_at")
    .eq("family_id", familyId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(15);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listPortfolioItemsForStudent(supabase: SupabaseClient, familyId: string, studentId?: string | null) {
  let query = supabase
    .from("portfolio_items")
    .select("id, family_id, student_id, title, description, activity_date, evidence_type, file_url, storage_path, parent_notes, ai_summary, created_by, created_at, updated_at, tags:portfolio_subject_tags(id, confidence_score, rationale, tagged_by, reviewer_confirmed, subject_areas(name))")
    .eq("family_id", familyId)
    .order("activity_date", { ascending: false })
    .limit(50);

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listReviewPacketsForStudent(supabase: SupabaseClient, familyId: string, studentId: string) {
  const { data, error } = await supabase
    .from("review_packets")
    .select("id, family_id, student_id, review_period_start, review_period_end, current_status, packet_json, coverage_snapshot, ai_summary, parent_notes, created_at, updated_at, submitted_for_review_at")
    .eq("family_id", familyId)
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown[]) as ReviewPacketRecord[];
}

export function buildPacketSummaryFromCoverage(input: {
  student: PremiumStudent;
  coverage: CoverageCard[];
  evidenceMap: Record<MarylandSubject, CoverageAccumulator>;
  evidenceItems: Array<{
    id: string;
    title: string;
    activity_date: string;
    evidence_type: string;
    parent_notes?: string | null;
    tags?: Array<{
      subject_areas?: {
        name?: string | null;
      } | null;
    }>;
  }>;
  startDate: string;
  endDate: string;
  familyName: string;
  parentName: string;
  aiSummary: string;
  parentNotes?: string | null;
}): PrintableReviewPacketData {
  return {
    title: "WSA Premium Homeschool Review Packet",
    generated_date: getTodayIsoDate(),
    student_name: formatPremiumStudentName(input.student),
    parent_guardian: input.parentName,
    review_period_start: input.startDate,
    review_period_end: input.endDate,
    student_summary: {
      grade_level: formatGradeLevel(input.student.grade_level),
      reading_level: formatLevelLabel(input.student.reading_level),
      math_level: formatLevelLabel(input.student.math_level),
      general_progress_summary: `${formatPremiumStudentName(input.student)} has a structured review packet for ${input.familyName} with saved evidence across planning, portfolio records, and subject-linked documentation.`,
    },
    subjects: input.coverage.map((subjectCoverage) => ({
      ...subjectCoverage,
      mostRecentEvidenceTitle: input.evidenceMap[subjectCoverage.subject].latestTitle,
      summaryOfLearning:
        input.evidenceMap[subjectCoverage.subject].titles.slice(0, 3).join("; ") ||
        "No saved evidence in this review window yet.",
      parentActionItems:
        subjectCoverage.status === "covered"
          ? "Continue saving a few representative samples for balance."
          : subjectCoverage.suggestedNextAction,
    })),
    evidence_items: input.evidenceItems.map((item) => ({
      id: item.id,
      title: item.title,
      date: item.activity_date,
      type: item.evidence_type,
      subject_tags:
        item.tags
          ?.map((tag) => normalizeSubjectName(tag.subject_areas?.name))
          .filter((value): value is MarylandSubject => Boolean(value)) ?? [],
      parent_notes: item.parent_notes ?? "",
    })),
    ai_assisted_summary: input.aiSummary,
    parent_notes: input.parentNotes ?? "",
  };
}

export async function loadUmbrellaOverview(supabase: SupabaseClient) {
  const [reviews, assignments, families, enrollments] = await Promise.all([
    supabase
      .from("reviews")
      .select("id, decision, due_date, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("reviewer_assignments").select("id, reviewer_user_id, family_id, student_id, active"),
    supabase.from("families").select("id, name"),
    supabase.from("umbrella_enrollments").select("id, enrollment_status, student_id"),
  ]);

  if (reviews.error) throw new Error(reviews.error.message);
  if (assignments.error) throw new Error(assignments.error.message);
  if (families.error) throw new Error(families.error.message);
  if (enrollments.error) throw new Error(enrollments.error.message);

  const reviewRows = reviews.data ?? [];
  return {
    totalFamilies: (families.data ?? []).length,
    totalAssignments: (assignments.data ?? []).filter((item) => item.active).length,
    totalReviews: reviewRows.length,
    awaitingReview: reviewRows.filter((item) => item.decision === "awaiting_review").length,
    needsCorrection: reviewRows.filter((item) => item.decision === "needs_correction").length,
    approved: reviewRows.filter((item) => item.decision === "approved").length,
    activeEnrollments: (enrollments.data ?? []).filter((item) => item.enrollment_status === "active").length,
  };
}

export async function listUmbrellaFamilies(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("families")
    .select("id, name, county, local_school_system, payment_status, students(id, first_name, last_name, name, grade_level), umbrella_enrollments(id, enrollment_status, student_id), reviews(id, decision, created_at)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listUmbrellaReviews(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, family_id, student_id, review_packet_id, decision, reviewer_user_id, reviewer_summary, correction_notes, due_date, created_at, updated_at, families(name), students(first_name, last_name, name, grade_level)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ReviewQueueItem[];
}

export async function loadReviewDetails(supabase: SupabaseClient, reviewId: string) {
  const { data: review, error: reviewError } = await supabase
    .from("reviews")
    .select("id, family_id, student_id, review_packet_id, decision, reviewer_user_id, reviewer_summary, correction_notes, due_date, created_at, updated_at, review_packets(id, packet_json, current_status, review_period_start, review_period_end), families(name), students(first_name, last_name, name, grade_level)")
    .eq("id", reviewId)
    .maybeSingle();

  if (reviewError) {
    throw new Error(reviewError.message);
  }

  if (!review) {
    return null;
  }

  const { data: findings, error: findingsError } = await supabase
    .from("review_findings")
    .select("id, review_id, reviewer_status, reviewer_note, parent_action_needed, ai_summary, subject_areas(name)")
    .eq("review_id", reviewId)
    .order("created_at", { ascending: true });

  if (findingsError) {
    throw new Error(findingsError.message);
  }

  return {
    review,
    findings: findings ?? [],
  };
}

export async function listReviewerProfilesWithAssignments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("reviewer_profiles")
    .select("id, user_id, display_name, bio, active, max_family_load, reviewer_assignments(id, family_id, student_id, active)")
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listUmbrellaEnrollments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("umbrella_enrollments")
    .select("id, family_id, student_id, enrollment_status, start_date, end_date, supervising_entity_status, notes, families(name), students(first_name, last_name, name, grade_level)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function loadComplianceSnapshot(supabase: SupabaseClient) {
  const [portfolioItems, findings, reviews, aiLogs] = await Promise.all([
    supabase.from("portfolio_subject_tags").select("subject_areas(name)"),
    supabase.from("review_findings").select("reviewer_status, subject_areas(name)"),
    supabase.from("reviews").select("decision, due_date, created_at"),
    supabase.from("portfolio_subject_tags").select("reviewer_confirmed, tagged_by"),
  ]);

  if (portfolioItems.error) throw new Error(portfolioItems.error.message);
  if (findings.error) throw new Error(findings.error.message);
  if (reviews.error) throw new Error(reviews.error.message);
  if (aiLogs.error) throw new Error(aiLogs.error.message);

  const missingBySubject = (portfolioItems.data ?? []).reduce<Record<string, number>>((acc, item) => {
    const subject = (item as { subject_areas?: { name?: string | null } | null }).subject_areas?.name ?? "Unassigned";
    acc[subject] = acc[subject] ?? 0;
    return acc;
  }, {});

  for (const finding of findings.data ?? []) {
    const row = finding as { reviewer_status?: string; subject_areas?: { name?: string | null } | null };
    if (row.reviewer_status === "missing") {
      const subject = row.subject_areas?.name ?? "Unassigned";
      missingBySubject[subject] = (missingBySubject[subject] ?? 0) + 1;
    }
  }

  const now = getTodayIsoDate();
  return {
    subjectGaps: Object.entries(missingBySubject)
      .map(([subject, count]) => ({ subject, count }))
      .sort((left, right) => right.count - left.count),
    overdueReviews: (reviews.data ?? []).filter((item) => {
      const dueDate = (item as { due_date?: string | null }).due_date;
      return Boolean(dueDate && dueDate < now);
    }).length,
    familiesNeedingCorrection: (reviews.data ?? []).filter((item) => item.decision === "needs_correction").length,
    aiPendingConfirmation: (aiLogs.data ?? []).filter((item) => {
      const row = item as { tagged_by?: string; reviewer_confirmed?: boolean };
      return row.tagged_by === "ai" && !row.reviewer_confirmed;
    }).length,
  };
}
