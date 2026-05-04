"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListTodo, FolderKanban, CheckCircle2, Clock,
  Circle, Star, Zap, Target, TrendingUp, Briefcase,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn, timeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { Task, Project, IdeaApplication, Idea } from "@/lib/types";

type Tab = "tasks" | "projects" | "applications" | "my-ideas";

const demoTasks: Task[] = [
  { id: "t2", project_id: "p1", milestone_id: null, title: "Set up database schema", description: null, completed: false, status: "in_progress", priority: "high", assigned_to: "me", deadline: null, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
  { id: "t3", project_id: "p1", milestone_id: null, title: "Implement authentication flow", description: null, completed: false, status: "todo", priority: "medium", assigned_to: "me", deadline: null, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
  { id: "t1", project_id: "p2", milestone_id: null, title: "Design landing page", description: null, completed: true, status: "done", priority: "low", assigned_to: "me", deadline: null, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
];

const demoProjects: (Project & { progress: number })[] = [
  { id: "p1", idea_id: "1", name: "AI Study Companion", description: "Intelligent study app with personalised learning", status: "active", progress: 40, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
  { id: "p2", idea_id: "2", name: "EcoTrack", description: "Carbon footprint tracking platform", status: "active", progress: 15, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date().toISOString() },
];

const demoApplications: IdeaApplication[] = [
  { id: "a1", idea_id: "3", user_id: "me", role_id: null, role_name: "Frontend Developer", message: "I have 3 years of React experience.", match_score: 82, status: "pending", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), idea_title: "HealthHub – Smart Clinic Management" },
  { id: "a2", idea_id: "4", user_id: "me", role_id: null, role_name: "Full-Stack Developer", message: "Excited about this idea!", match_score: 65, status: "accepted", created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), idea_title: "DevCollab – Open Source Marketplace" },
];

const taskStatusConfig = {
  todo: { icon: Circle, label: "To Do", color: "text-[#94A3B8]", bg: "bg-[#F7F7F9]" },
  in_progress: { icon: Clock, label: "In Progress", color: "text-amber-500", bg: "bg-amber-50" },
  done: { icon: CheckCircle2, label: "Done", color: "text-emerald-500", bg: "bg-emerald-50" },
};

export default function MyWorkPage() {
  const user = useAppStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>("my-ideas");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [applications, setApplications] = useState<IdeaApplication[]>([]);
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // user is null on first render while layout fetches auth — wait for it
    if (user === null && !dataLoaded) return;
    if (user === null) {
      // confirmed logged out — show demo
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
          supabase.rpc("get_my_tasks"),
          supabase.from("project_members").select("project:projects(*)").eq("user_id", user.id),
          supabase.from("idea_applications").select("*, idea:ideas(id, title)").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("ideas").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }),
        ]);
        setTasks(tasksRes.data ?? []);
        setProjects((membersRes.data ?? []).map((r: any) => ({ ...r.project, progress: 0 })));

        const rawApps = (appsRes.data ?? []) as any[];
        const acceptedIdeaIds = rawApps.filter((a) => a.status === "accepted").map((a) => a.idea_id);
        let projectIdMap: Record<string, string> = {};
        if (acceptedIdeaIds.length > 0) {
          const { data: projData } = await supabase
            .from("projects")
            .select("id, idea_id")
            .in("idea_id", acceptedIdeaIds);
          if (projData) {
            projectIdMap = Object.fromEntries(projData.map((p: any) => [p.idea_id, p.id]));
          }
        }
        setApplications(rawApps.map((a: any) => ({
          ...a,
          idea_title: a.idea?.title,
          project_id: projectIdMap[a.idea_id] ?? null,
        })));
        setMyIdeas(ideasRes.data ?? []);
      } catch {
        // network error — show demo as fallback
        setTasks(demoTasks);
        setProjects(demoProjects);
        setApplications(demoApplications);
      } finally {
        setDataLoaded(true);
      }
    };
    load();
  }, [user]);

  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const todo = tasks.filter((t) => t.status === "todo").length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "tasks", label: "My Tasks", icon: ListTodo, count: tasks.length },
    { id: "projects", label: "My Projects", icon: FolderKanban, count: projects.length },
    { id: "my-ideas", label: "My Ideas", icon: Zap, count: myIdeas.length },
    { id: "applications", label: "Applications", icon: Briefcase, count: applications.length },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 gradient-bg rounded-2xl flex items-center justify-center shadow-md shadow-red-200/40">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0A0A0F] tracking-tight">My Work</h1>
              <p className="text-sm text-[#9CA3AF]">Track your tasks, projects, and applications</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { label: "To Do", count: todo, icon: Circle, color: "text-[#6B7280]", accent: "from-gray-100 to-slate-100", num: "text-[#374151]" },
            { label: "In Progress", count: inProgress, icon: Clock, color: "text-amber-500", accent: "from-amber-50 to-orange-50", num: "text-amber-600" },
            { label: "Done", count: done, icon: CheckCircle2, color: "text-emerald-500", accent: "from-emerald-50 to-teal-50", num: "text-emerald-600" },
            { label: "My Ideas", count: myIdeas.length, icon: Zap, color: "text-[#FF2D2D]", accent: "from-red-50 to-orange-50", num: "text-[#FF2D2D]" },
          ].map((stat) => (
            <motion.div key={stat.label} whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className={cn("rounded-3xl p-5 flex flex-col gap-2 bg-gradient-to-br border border-white/80", stat.accent)}
              style={{boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}
            >
              <stat.icon className={cn("w-5 h-5", stat.color)} />
              <p className={cn("text-3xl font-black", stat.num)}>{stat.count}</p>
              <p className="text-xs font-semibold text-[#9CA3AF]">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 glass-strong rounded-2xl border border-white/80 p-1 sm:p-1.5 mb-5 sm:mb-6 overflow-x-auto scrollbar-hide"
          style={{boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
          {tabs.map((tab) => (
            <motion.button key={tab.id} whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap flex-shrink-0",
                activeTab === tab.id
                  ? "gradient-bg text-white shadow-md shadow-red-200/60"
                  : "text-[#9CA3AF] hover:text-[#0A0A0F] hover:bg-black/[0.04]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-black/[0.05] text-[#9CA3AF]"
              )}>
                {tab.count}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="space-y-4">
                {(["in_progress", "todo", "done"] as const).map((status) => {
                  const config = taskStatusConfig[status];
                  const statusTasks = tasks.filter((t) => t.status === status);
                  return (
                    <div key={status}>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <config.icon className={cn("w-4 h-4", config.color)} />
                        <span className="text-sm font-semibold text-[#0F172A]">{config.label}</span>
                        <span className="text-xs text-[#94A3B8] bg-[#F7F7F9] px-2 py-0.5 rounded-full">{statusTasks.length}</span>
                      </div>
                      <div className="space-y-2">
                        {statusTasks.map((task, i) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Link
                              href={`/projects/${task.project_id}`}
                              className="flex items-center gap-3 p-4 glass-strong rounded-2xl border border-white/80 hover:border-[#FF2D2D]/20 hover:shadow-md transition-all group"
                              style={{boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}
                            >
                              <config.icon className={cn("w-5 h-5 flex-shrink-0", config.color)} />
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  "text-sm font-semibold",
                                  status === "done" ? "line-through text-[#9CA3AF]" : "text-[#0A0A0F]"
                                )}>
                                  {task.title}
                                </p>
                                <p className="text-xs text-[#9CA3AF] mt-0.5" suppressHydrationWarning>{timeAgo(task.created_at)}</p>
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-full border",
                                task.priority === "high" ? "bg-red-50 text-red-500 border-red-100" :
                                task.priority === "medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                "bg-gray-100 text-gray-500 border-gray-200"
                              )}>
                                {task.priority}
                              </span>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {tasks.length === 0 && (
                  <div className="text-center py-16">
                    <ListTodo className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#94A3B8] font-medium">No tasks assigned yet</p>
                    <p className="text-sm text-[#CBD5E1] mt-1">Join a project and claim tasks</p>
                  </div>
                )}
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div className="space-y-3">
                {projects.map((project, i) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/projects/${project.id}`}>
                      <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                        className="block p-5 glass-strong rounded-2xl border border-white/80 hover:border-[#FF2D2D]/20 transition-all group"
                        style={{boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md shadow-red-200/40">
                              {project.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-[#0A0A0F] group-hover:text-[#FF2D2D] transition-colors">{project.name}</p>
                              <p className="text-xs text-[#9CA3AF] mt-0.5">{project.description}</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Active
                          </span>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="flex items-center gap-1 text-[#9CA3AF] font-medium">
                              <TrendingUp className="w-3 h-3" />Progress
                            </span>
                            <span className="font-bold text-[#FF2D2D]">{project.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full gradient-bg rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
                {projects.length === 0 && (
                  <div className="text-center py-16">
                    <FolderKanban className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#94A3B8] font-medium">No active projects</p>
                    <p className="text-sm text-[#CBD5E1] mt-1">Apply to an idea to join a team</p>
                    <Link href="/ideas" className="inline-block mt-4 px-5 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl shadow-md shadow-red-200 hover:shadow-lg transition-all">
                      Browse Ideas
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* My Ideas Tab */}
            {activeTab === "my-ideas" && (
              <div className="space-y-3">
                {myIdeas.map((idea, i) => {
                  const fillPct = idea.max_members > 0 ? Math.round((idea.current_members / idea.max_members) * 100) : 0;
                  const statusStyles: Record<string, string> = {
                    open: "bg-emerald-50 text-emerald-600 border-emerald-100",
                    full: "bg-blue-50 text-blue-600 border-blue-100",
                    closed: "bg-gray-100 text-gray-500 border-gray-200",
                  };
                  return (
                    <motion.div key={idea.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href={`/ideas/${idea.id}`}>
                        <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                          className="block p-5 glass-strong rounded-2xl border border-white/80 hover:border-[#FF2D2D]/20 transition-all group"
                          style={{boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0 pr-3">
                              <p className="font-bold text-[#0A0A0F] group-hover:text-[#FF2D2D] transition-colors truncate">{idea.title}</p>
                              <p className="text-xs text-[#9CA3AF] mt-0.5 line-clamp-1">{idea.description}</p>
                            </div>
                            <span className={cn("flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border", statusStyles[idea.status] ?? statusStyles.open)}>
                              {idea.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#9CA3AF] font-medium">{idea.current_members}/{idea.max_members} members</span>
                                <span className="font-bold text-[#FF2D2D]">{fillPct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  className="h-full gradient-bg rounded-full"
                                />
                              </div>
                            </div>
                            {idea.category && (
                              <span className="flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 bg-black/[0.04] text-[#6B7280] rounded-full border border-black/[0.06]">
                                {idea.category}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  );
                })}
                {myIdeas.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 glass-strong rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/80">
                      <Zap className="w-6 h-6 text-[#9CA3AF]" />
                    </div>
                    <p className="text-[#374151] font-bold mb-1">No ideas posted yet</p>
                    <p className="text-sm text-[#9CA3AF] mb-5">Share your vision and find your dream team</p>
                    <Link href="/ideas/new">
                      <motion.button whileHover={{scale:1.04, boxShadow:"0 6px 20px rgba(255,45,45,0.25)"}} whileTap={{scale:0.97}}
                        className="gradient-bg text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-red-200/40 cursor-pointer"
                      >Post an Idea</motion.button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === "applications" && (
              <div className="space-y-3">
                {applications.map((app, i) => (
                  <motion.div key={app.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 glass-strong rounded-2xl border border-white/80"
                    style={{boxShadow:"0 1px 6px rgba(0,0,0,0.04)"}}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-[#0A0A0F] text-sm">{app.idea_title ?? "Idea"}</p>
                        {app.role_name && (
                          <span className="text-xs bg-[#FFF0F0] text-[#FF2D2D] px-2 py-0.5 rounded-full font-semibold mt-1.5 inline-block border border-red-100">
                            {app.role_name}
                          </span>
                        )}
                      </div>
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full border",
                        app.status === "accepted" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        app.status === "rejected" ? "bg-red-50 text-red-500 border-red-100" :
                        "bg-amber-50 text-amber-600 border-amber-100"
                      )}>{app.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className={cn("w-3.5 h-3.5",
                          app.match_score >= 70 ? "text-emerald-500" :
                          app.match_score >= 40 ? "text-amber-500" : "text-[#9CA3AF]"
                        )} />
                        <span className={cn("text-xs font-bold",
                          app.match_score >= 70 ? "text-emerald-600" :
                          app.match_score >= 40 ? "text-amber-500" : "text-[#9CA3AF]"
                        )}>{app.match_score}% match</span>
                      </div>
                      <span className="text-xs text-[#9CA3AF]" suppressHydrationWarning>{timeAgo(app.created_at)}</span>
                    </div>
                    {app.status === "accepted" && (
                      <div className="mt-3 pt-3 border-t border-black/[0.05]">
                        <Link
                          href={app.project_id ? `/projects/${app.project_id}` : `/ideas/${app.idea_id}`}
                          className="flex items-center gap-1 text-xs text-[#FF2D2D] font-bold hover:underline"
                        >
                          <Zap className="w-3 h-3" />{app.project_id ? "Open Project" : "View Idea"}
                        </Link>
                      </div>
                    )}
                  </motion.div>
                ))}
                {applications.length === 0 && (
                  <div className="text-center py-16">
                    <Briefcase className="w-12 h-12 text-[#E2E8F0] mx-auto mb-4" />
                    <p className="text-[#94A3B8] font-medium">No applications yet</p>
                    <p className="text-sm text-[#CBD5E1] mt-1">Browse ideas and apply to join a team</p>
                    <Link href="/ideas" className="inline-block mt-4 px-5 py-2.5 gradient-bg text-white text-sm font-semibold rounded-xl shadow-md shadow-red-200 hover:shadow-lg transition-all">
                      Browse Ideas
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
