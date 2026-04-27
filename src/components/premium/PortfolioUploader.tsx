"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PortfolioItemRecord, PortfolioTagSuggestion, PremiumStudent } from "@/lib/premium/types";
import { formatPremiumStudentName } from "@/lib/premium/data";
import { marylandSubjects } from "@/lib/compliance/marylandSubjects";
import { PortfolioTagger } from "@/components/premium/PortfolioTagger";

type PortfolioUploaderProps = {
  familyId: string;
  students: PremiumStudent[];
  activeStudentId?: string | null;
  onCreated: (item: PortfolioItemRecord) => void;
};

export function PortfolioUploader({ familyId, students, activeStudentId, onCreated }: PortfolioUploaderProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(activeStudentId ?? students[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 10));
  const [evidenceType, setEvidenceType] = useState("parent_note");
  const [parentNotes, setParentNotes] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<PortfolioTagSuggestion[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggleSubject(subject: string) {
    setSelectedSubjects((current) =>
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject],
    );
  }

  async function createPortfolioItem() {
    setError("");
    setSuccess("");

    let fileUrl: string | undefined;
    let storagePath: string | undefined;

    if (file) {
      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      storagePath = `${familyId}/${studentId}/${Date.now()}-${safeName}`;
      const upload = await supabase.storage.from("portfolio-evidence").upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (!upload.error) {
        const { data: signedData } = await supabase.storage.from("portfolio-evidence").createSignedUrl(storagePath, 3600);
        fileUrl = signedData?.signedUrl;
      } else {
        setSuccess("Storage upload was unavailable, so the evidence was saved as a text-only record.");
      }
    }

    const subjectTags = [...selectedSubjects, ...tagSuggestions.map((tag) => tag.subject)]
      .filter((value, index, items) => items.indexOf(value) === index)
      .map((subject) => {
        const aiSuggestion = tagSuggestions.find((tag) => tag.subject === subject);
        return {
          subject,
          confidence_score: aiSuggestion?.confidence_score ?? 1,
          rationale: aiSuggestion?.reason,
          tagged_by: aiSuggestion ? "ai" : "parent",
        };
      });

    const response = await fetch("/api/portfolio/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: studentId,
        title,
        description,
        activity_date: activityDate,
        evidence_type: evidenceType,
        file_url: fileUrl,
        storage_path: storagePath,
        parent_notes: parentNotes,
        tags: subjectTags,
      }),
    });

    const result = (await response.json()) as { error?: string; item?: PortfolioItemRecord };
    if (!response.ok || !result.item) {
      setError(result.error ?? "Unable to save portfolio evidence.");
      return;
    }

    setSuccess("Portfolio evidence saved.");
    onCreated(result.item);
    router.refresh();
    setTitle("");
    setDescription("");
    setParentNotes("");
    setSelectedSubjects([]);
    setTagSuggestions([]);
    setFile(null);
  }

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Upload Evidence</p>
        <h3>Portfolio evidence system</h3>
        <p className="panel-copy" style={{ margin: 0 }}>
          Text-only evidence works even when file storage is unavailable. File uploads are optional.
        </p>
      </div>

      <div className="premium-form-grid">
        <label>
          Student
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)}>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {formatPremiumStudentName(student)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Activity date
          <input type="date" value={activityDate} onChange={(event) => setActivityDate(event.target.value)} />
        </label>
        <label>
          Evidence type
          <select value={evidenceType} onChange={(event) => setEvidenceType(event.target.value)}>
            <option value="worksheet">worksheet</option>
            <option value="photo">photo</option>
            <option value="video">video</option>
            <option value="reading_log">reading_log</option>
            <option value="writing_sample">writing_sample</option>
            <option value="math_work">math_work</option>
            <option value="science_observation">science_observation</option>
            <option value="outdoor_activity">outdoor_activity</option>
            <option value="class_attendance">class_attendance</option>
            <option value="art_project">art_project</option>
            <option value="music_activity">music_activity</option>
            <option value="health_activity">health_activity</option>
            <option value="pe_activity">pe_activity</option>
            <option value="parent_note">parent_note</option>
            <option value="other">other</option>
          </select>
        </label>
      </div>

      <label>
        Description
        <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        Parent notes
        <textarea rows={3} value={parentNotes} onChange={(event) => setParentNotes(event.target.value)} />
      </label>
      <label>
        Evidence file
        <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      </label>

      <div className="premium-checklist">
        {marylandSubjects.map((subject) => (
          <label key={subject} className="classes-waiver-toggle premium-checkbox-card">
            <input
              type="checkbox"
              checked={selectedSubjects.includes(subject)}
              onChange={() => toggleSubject(subject)}
            />
            <span>{subject}</span>
          </label>
        ))}
      </div>

      <PortfolioTagger
        draft={{
          title,
          description,
          evidence_type: evidenceType,
          parent_notes: parentNotes,
        }}
        onApplySuggestions={(suggestions) => {
          setTagSuggestions(suggestions);
          setSelectedSubjects((current) => [
            ...current,
            ...suggestions.map((suggestion) => suggestion.subject),
          ].filter((value, index, items) => items.indexOf(value) === index));
        }}
      />

      <div className="cta-row">
        <button
          type="button"
          disabled={isPending || !studentId || !title.trim()}
          onClick={() => {
            startTransition(() => {
              void createPortfolioItem();
            });
          }}
        >
          {isPending ? "Saving..." : "Upload Evidence"}
        </button>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {success ? <p className="success">{success}</p> : null}
    </section>
  );
}
