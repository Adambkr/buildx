import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/ideas/ranked — Smart-ranked idea feed
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feed = searchParams.get("feed") || "trending";
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

  const supabase = await createClient();

  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("*, creator:users!ideas_creator_id_fkey(*)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!ideas || ideas.length === 0) {
    return NextResponse.json({ ideas: [] });
  }

  // Get current user for personalized scoring
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userSkills: string[] = [];
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("skills")
      .eq("id", user.id)
      .single();
    userSkills = Array.isArray(profile?.skills) ? profile.skills : [];
  }

  // Calculate smart ranking scores
  const scored = ideas.map((idea) => {
    const reqSkills: string[] = Array.isArray(idea.required_skills) ? idea.required_skills : [];

    // Engagement score (0-100)
    const engagement = Math.min(
      100,
      (idea.likes_count * 3 + idea.comments_count * 2 + idea.views_count * 0.1) / 5
    );

    // Recency score (0-100) — decays over 48 hours
    const hoursAgo =
      (Date.now() - new Date(idea.created_at).getTime()) / (1000 * 60 * 60);
    const recency = Math.max(0, 100 - hoursAgo * (100 / 48));

    // Urgency score (0-100) — higher when almost full
    const urgency =
      idea.max_members > 0
        ? (idea.current_members / idea.max_members) * 100
        : 0;

    // Skill match score (0-100)
    let matchScore = 50;
    if (userSkills.length > 0 && reqSkills.length > 0) {
      const overlap = reqSkills.filter((s: string) =>
        userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
      ).length;
      matchScore = Math.min(100, (overlap / reqSkills.length) * 100);
    }

    // Creator reputation (0-100)
    const reputation = Math.min(100, idea.creator?.reputation_score || 50);

    // Weighted formula:
    // engagement(35%) + recency(20%) + urgency(20%) + match(15%) + reputation(10%)
    const score =
      engagement * 0.35 +
      recency * 0.2 +
      urgency * 0.2 +
      matchScore * 0.15 +
      reputation * 0.1;

    return { ...idea, _score: Math.round(score * 100) / 100 };
  });

  // Sort based on feed type
  let sorted;
  switch (feed) {
    case "trending":
      sorted = scored.sort((a, b) => b._score - a._score);
      break;
    case "new":
      sorted = scored.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
    case "almost-full":
      sorted = scored.sort(
        (a, b) =>
          b.current_members / b.max_members -
          a.current_members / a.max_members
      );
      break;
    case "for-you":
      sorted = scored
        .map((idea) => {
          const reqSkills: string[] = Array.isArray(idea.required_skills) ? idea.required_skills : [];
          const skillBoost =
            userSkills.length > 0
              ? reqSkills.filter((s: string) =>
                  userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
                ).length * 20
              : 0;
          return { ...idea, _score: idea._score + skillBoost };
        })
        .sort((a, b) => b._score - a._score);
      break;
    default:
      sorted = scored.sort((a, b) => b._score - a._score);
  }

  return NextResponse.json({ ideas: sorted });
}
