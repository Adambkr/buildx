import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/admin/users/[id] — Delete a user (admin only)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("admin_delete_user", {
      p_user_id: id,
    });

    if (error) {
      const status = error.message.includes("Admin")
        ? 403
        : error.message.includes("yourself")
        ? 400
        : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
