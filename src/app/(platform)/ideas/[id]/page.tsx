"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Eye,
  Send,
  Check,
  X,
  Clock,
  Star,
  Zap,
  Bookmark,
  Rocket,
  Signal,
  Hash,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { SlotIndicator } from "@/components/ui/slot-indicator";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";
import { TeamBalanceIndicator } from "@/components/ideas/team-balance-indicator";
import type { Idea, Comment, IdeaApplication, IdeaRole, TeamBalanceScore } from "@/lib/types";

const demoRoles: IdeaRole[] = [
  { id: "r1", challenge_id: "1", role_name: "Frontend Developer", required_count: 2, current_count: 1, priority: "critical", created_at: "" },
  { id: "r2", challenge_id: "1", role_name: "Backend Developer", required_count: 1, current_count: 0, priority: "critical", created_at: "" },
  { id: "r3", challenge_id: "1", role_name: "UI/UX Designer", required_count: 1, current_count: 1, priority: "medium", created_at: "" },
  { id: "r4", challenge_id: "1", role_name: "ML Engineer", required_count: 1, current_count: 0, priority: "medium", created_at: "" },
];

// Demo idea for when Supabase isn't connected
const demoIdea: Idea = {
  id: "1",
  creator_id: "demo-1",
  title: "AI-Powered Study Companion",
  description:
    "We're building an intelligent study app that uses AI to create personalized learning paths, generate flashcards from notes, and adapt to each student's learning pace.\n\nThe app will feature:\n- Smart note summarization\n- Adaptive quizzes that focus on weak areas\n- Collaboration tools for study groups\n- Progress analytics and insights\n\nWe need passionate people who care about education and want to make learning more accessible.",
  category: "Education",
  difficulty: "intermediate",
  tags: ["ai", "education", "study"],
  required_skills: ["React", "Python", "Machine Learning", "UI/UX", "Node.js"],
  duration: "2_weeks",
  xp_reward: 500,
  badge_reward: "AI Architect",
  max_squad_size: 8,
  current_members: 5,
  status: "open",
  likes_count: 124,
  comments_count: 18,
  applications_count: 12,
  views_count: 890,
  created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  creator: {
    id: "demo-1",
    email: "sarah@example.com",
    username: "sarahkim",
    avatar_url: null,
    bio: "Full-stack developer passionate about EdTech",
    skills: ["React", "Python", "TensorFlow"],
    role: "user",
    reputation_score: 85,
    xp: 1020,
    level: 5,
    created_at: "",
  },
};

const demoComments: Comment[] = [
  {
    id: "c1",
    post_id: null,
    challenge_id: "1",
    user_id: "demo-2",
    content: "Love this idea! The adaptive quiz feature sounds really promising.",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    user: {
      id: "demo-2",
      email: "james@example.com",
      username: "jamesliu",
      avatar_url: null,
      bio: null,
      skills: [],
      role: "user",
      reputation_score: 72,
      xp: 864,
      level: 4,
      created_at: "",
    },
  },
  {
    id: "c2",
    post_id: null,
    challenge_id: "1",
    user_id: "demo-3",
    content:
      "I have experience with spaced repetition algorithms. Would love to contribute!",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    user: {
      id: "demo-3",
      email: "priya@example.com",
      username: "priyapatel",
      avatar_url: null,
      bio: null,
      skills: [],
      role: "user",
      reputation_score: 67,
      xp: 804,
      level: 4,
      created_at: "",
    },
  },
];

export default function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [ideaLoading, setIdeaLoading] = useState(true);
  const [ideaNotFound, setIdeaNotFound] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [applications, setApplications] = useState<IdeaApplication[]>([]);
  const [roles, setRoles] = useState<IdeaRole[]>([]);
  const [balance, setBalance] = useState<TeamBalanceScore | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [startingProject, setStartingProject] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    const fetchIdea = async () => {
      setIdeaLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("challenges")
          .select("*, creator:users!challenges_creator_id_fkey(*)")
          .eq("id", id)
          .single();

        if (error || !data) { setIdeaNotFound(true); return; }
        setIdea(data);

        // Increment view count (fire-and-forget)
        supabase.rpc("increment_challenge_views", { p_challenge_id: id }).then(() => {});

        const { data: commentsData } = await supabase
          .from("comments")
          .select("*, user:users!comments_user_id_fkey(*)")
          .eq("challenge_id", id)
          .order("created_at", { ascending: true });

        if (commentsData) setComments(commentsData);

        const { data: rolesData } = await supabase
          .from("challenge_roles")
          .select("*")
          .eq("challenge_id", id)
          .order("priority", { ascending: true });
        if (rolesData) setRoles(rolesData);

        const { data: balanceData } = await supabase.rpc("get_team_balance_score", { p_challenge_id: id });
        if (balanceData) setBalance(balanceData as TeamBalanceScore);

        if (user) {
          const [appsRes, likeRes, bookmarkRes] = await Promise.all([
            supabase
              .from("challenge_applications")
              .select("*, user:users!challenge_applications_user_id_fkey(*)")
              .eq("challenge_id", id)
              .order("match_score", { ascending: false }),
            supabase
              .from("challenge_likes")
              .select("id")
              .eq("challenge_id", id)
              .eq("user_id", user.id)
              .maybeSingle(),
            supabase
              .from("bookmarks")
              .select("id")
              .eq("challenge_id", id)
              .eq("user_id", user.id)
              .maybeSingle(),
          ]);
          if (appsRes.data) setApplications(appsRes.data);
          if (likeRes.data) setLiked(true);
          if (bookmarkRes.data) setBookmarked(true);
        }
      } catch {
        setIdeaNotFound(true);
      } finally {
        setIdeaLoading(false);
      }
    };

    fetchIdea();
  }, [id, user]);

  const handleBookmark = async () => {
    if (!user) return;
    const newState = !bookmarked;
    setBookmarked(newState);
    try {
      const supabase = createClient();
      await supabase.rpc("toggle_bookmark", { p_challenge_id: id });
    } catch {
      setBookmarked(!newState);
    }
  };

  const handleStartProject = async () => {
    if (!user || !idea) return;
    setStartingProject(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("start_run_early", { p_challenge_id: idea.id });
      if (error) throw error;
      if (data?.run_id) {
        router.push(`/projects/${data.run_id}`);
      }
    } catch (err: any) {
      alert(err?.message || "Failed to start project");
    } finally {
      setStartingProject(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    if (idea) {
      setIdea({
        ...idea,
        likes_count: newLiked ? idea.likes_count + 1 : idea.likes_count - 1,
      });
    }
    try {
      const supabase = createClient();
      await supabase.rpc("toggle_challenge_like", { p_challenge_id: id });
    } catch {
      // Revert on failure
      setLiked(!newLiked);
      if (idea) {
        setIdea({
          ...idea,
          likes_count: newLiked ? idea.likes_count : idea.likes_count + 1,
        });
      }
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: crypto.randomUUID(),
      post_id: null,
      challenge_id: id,
      user_id: user.id,
      content: newComment,
      created_at: new Date().toISOString(),
      user,
    };

    setComments([...comments, comment]);
    setNewComment("");

    try {
      const supabase = createClient();
      await supabase.rpc("add_comment", {
        p_content: newComment,
        p_challenge_id: id,
      });
    } catch {
      // Comment added optimistically
    }
  };

  const handleApply = async () => {
    if (!user || !idea) return;
    setApplyLoading(true);
    setApplyError("");

    try {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("apply_to_challenge", {
        p_challenge_id: idea.id,
        p_message: applyMessage,
        p_role_id: selectedRoleId ?? null,
      });
      if (rpcError) throw rpcError;
      // Optimistically mark as applied
      setApplications((prev) => [...prev, {
        id: crypto.randomUUID(),
        challenge_id: idea.id,
        user_id: user.id,
        role_id: selectedRoleId,
        role_name: null,
        message: applyMessage,
        match_score: 0,
        status: "pending",
        created_at: new Date().toISOString(),
        user,
      }]);
      setShowApplyModal(false);
      setApplyMessage("");
      setSelectedRoleId(null);
    } catch (err: any) {
      setApplyError(err?.message || "Failed to submit application. Please try again.");
    } finally {
      setApplyLoading(false);
    }
  };

  const handleApplicationAction = async (
    appId: string,
    action: "accepted" | "rejected"
  ) => {
    setApplications(
      applications.map((app) =>
        app.id === appId ? { ...app, status: action } : app
      )
    );

    try {
      const supabase = createClient();
      if (action === "accepted") {
        const { data } = await supabase.rpc("accept_application", {
          p_application_id: appId,
        });
        if (idea) {
          const newCount = idea.current_members + 1;
          setIdea({ ...idea, current_members: newCount, status: newCount >= idea.max_squad_size ? "full" : idea.status });
        }
        if (data?.project_created) {
          router.push(`/projects/${data.project_id}`);
        }
      } else {
        await supabase.rpc("reject_application", {
          p_application_id: appId,
        });
      }
    } catch {
      // Handled gracefully
    }
  };

  if (ideaLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-2 border-[#FF3366]/30 border-t-[#FF3366] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64748B] text-sm">Loading challenge…</p>
      </div>
    );
  }

  if (ideaNotFound || !idea) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 glass-dark rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
          <Rocket className="w-8 h-8 text-[#64748B]" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Challenge not found</h2>
        <p className="text-[#64748B] text-sm mb-6">This challenge may have been removed or doesn&apos;t exist.</p>
        <Link href="/ideas" className="text-sm font-bold text-[#FF3366] hover:underline">← Back to Challenges</Link>
      </div>
    );
  }

  const isCreator = user?.id === idea.creator_id;
  const alreadyApplied = applications.some((a) => a.user_id === user?.id);
  const fillPct = Math.round((idea.current_members / (idea.max_squad_size || 1)) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/ideas" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-5 sm:mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />Back to Challenges
        </Link>

        {/* Main Card */}
        <div className="glass-dark rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF3366] via-[#FF6B9D] to-[#A855F7]" />

          {/* Header */}
          <div className="p-6 sm:p-8 pb-0">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <Avatar src={idea.creator?.avatar_url} name={idea.creator?.username || "User"} size="lg" />
                <div>
                  <p className="font-bold text-white">{idea.creator?.username}</p>
                  <p className="text-sm text-[#64748B]" suppressHydrationWarning>
                    {timeAgo(idea.created_at)}
                    {idea.category && <> · <span className="text-[#94A3B8]">{idea.category}</span></>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                  idea.status === "open" ? "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20" :
                  idea.status === "in_progress" ? "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20" :
                  idea.status === "full" ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20" :
                  "bg-white/[0.03] text-[#64748B] border-white/[0.06]"
                }`}>{idea.status === "in_progress" ? "In Progress" : idea.status}</span>
                {user && (
                  <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={handleBookmark}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      bookmarked ? "bg-[#FFD700]/10 text-[#FFD700]" : "bg-white/[0.03] text-[#64748B] hover:text-[#FFD700]"
                    }`}
                    title={bookmarked ? "Remove bookmark" : "Bookmark"}
                  >
                    <Bookmark className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} />
                  </motion.button>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight leading-tight">
              {idea.title}
            </h1>

            {/* Difficulty + Tags + XP */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {idea.difficulty && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  idea.difficulty === "advanced" ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20" :
                  idea.difficulty === "intermediate" ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20" :
                  "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20"
                }`}>
                  <Signal className="w-3 h-3" />{idea.difficulty}
                </span>
              )}
              {idea.tags?.map((tag) => (
                <span key={tag} className="flex items-center gap-0.5 text-xs font-medium px-2 py-1 bg-white/[0.03] text-[#64748B] rounded-full border border-white/[0.06]">
                  <Hash className="w-3 h-3" />{tag}
                </span>
              ))}
              {idea.xp_reward !== undefined && idea.xp_reward > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 bg-[#FFD700]/10 text-[#FFD700] rounded-full border border-[#FFD700]/20 ml-auto">
                  <Star className="w-3 h-3" />{idea.xp_reward} XP
                </span>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {idea.description.split("\n").filter(l => l.trim()).map((line, i) => (
                <p key={i} className="text-[#94A3B8] leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Skills */}
            {idea.required_skills && idea.required_skills.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2.5">Required Skills</p>
                <div className="flex flex-wrap gap-2">
                  {idea.required_skills.map((skill) => (
                    <span key={skill} className="text-xs font-medium px-3 py-1.5 bg-white/[0.03] text-[#94A3B8] rounded-xl border border-white/[0.06]">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Team Roles */}
            {roles.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#FF3366]" />Team Roles
                </p>
                <TeamBalanceIndicator roles={roles} balance={balance} />
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="px-5 sm:px-8 py-3.5 bg-white/[0.02] border-t border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-5">
              <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                  liked ? "text-[#FF3366]" : "text-[#64748B] hover:text-[#FF3366]"
                }`}
              >
                <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} />{idea.likes_count}
              </motion.button>
              <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
                <MessageCircle className="w-4 h-4" />{comments.length}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
                <Eye className="w-4 h-4" />{idea.views_count}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-white">{idea.current_members}/{idea.max_squad_size}</span>
              <div className="w-20 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${fillPct >= 80 ? "from-[#FF3366] to-[#FF6B9D]" : "from-[#00E5FF] to-[#00B4D8]"}`}
                  style={{width:`${fillPct}%`}} />
              </div>
              <span className="text-xs text-[#64748B]">squad</span>
            </div>
          </div>

          {/* Apply / Manage */}
          <div className="px-6 sm:px-8 py-5 border-b border-white/[0.06]">
            {isCreator ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    Applications
                    <span className="text-xs font-bold px-2 py-0.5 bg-[#FF3366]/10 text-[#FF3366] rounded-full border border-[#FF3366]/20">
                      {applications.filter((a) => a.status === "pending").length} pending
                    </span>
                  </h3>
                  {idea.current_members >= 2 && idea.status === "open" && (
                    <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}} onClick={handleStartProject} disabled={startingProject}
                      className="flex items-center gap-1.5 bg-gradient-hero text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-[#FF3366]/20 cursor-pointer disabled:opacity-50"
                    >
                      <Rocket className="w-4 h-4" />{startingProject ? "Starting…" : "Launch Run"}
                    </motion.button>
                  )}
                </div>
                {applications.length === 0 ? (
                  <p className="text-sm text-[#64748B]">No applications yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {[...applications].sort((a, b) => b.match_score - a.match_score).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar src={app.user?.avatar_url} name={app.user?.username || "User"} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-white">{app.user?.username}</p>
                              {app.role_name && (
                                <span className="text-xs bg-[#FF3366]/10 text-[#FF3366] px-2 py-0.5 rounded-full font-semibold border border-[#FF3366]/20">{app.role_name}</span>
                              )}
                              <span className={`flex items-center gap-0.5 text-xs font-bold ${
                                app.match_score >= 70 ? "text-[#00FFA3]" : app.match_score >= 40 ? "text-[#FFD700]" : "text-[#64748B]"
                              }`}><Star className="w-3 h-3" />{app.match_score}%</span>
                            </div>
                            <p className="text-xs text-[#64748B] truncate mt-0.5">{app.message}</p>
                          </div>
                        </div>
                        {app.status === "pending" ? (
                          <div className="flex gap-1.5 flex-shrink-0">
                            <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={() => handleApplicationAction(app.id, "accepted")}
                              className="p-2 bg-[#00FFA3]/10 text-[#00FFA3] rounded-xl hover:bg-[#00FFA3]/20 transition-colors cursor-pointer border border-[#00FFA3]/20"
                            ><Check className="w-4 h-4" /></motion.button>
                            <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={() => handleApplicationAction(app.id, "rejected")}
                              className="p-2 bg-[#FF3366]/10 text-[#FF3366] rounded-xl hover:bg-[#FF3366]/20 transition-colors cursor-pointer border border-[#FF3366]/20"
                            ><X className="w-4 h-4" /></motion.button>
                          </div>
                        ) : (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            app.status === "accepted" ? "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20" : "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20"
                          }`}>{app.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : idea.status === "open" || idea.status === "in_progress" ? (
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-white">{idea.max_squad_size - idea.current_members} slots remaining</p>
                  <p className="text-sm text-[#64748B]">Apply to join this squad</p>
                </div>
                {!user ? (
                  <Link href={`/login?next=/ideas/${id}`}>
                    <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                      className="bg-gradient-hero text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#FF3366]/20 cursor-pointer"
                    >Sign in to Apply</motion.button>
                  </Link>
                ) : alreadyApplied ? (
                  <span className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-[#FFD700]/10 text-[#FFD700] rounded-xl border border-[#FFD700]/20">
                    <Clock className="w-4 h-4" />Applied
                  </span>
                ) : (
                  <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}} onClick={() => setShowApplyModal(true)}
                    className="bg-gradient-hero text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#FF3366]/20 cursor-pointer"
                  >Apply to Join</motion.button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#64748B] text-center py-2">This challenge is no longer accepting applications.</p>
            )}
          </div>

          {/* Comments */}
          <div className="p-6 sm:p-8">
            <h3 className="font-bold text-white mb-5 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#FF3366]" />Discussion <span className="text-[#64748B] font-normal text-sm">({comments.length})</span>
            </h3>
            <div className="space-y-3 mb-5">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar src={comment.user?.avatar_url} name={comment.user?.username || "User"} size="sm" />
                  <div className="flex-1 bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-white">{comment.user?.username}</span>
                      <span className="text-xs text-[#64748B]" suppressHydrationWarning>{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-[#64748B] text-center py-6">No comments yet. Start the discussion!</p>
              )}
            </div>

            {user ? (
              <div className="relative">
                <input type="text" placeholder="Add a comment…" value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
                  className="w-full h-12 pl-4 pr-14 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/30 focus:ring-1 focus:ring-[#FF3366]/10 transition-all text-sm"
                />
                <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={handleComment}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-hero text-white rounded-lg cursor-pointer"
                ><Send className="w-4 h-4" /></motion.button>
              </div>
            ) : (
              <Link href={`/login?next=/ideas/${id}`}
                className="flex items-center justify-center gap-2 h-12 rounded-xl border border-white/[0.06] bg-white/[0.02] text-sm text-[#64748B] hover:border-[#FF3366]/30 hover:text-[#FF3366] transition-all"
              >
                <Send className="w-4 h-4" />Sign in to comment
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Apply Modal */}
      <Modal isOpen={showApplyModal} onClose={() => setShowApplyModal(false)} title="Apply to Join">
        <div className="space-y-4">
          {roles.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-[#94A3B8] mb-2">Which role are you applying for?</label>
              <div className="space-y-2">
                {roles.filter((r) => r.current_count < r.required_count).map((role) => (
                  <button key={role.id} type="button" onClick={() => setSelectedRoleId(role.id === selectedRoleId ? null : role.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedRoleId === role.id ? "border-[#FF3366]/40 bg-[#FF3366]/5" : "border-white/[0.06] hover:border-[#FF3366]/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{role.role_name}</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                        role.priority === "critical" ? "bg-[#FF3366]/10 text-[#FF3366]" : "bg-[#FFD700]/10 text-[#FFD700]"
                      }`}>{role.priority}</span>
                    </div>
                    <span className="text-xs text-[#64748B]">{role.required_count - role.current_count} left</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {applyError && (
            <div className="flex items-center gap-2 p-3 bg-[#FF3366]/10 border border-[#FF3366]/20 rounded-xl text-sm text-[#FF3366] font-medium">
              <X className="w-4 h-4 flex-shrink-0" />{applyError}
            </div>
          )}
          <p className="text-sm text-[#64748B]">Tell the squad why you&apos;d be a great addition.</p>
          <textarea
            placeholder="Share your skills, experience, and what excites you about this challenge..."
            value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} rows={4}
            className="w-full px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/30 transition-all resize-none text-sm"
          />
          <Button onClick={handleApply} loading={applyLoading} className="w-full">Send Application</Button>
        </div>
      </Modal>
    </div>
  );
}
