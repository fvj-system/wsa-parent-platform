import { notFound } from "next/navigation";
import { DiscoveryDetailView } from "@/components/discovery-detail-view";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import type { DiscoveryRecord } from "@/lib/discoveries";
import { createSignedStorageUrl, extractStoragePathFromLegacyUrl } from "@/lib/storage";

export default async function DiscoveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();

  const { data: discovery } = await supabase
    .from("discoveries")
    .select("id, user_id, student_id, category, image_path, common_name, scientific_name, confidence_level, image_url, image_alt, notes, result_json, location_label, latitude, longitude, observed_at, created_at")
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (!discovery) {
    notFound();
  }

  const imagePath =
    (discovery as DiscoveryRecord).image_path ?? extractStoragePathFromLegacyUrl(discovery.image_url, "leaf-photos");
  const signedImageUrl = await createSignedStorageUrl(supabase, "leaf-photos", imagePath);

  let studentName: string | null = null;
  if (discovery.student_id) {
    const { data: student } = await supabase
      .from("students")
      .select("name")
      .eq("user_id", user.id)
      .eq("id", discovery.student_id)
      .maybeSingle();
    studentName = student?.name ?? null;
  }

  return (
    <PageShell
      userLabel={user.email ?? "WSA family"}
      eyebrow="Discovery Detail"
      title={discovery.common_name}
      description="A saved family field-catalog entry with its photo, identification notes, and safety guidance."
    >
      <DiscoveryDetailView
        discovery={{
          ...(discovery as DiscoveryRecord),
          image_path: imagePath,
          image_url: signedImageUrl ?? discovery.image_url
        }}
        studentName={studentName}
      />
    </PageShell>
  );
}
