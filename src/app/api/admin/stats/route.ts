import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/stats — Get platform statistics (admin only)
export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("admin_get_stats");

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
