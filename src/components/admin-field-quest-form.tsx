"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  fieldQuestDifficultyLevels,
  fieldQuestStatuses,
  normalizeFieldQuestChecklistItems,
  slugifyFieldQuestTitle,
  type FieldQuestRecord,
} from "@/lib/field-quests";

type QuestClassOption = {
  id: string;
  title: string;
};

type AdminFieldQuestFormProps = {
  initialValues?: FieldQuestRecord | null;
  classOptions: QuestClassOption[];
  mode: "create" | "edit";
};

export function AdminFieldQuestForm({
  initialValues,
  classOptions,
  mode,
}: AdminFieldQuestFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="panel stack"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const formData = new FormData(event.currentTarget);
        const title = String(formData.get("title") || "").trim();
        const slug = String(formData.get("slug") || "").trim() || slugifyFieldQuestTitle(title);

        startTransition(async () => {
          const payload = {
            title,
            slug,
            short_description: String(formData.get("short_description") || ""),
            description: String(formData.get("description") || ""),
            location_type: String(formData.get("location_type") || ""),
            exact_location: String(formData.get("exact_location") || ""),
            state_code: String(formData.get("state_code") || ""),
            county_name: String(formData.get("county_name") || ""),
            difficulty_level: String(formData.get("difficulty_level") || "easy"),
            estimated_time: String(formData.get("estimated_time") || ""),
            age_range: String(formData.get("age_range") || ""),
            subject_tags: String(formData.get("subject_tags") || ""),
            checklist_lines: String(formData.get("checklist_lines") || ""),
            clue_text: String(formData.get("clue_text") || ""),
            requires_photo: formData.get("requires_photo") === "on",
            requires_note: formData.get("requires_note") === "on",
            badge_name: String(formData.get("badge_name") || ""),
            badge_description: String(formData.get("badge_description") || ""),
            linked_class_id: String(formData.get("linked_class_id") || ""),
            is_backyard_friendly: formData.get("is_backyard_friendly") === "on",
            is_park_quest: formData.get("is_park_quest") === "on",
            is_creek_water: formData.get("is_creek_water") === "on",
            is_history: formData.get("is_history") === "on",
            is_animal: formData.get("is_animal") === "on",
            is_easy_young_kids: formData.get("is_easy_young_kids") === "on",
            status: String(formData.get("status") || "published"),
          };

          const endpoint =
            mode === "create"
              ? "/api/admin/field-quests"
              : `/api/admin/field-quests/${initialValues?.id}`;
          const method = mode === "create" ? "POST" : "PATCH";
          const response = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const body = (await response.json().catch(() => ({}))) as {
            id?: string;
            error?: string;
          };

          if (!response.ok || body.error) {
            setError(body.error ?? "Could not save Field Quest.");
            return;
          }

          const nextId = mode === "create" ? body.id : initialValues?.id;
          router.push(`/admin/field-quests/${nextId}`);
          router.refresh();
        });
      }}
    >
      <div>
        <p className="eyebrow">{mode === "create" ? "Create Field Quest" : "Edit Field Quest"}</p>
        <h3>{mode === "create" ? "Publish a public mission" : "Update the public mission"}</h3>
        <p className="panel-copy" style={{ marginBottom: 0 }}>
          Field Quests are the growth-friendly public missions that feed badge progress, student profiles, and homeschool review once a family saves them inside the WSA app.
        </p>
      </div>

      <div className="content-grid">
        <label>
          Title
          <input name="title" defaultValue={initialValues?.title ?? ""} required />
        </label>
        <label>
          Slug
          <input name="slug" defaultValue={initialValues?.slug ?? ""} />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Short description
          <textarea
            name="short_description"
            rows={2}
            defaultValue={initialValues?.short_description ?? ""}
            required
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Full description
          <textarea
            name="description"
            rows={5}
            defaultValue={initialValues?.description ?? ""}
            required
          />
        </label>
        <label>
          Location type
          <input
            name="location_type"
            defaultValue={initialValues?.location_type ?? ""}
            placeholder="Creek walk or park trail"
            required
          />
        </label>
        <label>
          Exact location
          <input
            name="exact_location"
            defaultValue={initialValues?.exact_location ?? ""}
            placeholder="Optional public place guidance"
          />
        </label>
        <label>
          State code
          <input name="state_code" defaultValue={initialValues?.state_code ?? ""} placeholder="MD" />
        </label>
        <label>
          County
          <input name="county_name" defaultValue={initialValues?.county_name ?? ""} placeholder="St. Mary's" />
        </label>
        <label>
          Difficulty
          <select
            name="difficulty_level"
            defaultValue={initialValues?.difficulty_level ?? "easy"}
          >
            {fieldQuestDifficultyLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estimated time
          <input
            name="estimated_time"
            defaultValue={initialValues?.estimated_time ?? ""}
            placeholder="20-30 minutes"
            required
          />
        </label>
        <label>
          Age range
          <input name="age_range" defaultValue={initialValues?.age_range ?? ""} required />
        </label>
        <label>
          Status
          <select name="status" defaultValue={initialValues?.status ?? "published"}>
            {fieldQuestStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Subject tags
          <input
            name="subject_tags"
            defaultValue={initialValues?.subject_tags.join(", ") ?? ""}
            placeholder="Science, Social Studies, Art, creek/water"
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Checklist items
          <textarea
            name="checklist_lines"
            rows={6}
            defaultValue={normalizeFieldQuestChecklistItems(initialValues?.checklist_json ?? []).map((item) => item.label).join("\n")}
            placeholder="One checklist step per line"
            required
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Optional clue
          <textarea
            name="clue_text"
            rows={3}
            defaultValue={initialValues?.clue_text ?? ""}
          />
        </label>
        <label>
          Badge name
          <input name="badge_name" defaultValue={initialValues?.badge_name ?? ""} required />
        </label>
        <label>
          Badge description
          <input
            name="badge_description"
            defaultValue={initialValues?.badge_description ?? ""}
            required
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Linked class
          <select name="linked_class_id" defaultValue={initialValues?.linked_class_id ?? ""}>
            <option value="">No linked class</option>
            {classOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="classes-waiver-toggle">
          <input
            name="requires_photo"
            type="checkbox"
            defaultChecked={initialValues?.requires_photo ?? false}
          />
          <span>Require a proof photo for completion</span>
        </label>
        <label className="classes-waiver-toggle">
          <input
            name="requires_note"
            type="checkbox"
            defaultChecked={initialValues?.requires_note ?? false}
          />
          <span>Require a written field note for completion</span>
        </label>
        <label className="classes-waiver-toggle">
          <input
            name="is_backyard_friendly"
            type="checkbox"
            defaultChecked={initialValues?.is_backyard_friendly ?? false}
          />
          <span>Backyard friendly</span>
        </label>
        <label className="classes-waiver-toggle">
          <input
            name="is_park_quest"
            type="checkbox"
            defaultChecked={initialValues?.is_park_quest ?? false}
          />
          <span>Park quest</span>
        </label>
        <label className="classes-waiver-toggle">
          <input
            name="is_creek_water"
            type="checkbox"
            defaultChecked={initialValues?.is_creek_water ?? false}
          />
          <span>Creek / water quest</span>
        </label>
        <label className="classes-waiver-toggle">
          <input
            name="is_history"
            type="checkbox"
            defaultChecked={initialValues?.is_history ?? false}
          />
          <span>History quest</span>
        </label>
        <label className="classes-waiver-toggle">
          <input
            name="is_animal"
            type="checkbox"
            defaultChecked={initialValues?.is_animal ?? false}
          />
          <span>Animal quest</span>
        </label>
        <label className="classes-waiver-toggle">
          <input
            name="is_easy_young_kids"
            type="checkbox"
            defaultChecked={initialValues?.is_easy_young_kids ?? false}
          />
          <span>Easy for young kids</span>
        </label>
      </div>

      <div className="cta-row">
        <button type="submit" className="button button-primary" disabled={isPending}>
          {isPending ? "Saving..." : mode === "create" ? "Create Field Quest" : "Save changes"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
