"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AdminFieldQuestDeleteButtonProps = {
  questId: string;
  questTitle: string;
};

export function AdminFieldQuestDeleteButton({
  questId,
  questTitle,
}: AdminFieldQuestDeleteButtonProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="stack">
      <button
        type="button"
        className="button button-ghost"
        disabled={isPending}
        onClick={() => {
          const shouldDelete = window.confirm(
            `Delete "${questTitle}"? This removes the public quest and its Field Quest analytics history.`,
          );
          if (!shouldDelete) return;

          setError("");
          startTransition(async () => {
            const response = await fetch(`/api/admin/field-quests/${questId}`, {
              method: "DELETE",
            });

            const body = (await response.json().catch(() => ({}))) as { error?: string };
            if (!response.ok || body.error) {
              setError(body.error ?? "Could not delete Field Quest.");
              return;
            }

            router.push("/admin/field-quests");
            router.refresh();
          });
        }}
      >
        {isPending ? "Deleting..." : "Delete quest"}
      </button>
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
