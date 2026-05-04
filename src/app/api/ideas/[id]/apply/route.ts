import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/ideas/[id]/apply — Apply to join an idea
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data, error } = await supabase.rpc("apply_to_idea", {
      p_idea_id: id,
      p_message: body.message || "",
      p_role_id: body.role_id ?? null,
    });

    if (error) {
      // Parse the error message from the RPC function
      const msg = error.message || "Failed to apply";
      const status = msg.includes("already applied")
        ? 409
        : msg.includes("not accepting")
        ? 403
        : msg.includes("own idea")
        ? 403
        : msg.includes("Authentication")
        ? 401
        : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
