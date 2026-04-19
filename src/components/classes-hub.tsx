"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { calculateClassRegistrationPrice, CLASS_PRICING, formatPrice } from "@/lib/class-pricing";
import { getClassCapacity, getClassDateValue, getClassPrimaryPrice, getClassSpotsLeft } from "@/lib/classes";
import type { ClassBookingRecord, ClassRecord } from "@/lib/classes";
import type { StudentRecord } from "@/lib/students";
import type { WaiverRecord } from "@/lib/waivers";

type ClassesHubProps = {
  classes: ClassRecord[];
  students: StudentRecord[];
  bookings: ClassBookingRecord[];
  initialSelectedClassId?: string | null;
  reusableWaiver: WaiverRecord | null;
  successMessage?: string;
  errorMessage?: string;
};

type RegistrationGroup = {
  id: string;
  classId: string;
  classItem: ClassRecord | null;
  studentIds: string[];
  studentNames: string[];
  bookingIds: string[];
  bookingStatus: string;
  paymentStatus: string;
  statusLabel: string;
  totalPaidCents: number;
  attendeeCount: number;
  pricingMode: "per_child" | "family";
  waiverId: string | null;
};

function formatClassDate(classItem: ClassRecord | null) {
  const dateValue = classItem ? getClassDateValue(classItem) : null;
  if (!dateValue) return "Date TBD";
  return new Date(dateValue).toLocaleDateString();
}

function formatClassTime(classItem: ClassRecord | null) {
  if (!classItem?.start_time || !classItem?.end_time) return "Time TBD";
  return `${classItem.start_time} - ${classItem.end_time}`;
}

function getRegistrationStatusLabel(group: RegistrationGroup) {
  if (group.bookingStatus === "attended") return "Completed";
  if (group.paymentStatus === "paid") {
    return group.attendeeCount > 1 ? "Family Registered" : "Registered";
  }
  if (group.paymentStatus === "pending") return "Pending Checkout";
  return "Not Registered";
}

function getClassStatusLabel(classItem: ClassRecord, groups: RegistrationGroup[]) {
  const completed = groups.find((group) => group.bookingStatus === "attended");
  if (completed) return "Completed";

  const paidFamily = groups.find((group) => group.paymentStatus === "paid" && group.attendeeCount > 1);
  if (paidFamily) return "Family Registered";

  const paidSingle = groups.find((group) => group.paymentStatus === "paid");
  if (paidSingle) return "Registered";

  const pending = groups.find((group) => group.paymentStatus === "pending");
  if (pending) return "Pending Checkout";

  return classItem.status === "full" ? "Class Full" : "Not Registered";
}

export function ClassesHub({
  classes,
  students,
  bookings,
  initialSelectedClassId,
  reusableWaiver,
  successMessage,
  errorMessage
}: ClassesHubProps) {
  const router = useRouter();
  const [openClassId, setOpenClassId] = useState(initialSelectedClassId ?? classes[0]?.id ?? "");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [useSavedWaiverOnFile, setUseSavedWaiverOnFile] = useState(Boolean(reusableWaiver));
  const [signatureName, setSignatureName] = useState(reusableWaiver?.signature_name ?? "");
  const [emergencyContact, setEmergencyContact] = useState(reusableWaiver?.emergency_contact ?? "");
  const [medicalNotes, setMedicalNotes] = useState(reusableWaiver?.medical_notes ?? "");
  const [acceptWaiver, setAcceptWaiver] = useState(false);
  const [saveWaiverOnFile, setSaveWaiverOnFile] = useState(Boolean(reusableWaiver?.save_on_file));
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();

  const classMap = useMemo(
    () => new Map(classes.map((classItem) => [classItem.id, classItem])),
    [classes]
  );
  const studentMap = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  );

  const registrationGroups = useMemo(() => {
    const groups = new Map<string, RegistrationGroup>();

    for (const booking of bookings) {
      const groupId = booking.registration_group_id ?? booking.id;
      const current = groups.get(groupId);
      const classItem = classMap.get(booking.class_id) ?? null;
      const studentName = booking.student_id ? studentMap.get(booking.student_id)?.name ?? "Student" : "Student";

      if (!current) {
        groups.set(groupId, {
          id: groupId,
          classId: booking.class_id,
          classItem,
          studentIds: booking.student_id ? [booking.student_id] : [],
          studentNames: booking.student_id ? [studentName] : [],
          bookingIds: [booking.id],
          bookingStatus: booking.booking_status,
          paymentStatus: booking.payment_status,
          statusLabel: "",
          totalPaidCents: booking.amount_paid_cents,
          attendeeCount: booking.attendee_count ?? 1,
          pricingMode: booking.pricing_mode ?? "per_child",
          waiverId: booking.waiver_id ?? null
        });
        continue;
      }

      if (booking.student_id && !current.studentIds.includes(booking.student_id)) {
        current.studentIds.push(booking.student_id);
        current.studentNames.push(studentName);
      }
      current.bookingIds.push(booking.id);
      current.totalPaidCents += booking.amount_paid_cents;
      current.attendeeCount = Math.max(current.attendeeCount, booking.attendee_count ?? current.attendeeCount);
      current.pricingMode = booking.pricing_mode ?? current.pricingMode;
      if (current.bookingStatus !== "attended" && booking.booking_status === "attended") {
        current.bookingStatus = "attended";
      } else if (current.bookingStatus !== "confirmed" && booking.booking_status === "confirmed") {
        current.bookingStatus = "confirmed";
      }
      if (current.paymentStatus !== "paid" && booking.payment_status === "paid") {
        current.paymentStatus = "paid";
      } else if (current.paymentStatus !== "pending" && booking.payment_status === "pending") {
        current.paymentStatus = "pending";
      }
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        statusLabel: getRegistrationStatusLabel(group)
      }))
      .sort((left, right) => {
        const leftDate = left.classItem?.date ?? "";
        const rightDate = right.classItem?.date ?? "";
        return leftDate.localeCompare(rightDate);
      });
  }, [bookings, classMap, studentMap]);

  const registrationsByClassId = useMemo(() => {
    const grouped = new Map<string, RegistrationGroup[]>();

    for (const group of registrationGroups) {
      const existing = grouped.get(group.classId) ?? [];
      existing.push(group);
      grouped.set(group.classId, existing);
    }

    return grouped;
  }, [registrationGroups]);

  const openClass = classMap.get(openClassId) ?? null;
  const openClassGroups = openClass ? registrationsByClassId.get(openClass.id) ?? [] : [];
  const registeredStudentIdsForOpenClass = new Set(
    openClassGroups
      .filter((group) => group.paymentStatus === "paid" || group.bookingStatus === "confirmed" || group.bookingStatus === "attended")
      .flatMap((group) => group.studentIds)
  );

  const pricingSummary = useMemo(
    () => calculateClassRegistrationPrice(selectedStudentIds.length),
    [selectedStudentIds]
  );

  useEffect(() => {
    setSelectedStudentIds([]);
    setUseSavedWaiverOnFile(Boolean(reusableWaiver));
    setEmergencyContact(reusableWaiver?.emergency_contact ?? "");
    setMedicalNotes(reusableWaiver?.medical_notes ?? "");
    setSignatureName(reusableWaiver?.signature_name ?? "");
    setAcceptWaiver(false);
    setSaveWaiverOnFile(Boolean(reusableWaiver?.save_on_file));
    setFormError("");
  }, [openClassId, reusableWaiver]);

  const registrationCount = registrationGroups.filter(
    (group) => group.paymentStatus === "paid" || group.paymentStatus === "pending"
  ).length;

  return (
    <section className="stack">
      {successMessage ? <p className="success">{successMessage}</p> : null}
      {errorMessage ? <p className="error">{errorMessage}</p> : null}

      <section className="panel stack">
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Classes hub</p>
            <h3>One place to browse, register, and track family classes</h3>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Public classes and your family registrations now live together, so you do not have to bounce between separate pages.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <article className="stat metric-card">
            <span>Upcoming classes</span>
            <strong>{classes.length}</strong>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Current published field classes.
            </p>
          </article>
          <article className="stat metric-card">
            <span>Family registrations</span>
            <strong>{registrationCount}</strong>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              Paid and pending class registrations for this household.
            </p>
          </article>
          <article className="stat metric-card">
            <span>Waiver on file</span>
            <strong>{reusableWaiver ? "Ready" : "Needed"}</strong>
            <p className="panel-copy" style={{ marginBottom: 0 }}>
              {reusableWaiver
                ? `Saved waiver from ${new Date(reusableWaiver.accepted_at).toLocaleDateString()}.`
                : "A required class waiver can be signed during checkout."}
            </p>
          </article>
        </div>
      </section>

      <section className="panel stack">
        <div className="field-section-header">
          <div>
            <p className="eyebrow">Your family registrations</p>
            <h3>Track booked and pending classes</h3>
          </div>
        </div>

        {registrationGroups.length ? (
          <div className="dashboard-opportunity-list">
            {registrationGroups.map((group) => (
              <article className="dashboard-opportunity-row" key={group.id}>
                <div className="dashboard-opportunity-row-top">
                  <div className="field-guide-meta-row">
                    <span className="badge">{group.statusLabel}</span>
                    <span className="muted">{formatClassDate(group.classItem)}</span>
                  </div>
                </div>
                <h4 className="dashboard-opportunity-title">{group.classItem?.title ?? "Class registration"}</h4>
                <p className="dashboard-opportunity-description">
                  {group.studentNames.join(", ")} | {formatClassTime(group.classItem)} | {group.classItem?.location || "Location TBD"}
                </p>
                <div className="chip-list">
                  <li>{group.attendeeCount} attendee{group.attendeeCount === 1 ? "" : "s"}</li>
                  <li>{formatPrice(group.totalPaidCents)}</li>
                  <li>{group.waiverId ? "Waiver linked" : "No waiver saved"}</li>
                </div>
                <div className="cta-row">
                  {group.classItem ? (
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => {
                        setOpenClassId(group.classItem?.id ?? "");
                        router.replace(`/classes?class=${group.classItem?.id}`);
                      }}
                    >
                      Open class
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="field-empty-state">
            <div className="copy">
              <h4>No class registrations yet</h4>
              <p className="panel-copy" style={{ marginBottom: 0 }}>
                Once you register, the family and student records will both pick up those class bookings automatically.
              </p>
            </div>
          </div>
        )}
      </section>

      {classes.length ? (
        <section className="stack">
          {classes.map((classItem) => {
            const classGroups = registrationsByClassId.get(classItem.id) ?? [];
            const statusLabel = getClassStatusLabel(classItem, classGroups);
            const classRegisteredStudentIds = new Set(
              classGroups
                .filter((group) => group.paymentStatus === "paid" || group.bookingStatus === "confirmed" || group.bookingStatus === "attended")
                .flatMap((group) => group.studentIds)
            );

            return (
              <article
                className={`panel stack ${openClassId === classItem.id ? "classes-hub-card-open" : ""}`}
                key={classItem.id}
              >
                <button
                  type="button"
                  className="classes-hub-card-toggle"
                  onClick={() => {
                    const nextClassId = openClassId === classItem.id ? "" : classItem.id;
                    setOpenClassId(nextClassId);
                    router.replace(nextClassId ? `/classes?class=${nextClassId}` : "/classes");
                  }}
                >
                  <div className="classes-hub-card-head">
                    <div>
                      <p className="eyebrow">{classItem.class_type || "Field class"}</p>
                      <h3>{classItem.title}</h3>
                    </div>
                    <span className="badge">{statusLabel}</span>
                  </div>
                  <div className="chip-list">
                    <li>{formatClassDate(classItem)}</li>
                    <li>{formatClassTime(classItem)}</li>
                    <li>{classItem.location || "Location TBD"}</li>
                    <li>
                      {typeof getClassPrimaryPrice(classItem) === "number"
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD"
                          }).format(getClassPrimaryPrice(classItem) ?? 0)
                        : formatPrice(calculateClassRegistrationPrice(1).totalCents)}{" "}
                      per child
                    </li>
                  </div>
                </button>

                {openClassId === classItem.id ? (
                  <div className="stack">
                    <p className="panel-copy" style={{ margin: 0 }}>
                      {classItem.description || "Class details coming soon."}
                    </p>

                    <div className="result-sections">
                      <section>
                        <h4>When</h4>
                        <p>{formatClassDate(classItem)} | {formatClassTime(classItem)}</p>
                      </section>
                      <section>
                        <h4>Where</h4>
                        <p>{classItem.location || "Location TBD"}</p>
                      </section>
                      <section>
                        <h4>Cost</h4>
                        <p>
                          $15 for 1 child | $25 family rate for 2-4 children
                          {students.length > CLASS_PRICING.familyChildCap ? " | larger households add $15 per extra child" : ""}
                        </p>
                      </section>
                      <section>
                        <h4>Age range</h4>
                        <p>{classItem.age_min ?? "?"} - {classItem.age_max ?? "?"}</p>
                      </section>
                      <section>
                        <h4>What to bring</h4>
                        <p>{classItem.what_to_bring || "Bring water, weather-ready layers, and sturdy shoes."}</p>
                      </section>
                      <section>
                        <h4>Weather / notes</h4>
                        <p>{classItem.weather_note || "Final weather guidance will be shared before class."}</p>
                      </section>
                      <section>
                        <h4>Spots</h4>
                        <p>
                          {getClassSpotsLeft(classItem) ?? "?"} remaining out of {getClassCapacity(classItem) ?? "?"}
                        </p>
                      </section>
                      <section>
                        <h4>Waiver</h4>
                        <p>{classItem.waiver_required ? "Required before registration completes." : "No waiver required for this class."}</p>
                      </section>
                    </div>

                    {classGroups.length ? (
                      <section className="trail-note trail-note-framed stack">
                        <div>
                          <p className="eyebrow">Already linked to this class</p>
                          <h4 style={{ marginTop: 4 }}>Current family registration state</h4>
                        </div>
                        <div className="dashboard-opportunity-list">
                          {classGroups.map((group) => (
                            <article className="dashboard-opportunity-row" key={group.id}>
                              <div className="dashboard-opportunity-row-top">
                                <div className="field-guide-meta-row">
                                  <span className="badge">{group.statusLabel}</span>
                                  <span className="muted">{formatPrice(group.totalPaidCents)}</span>
                                </div>
                              </div>
                              <h4 className="dashboard-opportunity-title">{group.studentNames.join(", ")}</h4>
                              <p className="dashboard-opportunity-description">
                                {group.attendeeCount} attendee{group.attendeeCount === 1 ? "" : "s"} | {group.waiverId ? "Waiver linked" : "No waiver linked"}
                              </p>
                            </article>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <section className="panel stack classes-registration-panel">
                      <div>
                        <p className="eyebrow">Register this family</p>
                        <h4>Select one or more children</h4>
                        <p className="panel-copy" style={{ marginBottom: 0 }}>
                          Paid registrations are saved on the family record and also attached to each selected student profile.
                        </p>
                      </div>

                      {students.length ? (
                        <div className="classes-student-picker">
                          {students.map((student) => {
                            const isAlreadyRegistered = classRegisteredStudentIds.has(student.id);
                            const outOfRange =
                              (typeof classItem.age_min === "number" && student.age < classItem.age_min) ||
                              (typeof classItem.age_max === "number" && student.age > classItem.age_max);
                            const disabled = isAlreadyRegistered || outOfRange;

                            return (
                              <label
                                className={`classes-student-option ${disabled ? "classes-student-option-disabled" : ""}`}
                                key={student.id}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.includes(student.id)}
                                  disabled={disabled}
                                  onChange={(event) => {
                                    setSelectedStudentIds((current) =>
                                      event.target.checked
                                        ? [...current, student.id]
                                        : current.filter((item) => item !== student.id)
                                    );
                                  }}
                                />
                                <span>
                                  <strong>{student.name}</strong>
                                  <span className="muted">
                                    age {student.age}
                                    {isAlreadyRegistered
                                      ? " | already registered"
                                      : outOfRange
                                        ? " | outside age range"
                                        : ""}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="panel-copy">Add a student profile before registering for classes.</p>
                      )}

                      <section className="trail-note trail-note-framed stack">
                        <div>
                          <p className="eyebrow">Final price</p>
                          <h4 style={{ marginTop: 4 }}>{formatPrice(pricingSummary.totalCents || 0)}</h4>
                        </div>
                        <p className="panel-copy" style={{ margin: 0 }}>
                          {pricingSummary.breakdownLabel}
                        </p>
                      </section>

                      {classItem.waiver_required ? (
                        <section className="stack">
                          <div>
                            <p className="eyebrow">Waiver</p>
                            <h4>Class waiver before payment</h4>
                          </div>

                          {reusableWaiver ? (
                            <label className="classes-waiver-toggle">
                              <input
                                type="checkbox"
                                checked={useSavedWaiverOnFile}
                                onChange={(event) => setUseSavedWaiverOnFile(event.target.checked)}
                              />
                              <span>
                                Use saved waiver on file from {new Date(reusableWaiver.accepted_at).toLocaleDateString()} signed by {reusableWaiver.signature_name}
                              </span>
                            </label>
                          ) : null}

                          {!useSavedWaiverOnFile ? (
                            <div className="stack">
                              <label>
                                Emergency contact
                                <input
                                  value={emergencyContact}
                                  onChange={(event) => setEmergencyContact(event.target.value)}
                                  placeholder="Parent phone or emergency backup"
                                />
                              </label>
                              <label>
                                Medical notes
                                <textarea
                                  value={medicalNotes}
                                  onChange={(event) => setMedicalNotes(event.target.value)}
                                  rows={3}
                                  placeholder="Anything WSA should know for class safety."
                                />
                              </label>
                              <label>
                                Parent signature name
                                <input
                                  value={signatureName}
                                  onChange={(event) => setSignatureName(event.target.value)}
                                  placeholder="Type full name as signature"
                                />
                              </label>
                              <label className="classes-waiver-toggle">
                                <input
                                  type="checkbox"
                                  checked={acceptWaiver}
                                  onChange={(event) => setAcceptWaiver(event.target.checked)}
                                />
                                <span>I agree to the standard WSA class waiver for the selected children.</span>
                              </label>
                              <label className="classes-waiver-toggle">
                                <input
                                  type="checkbox"
                                  checked={saveWaiverOnFile}
                                  onChange={(event) => setSaveWaiverOnFile(event.target.checked)}
                                />
                                <span>Save this waiver on file for future class registrations.</span>
                              </label>
                            </div>
                          ) : (
                            <p className="panel-copy" style={{ margin: 0 }}>
                              This registration will reuse the household waiver already saved on file.
                            </p>
                          )}
                        </section>
                      ) : null}

                      {formError ? <p className="error">{formError}</p> : null}

                      <div className="cta-row">
                        <button
                          type="button"
                          className="button button-primary"
                          disabled={!students.length || !selectedStudentIds.length || isPending || classItem.status === "full"}
                          onClick={() => {
                            setFormError("");

                            startTransition(async () => {
                              const response = await fetch("/api/classes/checkout", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                  classId: classItem.id,
                                  studentIds: selectedStudentIds,
                                  useSavedWaiverOnFile: classItem.waiver_required ? useSavedWaiverOnFile : false,
                                  waiver:
                                    classItem.waiver_required && !useSavedWaiverOnFile
                                      ? {
                                          emergencyContact,
                                          medicalNotes,
                                          signatureName,
                                          saveOnFile: saveWaiverOnFile,
                                          accepted: acceptWaiver
                                        }
                                      : undefined
                                })
                              });

                              const payload = (await response.json()) as {
                                checkoutUrl?: string;
                                error?: string;
                              };

                              if (!response.ok || payload.error || !payload.checkoutUrl) {
                                setFormError(payload.error ?? "Could not start checkout.");
                                return;
                              }

                              window.location.href = payload.checkoutUrl;
                            });
                          }}
                        >
                          {isPending ? "Opening Stripe..." : `Pay ${formatPrice(pricingSummary.totalCents)} with Stripe`}
                        </button>
                      </div>
                    </section>
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="panel stack">
          <div>
            <p className="eyebrow">Classes</p>
            <h3>No classes published yet</h3>
            <p className="panel-copy">Once classes are published, this page will become the full family registration and tracking hub.</p>
          </div>
        </section>
      )}
    </section>
  );
}
