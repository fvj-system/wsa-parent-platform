"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { PhotoAsset, Profile, TreeIdentification, Waiver } from "@/lib/types";

const JOTFORM_URL = "https://form.jotform.com/260665866356066";

type Props = {
  initialProfile: Profile;
  initialWaiver: Waiver | null;
  initialPhotos: PhotoAsset[];
  initialTreeNotes: TreeIdentification[];
};

export function DashboardApp({ initialProfile, initialWaiver, initialPhotos, initialTreeNotes }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [waiver, setWaiver] = useState<Waiver | null>(initialWaiver);
  const [photos, setPhotos] = useState<PhotoAsset[]>(initialPhotos);
  const [treeNotes, setTreeNotes] = useState<TreeIdentification[]>(initialTreeNotes);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let ignore = false;

    async function loadSignedUrls() {
      const nextPhotos = await Promise.all(
        initialPhotos.map(async (photo) => {
          if (!photo.image_path) return photo;
          const signedUrl = (await supabase.storage.from("class-photos").createSignedUrl(photo.image_path, 3600)).data?.signedUrl;
          return { ...photo, public_url: signedUrl };
        })
      );

      const nextTreeNotes = await Promise.all(
        initialTreeNotes.map(async (tree) => {
          if (!tree.image_path) return tree;
          const signedUrl = (await supabase.storage.from("leaf-photos").createSignedUrl(tree.image_path, 3600)).data?.signedUrl;
          return { ...tree, public_url: signedUrl };
        })
      );

      if (ignore) return;
      setPhotos(nextPhotos);
      setTreeNotes(nextTreeNotes);
    }

    void loadSignedUrls();

    return () => {
      ignore = true;
    };
  }, [initialPhotos, initialTreeNotes, supabase]);

  const stats = [
    { label: "Waiver", value: waiver ? "Signed" : "Pending" },
    { label: "Photos", value: `${photos.length}` },
    { label: "Tree IDs", value: `${treeNotes.length}` },
    { label: "Household", value: initialProfile.household_name || "WSA Family" }
  ];

  const onSaveWaiver = (formData: FormData) => {
    setError("");
    setStatus("");

    startTransition(async () => {
      const payload = {
        child_name: String(formData.get("childName") || ""),
        emergency_contact: String(formData.get("emergencyContact") || ""),
        medical_notes: String(formData.get("medicalNotes") || ""),
        signature_name: String(formData.get("signatureName") || "")
      };

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setError("Your session expired. Please sign in again.");
        return;
      }

      const { data, error: saveError } = await supabase
        .from("waivers")
        .insert({ user_id: userId, ...payload })
        .select("id, child_name, emergency_contact, medical_notes, signature_name, signed_at")
        .single();

      if (saveError) {
        setError(saveError.message);
        return;
      }

      setWaiver(data);
      setStatus("Waiver stored successfully.");
      router.refresh();
    });
  };

  const onUploadPhotos = (formData: FormData) => {
    setError("");
    setStatus("");

    startTransition(async () => {
      const files = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
      const caption = String(formData.get("caption") || "");
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      if (!userId) {
        setError("Your session expired. Please sign in again.");
        return;
      }

      for (const file of files) {
        const path = `${userId}/${Date.now()}-${file.name}`;
        const upload = await supabase.storage.from("class-photos").upload(path, file, {
          cacheControl: "3600",
          upsert: false
        });

        if (upload.error) {
          setError(upload.error.message);
          return;
        }

        const { data, error: insertError } = await supabase
          .from("photo_assets")
          .insert({ user_id: userId, caption, image_path: path })
          .select("id, caption, image_path, created_at")
          .single();

        if (insertError) {
          setError(insertError.message);
          return;
        }

        const signedUrl = (await supabase.storage.from("class-photos").createSignedUrl(path, 3600)).data?.signedUrl;
        setPhotos((current) => [{ ...data, public_url: signedUrl }, ...current]);
      }

      setStatus("Photo upload complete.");
    });
  };

  const onIdentifyTree = (formData: FormData) => {
    setError("");
    setStatus("");

    startTransition(async () => {
      const requestBody = new FormData();
      requestBody.set("leafShape", String(formData.get("leafShape") || ""));
      requestBody.set("leafEdge", String(formData.get("leafEdge") || ""));
      requestBody.set("leafArrangement", String(formData.get("leafArrangement") || ""));
      requestBody.set("notes", String(formData.get("notes") || ""));

      const leafPhoto = formData.get("leafPhoto");
      if (leafPhoto instanceof File && leafPhoto.size > 0) {
        requestBody.set("leafPhoto", leafPhoto);
      }

      const response = await fetch("/api/tree-identify", {
        method: "POST",
        body: requestBody
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Tree identification failed.");
        return;
      }

      setTreeNotes((current) => [result.identification, ...current]);
      setStatus("Tree identification saved.");
      router.refresh();
    });
  };

  return (
    <>
      <section className="stats-grid">
        {stats.map((stat) => (
          <article className="stat" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">Waiver</p>
              <h3>Sign a durable class waiver</h3>
            </div>
            {waiver ? <span className="badge">Signed</span> : null}
          </div>

          <form className="stack" action={onSaveWaiver}>
            <label>
              Child name
              <input name="childName" defaultValue={waiver?.child_name ?? ""} required />
            </label>
            <label>
              Emergency contact
              <input name="emergencyContact" defaultValue={waiver?.emergency_contact ?? ""} required />
            </label>
            <label>
              Medical notes
              <textarea name="medicalNotes" defaultValue={waiver?.medical_notes ?? ""} rows={4} />
            </label>
            <label>
              Digital signature
              <input name="signatureName" defaultValue={waiver?.signature_name ?? initialProfile.full_name} required />
            </label>
            <button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save waiver"}
            </button>
          </form>
        </article>

        <article className="panel stack">
          <div className="header-row">
            <div>
              <p className="eyebrow">Gallery</p>
              <h3>Upload and share class photos</h3>
            </div>
          </div>

          <form className="stack" action={onUploadPhotos}>
            <label>
              Caption
              <input name="caption" placeholder="Creek walk, shelter build, leaf hunt..." />
            </label>
            <label>
              Photos
              <input name="photos" type="file" accept="image/*" multiple required />
            </label>
            <button type="submit" disabled={isPending}>
              {isPending ? "Uploading..." : "Upload photos"}
            </button>
          </form>

          <div className="gallery-grid">
            {photos.map((photo) => (
              <article className="note-card" key={photo.id}>
                {photo.public_url ? <img src={photo.public_url} alt={photo.caption || "WSA photo"} /> : null}
                <div className="copy">
                  <h3>{photo.caption || "WSA class photo"}</h3>
                  <p className="muted">{new Date(photo.created_at).toLocaleString()}</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel stack" style={{ gridColumn: "1 / -1" }}>
          <div className="header-row">
            <div>
              <p className="eyebrow">Registration</p>
              <h3>Continue to payment</h3>
              <p className="panel-copy">
                Parents can use the WSA registration and payment form here after creating an account and signing the waiver.
              </p>
            </div>
            <a className="button button-primary" href={JOTFORM_URL} target="_blank" rel="noreferrer">
              Open payment form
            </a>
          </div>

          <div className="payment-frame-wrap">
            <iframe
              title="WSA registration and payment form"
              src={JOTFORM_URL}
              className="payment-frame"
            />
          </div>
        </article>

        <article className="panel stack" style={{ gridColumn: "1 / -1" }}>
          <div className="header-row">
            <div>
              <p className="eyebrow">Tree ID</p>
              <h3>Identify a tree with AI from a leaf photo and field notes</h3>
              <p className="panel-copy">
                The server route sends the photo and notes to OpenAI, stores the result in Postgres, and saves the leaf image in storage.
              </p>
            </div>
          </div>

          <form className="split-grid" action={onIdentifyTree}>
            <div className="stack">
              <label>
                Leaf photo
                <input name="leafPhoto" type="file" accept="image/*" />
              </label>
              <label>
                Leaf shape
                <select name="leafShape" defaultValue="oval">
                  <option value="oval">Oval</option>
                  <option value="heart">Heart-shaped</option>
                  <option value="star">Star-shaped</option>
                  <option value="lobed">Deeply lobed</option>
                  <option value="needle">Needle-like</option>
                </select>
              </label>
              <label>
                Leaf edge
                <select name="leafEdge" defaultValue="smooth">
                  <option value="smooth">Smooth</option>
                  <option value="serrated">Serrated</option>
                  <option value="lobed">Lobed</option>
                  <option value="spiny">Spiny</option>
                </select>
              </label>
              <label>
                Leaf arrangement
                <select name="leafArrangement" defaultValue="alternate">
                  <option value="alternate">Alternate</option>
                  <option value="opposite">Opposite</option>
                  <option value="clustered">Clustered / unknown</option>
                </select>
              </label>
              <label>
                Field notes
                <textarea name="notes" rows={4} placeholder="Glossy leaf, wet area, white underside, red stem..." />
              </label>
              <button type="submit" disabled={isPending}>
                {isPending ? "Identifying..." : "Identify tree"}
              </button>
            </div>

            <div className="tree-grid">
              {treeNotes.map((tree) => (
                <article className="note-card" key={tree.id}>
                  {tree.public_url ? <img src={tree.public_url} alt={tree.species_name} /> : null}
                  <div className="copy">
                    <h3>{tree.species_name}</h3>
                    <p className="muted">{Math.round(tree.confidence)}% confidence</p>
                    <p className="muted">{tree.notes || "No extra notes."}</p>
                  </div>
                </article>
              ))}
            </div>
          </form>
        </article>
      </section>

      {status ? <p className="success">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="cta-row">
        <button
          className="button-ghost"
          type="button"
          onClick={() => {
            startTransition(async () => {
              await supabase.auth.signOut();
              router.push("/auth/sign-in");
              router.refresh();
            });
          }}
        >
          Sign out
        </button>
      </div>
    </>
  );
}
