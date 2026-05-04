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
  { id: "r1", idea_id: "1", role_name: "Frontend Developer", required_count: 2, current_count: 1, priority: "critical", created_at: "" },
  { id: "r2", idea_id: "1", role_name: "Backend Developer", required_count: 1, current_count: 0, priority: "critical", created_at: "" },
  { id: "r3", idea_id: "1", role_name: "UI/UX Designer", required_count: 1, current_count: 1, priority: "medium", created_at: "" },
  { id: "r4", idea_id: "1", role_name: "ML Engineer", required_count: 1, current_count: 0, priority: "medium", created_at: "" },
];

// Demo idea for when Supabase isn't connected
const demoIdea: Idea = {
  id: "1",
  creator_id: "demo-1",
  title: "AI-Powered Study Companion",
  description:
    "We're building an intelligent study app that uses AI to create personalized learning paths, generate flashcards from notes, and adapt to each student's learning pace.\n\nThe app will feature:\n- Smart note summarization\n- Adaptive quizzes that focus on weak areas\n- Collaboration tools for study groups\n- Progress analytics and insights\n\nWe need passionate people who care about education and want to make learning more accessible.",
  category: "Education",
  required_skills: ["React", "Python", "Machine Learning", "UI/UX", "Node.js"],
  max_members: 8,
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
    created_at: "",
  },
};

const demoComments: Comment[] = [
  {
    id: "c1",
    post_id: null,
    idea_id: "1",
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
      created_at: "",
    },
  },
  {
    id: "c2",
    post_id: null,
    idea_id: "1",
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
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState("");

  useEffect(() => {
    const fetchIdea = async () => {
      setIdeaLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("ideas")
          .select("*, creator:users!ideas_creator_id_fkey(*)")
          .eq("id", id)
          .single();

        if (error || !data) { setIdeaNotFound(true); return; }
        setIdea(data);

        // Increment view count (fire-and-forget)
        supabase.rpc("increment_idea_views", { p_idea_id: id }).then(() => {});

        const { data: commentsData } = await supabase
          .from("comments")
          .select("*, user:users!comments_user_id_fkey(*)")
          .eq("idea_id", id)
          .order("created_at", { ascending: true });

        if (commentsData) setComments(commentsData);

        const { data: rolesData } = await supabase
          .from("idea_roles")
          .select("*")
          .eq("idea_id", id)
          .order("priority", { ascending: true });
        if (rolesData) setRoles(rolesData);

        const { data: balanceData } = await supabase.rpc("get_team_balance_score", { p_idea_id: id });
        if (balanceData) setBalance(balanceData as TeamBalanceScore);

        if (user) {
          const { data: appsData } = await supabase
            .from("idea_applications")
            .select("*, user:users!idea_applications_user_id_fkey(*)")
            .eq("idea_id", id)
            .order("match_score", { ascending: false });
          if (appsData) setApplications(appsData);

          // Check if user already liked this idea
          const { data: likeData } = await supabase
            .from("idea_likes")
            .select("id")
            .eq("idea_id", id)
            .eq("user_id", user.id)
            .maybeSingle();
          if (likeData) setLiked(true);
        }
      } catch {
        setIdeaNotFound(true);
      } finally {
        setIdeaLoading(false);
      }
    };

    fetchIdea();
  }, [id, user]);

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
      await supabase.rpc("toggle_idea_like", { p_idea_id: id });
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
      idea_id: id,
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
        p_idea_id: id,
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
      const { error: rpcError } = await supabase.rpc("apply_to_idea", {
        p_idea_id: idea.id,
        p_message: applyMessage,
        p_role_id: selectedRoleId ?? null,
      });
      if (rpcError) throw rpcError;
      // Optimistically mark as applied
      setApplications((prev) => [...prev, {
        id: crypto.randomUUID(),
        idea_id: idea.id,
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
          setIdea({ ...idea, current_members: newCount, status: newCount >= idea.max_members ? "full" : idea.status });
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
        <div className="w-10 h-10 border-2 border-[#FF2D2D]/30 border-t-[#FF2D2D] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#9CA3AF] text-sm">Loading idea…</p>
      </div>
    );
  }

  if (ideaNotFound || !idea) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-2xl mb-2">🔍</p>
        <h2 className="text-lg font-bold text-[#0A0A0F] mb-2">Idea not found</h2>
        <p className="text-[#9CA3AF] text-sm mb-6">This idea may have been removed or doesn&apos;t exist.</p>
        <Link href="/ideas" className="text-sm font-bold text-[#FF2D2D] hover:underline">← Back to Ideas</Link>
      </div>
    );
  }

  const isCreator = user?.id === idea.creator_id;
  const alreadyApplied = applications.some((a) => a.user_id === user?.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/ideas" className="inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#0A0A0F] transition-colors mb-5 sm:mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Ideas
        </Link>

        {/* Main Card */}
        <div className="glass-strong rounded-3xl border border-white/80 overflow-hidden" style={{boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
          {/* Category top bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF2D2D] via-[#FF6B6B] to-[#FF9A3C]" />

          {/* Header */}
          <div className="p-6 sm:p-8 pb-0">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <Avatar src={idea.creator?.avatar_url} name={idea.creator?.username || "User"} size="lg" />
                <div>
                  <p className="font-bold text-[#0A0A0F]">{idea.creator?.username}</p>
                  <p className="text-sm text-[#9CA3AF]" suppressHydrationWarning>
                    {timeAgo(idea.created_at)}
                    {idea.category && <> · <span className="text-[#6B7280]">{idea.category}</span></>}
                  </p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                idea.status === "open" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                idea.status === "full" ? "bg-orange-50 text-orange-600 border-orange-100" :
                "bg-gray-100 text-gray-500 border-gray-200"
              }`}>{idea.status}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#0A0A0F] mb-4 tracking-tight leading-tight">
              {idea.title}
            </h1>

            <div className="space-y-3 mb-6">
              {idea.description.split("\n").filter(l => l.trim()).map((line, i) => (
                <p key={i} className="text-[#374151] leading-relaxed">{line}</p>
              ))}
            </div>

            {/* Team Roles */}
            {roles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-bold text-[#0A0A0F] mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FF2D2D]" />Team Roles
                </h3>
                <TeamBalanceIndicator roles={roles} balance={balance} />
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="px-4 sm:px-8 py-3 bg-black/[0.02] border-t border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-5">
              <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer ${
                  liked ? "text-[#FF2D2D]" : "text-[#9CA3AF] hover:text-[#FF2D2D]"
                }`}
              >
                <Heart className="w-4 h-4" fill={liked ? "#FF2D2D" : "none"} />
                {idea.likes_count}
              </motion.button>
              <span className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
                <MessageCircle className="w-4 h-4" />{comments.length}
              </span>
              <span className="flex items-center gap-1.5 text-sm text-[#9CA3AF]">
                <Eye className="w-4 h-4" />{idea.views_count}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#374151]">{idea.current_members}/{idea.max_members} members</span>
              <div className="w-16 h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${
                  idea.current_members / idea.max_members >= 0.8 ? "from-orange-400 to-red-500" : "from-emerald-400 to-teal-500"
                }`} style={{width:`${Math.round(idea.current_members/idea.max_members*100)}%`}} />
              </div>
            </div>
          </div>

          {/* Apply / Manage */}
          <div className="px-6 sm:px-8 py-5 border-b border-black/[0.06]">
            {isCreator ? (
              <div>
                <h3 className="font-bold text-[#0A0A0F] mb-4 flex items-center gap-2">
                  Applications
                  <span className="text-xs font-semibold px-2 py-0.5 bg-[#FFF0F0] text-[#FF2D2D] rounded-full border border-red-100">
                    {applications.filter((a) => a.status === "pending").length} pending
                  </span>
                </h3>
                {applications.length === 0 ? (
                  <p className="text-sm text-[#9CA3AF]">No applications yet.</p>
                ) : (
                  <div className="space-y-2.5">
                    {[...applications].sort((a, b) => b.match_score - a.match_score).map((app) => (
                      <div key={app.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar src={app.user?.avatar_url} name={app.user?.username || "User"} size="sm" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-[#0A0A0F]">{app.user?.username}</p>
                              {app.role_name && (
                                <span className="text-xs bg-[#FFF0F0] text-[#FF2D2D] px-2 py-0.5 rounded-full font-semibold border border-red-100">{app.role_name}</span>
                              )}
                              <span className={`flex items-center gap-0.5 text-xs font-bold ${
                                app.match_score >= 70 ? "text-emerald-500" :
                                app.match_score >= 40 ? "text-amber-500" : "text-[#9CA3AF]"
                              }`}><Star className="w-3 h-3" />{app.match_score}%</span>
                            </div>
                            <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{app.message}</p>
                          </div>
                        </div>
                        {app.status === "pending" ? (
                          <div className="flex gap-1.5 flex-shrink-0">
                            <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                              onClick={() => handleApplicationAction(app.id, "accepted")}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-100"
                            ><Check className="w-4 h-4" /></motion.button>
                            <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                              onClick={() => handleApplicationAction(app.id, "rejected")}
                              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors cursor-pointer border border-red-100"
                            ><X className="w-4 h-4" /></motion.button>
                          </div>
                        ) : (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            app.status === "accepted" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                          }`}>{app.status}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : idea.status === "open" ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0A0A0F]">{idea.max_members - idea.current_members} slots remaining</p>
                  <p className="text-sm text-[#9CA3AF]">Apply to join this team</p>
                </div>
                {!user ? (
                  <Link href={`/login?next=/ideas/${id}`}>
                    <motion.button whileHover={{scale:1.04,boxShadow:"0 6px 20px rgba(255,45,45,0.25)"}} whileTap={{scale:0.97}}
                      className="gradient-bg text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-red-200/40 cursor-pointer"
                    >Sign in to Apply</motion.button>
                  </Link>
                ) : alreadyApplied ? (
                  <span className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                    <Clock className="w-4 h-4" />Applied
                  </span>
                ) : (
                  <motion.button whileHover={{scale:1.04,boxShadow:"0 6px 20px rgba(255,45,45,0.25)"}} whileTap={{scale:0.97}}
                    onClick={() => setShowApplyModal(true)}
                    className="gradient-bg text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-red-200/40 cursor-pointer"
                  >Apply to Join</motion.button>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF] text-center py-2">This idea is no longer accepting applications.</p>
            )}
          </div>

          {/* Comments */}
          <div className="p-6 sm:p-8">
            <h3 className="font-bold text-[#0A0A0F] mb-5">Discussion ({comments.length})</h3>
            <div className="space-y-3 mb-5">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar src={comment.user?.avatar_url} name={comment.user?.username || "User"} size="sm" />
                  <div className="flex-1 bg-black/[0.02] rounded-2xl p-4 border border-black/[0.05]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-bold text-[#0A0A0F]">{comment.user?.username}</span>
                      <span className="text-xs text-[#9CA3AF]" suppressHydrationWarning>{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* New Comment */}
            {user ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add a comment…"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleComment(); }}
                  className="w-full h-12 pl-4 pr-14 rounded-2xl border border-black/[0.08] bg-white text-[#0A0A0F] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF2D2D] focus:ring-2 focus:ring-red-100 transition-all text-sm"
                  style={{boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}
                />
                <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                  onClick={handleComment}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 gradient-bg text-white rounded-xl cursor-pointer"
                ><Send className="w-4 h-4" /></motion.button>
              </div>
            ) : (
              <Link href={`/login?next=/ideas/${id}`}
                className="flex items-center justify-center gap-2 h-12 rounded-2xl border border-black/[0.08] bg-white text-sm text-[#9CA3AF] hover:border-[#FF2D2D]/40 hover:text-[#FF2D2D] transition-all"
                style={{boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}
              >
                <Send className="w-4 h-4" />Sign in to comment
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Apply Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Apply to Join"
      >
        <div className="space-y-4">
          {/* Role selection */}
          {roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[#0F172A] mb-2">
                Which role are you applying for?
              </label>
              <div className="space-y-2">
                {roles.filter((r) => r.current_count < r.required_count).map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRoleId(role.id === selectedRoleId ? null : role.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedRoleId === role.id
                        ? "border-[#FF2D2D] bg-[#FFF0F0]"
                        : "border-[#E2E8F0] hover:border-[#FF2D2D]/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#0F172A]">{role.role_name}</span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md ${
                        role.priority === "critical" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
                      }`}>{role.priority}</span>
                    </div>
                    <span className="text-xs text-[#64748B]">{role.required_count - role.current_count} slot{role.required_count - role.current_count > 1 ? "s" : ""} left</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {applyError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium">
              <X className="w-4 h-4 flex-shrink-0" />{applyError}
            </div>
          )}
          <p className="text-sm text-[#64748B]">
            Tell the team why you&apos;d be a great addition.
          </p>
          <textarea
            placeholder="Share your skills, experience, and what excites you about this idea..."
            value={applyMessage}
            onChange={(e) => setApplyMessage(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#FF2D2D] focus:ring-2 focus:ring-red-100 transition-all resize-none"
          />
          <Button
            onClick={handleApply}
            loading={applyLoading}
            className="w-full"
          >
            Send Application
          </Button>
        </div>
      </Modal>
    </div>
  );
}
