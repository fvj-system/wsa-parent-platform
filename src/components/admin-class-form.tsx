"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClassRecord } from "@/lib/classes";
import { slugifyClassTitle } from "@/lib/admin-classes";

type AdminClassFormProps = {
  initialValues?: ClassRecord | null;
  mode: "create" | "edit";
};

export function AdminClassForm({ initialValues, mode }: AdminClassFormProps) {
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
        const manualSlug = String(formData.get("slug") || "").trim();

        startTransition(async () => {
          const body = {
            title,
            slug: manualSlug || slugifyClassTitle(title),
            description: String(formData.get("description") || ""),
            short_description: String(formData.get("short_description") || ""),
            class_date: String(formData.get("class_date") || ""),
            start_time: String(formData.get("start_time") || ""),
            end_time: String(formData.get("end_time") || ""),
            location: String(formData.get("location") || ""),
            price_child: Number(formData.get("price_child") || 0),
            price_family: Number(formData.get("price_family") || 0),
            capacity: Number(formData.get("capacity") || 0),
            status: String(formData.get("status") || "scheduled"),
            image_url: String(formData.get("image_url") || ""),
            what_to_bring: String(formData.get("what_to_bring") || ""),
            age_range: String(formData.get("age_range") || ""),
            registration_link_child: String(formData.get("registration_link_child") || ""),
            registration_link_family: String(formData.get("registration_link_family") || ""),
            is_featured: formData.get("is_featured") === "on"
          };

          const endpoint = mode === "create" ? "/api/admin/classes" : `/api/admin/classes/${initialValues?.id}`;
          const method = mode === "create" ? "POST" : "PATCH";
          const response = await fetch(endpoint, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          const payload = (await response.json()) as { id?: string; error?: string };

          if (!response.ok || payload.error) {
            setError(payload.error ?? "Could not save class.");
            return;
          }

          router.push(mode === "create" ? `/admin/classes/${payload.id}` : `/admin/classes/${initialValues?.id}`);
          router.refresh();
        });
      }}
    >
      <div>
        <p className="eyebrow">{mode === "create" ? "Create class" : "Edit class"}</p>
        <h3>{mode === "create" ? "Publish a class card for families" : "Update class details and links"}</h3>
        <p className="panel-copy" style={{ marginBottom: 0 }}>
          WSA handles browsing and class choice here. Jotform still handles the real registration, waiver, and Stripe checkout.
        </p>
      </div>

      <div className="content-grid">
        <label>
          Title
          <input name="title" defaultValue={initialValues?.title ?? ""} required />
        </label>
        <label>
          Slug
          <input
            name="slug"
            defaultValue={initialValues?.slug ?? ""}
            placeholder="auto-generated-from-title"
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Short description
          <textarea
            name="short_description"
            rows={2}
            defaultValue={initialValues?.short_description ?? ""}
            placeholder="One compact sentence for the class card."
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Full description
          <textarea
            name="description"
            rows={5}
            defaultValue={initialValues?.description ?? ""}
            placeholder="What families should know before they register."
          />
        </label>
        <label>
          Class date
          <input
            name="class_date"
            type="date"
            defaultValue={initialValues?.class_date ?? initialValues?.date ?? ""}
            required
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={initialValues?.status ?? "scheduled"}>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="full">Full</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          Start time
          <input name="start_time" type="time" defaultValue={initialValues?.start_time ?? ""} required />
        </label>
        <label>
          End time
          <input name="end_time" type="time" defaultValue={initialValues?.end_time ?? ""} required />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Location
          <input name="location" defaultValue={initialValues?.location ?? ""} />
        </label>
        <label>
          Child price
          <input
            name="price_child"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initialValues?.price_child ?? (typeof initialValues?.price_cents === "number" ? initialValues.price_cents / 100 : 15)}
            required
          />
        </label>
        <label>
          Family price
          <input
            name="price_family"
            type="number"
            min={0}
            step="0.01"
            defaultValue={initialValues?.price_family ?? 25}
            required
          />
        </label>
        <label>
          Capacity
          <input
            name="capacity"
            type="number"
            min={1}
            defaultValue={initialValues?.capacity ?? initialValues?.max_capacity ?? 12}
            required
          />
        </label>
        <label>
          Age range
          <input
            name="age_range"
            defaultValue={
              initialValues?.age_range ??
              (typeof initialValues?.age_min === "number" && typeof initialValues?.age_max === "number"
                ? `${initialValues.age_min}-${initialValues.age_max}`
                : "")
            }
            placeholder="5-12"
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Image URL
          <input name="image_url" type="url" defaultValue={initialValues?.image_url ?? ""} placeholder="https://..." />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          What to bring
          <textarea
            name="what_to_bring"
            rows={3}
            defaultValue={initialValues?.what_to_bring ?? ""}
            placeholder="Water, bug spray, journal, boots..."
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Child registration Jotform link
          <input
            name="registration_link_child"
            type="url"
            defaultValue={initialValues?.registration_link_child ?? ""}
            placeholder="https://form.jotform.com/..."
          />
        </label>
        <label style={{ gridColumn: "1 / -1" }}>
          Family registration Jotform link
          <input
            name="registration_link_family"
            type="url"
            defaultValue={initialValues?.registration_link_family ?? ""}
            placeholder="https://form.jotform.com/..."
          />
        </label>
        <label className="classes-waiver-toggle" style={{ gridColumn: "1 / -1" }}>
          <input name="is_featured" type="checkbox" defaultChecked={initialValues?.is_featured ?? false} />
          <span>Feature this class at the top of the parent class list.</span>
        </label>
      </div>

      <div className="cta-row">
        <button type="submit" className="button button-primary" disabled={isPending}>
          {isPending ? "Saving..." : mode === "create" ? "Create class" : "Save changes"}
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
    </form>
  );
}
