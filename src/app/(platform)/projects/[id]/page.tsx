"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Send, CheckCircle2, Circle, Clock,
  Users, ListTodo, MessageSquare, BarChart3, Zap,
  Flag, Activity, Target, ChevronRight, UserCheck,
  Trophy, Swords, Crosshair, Flame, Star, Rocket
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { cn, timeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { Project, Task, Milestone, Phase, ActivityFeedItem, ProjectMember, SquadMember, Post } from "@/lib/types";

type Tab = "overview" | "missions" | "phases" | "chat" | "squad" | "activity";

const demoPhases: Milestone[] = [
  { id: "m1", run_id: "p1", title: "Planning", description: "Define scope and requirements", status: "completed", sort_order: 0, created_at: "", updated_at: "" },
  { id: "m2", run_id: "p1", title: "Design", description: "UI/UX wireframes and mockups", status: "active", sort_order: 1, created_at: "", updated_at: "" },
  { id: "m3", run_id: "p1", title: "Development", description: "Core feature implementation", status: "not_started", sort_order: 2, created_at: "", updated_at: "" },
  { id: "m4", run_id: "p1", title: "Testing", description: "QA and bug fixes", status: "not_started", sort_order: 3, created_at: "", updated_at: "" },
  { id: "m5", run_id: "p1", title: "Launch", description: "Deploy and go live", status: "not_started", sort_order: 4, created_at: "", updated_at: "" },
];

const demoActivity: ActivityFeedItem[] = [
  { id: "a1", run_id: "p1", user_id: "demo-1", type: "mission_completed", message: "sarahkim completed \"Design UI mockups in Figma\"", created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: "a2", run_id: "p1", user_id: "demo-2", type: "mission_started", message: "jamesliu started \"Set up database schema\"", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "a3", run_id: "p1", user_id: "demo-1", type: "phase_completed", message: "Planning phase completed 🎉", created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: "a4", run_id: "p1", user_id: "demo-3", type: "squad_joined", message: "priyapatel joined the squad", created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

const demoMissions: Task[] = [
  { id: "t1", run_id: "p1", title: "Design UI mockups in Figma", description: "Create high-fidelity mockups for the main screens", phase_id: null, status: "completed", priority: "high", assigned_to: "demo-1", xp_value: 50, deadline: null, created_at: "", updated_at: "" },
  { id: "t2", run_id: "p1", title: "Set up database schema", description: "Design PostgreSQL schema with Prisma", phase_id: null, status: "active", priority: "high", assigned_to: null, xp_value: 40, deadline: null, created_at: "", updated_at: "" },
  { id: "t3", run_id: "p1", title: "Implement auth system", description: "OAuth + JWT authentication", phase_id: null, status: "pending", priority: "medium", assigned_to: null, xp_value: 30, deadline: null, created_at: "", updated_at: "" },
];

const demoPosts: Post[] = [
  { id: "p1", run_id: "p1", user_id: "demo-1", content: "Just finished the Figma mockups! Check them out in the design channel.", created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: "p2", run_id: "p1", user_id: "demo-2", content: "Database schema is ready. Moving on to API endpoints next.", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
];

const demoMembers: ProjectMember[] = [
  { id: "m1", run_id: "p1", user_id: "demo-1", squad_role: "leader", joined_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), user: { id: "demo-1", email: "sarah@example.com", username: "sarahkim", avatar_url: null, bio: null, skills: [], role: "user", reputation_score: 85, xp: 1020, level: 5, created_at: "" } },
  { id: "m2", run_id: "p1", user_id: "demo-2", squad_role: "member", joined_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), user: { id: "demo-2", email: "james@example.com", username: "jamesliu", avatar_url: null, bio: null, skills: [], role: "user", reputation_score: 72, xp: 864, level: 4, created_at: "" } },
  { id: "m3", run_id: "p1", user_id: "demo-3", squad_role: "member", joined_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), user: { id: "demo-3", email: "priya@example.com", username: "priyapatel", avatar_url: null, bio: null, skills: [], role: "user", reputation_score: 67, xp: 804, level: 4, created_at: "" } },
];

const demoProject: Project = {
  id: "p1", challenge_id: "1", name: "AI Pair Programmer Run",
  description: "Squad building an AI-powered pair programming tool.",
  status: "active", completed_at: null, progress_pct: 42, xp_earned: 210,
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
  members: demoMembers,
};

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "missions", label: "Missions", icon: Swords },
  { id: "phases", label: "Phases", icon: Flag },
  { id: "chat", label: "Squad Chat", icon: MessageSquare },
  { id: "squad", label: "Squad", icon: Users },
  { id: "activity", label: "Activity", icon: Activity },
];

const MISSION_STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20",
  active: "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20",
  completed: "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20",
};

const PHASE_STATUS_STYLES: Record<string, string> = {
  not_started: "bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20",
  active: "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20",
  completed: "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20",
};

export default function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [missions, setMissions] = useState<Task[]>([]);
  const [phases, setPhases] = useState<Milestone[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activity, setActivity] = useState<ActivityFeedItem[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [newPost, setNewPost] = useState("");
  const [showNewMission, setShowNewMission] = useState(false);
  const [newMissionTitle, setNewMissionTitle] = useState("");
  const [newMissionPriority, setNewMissionPriority] = useState<"low" | "medium" | "high">("medium");
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase.from("challenge_runs").select("*, members:run_members(*, user:users!run_members_user_id_fkey(*))").eq("id", id).single();
        if (data) setProject(data);
        const [tasksRes, milestonesRes, postsRes, activityRes] = await Promise.all([
          supabase.from("missions").select("*").eq("run_id", id).order("created_at", { ascending: true }),
          supabase.from("phases").select("*").eq("run_id", id).order("sort_order", { ascending: true }),
          supabase.from("posts").select("*").eq("run_id", id).order("created_at", { ascending: false }),
          supabase.from("activity_feed").select("*").eq("run_id", id).order("created_at", { ascending: false }).limit(20),
        ]);
        setMissions((tasksRes.data as Task[]) ?? []);
        setPhases((milestonesRes.data as Milestone[]) ?? []);
        setPosts((postsRes.data as Post[]) ?? []);
        setActivity((activityRes.data as ActivityFeedItem[]) ?? []);
      } catch { setProject(demoProject); setMissions(demoMissions); setPhases(demoPhases); setPosts(demoPosts); setActivity(demoActivity); setMembers(demoMembers); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const addMission = async () => {
    if (!newMissionTitle.trim()) return;
    const mission: Task = { id: crypto.randomUUID(), run_id: id, title: newMissionTitle, description: null, phase_id: null, status: "pending", priority: newMissionPriority, assigned_to: null, xp_value: 20, deadline: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setMissions([...missions, mission]);
    setNewMissionTitle(""); setNewMissionPriority("medium"); setShowNewMission(false);
    try { const supabase = createClient(); await supabase.from("tasks").insert({ run_id: id, title: newMissionTitle, priority: newMissionPriority }); }
    catch {}
  };

  const addPost = async () => {
    if (!newPost.trim() || !user) return;
    const post: Post = { id: crypto.randomUUID(), run_id: id, user_id: user.id, content: newPost, created_at: new Date().toISOString(), user };
    setPosts([post, ...posts]); setNewPost("");
    try { const supabase = createClient(); await supabase.from("posts").insert({ run_id: id, content: newPost }); }
    catch {}
  };

  const completeProject = async () => {
    if (!project) return;
    setCompleting(true);
    try { const supabase = createClient(); await supabase.rpc("complete_run", { p_run_id: id }); router.push(`/projects/${id}`); }
    catch (err: any) { alert(err?.message || "Failed to complete run"); }
    finally { setCompleting(false); }
  };

  const claimMission = async (missionId: string) => {
    if (!user) return;
    setMissions(missions.map((m) => m.id === missionId ? { ...m, assigned_to: user.id, status: "active" } : m));
    try { const supabase = createClient(); await supabase.rpc("claim_mission", { p_mission_id: missionId }); }
    catch {}
  };

  const currentMembers = members.length > 0 ? members : (project?.members ?? []);
  const isOwner = user && currentMembers.some((m) => m.user_id === user.id && m.squad_role === "leader");

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <div className="w-10 h-10 border-2 border-[#FF3366]/30 border-t-[#FF3366] rounded-full animate-spin mx-auto mb-4" />
      <p className="text-[#94A3B8] text-sm">Loading run…</p>
    </div>
  );

  if (!project) return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <p className="text-2xl mb-2">🔍</p>
      <h2 className="text-lg font-bold text-white mb-2">Run not found</h2>
      <Link href="/projects" className="text-sm font-bold text-[#FF3366] hover:underline">← Back to Runs</Link>
    </div>
  );

  const doneMissions = missions.filter((m) => m.status === "completed").length;
  const totalMissions = missions.length || 1;
  const progress = Math.round((doneMissions / totalMissions) * 100);
  const completedPhases = phases.filter((p) => p.status === "completed").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-5 sm:mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />Back to Runs
        </Link>

        {/* Header */}
        <div className="glass-dark rounded-2xl border border-white/[0.06] overflow-hidden mb-6">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FF3366] via-[#FF6B9D] to-[#A855F7]" />
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">{project.name}</h1>
                <p className="text-[#94A3B8] text-sm">{project.description}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                <span className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20">
                  <Flame className="w-3 h-3" />{project.status}
                </span>
                {isOwner && project.status === "active" && (
                  <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}} onClick={completeProject} disabled={completing}
                    className="flex items-center gap-1.5 bg-gradient-hero text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-[#FF3366]/20 cursor-pointer disabled:opacity-50"
                  ><Trophy className="w-4 h-4" />{completing ? "Completing…" : "Complete Run"}</motion.button>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-[#94A3B8] font-medium">Run Progress</span>
                <span className="font-bold text-[#00E5FF]">{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-[#FF3366] to-[#A855F7] rounded-full" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Swords, label: "Missions", value: `${doneMissions}/${totalMissions}` },
                { icon: Flag, label: "Phases", value: `${completedPhases}/${phases.length || 1}` },
                { icon: Users, label: "Squad", value: `${currentMembers.length}` },
                { icon: Zap, label: "XP Earned", value: `${project.xp_earned ?? 0}` },
              ].map((stat) => (
                <div key={stat.label} className="glass-dark rounded-xl p-3 border border-white/[0.04] text-center">
                  <stat.icon className="w-4 h-4 text-[#FF3366] mx-auto mb-1.5" />
                  <p className="text-lg font-black text-white">{stat.value}</p>
                  <p className="text-[10px] text-[#64748B] uppercase tracking-wider font-bold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 glass-dark rounded-2xl border border-white/[0.06] p-1 mb-6 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id ? "bg-gradient-hero text-white shadow-lg shadow-[#FF3366]/20" : "text-[#64748B] hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>

            {/* Overview */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                <div className="glass-dark rounded-2xl border border-white/[0.06] p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Swords className="w-4 h-4 text-[#FF3366]" />Active Missions</h3>
                  {missions.filter((m) => m.status !== "completed").length === 0 ? (
                    <p className="text-sm text-[#64748B]">All missions completed! 🎉</p>
                  ) : (
                    <div className="space-y-3">
                      {missions.filter((m) => m.status !== "completed").slice(0, 5).map((mission) => (
                        <div key={mission.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", mission.priority === "high" ? "bg-[#FF3366]" : mission.priority === "medium" ? "bg-[#FFD700]" : "bg-[#00E5FF]")} />
                            <div>
                              <p className="text-sm font-semibold text-white">{mission.title}</p>
                              <p className="text-xs text-[#64748B]">{mission.assigned_to ? "In progress" : "Unassigned"} · {mission.xp_value ?? 0} XP</p>
                            </div>
                          </div>
                          {!mission.assigned_to && (
                            <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => claimMission(mission.id)}
                              className="px-3 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-bold rounded-lg border border-[#00E5FF]/20 hover:bg-[#00E5FF]/20 transition-colors cursor-pointer"
                            >Claim</motion.button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="glass-dark rounded-2xl border border-white/[0.06] p-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Flag className="w-4 h-4 text-[#FF3366]" />Phase Progress</h3>
                  <div className="space-y-4">
                    {phases.map((phase, i) => (
                      <div key={phase.id} className="flex items-center gap-4">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          phase.status === "completed" ? "bg-[#00FFA3]/10 text-[#00FFA3]" : phase.status === "active" ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "bg-white/[0.03] text-[#64748B]"
                        )}>{phase.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}</div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white">{phase.title}</p>
                          <p className="text-xs text-[#64748B]">{phase.description}</p>
                        </div>
                        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border", PHASE_STATUS_STYLES[phase.status])}>{phase.status === "not_started" ? "Pending" : phase.status}</span>
                      </div>
                    ))}
                    {phases.length === 0 && <p className="text-sm text-[#64748B]">No phases defined yet.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Missions */}
            {activeTab === "missions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2"><Swords className="w-4 h-4 text-[#FF3366]" />Squad Missions</h3>
                  {isOwner && (
                    <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}} onClick={() => setShowNewMission(true)}
                      className="flex items-center gap-1.5 bg-gradient-hero text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-[#FF3366]/20 cursor-pointer"
                    ><Plus className="w-4 h-4" />New Mission</motion.button>
                  )}
                </div>
                <div className="space-y-3">
                  {missions.map((mission) => (
                    <motion.div key={mission.id} whileHover={{ y: -2 }} className="glass-dark rounded-xl border border-white/[0.06] p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", mission.priority === "high" ? "bg-[#FF3366]" : mission.priority === "medium" ? "bg-[#FFD700]" : "bg-[#00E5FF]")} />
                          <div>
                            <p className="text-sm font-semibold text-white">{mission.title}</p>
                            {mission.description && <p className="text-xs text-[#64748B] mt-0.5">{mission.description}</p>}
                            <div className="flex items-center gap-3 mt-2">
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", MISSION_STATUS_STYLES[mission.status])}>{mission.status}</span>
                              <span className="text-[10px] text-[#64748B] font-medium flex items-center gap-1"><Zap className="w-3 h-3 text-[#FFD700]" />{mission.xp_value ?? 0} XP</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          {mission.assigned_to ? (
                            <div className="flex items-center gap-1.5">
                              <Avatar src={currentMembers.find((m) => m.user_id === mission.assigned_to)?.user?.avatar_url} name={currentMembers.find((m) => m.user_id === mission.assigned_to)?.user?.username || "User"} size="sm" />
                              <span className="text-xs text-[#94A3B8]">{currentMembers.find((m) => m.user_id === mission.assigned_to)?.user?.username}</span>
                            </div>
                          ) : (
                            <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => claimMission(mission.id)}
                              className="px-3 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-bold rounded-lg border border-[#00E5FF]/20 hover:bg-[#00E5FF]/20 transition-colors cursor-pointer"
                            >Claim</motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {missions.length === 0 && <p className="text-sm text-[#64748B] text-center py-12">No missions yet. Add one to get started!</p>}
                </div>
              </div>
            )}

            {/* Phases */}
            {activeTab === "phases" && (
              <div className="space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2"><Flag className="w-4 h-4 text-[#FF3366]" />Run Phases</h3>
                <div className="space-y-3">
                  {phases.map((phase, i) => (
                    <motion.div key={phase.id} whileHover={{ y: -2 }} className="glass-dark rounded-xl border border-white/[0.06] p-5">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          phase.status === "completed" ? "bg-[#00FFA3]/10 text-[#00FFA3]" : phase.status === "active" ? "bg-[#00E5FF]/10 text-[#00E5FF]" : "bg-white/[0.03] text-[#64748B]"
                        )}>{phase.status === "completed" ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-sm font-black">{i + 1}</span>}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-bold text-white">{phase.title}</p>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", PHASE_STATUS_STYLES[phase.status])}>{phase.status === "not_started" ? "Pending" : phase.status}</span>
                          </div>
                          <p className="text-xs text-[#94A3B8]">{phase.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {phases.length === 0 && <p className="text-sm text-[#64748B] text-center py-12">No phases defined yet.</p>}
                </div>
              </div>
            )}

            {/* Chat */}
            {activeTab === "chat" && (
              <div className="glass-dark rounded-2xl border border-white/[0.06] p-6">
                <h3 className="font-bold text-white mb-5 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#FF3366]" />Squad Chat</h3>
                <div className="space-y-4 mb-5 max-h-[500px] overflow-y-auto">
                  {posts.map((post) => (
                    <div key={post.id} className="flex gap-3">
                      <Avatar src={post.user?.avatar_url} name={post.user?.username || "User"} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">{post.user?.username || "User"}</span>
                          <span className="text-xs text-[#64748B]" suppressHydrationWarning>{timeAgo(post.created_at)}</span>
                        </div>
                        <p className="text-sm text-[#94A3B8] bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">{post.content}</p>
                      </div>
                    </div>
                  ))}
                  {posts.length === 0 && <p className="text-sm text-[#64748B] text-center py-8">No messages yet. Start the conversation!</p>}
                </div>
                {user ? (
                  <div className="relative">
                    <input type="text" placeholder="Message your squad…" value={newPost} onChange={(e) => setNewPost(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addPost(); }}
                      className="w-full h-12 pl-4 pr-14 rounded-xl border border-white/[0.06] bg-white/[0.02] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/30 transition-all text-sm"
                    />
                    <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}} onClick={addPost}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-hero text-white rounded-lg cursor-pointer"
                    ><Send className="w-4 h-4" /></motion.button>
                  </div>
                ) : (
                  <p className="text-sm text-[#64748B] text-center">Sign in to join the conversation</p>
                )}
              </div>
            )}

            {/* Squad */}
            {activeTab === "squad" && (
              <div className="glass-dark rounded-2xl border border-white/[0.06] p-6">
                <h3 className="font-bold text-white mb-5 flex items-center gap-2"><Users className="w-4 h-4 text-[#FF3366]" />Squad Members</h3>
                <div className="space-y-3">
                  {currentMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-3">
                        <Avatar src={member.user?.avatar_url} name={member.user?.username || "User"} size="md" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-white">{member.user?.username}</p>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                              member.squad_role === "leader" ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20" : "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20"
                            )}>{member.squad_role}</span>
                          </div>
                          <p className="text-xs text-[#64748B]">Level {member.user?.level ?? 1} · {member.user?.xp ?? 0} XP</p>
                        </div>
                      </div>
                      <span className="text-xs text-[#64748B]">Joined {timeAgo(member.joined_at)}</span>
                    </div>
                  ))}
                  {currentMembers.length === 0 && <p className="text-sm text-[#64748B] text-center py-8">No squad members yet.</p>}
                </div>
              </div>
            )}

            {/* Activity */}
            {activeTab === "activity" && (
              <div className="glass-dark rounded-2xl border border-white/[0.06] p-6">
                <h3 className="font-bold text-white mb-5 flex items-center gap-2"><Activity className="w-4 h-4 text-[#FF3366]" />Activity Feed</h3>
                <div className="space-y-1">
                  {activity.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                    >
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                        item.type === "mission_completed" ? "bg-[#00FFA3]/10" : item.type === "phase_completed" ? "bg-[#FF3366]/10" : item.type === "squad_joined" ? "bg-[#00E5FF]/10" : "bg-white/[0.03]"
                      )}>
                        {item.type === "mission_completed" || item.type === "mission_started" || item.type === "mission_claimed"
                          ? <Swords className={cn("w-4 h-4", item.type === "mission_completed" ? "text-[#00FFA3]" : "text-[#FFD700]")} />
                          : item.type === "phase_completed" ? <Flag className="w-4 h-4 text-[#FF3366]" />
                          : item.type === "squad_joined" ? <Users className="w-4 h-4 text-[#00E5FF]" />
                          : <Rocket className="w-4 h-4 text-[#FF3366]" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#94A3B8] font-medium">{item.message}</p>
                        <p className="text-xs text-[#64748B] mt-0.5" suppressHydrationWarning>{timeAgo(item.created_at)}</p>
                      </div>
                    </motion.div>
                  ))}
                  {activity.length === 0 && <p className="text-sm text-[#64748B] text-center py-8">No activity yet.</p>}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* New Mission Modal */}
      <Modal isOpen={showNewMission} onClose={() => setShowNewMission(false)} title="New Mission">
        <div className="space-y-4">
          <Input label="Mission Title" placeholder="What needs to be done?" value={newMissionTitle} onChange={(e) => setNewMissionTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addMission(); }} />
          <div>
            <label className="block text-sm font-bold text-white mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setNewMissionPriority(p)}
                  className={cn("flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer capitalize",
                    newMissionPriority === p
                      ? p === "high" ? "border-[#FF3366]/30 bg-[#FF3366]/10 text-[#FF3366]"
                        : p === "medium" ? "border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700]"
                        : "border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF]"
                      : "border-white/[0.06] text-[#64748B] hover:border-white/[0.12]"
                  )}
                >{p}</button>
              ))}
            </div>
          </div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={addMission}
            className="w-full bg-gradient-hero text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#FF3366]/20 cursor-pointer"
          >Add Mission</motion.button>
        </div>
      </Modal>
    </div>
  );
}
