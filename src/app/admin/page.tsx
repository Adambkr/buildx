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
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";

type AdminTab = "overview" | "analytics" | "users" | "challenges" | "runs" | "applications";

const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "analytics", label: "Analytics", icon: PieChart },
  { id: "users", label: "Users", icon: Users },
  { id: "challenges", label: "Challenges", icon: Lightbulb },
  { id: "runs", label: "Runs", icon: FolderKanban },
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
      <p className="text-xs font-semibold text-[#64748B] mb-2">{label}</p>
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
          <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <motion.circle
            cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-white">{pct}%</span>
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
      <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className="text-xs font-bold text-white w-8 text-right">{value}</span>
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
  // activeTab alias handled via tabs definition
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [allDataLoaded, setAllDataLoaded] = useState(false);

  // Sort/filter state for lists
  const [userSort, setUserSort] = useState<"newest" | "oldest" | "reputation">("newest");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [ideaSort, setIdeaSort] = useState<"newest" | "popular" | "views">("newest");
  const [ideaStatusFilter, setIdeaStatusFilter] = useState<"all" | "open" | "full" | "closed">("all");
  const [appStatusFilter, setAppStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  // activeTab state uses "challenges" / "runs" tabs

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
    { label: "Total Users", value: stats.total_users, icon: Users, color: "text-[#00E5FF]", bg: "bg-[#00E5FF]/10", delta: analytics?.recentUsers },
    { label: "Open Challenges", value: stats.open_ideas, icon: Lightbulb, color: "text-[#FFD700]", bg: "bg-[#FFD700]/10" },
    { label: "Active Runs", value: stats.active_projects, icon: FolderKanban, color: "text-[#00FFA3]", bg: "bg-[#00FFA3]/10" },
    { label: "Pending Apps", value: stats.pending_applications, icon: Clock, color: "text-[#FF3366]", bg: "bg-[#FF3366]/10" },
    { label: "Total Challenges", value: stats.total_ideas, icon: TrendingUp, color: "text-[#A855F7]", bg: "bg-[#A855F7]/10" },
    { label: "Full Squads", value: stats.full_ideas, icon: CheckCircle, color: "text-[#00E5FF]", bg: "bg-[#00E5FF]/10" },
    { label: "Total Runs", value: stats.total_projects, icon: FolderKanban, color: "text-[#FF6B9D]", bg: "bg-[#FF6B9D]/10" },
    { label: "Total Apps", value: stats.total_applications, icon: Shield, color: "text-[#FF3366]", bg: "bg-[#FF3366]/10" },
  ] : [];

  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  });

  return (
    <div className="min-h-screen bg-[#050507]">
      {/* Admin Header */}
      <div className="border-b border-white/[0.06] bg-[#050507]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-hero rounded-xl flex items-center justify-center shadow-lg shadow-[#FF3366]/20">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white">
                  Build<span className="text-gradient">X</span>
                </span>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/20 rounded-full">Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={refresh}
                className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-pointer" title="Refresh">
                <RefreshCw className={cn("w-4 h-4 text-[#64748B]", loading && "animate-spin")} />
              </button>
              <Link href="/ideas" className="text-sm text-[#64748B] hover:text-white transition-colors">← Back to App</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Tabs */}
        <div className="flex items-center gap-1 glass-dark rounded-2xl border border-white/[0.06] p-1 sm:p-1.5 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id
                  ? "bg-gradient-hero text-white shadow-lg shadow-[#FF3366]/20"
                  : "text-[#64748B] hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <tab.icon className="w-4 h-4" />{tab.label}
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
                    className="glass-dark rounded-2xl border border-white/[0.06] p-6 sm:p-8 mb-6 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 80% 20%, #FF3366 0%, transparent 50%)"}} />
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-[#64748B] text-sm font-medium mb-1">Platform Health Score</p>
                        <div className="flex items-center gap-3">
                          <span className="text-4xl font-black text-white">{analytics.healthScore}</span>
                          <span className="text-[#64748B] text-lg">/100</span>
                          <span className={cn("text-sm font-bold px-3 py-1 rounded-full border",
                            analytics.healthScore >= 75 ? "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20" :
                            analytics.healthScore >= 50 ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20" :
                            "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20"
                          )}>
                            {analytics.healthScore >= 75 ? "Healthy" : analytics.healthScore >= 50 ? "Fair" : "Needs Attention"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-black text-white">{analytics.recentUsers}</p>
                          <p className="text-xs text-[#64748B]">New today</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-white">{analytics.conversionRate}%</p>
                          <p className="text-xs text-[#64748B]">Accept rate</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-black text-white">{analytics.totalLikes}</p>
                          <p className="text-xs text-[#64748B]">Total likes</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Stat Cards */}
                {loading && !stats ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="glass-dark rounded-2xl border border-white/[0.06] p-6 animate-pulse h-28" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {statCards.map((s, i) => (
                      <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        whileHover={{ y: -3 }} className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm text-[#64748B]">{s.label}</p>
                            <p className="text-2xl sm:text-3xl font-black text-white mt-1">{s.value?.toLocaleString() ?? "—"}</p>
                            {s.delta !== undefined && s.delta > 0 && (
                              <p className="text-xs text-[#00FFA3] font-semibold flex items-center gap-0.5 mt-1">
                                <ArrowUpRight className="w-3 h-3" />+{s.delta} today
                              </p>
                            )}
                          </div>
                          <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center", s.bg)}>
                            <s.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", s.color)} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Growth Charts */}
                {analytics && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                      <MiniBar data={analytics.last7Users} color="bg-[#00E5FF]" label="User Signups (7d)" />
                      <div className="flex justify-between mt-2">
                        {dayLabels.map(d => <span key={d} className="text-[10px] text-[#64748B]">{d}</span>)}
                      </div>
                    </div>
                    <div className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                      <MiniBar data={analytics.last7Ideas} color="bg-[#FFD700]" label="Challenges Posted (7d)" />
                      <div className="flex justify-between mt-2">
                        {dayLabels.map(d => <span key={d} className="text-[10px] text-[#64748B]">{d}</span>)}
                      </div>
                    </div>
                    <div className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                      <MiniBar data={analytics.last7Apps} color="bg-[#A855F7]" label="Applications (7d)" />
                      <div className="flex justify-between mt-2">
                        {dayLabels.map(d => <span key={d} className="text-[10px] text-[#64748B]">{d}</span>)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick links */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                  {tabs.slice(1).map(t => (
                    <motion.button key={t.id} whileHover={{ y: -3 }} onClick={() => setActiveTab(t.id)}
                      className="glass-dark rounded-2xl border border-white/[0.06] p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 hover:border-[#FF3366]/30 transition-all cursor-pointer text-center sm:text-left">
                      <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center flex-shrink-0">
                        <t.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-white text-xs sm:text-sm">{t.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* ── ANALYTICS ────────────────────────────────────── */}
            {activeTab === "analytics" && (
              <div>
                {!analytics ? (
                  <div className="p-16 text-center text-[#64748B]">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p className="text-sm">Loading analytics...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <Target className="w-4 h-4 text-[#FF3366]" /> Conversion Funnel
                        </h3>
                        <div className="flex items-center justify-around">
                          <ProgressRing value={analytics.acceptedApps} max={analytics.totalApps} label="Accept Rate" color="#00FFA3" />
                          <ProgressRing value={projects.length} max={ideas.length} label="Challenges → Runs" color="#FF3366" />
                        </div>
                      </div>
                      <div className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#A855F7]" /> Engagement
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-[#64748B]"><Heart className="w-4 h-4 text-[#FF3366]" /> Total Likes</span>
                            <span className="text-lg font-black text-white">{analytics.totalLikes.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-[#64748B]"><Eye className="w-4 h-4 text-[#00E5FF]" /> Total Views</span>
                            <span className="text-lg font-black text-white">{analytics.totalViews.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-sm text-[#64748B]"><Zap className="w-4 h-4 text-[#FFD700]" /> Avg Apps/Challenge</span>
                            <span className="text-lg font-black text-white">{analytics.avgAppsPerIdea}</span>
                          </div>
                        </div>
                      </div>
                      <div className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <Hash className="w-4 h-4 text-[#00FFA3]" /> Status Distribution
                        </h3>
                        <div className="space-y-3">
                          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Challenges</p>
                          <HBar label="Open" value={analytics.ideaStatuses.open} total={ideas.length} color="bg-[#00FFA3]" />
                          <HBar label="Full" value={analytics.ideaStatuses.full} total={ideas.length} color="bg-[#00E5FF]" />
                          <HBar label="Closed" value={analytics.ideaStatuses.closed} total={ideas.length} color="bg-[#64748B]" />
                          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-2">Runs</p>
                          <HBar label="Active" value={analytics.projectStatuses.active} total={projects.length} color="bg-[#00FFA3]" />
                          <HBar label="Completed" value={analytics.projectStatuses.completed} total={projects.length} color="bg-[#00E5FF]" />
                          <HBar label="Paused" value={analytics.projectStatuses.paused} total={projects.length} color="bg-[#FFD700]" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                          <PieChart className="w-4 h-4 text-[#FFD700]" /> Challenge Categories
                        </h3>
                        <div className="space-y-2.5">
                          {analytics.categories.map(([cat, count]) => (
                            <HBar key={cat} label={cat} value={count} total={ideas.length} color="bg-gradient-to-r from-[#FF3366] to-[#A855F7]" />
                          ))}
                          {analytics.categories.length === 0 && <p className="text-sm text-[#64748B]">No challenges yet</p>}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#FFD700]" /> Top Challenges by Likes
                          </h3>
                          <div className="space-y-2">
                            {analytics.topIdeas.map((idea, i) => (
                              <div key={idea.id} className="flex items-center gap-3">
                                <span className="text-xs font-black text-[#64748B] w-5">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <Link href={`/ideas/${idea.id}`} target="_blank" className="text-sm font-semibold text-white truncate block hover:text-[#FF3366] transition-colors">
                                    {idea.title}
                                  </Link>
                                </div>
                                <span className="text-xs font-bold text-[#FF3366] flex items-center gap-1"><Heart className="w-3 h-3" />{idea.likes_count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-[#A855F7]" /> Top Users by Reputation
                          </h3>
                          <div className="space-y-2">
                            {analytics.topUsers.map((u, i) => (
                              <div key={u.id} className="flex items-center gap-3">
                                <span className="text-xs font-black text-[#64748B] w-5">{i + 1}</span>
                                <Avatar src={null} name={u.username} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">{u.username}</p>
                                </div>
                                <span className="text-xs font-bold text-[#A855F7]">⭐ {u.reputation_score}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── USERS ────────────────────────────────────────── */}
            {activeTab === "users" && (
              <div className="glass-dark rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-white">
                    Users <span className="text-[#64748B] text-sm font-normal">({filteredUsers.length})</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value as typeof userRoleFilter)}
                      className="h-9 px-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs font-medium text-[#94A3B8] cursor-pointer">
                      <option value="all">All Roles</option>
                      <option value="admin">Admins</option>
                      <option value="user">Users</option>
                    </select>
                    <select value={userSort} onChange={e => setUserSort(e.target.value as typeof userSort)}
                      className="h-9 px-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs font-medium text-[#94A3B8] cursor-pointer">
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="reputation">Top Reputation</option>
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                      <input type="text" placeholder="Search…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/30 transition-colors w-full sm:w-52" />
                    </div>
                  </div>
                </div>
                {loading && users.length === 0 ? (
                  <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#64748B]" /></div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-12 text-center text-[#64748B]">No users found</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {filteredUsers.map(u => (
                      <div key={u.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/[0.02] transition-colors gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={null} name={u.username} size="sm" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{u.username}</p>
                            <p className="text-xs text-[#64748B] truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 ml-2 sm:ml-4">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            u.role === "admin" ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20" : "bg-white/[0.03] text-[#64748B] border-white/[0.06]"
                          )}>{u.role}</span>
                          <span className="text-xs text-[#64748B] hidden sm:block">⭐ {u.reputation_score}</span>
                          <span className="text-xs text-[#64748B] hidden md:block">{timeAgo(u.created_at)}</span>
                          <div className="flex gap-1">
                            <Link href={`/profile/${u.id}`} target="_blank"
                              className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors" title="View Profile">
                              <ExternalLink className="w-4 h-4 text-[#64748B]" />
                            </Link>
                            {u.role !== "admin" ? (
                              <button onClick={() => promoteUser(u)} title="Promote to Admin"
                                className="p-1.5 rounded-lg hover:bg-[#00FFA3]/10 transition-colors cursor-pointer">
                                <ShieldCheck className="w-4 h-4 text-[#00FFA3]" />
                              </button>
                            ) : (
                              <button onClick={() => demoteUser(u)} title="Remove Admin"
                                className="p-1.5 rounded-lg hover:bg-[#FFD700]/10 transition-colors cursor-pointer">
                                <ShieldOff className="w-4 h-4 text-[#FFD700]" />
                              </button>
                            )}
                            <button onClick={() => deleteUser(u)} title="Delete User"
                              className="p-1.5 rounded-lg hover:bg-[#FF3366]/10 transition-colors cursor-pointer">
                              <Trash2 className="w-4 h-4 text-[#FF3366]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CHALLENGES ───────────────────────────────────── */}
            {activeTab === "challenges" && (
              <div className="glass-dark rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-white">
                    Challenges <span className="text-[#64748B] text-sm font-normal">({filteredIdeas.length})</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={ideaStatusFilter} onChange={e => setIdeaStatusFilter(e.target.value as typeof ideaStatusFilter)}
                      className="h-9 px-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs font-medium text-[#94A3B8] cursor-pointer">
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="full">Full</option>
                      <option value="closed">Closed</option>
                    </select>
                    <select value={ideaSort} onChange={e => setIdeaSort(e.target.value as typeof ideaSort)}
                      className="h-9 px-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs font-medium text-[#94A3B8] cursor-pointer">
                      <option value="newest">Newest</option>
                      <option value="popular">Most Liked</option>
                      <option value="views">Most Viewed</option>
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                      <input type="text" placeholder="Search challenges…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/30 transition-colors w-full sm:w-52" />
                    </div>
                  </div>
                </div>
                {loading && ideas.length === 0 ? (
                  <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#64748B]" /></div>
                ) : filteredIdeas.length === 0 ? (
                  <div className="p-12 text-center text-[#64748B]">No challenges found</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {filteredIdeas.map(idea => (
                      <div key={idea.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{idea.title}</p>
                          <p className="text-xs text-[#64748B]">
                            by {idea.creator_username} · {idea.category} · {idea.current_members}/{idea.max_members} squad · {timeAgo(idea.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-shrink-0">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            idea.status === "open" ? "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20" :
                            idea.status === "full" ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20" :
                            "bg-white/[0.03] text-[#64748B] border-white/[0.06]"
                          )}>{idea.status}</span>
                          <span className="text-[10px] text-[#64748B] hidden sm:flex items-center gap-0.5"><Heart className="w-3 h-3" />{idea.likes_count}</span>
                          <span className="text-[10px] text-[#64748B] hidden md:flex items-center gap-0.5"><Eye className="w-3 h-3" />{idea.views_count}</span>
                          <div className="flex gap-1">
                            <Link href={`/ideas/${idea.id}`} target="_blank"
                              className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors" title="View Challenge">
                              <ExternalLink className="w-4 h-4 text-[#64748B]" />
                            </Link>
                            {idea.status === "open" && (
                              <button onClick={() => closeIdea(idea)} title="Force Close"
                                className="p-1.5 rounded-lg hover:bg-[#FFD700]/10 transition-colors cursor-pointer">
                                <XCircle className="w-4 h-4 text-[#FFD700]" />
                              </button>
                            )}
                            <button onClick={() => deleteIdea(idea)} title="Delete Challenge"
                              className="p-1.5 rounded-lg hover:bg-[#FF3366]/10 transition-colors cursor-pointer">
                              <Trash2 className="w-4 h-4 text-[#FF3366]" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── RUNS ─────────────────────────────────────────── */}
            {activeTab === "runs" && (
              <div className="glass-dark rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-white/[0.06] flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-lg font-bold text-white">
                    Runs <span className="text-[#64748B] text-sm font-normal">({filteredProjects.length})</span>
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input type="text" placeholder="Search runs…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-9 pl-9 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/30 transition-colors w-full sm:w-52" />
                  </div>
                </div>
                {loading && projects.length === 0 ? (
                  <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#64748B]" /></div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-12 text-center text-[#64748B]">No runs found</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {filteredProjects.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-gradient-hero rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                            <p className="text-xs text-[#64748B]">
                              {p.member_count} members · {p.task_count} missions · {timeAgo(p.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-shrink-0">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            p.status === "active" ? "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20" :
                            p.status === "completed" ? "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20" :
                            "bg-white/[0.03] text-[#64748B] border-white/[0.06]"
                          )}>{p.status}</span>
                          <div className="flex gap-1">
                            <Link href={`/projects/${p.id}`} target="_blank"
                              className="p-1.5 rounded-lg hover:bg-white/[0.04] transition-colors" title="View Run">
                              <ExternalLink className="w-4 h-4 text-[#64748B]" />
                            </Link>
                            <button onClick={() => deleteProject(p)} title="Delete Run"
                              className="p-1.5 rounded-lg hover:bg-[#FF3366]/10 transition-colors cursor-pointer">
                              <Trash2 className="w-4 h-4 text-[#FF3366]" />
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
              <div className="glass-dark rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-white">
                    Applications <span className="text-[#64748B] text-sm font-normal">({filteredApps.length})</span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={appStatusFilter} onChange={e => setAppStatusFilter(e.target.value as typeof appStatusFilter)}
                      className="h-9 px-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs font-medium text-[#94A3B8] cursor-pointer">
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                      <input type="text" placeholder="Search…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-9 pl-9 pr-3 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/30 transition-colors w-full sm:w-52" />
                    </div>
                  </div>
                </div>
                {loading && applications.length === 0 ? (
                  <div className="p-8 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#64748B]" /></div>
                ) : filteredApps.length === 0 ? (
                  <div className="p-12 text-center text-[#64748B]">No applications found</div>
                ) : (
                  <div className="divide-y divide-white/[0.04]">
                    {filteredApps.map(app => (
                      <div key={app.id} className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/[0.02] transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-white">{app.username}</p>
                            <span className="text-[#64748B]">→</span>
                            <Link href={`/ideas/${app.idea_id}`} target="_blank"
                              className="text-sm text-[#FF3366] hover:underline truncate max-w-[180px]">
                              {app.idea_title}
                            </Link>
                          </div>
                          <p className="text-xs text-[#64748B]">
                            {app.role_name ?? "No role"} · Match: {app.match_score}% · {timeAgo(app.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4 flex-shrink-0">
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                            app.status === "accepted" ? "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20" :
                            app.status === "rejected" ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20" :
                            "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20"
                          )}>{app.status}</span>
                          {app.status === "pending" && (
                            <div className="flex gap-1">
                              <button onClick={() => acceptApp(app)} title="Accept"
                                className="p-1.5 rounded-lg hover:bg-[#00FFA3]/10 transition-colors cursor-pointer">
                                <CheckCircle className="w-4 h-4 text-[#00FFA3]" />
                              </button>
                              <button onClick={() => rejectApp(app)} title="Reject"
                                className="p-1.5 rounded-lg hover:bg-[#FF3366]/10 transition-colors cursor-pointer">
                                <XCircle className="w-4 h-4 text-[#FF3366]" />
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
