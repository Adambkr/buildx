"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Lightbulb, FolderKanban, BarChart3, Shield, Flame,
  Search, Trash2, Eye, ShieldCheck, ShieldOff, XCircle,
  RefreshCw, CheckCircle, Clock, Activity,
  ExternalLink, TrendingUp, ArrowUpRight,
  Heart, Zap, Target,
  PieChart, Award, Hash,
} from "lucide-react";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";

type AdminTab = "overview" | "analytics" | "users" | "ideas" | "projects" | "applications";

const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "analytics", label: "Analytics", icon: PieChart },
  { id: "users", label: "Users", icon: Users },
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "applications", label: "Applications", icon: Shield },
];

type StatsData = {
  total_users: number; total_ideas: number; open_ideas: number;
  full_ideas: number; total_projects: number; active_projects: number;
  total_applications: number; pending_applications: number;
};
type AdminUser = {
  id: string; username: string; email: string; role: string;
  reputation_score: number; bio: string | null; created_at: string;
};
type AdminIdea = {
  id: string; title: string; category: string; status: string;
  likes_count: number; applications_count: number; current_members: number;
  max_members: number; views_count: number; created_at: string;
  creator_id: string; creator_username: string; creator_email: string;
};
type AdminProject = {
  id: string; name: string; description: string; status: string;
  created_at: string; member_count: number; task_count: number;
};
type AdminApplication = {
  id: string; idea_id: string; idea_title: string; user_id: string;
  username: string; user_email: string; role_name: string | null;
  match_score: number; status: string; created_at: string;
};

function ConfirmModal({ open, title, message, onConfirm, onCancel, danger = true }: {
  open: boolean; title: string; message: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  return (
    <Modal isOpen={open} onClose={onCancel} title={title}>
      <p className="text-[#64748B] mb-6">{message}</p>
      <div className="flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button
          className={cn("flex-1", danger ? "bg-red-500 hover:bg-red-600" : "")}
          onClick={onConfirm}
        >
          Confirm
        </Button>
      </div>
    </Modal>
  );
}

// ── Mini bar chart (pure CSS) ────────────────────────────────────
function MiniBar({ data, color, label }: { data: number[]; color: string; label: string }) {
  const max = Math.max(...data, 1);
  return (
    <div>
      <p className="text-xs font-semibold text-[#94A3B8] mb-2">{label}</p>
      <div className="flex items-end gap-1 h-16">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(v / max) * 100}%` }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 20 }}
              className={cn("w-full rounded-t-sm min-h-[2px]", color)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress ring ────────────────────────────────────────────────
function ProgressRing({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r="40" fill="none" stroke="#F1F5F9" strokeWidth="6" />
          <motion.circle
            cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-[#0F172A]">{pct}%</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-[#64748B] text-center">{label}</p>
    </div>
  );
}

// ── Horizontal stat bar ──────────────────────────────────────────
function HBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#64748B] w-24 truncate">{label}</span>
      <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className="text-xs font-bold text-[#0F172A] w-8 text-right">{value}</span>
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data
  const [stats, setStats] = useState<StatsData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [ideas, setIdeas] = useState<AdminIdea[]>([]);
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  // Sort/filter state for lists
  const [userSort, setUserSort] = useState<"newest" | "oldest" | "reputation">("newest");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [ideaSort, setIdeaSort] = useState<"newest" | "popular" | "views">("newest");
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<"all" | "open" | "full" | "closed">("all");
  const [appStatusFilter, setAppStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  // Confirm modal
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; action: () => void; danger?: boolean;
  }>({ open: false, title: "", message: "", action: () => {}, danger: true });

  // Load all data for analytics
  const loadAll = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      const [statsRes, usersRes, ideasRes, projectsRes, appsRes] = await Promise.allSettled([
        supabase.rpc("admin_get_stats"),
        supabase.rpc("admin_get_users", { p_limit: 500, p_offset: 0 }),
        supabase.rpc("admin_get_challenges", { p_limit: 500, p_offset: 0 }),
        supabase.rpc("admin_get_runs", { p_limit: 500, p_offset: 0 }),
        supabase.rpc("admin_get_applications", { p_limit: 500, p_offset: 0 }),
      ]);
      if (statsRes.status === "fulfilled" && statsRes.value.data) setStats(statsRes.value.data as StatsData);
      if (usersRes.status === "fulfilled" && usersRes.value.data) setUsers(usersRes.value.data as AdminUser[]);
      if (ideasRes.status === "fulfilled" && ideasRes.value.data) setIdeas(ideasRes.value.data as AdminIdea[]);
      if (projectsRes.status === "fulfilled" && projectsRes.value.data) setProjects(projectsRes.value.data as AdminProject[]);
      if (appsRes.status === "fulfilled" && appsRes.value.data) setApplications(appsRes.value.data as AdminApplication[]);
      setAllDataLoaded(true);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const refresh = () => setRefreshKey(k => k + 1);

  const ask = (title: string, message: string, action: () => void, danger = true) =>
    setConfirm({ open: true, title, message, action, danger });

  // ── User Actions ──────────────────────────────────────────────
  const deleteUser = (u: AdminUser) => ask(
    "Delete User", `Permanently delete "${u.username}"? All their ideas and data will be removed.`,
    async () => {
      await createClient().rpc("admin_delete_user", { p_user_id: u.id });
      setUsers(prev => prev.filter(x => x.id !== u.id));
    }
  );

  const promoteUser = (u: AdminUser) => ask(
    "Promote to Admin", `Grant admin privileges to "${u.username}"?`,
    async () => {
      await createClient().rpc("admin_promote_user", { p_user_id: u.id });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: "admin" } : x));
    }, false
  );

  const demoteUser = (u: AdminUser) => ask(
    "Remove Admin", `Remove admin privileges from "${u.username}"?`,
    async () => {
      await createClient().rpc("admin_demote_user", { p_user_id: u.id });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: "user" } : x));
    }
  );

  // ── Idea Actions ──────────────────────────────────────────────
  const deleteIdea = (idea: AdminIdea) => ask(
    "Delete Idea", `Permanently delete "${idea.title}"?`,
    async () => {
      await createClient().rpc("admin_delete_challenge", { p_challenge_id: idea.id });
      setIdeas(prev => prev.filter(x => x.id !== idea.id));
    }
  );

  const closeIdea = (idea: AdminIdea) => ask(
    "Force Close Idea", `Close "${idea.title}" and reject all pending applications?`,
    async () => {
      await createClient().rpc("admin_close_challenge", { p_challenge_id: idea.id });
      setIdeas(prev => prev.map(x => x.id === idea.id ? { ...x, status: "closed" } : x));
    }
  );

  // ── Project Actions ───────────────────────────────────────────
  const deleteProject = (p: AdminProject) => ask(
    "Delete Project", `Permanently delete project "${p.name}"? All tasks and members will be removed.`,
    async () => {
      await createClient().rpc("admin_delete_run", { p_run_id: p.id });
      setProjects(prev => prev.filter(x => x.id !== p.id));
    }
  );

  // ── Application Actions ───────────────────────────────────────
  const acceptApp = (app: AdminApplication) => ask(
    "Accept Application", `Accept ${app.username}'s application to "${app.idea_title}"?`,
    async () => {
      await createClient().rpc("accept_application", { p_application_id: app.id });
      setApplications(prev => prev.map(x => x.id === app.id ? { ...x, status: "accepted" } : x));
    }, false
  );

  const rejectApp = (app: AdminApplication) => ask(
    "Reject Application", `Reject ${app.username}'s application to "${app.idea_title}"?`,
    async () => {
      await createClient().rpc("reject_application", { p_application_id: app.id });
      setApplications(prev => prev.map(x => x.id === app.id ? { ...x, status: "rejected" } : x));
    }
  );

  // ── Computed analytics ────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!allDataLoaded) return null;

    // Growth over last 7 days
    const now = Date.now();
    const dayMs = 86400000;
    const last7Users = Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (6 - i) * dayMs;
      const dayEnd = dayStart + dayMs;
      return users.filter(u => {
        const t = new Date(u.created_at).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
    });
    const last7Ideas = Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (6 - i) * dayMs;
      const dayEnd = dayStart + dayMs;
      return ideas.filter(idea => {
        const t = new Date(idea.created_at).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
    });
    const last7Apps = Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (6 - i) * dayMs;
      const dayEnd = dayStart + dayMs;
      return applications.filter(a => {
        const t = new Date(a.created_at).getTime();
        return t >= dayStart && t < dayEnd;
      }).length;
    });

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    ideas.forEach(i => {
      const cat = i.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categories = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    // Conversion funnel
    const totalApps = applications.length;
    const acceptedApps = applications.filter(a => a.status === "accepted").length;
    const conversionRate = totalApps > 0 ? Math.round((acceptedApps / totalApps) * 100) : 0;

    // Engagement
    const totalLikes = ideas.reduce((sum, i) => sum + i.likes_count, 0);
    const totalViews = ideas.reduce((sum, i) => sum + i.views_count, 0);
    const avgAppsPerIdea = ideas.length > 0 ? (totalApps / ideas.length).toFixed(1) : "0";

    // Top ideas by likes
    const topIdeas = [...ideas].sort((a, b) => b.likes_count - a.likes_count).slice(0, 5);

    // Top users by reputation
    const topUsers = [...users].sort((a, b) => b.reputation_score - a.reputation_score).slice(0, 5);

    // Recent signups (last 24h)
    const recentUsers = users.filter(u => now - new Date(u.created_at).getTime() < dayMs).length;

    // Status distribution
    const ideaStatuses = {
      open: ideas.filter(i => i.status === "open").length,
      full: ideas.filter(i => i.status === "full").length,
      closed: ideas.filter(i => i.status === "closed").length,
    };
    const projectStatuses = {
      active: projects.filter(p => p.status === "active").length,
      completed: projects.filter(p => p.status === "completed").length,
      paused: projects.filter(p => p.status === "paused").length,
    };

    // Health score (weighted metric 0-100)
    const healthFactors = [
      recentUsers > 0 ? 25 : last7Users.reduce((a, b) => a + b, 0) > 0 ? 15 : 0,
      last7Ideas.reduce((a, b) => a + b, 0) > 0 ? 25 : 0,
      conversionRate > 30 ? 25 : conversionRate > 10 ? 15 : 5,
      projects.length > 0 ? 25 : 0,
    ];
    const healthScore = healthFactors.reduce((a, b) => a + b, 0);

    return {
      last7Users, last7Ideas, last7Apps,
      categories, conversionRate, totalLikes, totalViews,
      avgAppsPerIdea, topIdeas, topUsers, recentUsers,
      ideaStatuses, projectStatuses, healthScore,
      acceptedApps, totalApps,
    };
  }, [allDataLoaded, users, ideas, applications, projects]);

  // ── Filtered & sorted lists ───────────────────────────────────
  const q = searchQuery.toLowerCase();

  const filteredUsers = useMemo(() => {
    let list = users.filter(u =>
      u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    if (userRoleFilter !== "all") list = list.filter(u => u.role === userRoleFilter);
    if (userSort === "newest") list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (userSort === "oldest") list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    else list.sort((a, b) => b.reputation_score - a.reputation_score);
    return list;
  }, [users, q, userRoleFilter, userSort]);

  const filteredIdeas = useMemo(() => {
    let list = ideas.filter(i =>
      i.title.toLowerCase().includes(q) || i.creator_username.toLowerCase().includes(q)
    );
    if (ideaStatusFilter !== "all") list = list.filter(i => i.status === ideaStatusFilter);
    if (ideaSort === "newest") list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    else if (ideaSort === "popular") list.sort((a, b) => b.likes_count - a.likes_count);
    else list.sort((a, b) => b.views_count - a.views_count);
    return list;
  }, [ideas, q, ideaStatusFilter, ideaSort]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.name.toLowerCase().includes(q));
  }, [projects, q]);

  const filteredApps = useMemo(() => {
    let list = applications.filter(a =>
      a.username.toLowerCase().includes(q) || a.idea_title.toLowerCase().includes(q)
    );
    if (appStatusFilter !== "all") list = list.filter(a => a.status === appStatusFilter);
    return list;
  }, [applications, q, appStatusFilter]);

  const statCards = stats ? [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-500", bg: "bg-blue-50", delta: analytics?.recentUsers },
    { label: "Active Ideas", value: stats.open_ideas, icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Active Projects", value: stats.active_projects, icon: FolderKanban, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Pending Apps", value: stats.pending_applications, icon: Clock, color: "text-[#FF2D2D]", bg: "bg-red-50" },
    { label: "Total Ideas", value: stats.total_ideas, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50" },
    { label: "Full Teams", value: stats.full_ideas, icon: CheckCircle, color: "text-teal-500", bg: "bg-teal-50" },
    { label: "Total Projects", value: stats.total_projects, icon: FolderKanban, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Total Apps", value: stats.total_applications, icon: Shield, color: "text-pink-500", bg: "bg-pink-50" },
  ] : [];

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  return (
    <div className="min-h-screen bg-[#F7F7F9]">
      {/* Admin Header */}
      <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-[#0F172A]">
                  Build<span className="gradient-text">X</span>
                </span>
                <Badge variant="primary" className="ml-2">Admin</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                className="p-2 rounded-xl hover:bg-[#F7F7F9] transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={cn("w-4 h-4 text-[#64748B]", loading && "animate-spin")} />
              </button>
              <Link href="/ideas" className="text-sm text-[#64748B] hover:text-[#0F172A] transition-colors">
                ← Back to App
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-[#E2E8F0] p-1 sm:p-1.5 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "gradient-bg text-white shadow-md shadow-red-200"
                  : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F7F7F9]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── OVERVIEW ─────────────────────────────────────── */}
            {activeTab === "overview" && (
              <div>
                {/* Health Score Banner */}
                {analytics && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-[#0F172A] to-[#1E293B] rounded-3xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 80% 20%, #FF2D2D 0%, transparent 50%)"}} />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-white/60 text-sm font-medium mb-1">Platform Health Score</p>
                        <div className="flex items-center gap-3">
                          <span className="text-4xl font-black">{analytics.healthScore}</span>
                          <span className="text-white/40 text-lg">/100</span>
                          <span className={cn("text-sm font-bold px-3 py-1 rounded-full",
                            analytics.healthScore >= 75 ? "bg-emerald-500/20 text-emerald-400" :
                            analytics.healthScore >= 50 ? "bg-amber-500/20 text-amber-400" :
                            "bg-red-500/20 text-red-400"
                          )}>
                            {analytics.healthScore >= 75 ? "Healthy" : analytics.healthScore >= 50 ? "Fair" : "Needs Attention"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-black">{analytics.recentUsers}</p>
                          <p className="text-xs text-white/40">New today</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black">{analytics.conversionRate}%</p>
                          <p className="text-xs text-white/40">Accept rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black">{analytics.totalLikes}</p>
                          <p className="text-xs text-white/40">Total likes</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Stat Cards */}
                {loading && !stats ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 animate-pulse h-28" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {statCards.map((s, i) => (
                      <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                        <Card hover={false}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs sm:text-sm text-[#64748B]">{s.label}</p>
                              <p className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1">{s.value?.toLocaleString() ?? "—"}</p>
                              {s.delta !== undefined && s.delta > 0 && (
                                <p className="text-xs text-emerald-500 font-semibold flex items-center gap-0.5 mt-1">
                                  <ArrowUpRight className="w-3 h-3" />+{s.delta} today
                                </p>
                              )}
                            </div>
                            <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center", s.bg)}>
                              <s.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", s.color)} />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Growth Charts + Activity */}
                {analytics && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <Card hover={false}>
                      <MiniBar data={analytics.last7Users} color="bg-blue-400" label="User Signups (7d)" />
                      <div className="flex justify-between mt-2">
                        {dayLabels.map(d => <span key={d} className="text-[10px] text-[#94A3B8]">{d}</span>)}
                      </div>
                    </Card>
                    <Card hover={false}>
                      <MiniBar data={analytics.last7Ideas} color="bg-amber-400" label="Ideas Posted (7d)" />
                      <div className="flex justify-between mt-2">
                        {dayLabels.map(d => <span key={d} className="text-[10px] text-[#94A3B8]">{d}</span>)}
                      </div>
                    </Card>
                    <Card hover={false}>
                      <MiniBar data={analytics.last7Apps} color="bg-violet-400" label="Applications (7d)" />
                      <div className="flex justify-between mt-2">
                        {dayLabels.map(d => <span key={d} className="text-[10px] text-[#94A3B8]">{d}</span>)}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Quick links */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                  {tabs.slice(1).map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 hover:border-[#FF2D2D] hover:shadow-md transition-all cursor-pointer text-center sm:text-left">
                      <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0">
                        <t.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-[#0F172A] text-xs sm:text-sm">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── ANALYTICS ────────────────────────────────────── */}
            {activeTab === "analytics" && (
              <div>
                {!analytics ? (
                  <div className="p-16 text-center text-[#94A3B8]">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p className="text-sm">Loading analytics...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Conversion Funnel & Engagement */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <Card hover={false}>
                        <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                          <Target className="w-4 h-4 text-[#FF2D2D]" /> Conversion Funnel
                        </h3>
                        <div className="flex items-center justify-around">
                          <ProgressRing value={analytics.acceptedApps} max={analytics.totalApps} label="Accept Rate" color="#10B981" />
                          <ProgressRing value={projects.length} max={ideas.length} label="Ideas → Projects" color="#FF2D2D" />
                        </div>
                      </Card>
                      <Card hover={false}>
                        <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-violet-500" /> Engagement
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-[#64748B]"><Heart className="w-4 h-4 text-red-400" /> Total Likes</span>
                            <span className="text-lg font-black text-[#0F172A]">{analytics.totalLikes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-[#64748B]"><Eye className="w-4 h-4 text-blue-400" /> Total Views</span>
                            <span className="text-lg font-black text-[#0F172A]">{analytics.totalViews.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-[#64748B]"><Zap className="w-4 h-4 text-amber-400" /> Avg Apps/Idea</span>
                            <span className="text-lg font-black text-[#0F172A]">{analytics.avgAppsPerIdea}</span>
                          </div>
                        </div>
                      </Card>
                      <Card hover={false}>
                        <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                          <Hash className="w-4 h-4 text-emerald-500" /> Status Distribution
                        </h3>
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Ideas</p>
                          <HBar label="Open" value={analytics.ideaStatuses.open} total={ideas.length} color="bg-emerald-400" />
                          <HBar label="Full" value={analytics.ideaStatuses.full} total={ideas.length} color="bg-blue-400" />
                          <HBar label="Closed" value={analytics.ideaStatuses.closed} total={ideas.length} color="bg-gray-300" />
                          <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mt-2">Projects</p>
                          <HBar label="Active" value={analytics.projectStatuses.active} total={projects.length} color="bg-emerald-400" />
                          <HBar label="Completed" value={analytics.projectStatuses.completed} total={projects.length} color="bg-blue-400" />
                          <HBar label="Paused" value={analytics.projectStatuses.paused} total={projects.length} color="bg-amber-400" />
                        </div>
                      </Card>
                    </div>

                    {/* Category Breakdown + Top Performers */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <Card hover={false}>
                        <h3 className="text-sm font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-amber-500" /> Idea Categories
                        </h3>
                        <div className="space-y-2.5">
                          {analytics.categories.map(([cat, count]) => (
                            <HBar key={cat} label={cat} value={count} total={ideas.length} color="bg-gradient-to-r from-[#FF2D2D] to-[#FF9A3C]" />
                          ))}
                          {analytics.categories.length === 0 && <p className="text-sm text-[#94A3B8]">No ideas yet</p>}
                        </div>
                      </Card>
                      <div className="space-y-4">
                        <Card hover={false}>
                          <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-amber-500" /> Top Ideas by Likes
                          </h3>
                          <div className="space-y-2">
                            {analytics.topIdeas.map((idea, i) => (
                              <div key={idea.id} className="flex items-center gap-3">
                                <span className="text-xs font-black text-[#94A3B8] w-5">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <Link href={`/ideas/${idea.id}`} target="_blank" className="text-sm font-semibold text-[#0F172A] truncate block hover:text-[#FF2D2D] transition-colors">
                                    {idea.title}
                                  </Link>
                                </div>
                                <span className="text-xs font-bold text-[#FF2D2D] flex items-center gap-1"><Heart className="w-3 h-3" />{idea.likes_count}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                        <Card hover={false}>
                          <h3 className="text-sm font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-violet-500" /> Top Users by Reputation
                          </h3>
                          <div className="space-y-2">
                            {analytics.topUsers.map((u, i) => (
                              <div key={u.id} className="flex items-center gap-3">
                                <span className="text-xs font-black text-[#94A3B8] w-5">{i + 1}</span>
                                <Avatar src={null} name={u.username} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[#0F172A] truncate">{u.username}</p>
                                </div>
                                <span className="text-xs font-bold text-violet-500">⭐ {u.reputation_score}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── USERS ────────────────────────────────────────── */}
            {activeTab === "users" && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-black/5">
                <div className="p-4 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Users <span className="text-[#94A3B8] text-sm font-normal">({filteredUsers.length})</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value as typeof userRoleFilter)}
                      className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] cursor-pointer">
                      <option value="all">All Roles</option>
                      <option value="admin">Admins</option>
                      <option value="user">Users</option>
                    </select>
                    <select value={userSort} onChange={e => setUserSort(e.target.value as typeof userSort)}
                      className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] cursor-pointer">
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="reputation">Top Reputation</option>
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input type="text" placeholder="Search…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#FF2D2D] transition-colors w-full sm:w-52" />
                    </div>
                  </div>
                </div>
                {loading && users.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8]"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-[#94A3B8]">No users found</div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {filteredUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-[#F7F7F9] transition-colors gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={null} name={u.username} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0F172A] truncate">{u.username}</p>
                            <p className="text-xs text-[#94A3B8] truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2 sm:ml-4">
                          <Badge variant={u.role === "admin" ? "primary" : "default"}>{u.role}</Badge>
                          <span className="text-xs text-[#94A3B8] hidden sm:block">⭐ {u.reputation_score}</span>
                          <span className="text-xs text-[#94A3B8] hidden md:block">{timeAgo(u.created_at)}</span>
                          <div className="flex gap-1">
                            <Link href={`/profile/${u.id}`} target="_blank"
                              className="p-1.5 rounded-lg hover:bg-[#F7F7F9] transition-colors" title="View Profile">
                              <ExternalLink className="w-4 h-4 text-[#64748B]" />
                            </Link>
                            {u.role !== "admin" ? (
                              <button onClick={() => promoteUser(u)} title="Promote to Admin"
                                className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              </button>
                            ) : (
                              <button onClick={() => demoteUser(u)} title="Remove Admin"
                                className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer">
                                <ShieldOff className="w-4 h-4 text-amber-500" />
                              </button>
                            )}
                            <button onClick={() => deleteUser(u)} title="Delete User"
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── IDEAS ────────────────────────────────────────── */}
            {activeTab === "ideas" && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-black/5">
                <div className="p-4 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Ideas <span className="text-[#94A3B8] text-sm font-normal">({filteredIdeas.length})</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={ideaStatusFilter} onChange={e => setIdeaStatusFilter(e.target.value as typeof ideaStatusFilter)}
                      className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] cursor-pointer">
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="full">Full</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select value={ideaSort} onChange={e => setIdeaSort(e.target.value as typeof ideaSort)}
                      className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] cursor-pointer">
                      <option value="newest">Newest</option>
                      <option value="popular">Most Liked</option>
                      <option value="views">Most Viewed</option>
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input type="text" placeholder="Search ideas…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#FF2D2D] transition-colors w-full sm:w-52" />
                    </div>
                  </div>
                </div>
                {loading && ideas.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8]"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
                ) : filteredIdeas.length === 0 ? (
                  <div className="p-12 text-center text-[#94A3B8]">No ideas found</div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {filteredIdeas.map(idea => (
                      <div key={idea.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-[#F7F7F9] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">{idea.title}</p>
                          <p className="text-xs text-[#94A3B8]">
                            by {idea.creator_username} · {idea.category} · {idea.current_members}/{idea.max_members} members · {timeAgo(idea.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-shrink-0">
                          <Badge variant={idea.status === "open" ? "success" : idea.status === "full" ? "warning" : "default"}>
                            {idea.status}
                          </Badge>
                          <span className="text-[10px] text-[#94A3B8] hidden sm:flex items-center gap-0.5"><Heart className="w-3 h-3" />{idea.likes_count}</span>
                          <span className="text-[10px] text-[#94A3B8] hidden md:flex items-center gap-0.5"><Eye className="w-3 h-3" />{idea.views_count}</span>
                          <div className="flex gap-1">
                            <Link href={`/ideas/${idea.id}`} target="_blank"
                              className="p-1.5 rounded-lg hover:bg-[#F7F7F9] transition-colors" title="View Idea">
                              <ExternalLink className="w-4 h-4 text-[#64748B]" />
                            </Link>
                            {idea.status === "open" && (
                              <button onClick={() => closeIdea(idea)} title="Force Close"
                                className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer">
                                <XCircle className="w-4 h-4 text-amber-500" />
                              </button>
                            )}
                            <button onClick={() => deleteIdea(idea)} title="Delete Idea"
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── PROJECTS ─────────────────────────────────────── */}
            {activeTab === "projects" && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-black/5">
                <div className="p-4 sm:p-6 border-b border-[#E2E8F0] flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Projects <span className="text-[#94A3B8] text-sm font-normal">({filteredProjects.length})</span>
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input type="text" placeholder="Search projects…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#FF2D2D] transition-colors w-full sm:w-52" />
                  </div>
                </div>
                {loading && projects.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8]"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-12 text-center text-[#94A3B8]">No projects found</div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {filteredProjects.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-[#F7F7F9] transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#0F172A] truncate">{p.name}</p>
                            <p className="text-xs text-[#94A3B8]">
                              {p.member_count} members · {p.task_count} tasks · {timeAgo(p.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-shrink-0">
                          <Badge variant={p.status === "active" ? "success" : p.status === "completed" ? "primary" : "default"}>
                            {p.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Link href={`/projects/${p.id}`} target="_blank"
                              className="p-1.5 rounded-lg hover:bg-[#F7F7F9] transition-colors" title="View Project">
                              <ExternalLink className="w-4 h-4 text-[#64748B]" />
                            </Link>
                            <button onClick={() => deleteProject(p)} title="Delete Project"
                              className="p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── APPLICATIONS ─────────────────────────────────── */}
            {activeTab === "applications" && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-black/5">
                <div className="p-4 sm:p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Applications <span className="text-[#94A3B8] text-sm font-normal">({filteredApps.length})</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={appStatusFilter} onChange={e => setAppStatusFilter(e.target.value as typeof appStatusFilter)}
                      className="h-9 px-3 rounded-lg border border-[#E2E8F0] text-xs font-medium text-[#64748B] cursor-pointer">
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input type="text" placeholder="Search…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 pr-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#FF2D2D] transition-colors w-full sm:w-52" />
                    </div>
                  </div>
                </div>
                {loading && applications.length === 0 ? (
                  <div className="p-8 text-center text-[#94A3B8]"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
                ) : filteredApps.length === 0 ? (
                  <div className="p-12 text-center text-[#94A3B8]">No applications found</div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {filteredApps.map(app => (
                      <div key={app.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-[#F7F7F9] transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-[#0F172A]">{app.username}</p>
                            <span className="text-[#94A3B8]">→</span>
                            <Link href={`/ideas/${app.idea_id}`} target="_blank"
                              className="text-sm text-[#FF2D2D] hover:underline truncate max-w-[180px]">
                              {app.idea_title}
                            </Link>
                          </div>
                          <p className="text-xs text-[#94A3B8]">
                            {app.role_name ?? "No role"} · Match: {app.match_score}% · {timeAgo(app.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-shrink-0">
                          <Badge variant={
                            app.status === "accepted" ? "success" :
                            app.status === "rejected" ? "danger" : "warning"
                          }>
                            {app.status}
                          </Badge>
                          {app.status === "pending" && (
                            <div className="flex gap-1">
                              <button onClick={() => acceptApp(app)} title="Accept"
                                className="p-1.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              </button>
                              <button onClick={() => rejectApp(app)} title="Reject"
                                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                                <XCircle className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        danger={confirm.danger}
        onConfirm={() => { confirm.action(); setConfirm(c => ({ ...c, open: false })); }}
        onCancel={() => setConfirm(c => ({ ...c, open: false }))}
      />
    </div>
  );
}
