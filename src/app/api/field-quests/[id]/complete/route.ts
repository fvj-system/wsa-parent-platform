import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { awardStudentRewards } from "@/lib/badge-awards";
import { getHouseholdContext } from "@/lib/households";
import {
  buildFieldQuestBadgeCriteria,
  buildFieldQuestCompletionNotes,
  buildFieldQuestEvidenceSummary,
  fieldQuestCompletionSchema,
  getFieldQuestSelect,
  normalizeFieldQuestChecklistItems,
  type FieldQuestRecord,
} from "@/lib/field-quests";
import { getImageUploadError } from "@/lib/image-upload";
import { createSignedStorageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { getRankForCompletedAdventures } from "@/lib/students";
import type { StudentRecord } from "@/lib/students";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let uploadedImagePath: string | null = null;
  let createdQuestCompletionId: string | null = null;
  let createdActivityCompletionId: string | null = null;
  let createdPortfolioEntryId: string | null = null;
  let rollbackStudentId: string | null = null;
  let rollbackHouseholdId: string | null = null;
  let rollbackNewAchievementIds: string[] = [];
  let rollbackInsertedBadgeCatalogId: string | null = null;

  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to save a Field Quest badge." }, { status: 401 });
    }

    const household = await getHouseholdContext(supabase, user.id);
    const formData = await request.formData();
    const image = formData.get("image");
    const checkedStepIds = (() => {
      const raw = String(formData.get("checkedStepIds") || "[]");
      try {
        return JSON.parse(raw);
      } catch {
        return [];
      }
    })();

    const parsed = fieldQuestCompletionSchema.safeParse({
      studentId: String(formData.get("studentId") || ""),
      checkedStepIds,
      note: String(formData.get("note") || ""),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid Field Quest completion." }, { status: 400 });
    }

    const [{ data: quest, error: questError }, { data: student, error: studentError }] =
      await Promise.all([
        supabase
          .from("field_quests")
          .select(getFieldQuestSelect())
          .eq("id", id)
          .eq("status", "published")
          .maybeSingle(),
        supabase
          .from("students")
          .select("id, user_id, household_id, name, age, interests, reading_level, current_rank, completed_adventures_count, created_at, updated_at")
          .eq("household_id", household.householdId)
          .eq("id", parsed.data.studentId)
          .maybeSingle(),
      ]);

    if (questError) throw new Error(questError.message);
    if (studentError) throw new Error(studentError.message);
    if (!quest) {
      return NextResponse.json({ error: "Field Quest not found." }, { status: 404 });
    }
    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const questRecord = quest as unknown as FieldQuestRecord;
    const checklistItems = normalizeFieldQuestChecklistItems(questRecord.checklist_json);
    const requiredStepIds = new Set(checklistItems.map((item) => item.id));
    const selectedStepIds = Array.from(new Set(parsed.data.checkedStepIds));

    const allStepsChecked =
      checklistItems.length > 0 &&
      checklistItems.every((item) => selectedStepIds.includes(item.id));

    if (!allStepsChecked) {
      return NextResponse.json(
        { error: "Finish every required quest step before saving the badge." },
        { status: 400 },
      );
    }

    if (questRecord.requires_note && !parsed.data.note.trim()) {
      return NextResponse.json(
        { error: "Add a quick field note before saving this quest." },
        { status: 400 },
      );
    }

    if (questRecord.requires_photo && (!(image instanceof File) || image.size === 0)) {
      return NextResponse.json(
        { error: "Add a proof photo before saving this quest." },
        { status: 400 },
      );
    }

    const { data: existingCompletion, error: existingCompletionError } = await supabase
      .from("field_quest_completions")
      .select("id")
      .eq("quest_id", questRecord.id)
      .eq("student_id", student.id)
      .maybeSingle();

    if (existingCompletionError) throw new Error(existingCompletionError.message);
    if (existingCompletion) {
      return NextResponse.json({
        alreadyExisted: true,
        message: `${student.name} already saved this Field Quest badge.`,
      });
    }

    let photoPath: string | null = null;
    let photoUrl: string | null = null;

    if (image instanceof File && image.size > 0) {
      const imageError = getImageUploadError(image);
      if (imageError) {
        return NextResponse.json({ error: imageError }, { status: 400 });
      }

      const bytes = Buffer.from(await image.arrayBuffer());
      photoPath = `${user.id}/field-quests/${questRecord.slug}-${Date.now()}-${image.name}`;
      uploadedImagePath = photoPath;

      const { error: uploadError } = await supabase.storage
        .from("leaf-photos")
        .upload(photoPath, bytes, {
          contentType: image.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      photoUrl = await createSignedStorageUrl(supabase, "leaf-photos", photoPath);
    }

    const { data: savedQuestCompletion, error: saveQuestCompletionError } = await supabase
      .from("field_quest_completions")
      .insert({
        quest_id: questRecord.id,
        user_id: user.id,
        household_id: household.householdId,
        student_id: student.id,
        checklist_progress: checklistItems,
        note: parsed.data.note.trim() || null,
        photo_path: photoPath,
        photo_url: photoUrl,
      })
      .select("id, quest_id, user_id, household_id, student_id, status, checklist_progress, note, photo_path, photo_url, completed_at, created_at, updated_at")
      .single();

    if (saveQuestCompletionError) {
      throw new Error(saveQuestCompletionError.message);
    }
    createdQuestCompletionId = savedQuestCompletion.id;
    rollbackStudentId = student.id;
    rollbackHouseholdId = household.householdId;

    const completionTitle = `${questRecord.title} Field Quest`;
    const completionNotes = buildFieldQuestCompletionNotes(
      questRecord,
      checklistItems.filter((item) => requiredStepIds.has(item.id)),
      parsed.data.note,
    );

    const { data: activityCompletion, error: activityCompletionError } = await supabase
      .from("activity_completions")
      .insert({
        user_id: user.id,
        household_id: household.householdId,
        student_id: student.id,
        generation_id: null,
        class_booking_id: null,
        source_field_quest_id: questRecord.id,
        activity_type: "field_quest",
        title: completionTitle,
        completed_at: new Date().toISOString(),
        notes: completionNotes || null,
        parent_rating: null,
      })
      .select("id")
      .single();

    if (activityCompletionError) {
      throw new Error(activityCompletionError.message);
    }
    createdActivityCompletionId = activityCompletion.id;

    const rewardSummary = await awardStudentRewards({
      supabase,
      userId: user.id,
      student: student as StudentRecord,
      sourceCompletionId: activityCompletion.id,
    });
    rollbackNewAchievementIds = rewardSummary.newAchievements.map((item) => item.id);

    const { data: existingQuestBadgeRows, error: existingQuestBadgeError } = await supabase
      .from("badges")
      .select("id, name, description, category, icon, criteria_json, created_at")
      .eq("name", questRecord.badge_name)
      .limit(1);

    if (existingQuestBadgeError) {
      throw new Error(existingQuestBadgeError.message);
    }

    let questBadge = existingQuestBadgeRows?.[0] ?? null;
    if (!questBadge) {
      const { data: insertedQuestBadge, error: insertedQuestBadgeError } = await supabase
        .from("badges")
        .insert({
          name: questRecord.badge_name,
          description: questRecord.badge_description,
          category: "Field Quest",
          icon: "compass",
          criteria_json: buildFieldQuestBadgeCriteria(questRecord),
        })
        .select("id, name, description, category, icon, criteria_json, created_at")
        .single();

      if (insertedQuestBadgeError) {
        throw new Error(insertedQuestBadgeError.message);
      }

      questBadge = insertedQuestBadge;
      rollbackInsertedBadgeCatalogId = insertedQuestBadge.id;
    }

    const { data: existingStudentQuestBadge, error: existingStudentQuestBadgeError } = await supabase
      .from("student_badges")
      .select("id")
      .eq("student_id", student.id)
      .eq("badge_id", questBadge.id)
      .maybeSingle();

    if (existingStudentQuestBadgeError) {
      throw new Error(existingStudentQuestBadgeError.message);
    }

    let questBadgeWasNew = false;
    if (!existingStudentQuestBadge) {
      const { error: studentQuestBadgeError } = await supabase.from("student_badges").insert({
        student_id: student.id,
        badge_id: questBadge.id,
        source_completion_id: activityCompletion.id,
      });

      if (studentQuestBadgeError) {
        throw new Error(studentQuestBadgeError.message);
      }

      questBadgeWasNew = true;
    }

    const { data: portfolioEntry, error: portfolioEntryError } = await supabase
      .from("portfolio_entries")
      .insert({
        household_id: household.householdId,
        student_id: student.id,
        completion_id: activityCompletion.id,
        source_field_quest_id: questRecord.id,
        title: completionTitle,
        entry_type: "field_quest",
        summary: buildFieldQuestEvidenceSummary(questRecord, checklistItems),
        parent_note: parsed.data.note.trim() || null,
        occurred_at: new Date().toISOString(),
        artifact_json: {
          source: "field_quest",
          questId: questRecord.id,
          questSlug: questRecord.slug,
          badgeName: questRecord.badge_name,
          subjectTags: questRecord.subject_tags,
          clueText: questRecord.clue_text,
          checklist: checklistItems,
          photoPath,
          photoUrl,
          photoAlt: `${questRecord.title} proof photo`,
          note: parsed.data.note.trim() || null,
          locationType: questRecord.location_type,
          exactLocation: questRecord.exact_location,
        },
      })
      .select("id")
      .single();

    if (portfolioEntryError) {
      throw new Error(portfolioEntryError.message);
    }
    createdPortfolioEntryId = portfolioEntry.id;

    await supabase.from("field_quest_events").insert({
      quest_id: questRecord.id,
      user_id: user.id,
      household_id: household.householdId,
      student_id: student.id,
      event_type: "completion",
      metadata_json: {
        studentName: student.name,
        badgeName: questRecord.badge_name,
      },
    });

    revalidatePath("/field-quests");
    revalidatePath(`/field-quests/${questRecord.slug}`);
    revalidatePath(`/students/${student.id}`);
    revalidatePath(`/portfolio/${student.id}`);
    revalidatePath("/dashboard");

    return NextResponse.json({
      alreadyExisted: false,
      completionId: savedQuestCompletion.id,
      updatedStudent: rewardSummary.updatedStudent,
      newBadges: questBadgeWasNew
        ? [...rewardSummary.newBadges, questBadge]
        : rewardSummary.newBadges,
      newAchievements: rewardSummary.newAchievements,
      badgeName: questRecord.badge_name,
      studentName: student.name,
    });
  } catch (error) {
    try {
      const supabase = await createClient();

      if (createdPortfolioEntryId) {
        await supabase.from("portfolio_entries").delete().eq("id", createdPortfolioEntryId);
      }

      if (createdActivityCompletionId) {
        if (rollbackStudentId) {
          await supabase
            .from("student_badges")
            .delete()
            .eq("student_id", rollbackStudentId)
            .eq("source_completion_id", createdActivityCompletionId);
        }

        if (rollbackStudentId && rollbackHouseholdId && rollbackNewAchievementIds.length) {
          await supabase
            .from("student_achievements")
            .delete()
            .eq("student_id", rollbackStudentId)
            .eq("household_id", rollbackHouseholdId)
            .in("achievement_id", rollbackNewAchievementIds);
        }

        await supabase.from("activity_completions").delete().eq("id", createdActivityCompletionId);

        if (rollbackStudentId && rollbackHouseholdId) {
          const { data: remainingCompletionRows } = await supabase
            .from("activity_completions")
            .select("activity_type")
            .eq("household_id", rollbackHouseholdId)
            .eq("student_id", rollbackStudentId);

          const remainingAdventureCount =
            remainingCompletionRows?.filter((item) => item.activity_type !== "in_person_class").length ?? 0;

          await supabase
            .from("students")
            .update({
              completed_adventures_count: remainingAdventureCount,
              current_rank: getRankForCompletedAdventures(remainingAdventureCount),
            })
            .eq("household_id", rollbackHouseholdId)
            .eq("id", rollbackStudentId);
        }
      }

      if (createdQuestCompletionId) {
        await supabase.from("field_quest_completions").delete().eq("id", createdQuestCompletionId);
      }

      if (rollbackInsertedBadgeCatalogId) {
        await supabase.from("badges").delete().eq("id", rollbackInsertedBadgeCatalogId);
      }

      if (uploadedImagePath) {
        await supabase.storage.from("leaf-photos").remove([uploadedImagePath]);
      }
    } catch {
      // Best-effort cleanup only.
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
