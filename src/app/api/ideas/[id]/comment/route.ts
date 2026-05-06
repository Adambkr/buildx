import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/ideas/[id]/comment — Add comment to an idea
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    if (!body.content || body.content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("add_comment", {
      p_content: body.content.trim(),
      p_challenge_id: id,
    });

    if (error) {
      const msg = error.message || "Failed to add comment";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json({ id: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/ideas/[id]/comment — List comments for an idea
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("comments")
      .select("*, user:users!comments_user_id_fkey(*)")
      .eq("challenge_id", id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
