import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminClassFormSchema, buildAdminClassPayload } from "@/lib/admin-classes";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { supabase } = await requireAdmin();
    const parsed = adminClassFormSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid class details." }, { status: 400 });
    }

    const {
      data: existingClass
    } = await supabase
      .from("classes")
      .select("spots_remaining, max_capacity, class_type, weather_note, internal_notes, waiver_required")
      .eq("id", id)
      .maybeSingle();

    const payload = buildAdminClassPayload(parsed.data);
    const nextCapacity = payload.capacity ?? payload.max_capacity ?? null;
    const existingSpots =
      typeof existingClass?.spots_remaining === "number"
        ? existingClass.spots_remaining
        : typeof existingClass?.max_capacity === "number"
          ? existingClass.max_capacity
          : nextCapacity;
    const nextSpotsRemaining =
      typeof nextCapacity === "number" && typeof existingSpots === "number"
        ? Math.min(existingSpots, nextCapacity)
        : nextCapacity;

    const { error } = await supabase
      .from("classes")
      .update({
        ...payload,
        class_type: existingClass?.class_type ?? payload.class_type,
        weather_note: existingClass?.weather_note ?? payload.weather_note,
        internal_notes: existingClass?.internal_notes ?? payload.internal_notes,
        waiver_required: existingClass?.waiver_required ?? payload.waiver_required,
        spots_remaining: nextSpotsRemaining,
        max_capacity: nextCapacity,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
