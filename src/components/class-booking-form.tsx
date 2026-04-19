"use client";

import { useState, useTransition } from "react";
import { getClassPrimaryPrice, type ClassBookingRecord, type ClassRecord } from "@/lib/classes";
import type { StudentRecord } from "@/lib/students";

type ClassBookingFormProps = {
  classItem: ClassRecord;
  students: StudentRecord[];
  existingBookings: Array<ClassBookingRecord & { studentName?: string }>;
};

export function ClassBookingForm({ classItem, students, existingBookings }: ClassBookingFormProps) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const existingBooking = existingBookings.find((item) => item.student_id === selectedStudentId);
  const priceLabel = getClassPrimaryPrice(classItem);

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Book this class</p>
        <h3>Select the student attending</h3>
        <p className="panel-copy">Checkout is handled securely through Stripe Checkout and the booking stays tied to the student profile.</p>
      </div>

      {students.length ? (
        <label>
          Student
          <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)}>
            <option value="">Choose a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name} | age {student.age}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="panel-copy">Add a student profile before booking an in-person class.</p>
      )}

      {existingBooking?.payment_status === "paid" ? (
        <p className="success">This student is already booked and paid for this class.</p>
      ) : null}

      <button
        type="button"
        disabled={isPending || !selectedStudentId || !students.length || existingBooking?.payment_status === "paid"}
        onClick={() => {
          setError("");

          startTransition(async () => {
            const response = await fetch("/api/classes/checkout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                classId: classItem.id,
                studentId: selectedStudentId
              })
            });

            const payload = (await response.json()) as { checkoutUrl?: string; error?: string };

            if (!response.ok || payload.error || !payload.checkoutUrl) {
              setError(payload.error ?? "Could not start checkout.");
              return;
            }

            window.location.href = payload.checkoutUrl;
          });
        }}
      >
        {isPending ? "Opening Stripe..." : `Book now${priceLabel !== null ? ` | $${priceLabel.toFixed(2)}` : ""}`}
      </button>

      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
