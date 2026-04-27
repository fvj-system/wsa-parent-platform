import type { MarylandSubject } from "@/lib/compliance/marylandSubjects";
import { getSuggestedSubjectAction } from "@/lib/compliance/marylandSubjects";

export type CoverageStatus = "covered" | "weak" | "missing";

export type CoverageCard = {
  subject: MarylandSubject;
  status: CoverageStatus;
  evidenceCount: number;
  lastEvidenceDate: string | null;
  suggestedNextAction: string;
};

export function deriveCoverageStatus(evidenceCount: number): CoverageStatus {
  if (evidenceCount >= 2) return "covered";
  if (evidenceCount === 1) return "weak";
  return "missing";
}

export function buildCoverageCard(input: {
  subject: MarylandSubject;
  evidenceCount: number;
  lastEvidenceDate: string | null;
}): CoverageCard {
  return {
    subject: input.subject,
    status: deriveCoverageStatus(input.evidenceCount),
    evidenceCount: input.evidenceCount,
    lastEvidenceDate: input.lastEvidenceDate,
    suggestedNextAction: getSuggestedSubjectAction(input.subject)
  };
}
