import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/ideas/[id] — Get single idea with creator
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Increment view count via RPC
    await supabase.rpc("increment_challenge_views", { p_challenge_id: id });

    const { data, error } = await supabase
      .from("challenges")
      .select("*, creator:users!challenges_creator_id_fkey(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Get comments for this idea
    const { data: comments } = await supabase
      .from("comments")
      .select("*, user:users!comments_user_id_fkey(*)")
      .eq("challenge_id", id)
      .order("created_at", { ascending: true });

    // Check if current user liked this idea
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let liked = false;
    if (user) {
      const { data: likeData } = await supabase
        .from("challenge_likes")
        .select("id")
        .eq("challenge_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      liked = !!likeData;
    }

    return NextResponse.json({ idea: data, comments: comments || [], liked });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/ideas/[id] — Delete idea (creator or admin)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { error } = await supabase.from("challenges").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
