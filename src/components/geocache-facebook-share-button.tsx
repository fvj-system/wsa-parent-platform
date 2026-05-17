"use client";

import { useState } from "react";
import { getFacebookShareUrl } from "@/lib/social";

type GeocacheFacebookShareButtonProps = {
  caption: string;
};

export function GeocacheFacebookShareButton({
  caption,
}: GeocacheFacebookShareButtonProps) {
  const [shared, setShared] = useState(false);

  return (
    <button
      type="button"
      className="button button-ghost"
      onClick={async () => {
        const targetUrl = `${window.location.origin}/field-quests#community-trail`;

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(caption);
        }

        window.open(
          getFacebookShareUrl(targetUrl, caption),
          "_blank",
          "noopener,noreferrer",
        );

        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }}
      title="Copies a ready-to-post caption with the Wild Stallion Academy Facebook page link, then opens Facebook."
    >
      {shared ? "Caption copied" : "Share clue on Facebook"}
    </button>
  );
}
