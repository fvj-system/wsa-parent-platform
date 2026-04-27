import { NextResponse } from "next/server";
import { ensurePremiumContext, listPortfolioItemsForStudent } from "@/lib/premium/data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");
    const context = await ensurePremiumContext(supabase, user.id);
    const items = await listPortfolioItemsForStudent(supabase, context.familyId, studentId);

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
