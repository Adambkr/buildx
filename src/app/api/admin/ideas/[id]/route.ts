import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/admin/ideas/[id] — Delete an idea (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("admin_delete_challenge", {
      p_challenge_id: id,
    });

    if (error) {
      const status = error.message.includes("Admin") ? 403 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
