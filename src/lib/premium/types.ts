import type { CoverageCard } from "@/lib/compliance/coverageRules";
import type { MarylandSubject } from "@/lib/compliance/marylandSubjects";

export const premiumReadingLevelOptions = [
  "pre_reader",
  "letter_sounds",
  "blending",
  "early_reader",
  "independent_reader",
  "advanced_reader"
] as const;

export const premiumMathLevelOptions = [
  "pre_k",
  "counting",
  "addition_subtraction",
  "place_value",
  "multiplication_division",
  "fractions",
  "pre_algebra",
  "algebra",
  "geometry"
] as const;

export type PremiumReadingLevel = (typeof premiumReadingLevelOptions)[number];
export type PremiumMathLevel = (typeof premiumMathLevelOptions)[number];
export type PremiumRole = "parent" | "student" | "reviewer" | "admin" | "super_admin";
export type LessonPlanType = "full_day" | "light_day" | "outdoor_heavy";
export type ReviewDecision = "awaiting_review" | "in_review" | "approved" | "needs_correction" | "rejected";
export type ReviewFindingStatus = "sufficient" | "weak" | "missing";
export type TaggedBy = "ai" | "parent" | "reviewer";

export type PremiumStudent = {
  id: string;
  family_id?: string | null;
  household_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name: string;
  birthdate?: string | null;
  age?: number | null;
  grade_level?: string | null;
  reading_level?: string | null;
  math_level?: string | null;
  science_level?: string | null;
  writing_level?: string | null;
  active?: boolean | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type LessonAssignment = {
  subject: MarylandSubject;
  activity_title: string;
  instructions: string;
  evidence_to_save: string;
  estimated_minutes: number;
  materials: string[];
  parent_notes: string;
};

export type LessonPlanPayload = {
  title: string;
  date: string;
  student_id: string;
  theme: string;
  estimated_total_minutes: number;
  assignments: LessonAssignment[];
};

export type WorksheetQuestion = {
  number: number;
  prompt: string;
  type: "short_answer" | "multiple_choice" | "draw" | "match" | "math" | "copywork";
  choices?: string[];
  answer?: string;
  hint?: string;
  workspace_lines?: number;
};

export type WorksheetSection = {
  title: string;
  kind: "hook" | "mini_lesson" | "word_bank" | "mission" | "reflection" | "coach_note";
  body: string;
  bullets?: string[];
};

export type WorksheetPayload = {
  title: string;
  student_name: string;
  subject: MarylandSubject;
  date: string;
  track_id?: string;
  track_title?: string;
  unit_title?: string;
  lesson_title?: string;
  lesson_number?: number;
  total_lessons?: number;
  fun_theme?: string;
  essential_question?: string;
  learning_objective?: string;
  instructions: string;
  materials?: string[];
  sections?: WorksheetSection[];
  questions: WorksheetQuestion[];
  extension_activity?: string;
  parent_notes: string;
};

export type PortfolioTagSuggestion = {
  subject: MarylandSubject;
  reason: string;
  confidence_score: number;
};

export type PortfolioItemRecord = {
  id: string;
  family_id: string;
  student_id: string;
  title: string;
  description: string;
  activity_date: string;
  evidence_type: string;
  file_url?: string | null;
  storage_path?: string | null;
  parent_notes?: string | null;
  ai_summary?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  tags?: Array<{
    id?: string;
    subject_area_id?: string;
    confidence_score?: number;
    rationale?: string | null;
    tagged_by?: TaggedBy;
    reviewer_confirmed?: boolean;
    subject_areas?: {
      name?: string | null;
    } | null;
  }>;
};

export type ReviewPacketRecord = {
  id: string;
  family_id: string;
  student_id: string;
  review_period_start: string;
  review_period_end: string;
  current_status: string;
  packet_json: PrintableReviewPacketData;
  coverage_snapshot: CoverageCard[];
  ai_summary?: string | null;
  parent_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
  submitted_for_review_at?: string | null;
};

export type PrintableReviewPacketData = {
  title: string;
  generated_date: string;
  student_name: string;
  parent_guardian: string;
  review_period_start: string;
  review_period_end: string;
  student_summary: {
    grade_level: string;
    reading_level: string;
    math_level: string;
    general_progress_summary: string;
  };
  subjects: Array<CoverageCard & {
    mostRecentEvidenceTitle: string | null;
    summaryOfLearning: string;
    parentActionItems: string;
  }>;
  evidence_items: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
    subject_tags: MarylandSubject[];
    parent_notes: string;
  }>;
  ai_assisted_summary: string;
  parent_notes: string;
};

export type PremiumContext = {
  userId: string;
  familyId: string;
  familyName: string;
  householdId: string;
  displayName: string;
  role: PremiumRole;
  isReviewer: boolean;
  isStaff: boolean;
};
