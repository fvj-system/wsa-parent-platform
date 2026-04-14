import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getHouseholdContext } from "@/lib/households";
import { getImageUploadError } from "@/lib/image-upload";
import { createSignedStorageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

const createPortfolioEntrySchema = z.object({
  studentId: z.string().uuid().optional(),
  scope: z.enum(["student", "household"]).default("student"),
  title: z.string().trim().min(1).max(120),
  entryType: z.string().trim().min(1).max(80),
  occurredAt: z.string().trim().min(1),
  summary: z.string().trim().max(1200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request) {
  let uploadedImagePath: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const household = await getHouseholdContext(supabase, user.id);
    const formData = await request.formData();
    const image = formData.get("image");
    const parsed = createPortfolioEntrySchema.safeParse({
      studentId: String(formData.get("studentId") || "").trim() || undefined,
      scope: String(formData.get("scope") || "student"),
      title: String(formData.get("title") || ""),
      entryType: String(formData.get("entryType") || ""),
      occurredAt: String(formData.get("occurredAt") || ""),
      summary: String(formData.get("summary") || "").trim() || undefined,
      notes: String(formData.get("notes") || "").trim() || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid homeschool evidence entry." }, { status: 400 });
    }

    if (parsed.data.scope === "student" && !parsed.data.studentId) {
      return NextResponse.json(
        { error: "Choose a student or switch this entry to household scope." },
        { status: 400 },
      );
    }

    if (parsed.data.studentId) {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("household_id", household.householdId)
        .eq("id", parsed.data.studentId)
        .maybeSingle();

      if (studentError) {
        throw new Error(studentError.message);
      }

      if (!student) {
        return NextResponse.json({ error: "Student not found." }, { status: 404 });
      }
    }

    let imagePath: string | null = null;
    let imageUrl: string | null = null;
    let imageAlt: string | null = null;

    if (image instanceof File && image.size > 0) {
      const imageError = getImageUploadError(image);
      if (imageError) {
        return NextResponse.json({ error: imageError }, { status: 400 });
      }

      const bytes = Buffer.from(await image.arrayBuffer());
      imagePath = `${user.id}/portfolio-evidence/${Date.now()}-${image.name}`;
      uploadedImagePath = imagePath;
      imageAlt = `${parsed.data.title} documentation photo`;

      const { error: uploadError } = await supabase.storage
        .from("leaf-photos")
        .upload(imagePath, bytes, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      imageUrl = await createSignedStorageUrl(supabase, "leaf-photos", imagePath);
    }

    const { data, error } = await supabase
      .from("portfolio_entries")
      .insert({
        household_id: household.householdId,
        student_id: parsed.data.scope === "student" ? parsed.data.studentId ?? null : null,
        completion_id: null,
        title: parsed.data.title,
        entry_type: parsed.data.entryType,
        summary: parsed.data.summary ?? null,
        parent_note: parsed.data.notes ?? null,
        occurred_at: new Date(parsed.data.occurredAt).toISOString(),
        artifact_json: {
          source: "manual_documentation",
          imagePath,
          imageUrl,
          imageAlt,
          notes: parsed.data.notes ?? null,
          summary: parsed.data.summary ?? null,
          uploadedByUserId: user.id,
        },
      })
      .select("id, household_id, student_id, completion_id, title, entry_type, summary, parent_note, artifact_json, occurred_at, created_at, source_discovery_id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/portfolio");
    if (parsed.data.studentId) {
      revalidatePath(`/portfolio/${parsed.data.studentId}`);
      revalidatePath(`/students/${parsed.data.studentId}`);
    }

    return NextResponse.json({ entry: data });
  } catch (error) {
    if (uploadedImagePath) {
      try {
        const supabase = await createClient();
        await supabase.storage.from("leaf-photos").remove([uploadedImagePath]);
      } catch {
        // Best-effort cleanup if the database save fails after upload.
      }
    }
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
