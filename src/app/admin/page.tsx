"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Lightbulb, FolderKanban, BarChart3, Shield, Flame,
  Search, Trash2, Eye, ShieldCheck, ShieldOff, XCircle,
  RefreshCw, CheckCircle, Clock,
  ExternalLink, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createClient } from "@/lib/supabase/client";

type AdminTab = "overview" | "users" | "ideas" | "projects" | "applications";

const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
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

  // Confirm modal
  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; action: () => void; danger?: boolean;
  }>({ open: false, title: "", message: "", action: () => {}, danger: true });

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    try {
      if (activeTab === "overview") {
        const { data } = await supabase.rpc("admin_get_stats");
        if (data) setStats(data as StatsData);
      } else if (activeTab === "users") {
        const { data } = await supabase.rpc("admin_get_users", { p_limit: 100, p_offset: 0 });
        if (data) setUsers(data as AdminUser[]);
      } else if (activeTab === "ideas") {
        const { data } = await supabase.rpc("admin_get_ideas", { p_limit: 100, p_offset: 0 });
        if (data) setIdeas(data as AdminIdea[]);
      } else if (activeTab === "projects") {
        const { data } = await supabase.rpc("admin_get_projects", { p_limit: 100, p_offset: 0 });
        if (data) setProjects(data as AdminProject[]);
      } else if (activeTab === "applications") {
        const { data } = await supabase.rpc("admin_get_applications", { p_limit: 100, p_offset: 0 });
        if (data) setApplications(data as AdminApplication[]);
      }
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [activeTab, refreshKey]);

  useEffect(() => { load(); }, [load]);

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
      await createClient().rpc("admin_delete_idea", { p_idea_id: idea.id });
      setIdeas(prev => prev.filter(x => x.id !== idea.id));
    }
  );

  const closeIdea = (idea: AdminIdea) => ask(
    "Force Close Idea", `Close "${idea.title}" and reject all pending applications?`,
    async () => {
      await createClient().rpc("admin_close_idea", { p_idea_id: idea.id });
      setIdeas(prev => prev.map(x => x.id === idea.id ? { ...x, status: "closed" } : x));
    }
  );

  // ── Project Actions ───────────────────────────────────────────
  const deleteProject = (p: AdminProject) => ask(
    "Delete Project", `Permanently delete project "${p.name}"? All tasks and members will be removed.`,
    async () => {
      await createClient().rpc("admin_delete_project", { p_project_id: p.id });
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

  // ── Filtered lists ────────────────────────────────────────────
  const q = searchQuery.toLowerCase();
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );
  const filteredIdeas = ideas.filter(i =>
    i.title.toLowerCase().includes(q) || i.creator_username.toLowerCase().includes(q)
  );
  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(q)
  );
  const filteredApps = applications.filter(a =>
    a.username.toLowerCase().includes(q) || a.idea_title.toLowerCase().includes(q)
  );

  const statCards = stats ? [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Active Ideas", value: stats.open_ideas, icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Active Projects", value: stats.active_projects, icon: FolderKanban, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Pending Applications", value: stats.pending_applications, icon: Clock, color: "text-[#FF2D2D]", bg: "bg-red-50" },
    { label: "Total Ideas", value: stats.total_ideas, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-50" },
    { label: "Full Teams", value: stats.full_ideas, icon: CheckCircle, color: "text-teal-500", bg: "bg-teal-50" },
    { label: "Total Projects", value: stats.total_projects, icon: FolderKanban, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Total Applications", value: stats.total_applications, icon: Shield, color: "text-pink-500", bg: "bg-pink-50" },
  ] : [];

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
                {loading ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-white rounded-2xl border border-[#E2E8F0] p-6 animate-pulse h-32" />
                    ))}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((s, i) => (
                      <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <Card hover={false}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-[#64748B]">{s.label}</p>
                              <p className="text-3xl font-extrabold text-[#0F172A] mt-1">{s.value?.toLocaleString() ?? "—"}</p>
                            </div>
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", s.bg)}>
                              <s.icon className={cn("w-6 h-6", s.color)} />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
                {/* Quick links */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {tabs.slice(1).map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)}
                      className="bg-white rounded-2xl border border-[#E2E8F0] p-5 flex items-center gap-3 hover:border-[#FF2D2D] hover:shadow-md transition-all cursor-pointer text-left">
                      <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                        <t.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-semibold text-[#0F172A]">Manage {t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── USERS ────────────────────────────────────────── */}
            {activeTab === "users" && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl shadow-black/5">
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Users <span className="text-[#94A3B8] text-sm font-normal">({filteredUsers.length})</span>
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input type="text" placeholder="Search by name or email…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-10 pl-10 pr-4 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#FF2D2D] transition-colors w-full sm:w-64" />
                  </div>
                </div>
                {loading ? (
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
                        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
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
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Ideas <span className="text-[#94A3B8] text-sm font-normal">({filteredIdeas.length})</span>
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input type="text" placeholder="Search ideas…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-10 pl-10 pr-4 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#FF2D2D] transition-colors w-64" />
                  </div>
                </div>
                {loading ? (
                  <div className="p-8 text-center text-[#94A3B8]"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
                ) : filteredIdeas.length === 0 ? (
                  <div className="p-12 text-center text-[#94A3B8]">No ideas found</div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {filteredIdeas.map(idea => (
                      <div key={idea.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F7F9] transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-[#0F172A] truncate">{idea.title}</p>
                          <p className="text-xs text-[#94A3B8]">
                            by {idea.creator_username} · {idea.current_members}/{idea.max_members} members · {idea.applications_count} apps · {timeAgo(idea.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <Badge variant={idea.status === "open" ? "success" : idea.status === "full" ? "warning" : "default"}>
                            {idea.status}
                          </Badge>
                          <span className="text-xs text-[#94A3B8] hidden sm:block">❤️ {idea.likes_count}</span>
                          <div className="flex gap-1">
                            <Link href={`/ideas/${idea.id}`} target="_blank"
                              className="p-1.5 rounded-lg hover:bg-[#F7F7F9] transition-colors" title="View Idea">
                              <Eye className="w-4 h-4 text-[#64748B]" />
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
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Projects <span className="text-[#94A3B8] text-sm font-normal">({filteredProjects.length})</span>
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input type="text" placeholder="Search projects…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="h-10 pl-10 pr-4 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#FF2D2D] transition-colors w-64" />
                  </div>
                </div>
                {loading ? (
                  <div className="p-8 text-center text-[#94A3B8]"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-12 text-center text-[#94A3B8]">No projects found</div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {filteredProjects.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F7F9] transition-colors">
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
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                          <Badge variant={p.status === "active" ? "success" : p.status === "completed" ? "primary" : "default"}>
                            {p.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Link href={`/projects/${p.id}`} target="_blank"
                              className="p-1.5 rounded-lg hover:bg-[#F7F7F9] transition-colors" title="View Project">
                              <Eye className="w-4 h-4 text-[#64748B]" />
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
                <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between gap-4 flex-wrap">
                  <h2 className="text-lg font-bold text-[#0F172A]">
                    Applications <span className="text-[#94A3B8] text-sm font-normal">({filteredApps.length})</span>
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                      <input type="text" placeholder="Search applications…" value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="h-10 pl-10 pr-4 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#FF2D2D] transition-colors w-64" />
                    </div>
                  </div>
                </div>
                {loading ? (
                  <div className="p-8 text-center text-[#94A3B8]"><RefreshCw className="w-6 h-6 animate-spin mx-auto" /></div>
                ) : filteredApps.length === 0 ? (
                  <div className="p-12 text-center text-[#94A3B8]">No applications found</div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {filteredApps.map(app => (
                      <div key={app.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F7F7F9] transition-colors">
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
                            {app.role_name ?? "No role specified"} · Match: {app.match_score}% · {timeAgo(app.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
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
