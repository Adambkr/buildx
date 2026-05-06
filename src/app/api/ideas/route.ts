import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/ideas — Create a new idea
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, difficulty, tags, required_skills, max_squad_size } = body;

    if (!title || title.length < 3) {
      return NextResponse.json({ error: "Title must be at least 3 characters" }, { status: 400 });
    }
    if (!description || description.length < 10) {
      return NextResponse.json({ error: "Description must be at least 10 characters" }, { status: 400 });
    }
    if (!max_squad_size || max_squad_size < 2 || max_squad_size > 10) {
      return NextResponse.json({ error: "max_squad_size must be between 2 and 10" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("challenges")
      .insert({
        title,
        description,
        creator_id: user.id,
        category: category || "Other",
        difficulty: difficulty || "intermediate",
        tags: tags || [],
        required_skills: required_skills || [],
        max_squad_size,
        current_members: 1,
        status: "open",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ idea: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/ideas — List ideas with optional filters
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "open";
    const limit = Math.min(Number(searchParams.get("limit") || 20), 50);
    const offset = Number(searchParams.get("offset") || 0);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const supabase = await createClient();

    let query = supabase
      .from("challenges")
      .select("*, creator:users!challenges_creator_id_fkey(*)", { count: "exact" });

    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (category) {
      query = query.eq("category", category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ideas: data, total: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
