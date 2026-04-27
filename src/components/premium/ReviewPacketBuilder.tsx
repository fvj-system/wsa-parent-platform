"use client";

import { useMemo, useState, useTransition } from "react";
import { PrintableReviewPacket } from "@/components/premium/PrintableReviewPacket";
import { formatPremiumStudentName, getDefaultReviewWindow } from "@/lib/premium/data";
import type { PremiumStudent, PrintableReviewPacketData, ReviewPacketRecord } from "@/lib/premium/types";

type ReviewPacketBuilderProps = {
  students: PremiumStudent[];
  activeStudentId?: string | null;
  latestPacket?: ReviewPacketRecord | null;
};

export function ReviewPacketBuilder({ students, activeStudentId, latestPacket = null }: ReviewPacketBuilderProps) {
  const reviewWindow = getDefaultReviewWindow();
  const [studentId, setStudentId] = useState(activeStudentId ?? students[0]?.id ?? "");
  const [startDate, setStartDate] = useState(reviewWindow.startDate);
  const [endDate, setEndDate] = useState(reviewWindow.endDate);
  const [parentNotes, setParentNotes] = useState("");
  const [packet, setPacket] = useState<ReviewPacketRecord | null>(latestPacket);
  const [printablePacket, setPrintablePacket] = useState<PrintableReviewPacketData | null>(
    (latestPacket?.packet_json as PrintableReviewPacketData | undefined) ?? null,
  );
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [warning, setWarning] = useState("");
  const [isPending, startTransition] = useTransition();
  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId) ?? students[0],
    [studentId, students],
  );

  async function buildPacket() {
    setError("");
    setStatus("");
    setWarning("");

    const response = await fetch("/api/ai/build-review-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_id: studentId,
        review_period_start: startDate,
        review_period_end: endDate,
        parent_notes: parentNotes,
      }),
    });

    const result = (await response.json()) as {
      error?: string;
      warning?: string | null;
      packet?: ReviewPacketRecord;
      printable_packet?: PrintableReviewPacketData;
    };

    if (!response.ok || !result.packet || !result.printable_packet) {
      setError(result.error ?? "Unable to build review packet.");
      return;
    }

    setPacket(result.packet);
    setPrintablePacket(result.printable_packet);
    setWarning(result.warning ?? "");
    setStatus("Review packet built and saved.");
  }

  async function submitForHumanReview() {
    if (!packet) return;

    setError("");
    setStatus("");
    const response = await fetch("/api/umbrella/reviews/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        review_packet_id: packet.id,
      }),
    });

    const result = (await response.json()) as { error?: string; already_exists?: boolean };
    if (!response.ok) {
      setError(result.error ?? "Unable to submit packet for human review.");
      return;
    }

    setStatus(result.already_exists ? "This packet was already submitted for human review." : "Packet submitted for human review.");
  }

  return (
    <section className="stack">
      <section className="panel stack">
        <div>
          <p className="eyebrow">Review Packet Status</p>
          <h3>Build a review-ready packet</h3>
          <p className="panel-copy" style={{ margin: 0 }}>
            AI assists with packet organization only. Final review decisions require a qualified human reviewer.
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
            Review period start
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>
            Review period end
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
        </div>

        <label>
          Parent notes
          <textarea rows={3} value={parentNotes} onChange={(event) => setParentNotes(event.target.value)} />
        </label>

        <div className="cta-row">
          <button
            type="button"
            disabled={isPending || !selectedStudent}
            onClick={() => {
              startTransition(() => {
                void buildPacket();
              });
            }}
          >
            {isPending ? "Building..." : "Build Review Packet"}
          </button>
          {packet ? (
            <button
              type="button"
              className="button button-ghost"
              onClick={() => {
                startTransition(() => {
                  void submitForHumanReview();
                });
              }}
            >
              Submit for Human Review
            </button>
          ) : null}
        </div>

        {error ? <p className="error">{error}</p> : null}
        {warning ? <p className="success">{warning}</p> : null}
        {status ? <p className="success">{status}</p> : null}
      </section>

      {packet ? (
        <section className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">Current review period</p>
              <h3>{packet.review_period_start} to {packet.review_period_end}</h3>
            </div>
            <span className="badge">{packet.current_status}</span>
          </div>
        </section>
      ) : null}

      {printablePacket ? <PrintableReviewPacket packet={printablePacket} /> : null}
    </section>
  );
}
