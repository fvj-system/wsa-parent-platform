"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AdminClassStatusActionsProps = {
  classId: string;
};

export function AdminClassStatusActions({ classId }: AdminClassStatusActionsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const updateStatus = (status: "scheduled" | "cancelled" | "completed" | "archived") => {
    setError("");
    startTransition(async () => {
      const response = await fetch(`/api/admin/classes/${classId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok || payload.error) {
        setError(payload.error ?? "Could not update class status.");
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="stack">
      <div className="cta-row">
        <button type="button" className="button button-ghost" disabled={isPending} onClick={() => updateStatus("scheduled")}>
          Schedule
        </button>
        <button type="button" className="button button-ghost" disabled={isPending} onClick={() => updateStatus("cancelled")}>
          Cancel
        </button>
        <button type="button" className="button button-ghost" disabled={isPending} onClick={() => updateStatus("completed")}>
          Mark completed
        </button>
        <button type="button" className="button button-ghost" disabled={isPending} onClick={() => updateStatus("archived")}>
          Archive
        </button>
      </div>
      {error ? <p className="error" style={{ margin: 0 }}>{error}</p> : null}
    </div>
  );
}
