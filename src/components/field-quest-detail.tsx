"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  getFieldQuestLocationLabel,
  normalizeFieldQuestChecklistItems,
  type FieldQuestRecord,
} from "@/lib/field-quests";

type QuestStudentOption = {
  id: string;
  name: string;
};

type LinkedClassOption = {
  id: string;
  title: string;
};

type FieldQuestDetailProps = {
  quest: FieldQuestRecord;
  userEmail?: string | null;
  students: QuestStudentOption[];
  linkedClass?: LinkedClassOption | null;
  completionNames: string[];
  signInHref: string;
  signUpHref: string;
};

async function trackFieldQuestEvent(input: {
  questId?: string;
  questSlug?: string;
  eventType: string;
  studentId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  await fetch("/api/field-quests/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).catch(() => undefined);
}

export function FieldQuestDetail({
  quest,
  userEmail,
  students,
  linkedClass = null,
  completionNames,
  signInHref,
  signUpHref,
}: FieldQuestDetailProps) {
  const checklistItems = useMemo(
    () => normalizeFieldQuestChecklistItems(quest.checklist_json),
    [quest.checklist_json],
  );
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [selectedPhotoName, setSelectedPhotoName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [guestComplete, setGuestComplete] = useState(false);
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allStepsChecked =
    checklistItems.length > 0 &&
    checklistItems.every((item) => selectedSteps.includes(item.id));

  useEffect(() => {
    void trackFieldQuestEvent({
      questId: quest.id,
      eventType: "page_view",
      metadata: { source: "detail_page" },
    });
  }, [quest.id]);

  function toggleStep(stepId: string) {
    setSelectedSteps((current) => {
      const next = current.includes(stepId)
        ? current.filter((item) => item !== stepId)
        : [...current, stepId];

      if (!hasTrackedStart && next.length > 0) {
        setHasTrackedStart(true);
        void trackFieldQuestEvent({
          questId: quest.id,
          studentId: selectedStudentId || undefined,
          eventType: "start",
          metadata: { signedIn: Boolean(userEmail) },
        });
      }

      return next;
    });
  }

  function validateLocalCompletion(hasPhoto: boolean) {
    if (!allStepsChecked) {
      return "Finish every quest checklist step first.";
    }

    if (quest.requires_note && !note.trim()) {
      return "Add a quick field note before you finish this quest.";
    }

    if (quest.requires_photo && !hasPhoto) {
      return "Add a proof photo before you finish this quest.";
    }

    return "";
  }

  return (
    <section className="stack">
      <section className="panel stack">
        <div className="field-guide-meta-row">
          <span className="badge">{quest.difficulty_level}</span>
          <span className="muted">{quest.estimated_time}</span>
        </div>
        <div>
          <p className="eyebrow">Field Quest</p>
          <h1 className="page-title">{quest.title}</h1>
          <p className="lede">{quest.short_description}</p>
        </div>
        <ul className="chip-list">
          <li>{getFieldQuestLocationLabel(quest)}</li>
          <li>Ages {quest.age_range}</li>
          <li>Badge reward: {quest.badge_name}</li>
        </ul>
        <div className="chip-list">
          {quest.subject_tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </div>
        <p className="panel-copy" style={{ margin: 0 }}>
          {quest.description}
        </p>
        {quest.clue_text ? (
          <div className="trail-note trail-note-framed">
            <p className="eyebrow" style={{ marginBottom: 8 }}>
              Optional clue
            </p>
            <p className="panel-copy" style={{ margin: 0 }}>
              {quest.clue_text}
            </p>
          </div>
        ) : null}
        <div className="cta-row">
          <Link
            className="button button-primary"
            href={userEmail ? "/dashboard" : signInHref}
            onClick={() => {
              void trackFieldQuestEvent({
                questId: quest.id,
                eventType: "app_open_click",
                metadata: { signedIn: Boolean(userEmail) },
              });
            }}
          >
            Open in WSA App
          </Link>
          {linkedClass ? (
            <Link
              className="button button-ghost"
              href={`/classes/${linkedClass.id}`}
              onClick={() => {
                void trackFieldQuestEvent({
                  questId: quest.id,
                  eventType: "class_click",
                  metadata: { classId: linkedClass.id, classTitle: linkedClass.title },
                });
              }}
            >
              Join a WSA Class
            </Link>
          ) : null}
        </div>
      </section>

      <section className="content-grid">
        <section className="panel stack">
          <div>
            <p className="eyebrow">Quest checklist</p>
            <h3>Complete every step</h3>
          </div>

          <div className="stack">
            {checklistItems.map((item) => (
              <label className="classes-waiver-toggle" key={item.id}>
                <input
                  type="checkbox"
                  checked={selectedSteps.includes(item.id)}
                  onChange={() => toggleStep(item.id)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>

          <label>
            Field note {quest.requires_note ? "(required)" : "(optional)"}
            <textarea
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What did you notice, learn, or sketch today?"
            />
          </label>

          <label>
            Proof photo {quest.requires_photo ? "(required)" : "(optional)"}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setSelectedPhoto(nextFile);
                setSelectedPhotoName(nextFile?.name ?? "");
              }}
            />
          </label>
          {selectedPhotoName ? (
            <p className="muted" style={{ margin: 0 }}>
              Ready to upload: {selectedPhotoName}
            </p>
          ) : null}

          {students.length ? (
            <>
              <label>
                Save this badge for
                <select
                  value={selectedStudentId}
                  onChange={(event) => setSelectedStudentId(event.target.value)}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </label>

              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  setError("");
                  setStatusMessage("");
                  const localError = validateLocalCompletion(Boolean(selectedPhoto));

                  if (localError) {
                    setError(localError);
                    return;
                  }

                  const formData = new FormData();
                  formData.set("studentId", selectedStudentId);
                  formData.set("checkedStepIds", JSON.stringify(selectedSteps));
                  formData.set("note", note);
                  if (selectedPhoto) formData.set("image", selectedPhoto);

                  startTransition(async () => {
                    const response = await fetch(`/api/field-quests/${quest.id}/complete`, {
                      method: "POST",
                      body: formData,
                    });

                    const payload = (await response.json().catch(() => ({}))) as {
                      error?: string;
                      message?: string;
                      studentName?: string;
                      badgeName?: string;
                      alreadyExisted?: boolean;
                    };

                    if (!response.ok) {
                      setError(payload.error ?? "Could not save this Field Quest yet.");
                      return;
                    }

                    setStatusMessage(
                      payload.alreadyExisted
                        ? payload.message ?? `${payload.studentName ?? "This student"} already saved this quest.`
                        : `${payload.studentName ?? "Student"} earned the ${payload.badgeName ?? quest.badge_name} badge.`,
                    );
                    setError("");
                    setSelectedPhoto(null);
                    setSelectedPhotoName("");
                  });
                }}
              >
                <div className="cta-row">
                  <button type="submit" className="button button-primary" disabled={isPending}>
                    {isPending ? "Saving badge..." : "Save badge to student profile"}
                  </button>
                </div>
              </form>
            </>
          ) : userEmail ? (
            <div className="field-empty-state">
              <div className="copy">
                <h4>Create a student to save badges</h4>
                <p className="panel-copy" style={{ marginBottom: 0 }}>
                  Your family account is ready, but you need a student profile before this quest can count toward badges and homeschool review documentation.
                </p>
                <div className="cta-row" style={{ marginTop: 14 }}>
                  <Link className="button button-primary" href="/students">
                    Add a student
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="trail-note trail-note-framed">
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  Want this badge to count?
                </p>
                <p className="panel-copy" style={{ margin: 0 }}>
                  Guests can preview the quest here. Create a WSA account to save the badge to a student profile and include it in homeschool documentation.
                </p>
              </div>
              <div className="cta-row">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    setError("");
                    const localError = validateLocalCompletion(Boolean(selectedPhoto));
                    if (localError) {
                      setError(localError);
                      return;
                    }

                    setGuestComplete(true);
                    setStatusMessage("Nice work. Your guest preview is complete.");
                    void trackFieldQuestEvent({
                      questId: quest.id,
                      eventType: "completion",
                      metadata: { mode: "guest_preview" },
                    });
                  }}
                >
                  Finish guest preview
                </button>
              </div>
              {guestComplete ? (
                <div className="trail-note trail-note-framed">
                  <p className="eyebrow" style={{ marginBottom: 8 }}>
                    Save the badge for real
                  </p>
                  <p className="panel-copy" style={{ margin: 0 }}>
                    Create a WSA account to save this badge to a student profile, add it to homeschool review documentation, and unlock more quests and classes.
                  </p>
                  <div className="cta-row" style={{ marginTop: 14 }}>
                    <Link
                      className="button button-primary"
                      href={signUpHref}
                      onClick={() => {
                        void trackFieldQuestEvent({
                          questId: quest.id,
                          eventType: "signup_click",
                          metadata: { source: "guest_completion" },
                        });
                      }}
                    >
                      Create account to save badge
                    </Link>
                    <Link className="button button-ghost" href={signInHref}>
                      Already have an account?
                    </Link>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {statusMessage ? <p className="success">{statusMessage}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </section>

        <section className="panel stack">
          <div>
            <p className="eyebrow">Completion status</p>
            <h3>Who has already saved this quest?</h3>
          </div>
          {completionNames.length ? (
            <div className="chip-list">
              {completionNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </div>
          ) : (
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              No saved household completions yet. Finish the checklist and save the badge to start the trail record.
            </p>
          )}
          <div className="trail-note trail-note-framed">
            <p className="eyebrow" style={{ marginBottom: 8 }}>
              Homeschool review value
            </p>
            <p className="panel-copy" style={{ margin: 0 }}>
              This quest can feed Science, Social Studies, Language Arts, Art, or Physical Education evidence depending on the subject tags and the note your family saves with it.
            </p>
          </div>
        </section>
      </section>
    </section>
  );
}
