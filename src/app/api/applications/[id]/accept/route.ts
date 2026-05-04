import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/applications/[id]/accept — Accept an application (transactional)
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("accept_application", {
      p_application_id: id,
    });

    if (error) {
      const msg = error.message || "Failed to accept application";
      const status = msg.includes("Authentication")
        ? 401
        : msg.includes("creator")
        ? 403
        : msg.includes("full")
        ? 409
        : msg.includes("not pending")
        ? 409
        : 400;
      return NextResponse.json({ error: msg }, { status });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
