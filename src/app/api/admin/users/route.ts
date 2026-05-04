import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/users — Get all users (admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 100), 500);
    const offset = Number(searchParams.get("offset") || 0);

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("admin_get_users", {
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      const status = error.message.includes("Admin") ? 403 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ users: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
