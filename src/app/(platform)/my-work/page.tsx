"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListTodo, FolderKanban, CheckCircle2, Clock,
  Circle, Star, Zap, Target, TrendingUp, Briefcase,
  Swords, Flame, Crosshair
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { Task, Project, IdeaApplication, Idea } from "@/lib/types";

type Tab = "missions" | "runs" | "applications" | "my-challenges";

const demoTasks: Task[] = [
  { id: "t2", run_id: "p1", phase_id: null, title: "Set up database schema", description: null, status: "active", priority: "high", assigned_to: "me", xp_value: 40, deadline: null, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
  { id: "t3", run_id: "p1", phase_id: null, title: "Implement authentication flow", description: null, status: "pending", priority: "medium", assigned_to: "me", xp_value: 30, deadline: null, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
  { id: "t1", run_id: "p2", phase_id: null, title: "Design landing page", description: null, status: "completed", priority: "low", assigned_to: "me", xp_value: 25, deadline: null, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
];

const demoProjects: Project[] = [
  { id: "p1", challenge_id: "1", name: "AI Study Companion", description: "Intelligent study app with personalised learning", status: "active", completed_at: null, progress_pct: 40, xp_earned: 120, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
  { id: "p2", challenge_id: "2", name: "EcoTrack", description: "Carbon footprint tracking platform", status: "active", completed_at: null, progress_pct: 15, xp_earned: 45, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
];

const demoApplications: IdeaApplication[] = [
  { id: "a1", challenge_id: "3", user_id: "me", role_id: null, role_name: "Frontend Developer", message: "I have 3 years of React experience.", match_score: 82, status: "pending", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "a2", challenge_id: "4", user_id: "me", role_id: null, role_name: "Full-Stack Developer", message: "Excited about this challenge!", match_score: 65, status: "accepted", created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
];

const taskStatusConfig = {
  pending: { icon: Circle, label: "To Do", color: "text-[#94A3B8]", bg: "bg-[#0F111A]" },
  active: { icon: Clock, label: "In Progress", color: "text-[#FFD700]", bg: "bg-[#FFD700]/5" },
  completed: { icon: CheckCircle2, label: "Done", color: "text-[#00FFA3]", bg: "bg-[#00FFA3]/5" },
};

export default function MyWorkPage() {
  const user = useAppStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>("my-challenges");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<IdeaApplication[]>([]);
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (user === null && !dataLoaded) return;
    if (user === null) {
      setTasks(demoTasks);
      setProjects(demoProjects);
      setApplications(demoApplications);
      setDataLoaded(true);
      return;
    }
    const load = async () => {
      try {
        const supabase = createClient();
        const [tasksRes, membersRes, appsRes, ideasRes] = await Promise.all([
          supabase.rpc("get_my_missions"),
          supabase.from("run_members").select("run:challenge_runs(*)").eq("user_id", user.id),
          supabase.from("challenge_applications").select("*, challenge:challenges(id, title)").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("challenges").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }),
        ]);
        setTasks(tasksRes.data ?? []);
        setProjects((membersRes.data ?? []).map((r: any) => ({ ...r.run, progress_pct: r.run?.progress_pct ?? 0 })));
        setApplications((appsRes.data ?? []) as IdeaApplication[]);
        setMyIdeas(ideasRes.data ?? []);
      } catch {
        setTasks(demoTasks);
        setProjects(demoProjects);
        setApplications(demoApplications);
      } finally {
        setDataLoaded(true);
      }
    };
    load();
  }, [user]);

  const inProgress = tasks.filter((t) => t.status === "active").length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const todo = tasks.filter((t) => t.status === "pending").length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "missions", label: "Missions", icon: Swords, count: tasks.length },
    { id: "runs", label: "My Runs", icon: Flame, count: projects.length },
    { id: "my-challenges", label: "My Challenges", icon: Crosshair, count: myIdeas.length },
    { id: "applications", label: "Applications", icon: Briefcase, count: applications.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#FF3366] to-[#A855F7] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF3366]/20">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">My Work</h1>
              <p className="text-sm text-[#64748B]">Track your missions, runs, and applications</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "To Do", count: todo, icon: Circle, color: "text-[#94A3B8]", accent: "from-[#0F111A] to-[#151725]", num: "text-white" },
            { label: "In Progress", count: inProgress, icon: Clock, color: "text-[#FFD700]", accent: "from-[#FFD700]/5 to-[#FFA500]/5", num: "text-[#FFD700]" },
            { label: "Done", count: done, icon: CheckCircle2, color: "text-[#00FFA3]", accent: "from-[#00FFA3]/5 to-[#10B981]/5", num: "text-[#00FFA3]" },
            { label: "My Challenges", count: myIdeas.length, icon: Crosshair, color: "text-[#FF3366]", accent: "from-[#FF3366]/5 to-[#FF6B9D]/5", num: "text-[#FF3366]" },
          ].map((stat) => (
            <motion.div key={stat.label} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={cn("rounded-2xl p-5 flex flex-col gap-2 bg-gradient-to-br border border-white/[0.06]", stat.accent)}
            >
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <p className={cn("text-3xl font-black", stat.num)}>{stat.count}</p>
              <p className="text-xs font-semibold text-[#64748B]">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 glass-dark rounded-2xl border border-white/[0.06] p-1 mb-6 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer",
                activeTab === tab.id ? "bg-gradient-hero text-white shadow-lg shadow-[#FF3366]/20" : "text-[#64748B] hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", activeTab === tab.id ? "bg-white/20 text-white" : "bg-white/[0.04] text-[#64748B]")}>{tab.count}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {/* Missions Tab */}
            {activeTab === "missions" && (
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-16 glass-dark rounded-2xl border border-white/[0.06]">
                    <Swords className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No missions yet</p>
                    <p className="text-[#64748B] text-sm">Join a challenge run to get assigned missions</p>
                  </div>
                ) : tasks.map((task) => {
                  const s = taskStatusConfig[task.status as keyof typeof taskStatusConfig] ?? taskStatusConfig.pending;
                  return (
                    <motion.div key={task.id} whileHover={{ y: -2 }} className="glass-dark rounded-2xl border border-white/[0.06] p-4 flex items-start gap-3">
                      <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0",
                        task.priority === "high" ? "bg-[#FF3366]" : task.priority === "medium" ? "bg-[#FFD700]" : "bg-[#00E5FF]"
                      )} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn("text-sm font-semibold", task.status === "completed" ? "text-[#64748B] line-through" : "text-white")}>{task.title}</p>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", s.color.replace("text-", "bg-").replace("[#", "").replace("]", "") + "/10", s.color, "border-current/20")}>
                            {s.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#64748B]">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-[#FFD700]" />{task.xp_value ?? 0} XP</span>
                          <span className="capitalize">{task.priority}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Runs Tab */}
            {activeTab === "runs" && (
              <div className="space-y-3">
                {projects.length === 0 ? (
                  <div className="text-center py-16 glass-dark rounded-2xl border border-white/[0.06]">
                    <Flame className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No active runs</p>
                    <p className="text-[#64748B] text-sm">Join a challenge and start a run</p>
                  </div>
                ) : projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <motion.div whileHover={{ y: -3 }} className="glass-dark rounded-2xl border border-white/[0.06] p-5 cursor-pointer card-hover-glow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-white">{project.name}</h3>
                          <p className="text-sm text-[#64748B] line-clamp-1">{project.description}</p>
                        </div>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          project.status === "active" ? "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20" : "bg-white/[0.03] text-[#64748B] border-white/[0.06]"
                        )}>{project.status}</span>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-[#64748B] font-medium">Progress</span>
                          <span className="font-bold text-[#00E5FF]">{project.progress_pct ?? 0}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#FF3366] to-[#A855F7] rounded-full" style={{ width: `${project.progress_pct ?? 0}%` }} />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            )}

            {/* My Challenges Tab */}
            {activeTab === "my-challenges" && (
              <div className="space-y-3">
                {myIdeas.length === 0 ? (
                  <div className="text-center py-16 glass-dark rounded-2xl border border-white/[0.06]">
                    <Crosshair className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No challenges posted</p>
                    <p className="text-[#64748B] text-sm">Launch your first challenge to recruit a squad</p>
                  </div>
                ) : myIdeas.map((idea) => {
                  const fillPct = idea.max_squad_size > 0 ? Math.round((idea.current_members / idea.max_squad_size) * 100) : 0;
                  return (
                    <Link key={idea.id} href={`/ideas/${idea.id}`}>
                      <motion.div whileHover={{ y: -3 }} className="glass-dark rounded-2xl border border-white/[0.06] p-5 cursor-pointer card-hover-glow">
                        <h3 className="font-bold text-white mb-1">{idea.title}</h3>
                        <p className="text-sm text-[#64748B] line-clamp-1 mb-3">{idea.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#64748B]">{idea.current_members}/{idea.max_squad_size} squad · {fillPct}%</span>
                          <span className={cn("font-bold px-2 py-0.5 rounded-full border text-[10px]",
                            idea.status === "open" ? "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20" :
                            idea.status === "in_progress" ? "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20" :
                            idea.status === "full" ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20" :
                            "bg-white/[0.03] text-[#64748B] border-white/[0.06]"
                          )}>{idea.status === "in_progress" ? "In Progress" : idea.status}</span>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === "applications" && (
              <div className="space-y-3">
                {applications.length === 0 ? (
                  <div className="text-center py-16 glass-dark rounded-2xl border border-white/[0.06]">
                    <Briefcase className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                    <p className="text-white font-bold mb-1">No applications</p>
                    <p className="text-[#64748B] text-sm">Apply to challenges to join a squad</p>
                  </div>
                ) : applications.map((app) => (
                  <motion.div key={app.id} whileHover={{ y: -2 }} className="glass-dark rounded-2xl border border-white/[0.06] p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-white">{app.role_name ?? "General Application"}</h3>
                        <p className="text-sm text-[#64748B]">{app.message}</p>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        app.status === "pending" ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20" :
                        app.status === "accepted" ? "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20" :
                        "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20"
                      )}>{app.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                      <Star className="w-3 h-3 text-[#FFD700]" />
                      <span className="font-bold">{app.match_score}%</span> match score
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
