import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { ResponseInputMessageContentList } from "openai/resources/responses/responses";
import { z } from "zod";
import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const formSchema = z.object({
  leafShape: z.string().min(1),
  leafEdge: z.string().min(1),
  leafArrangement: z.string().min(1),
  notes: z.string().optional()
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(_cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {}
        }
      }
    );

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const parsed = formSchema.safeParse({
      leafShape: formData.get("leafShape"),
      leafEdge: formData.get("leafEdge"),
      leafArrangement: formData.get("leafArrangement"),
      notes: formData.get("notes")
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tree identification request." }, { status: 400 });
    }

    const leafPhoto = formData.get("leafPhoto");
    let uploadedPath: string | null = null;
    let photoDataUrl = "";

    if (leafPhoto instanceof File && leafPhoto.size > 0) {
      const bytes = Buffer.from(await leafPhoto.arrayBuffer());
      uploadedPath = `${user.id}/${Date.now()}-${leafPhoto.name}`;
      const { error: uploadError } = await supabase.storage.from("leaf-photos").upload(uploadedPath, bytes, {
        contentType: leafPhoto.type,
        upsert: false
      });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      photoDataUrl = `data:${leafPhoto.type};base64,${bytes.toString("base64")}`;
    }

    const prompt = [
      "You are a field naturalist helping identify a tree species from leaf observations in Southern Maryland.",
      "Return strict JSON with keys: species_name, confidence, rationale, suggested_next_observation.",
      `Leaf shape: ${parsed.data.leafShape}`,
      `Leaf edge: ${parsed.data.leafEdge}`,
      `Leaf arrangement: ${parsed.data.leafArrangement}`,
      `Field notes: ${parsed.data.notes || "None"}`
    ].join("\n");

    const content: ResponseInputMessageContentList = [
      { type: "input_text", text: prompt }
    ];

    if (photoDataUrl) {
      content.push({ type: "input_image", image_url: photoDataUrl, detail: "auto" });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.responses.create({
      model: process.env.OPENAI_TREE_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "tree_identification",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              species_name: { type: "string" },
              confidence: { type: "number" },
              rationale: { type: "string" },
              suggested_next_observation: { type: "string" }
            },
            required: ["species_name", "confidence", "rationale", "suggested_next_observation"]
          }
        }
      }
    });

    const parsedOutput = JSON.parse(response.output_text) as {
      species_name: string;
      confidence: number;
      rationale: string;
      suggested_next_observation: string;
    };

    const { data: inserted, error: insertError } = await supabase
      .from("tree_identifications")
      .insert({
        user_id: user.id,
        species_name: parsedOutput.species_name,
        confidence: parsedOutput.confidence,
        notes: `${parsedOutput.rationale} Next check: ${parsedOutput.suggested_next_observation}`,
        image_path: uploadedPath
      })
      .select("id, species_name, confidence, notes, created_at, image_path")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const publicUrl = uploadedPath
      ? (await supabase.storage.from("leaf-photos").createSignedUrl(uploadedPath, 3600)).data?.signedUrl
      : undefined;

    return NextResponse.json({
      identification: {
        ...inserted,
        public_url: publicUrl
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
