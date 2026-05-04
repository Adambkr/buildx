"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Send, CheckCircle2, Circle, Clock,
  Users, ListTodo, MessageSquare, BarChart3, Zap,
  Flag, Activity, Target, ChevronRight, UserCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { cn, timeAgo } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { Project, Task, Milestone, ActivityFeedItem, ProjectMember, Post } from "@/lib/types";

type Tab = "overview" | "tasks" | "milestones" | "chat" | "members" | "activity";

const demoMilestones: Milestone[] = [
  { id: "m1", project_id: "p1", title: "Planning", description: "Define scope and requirements", status: "completed", sort_order: 0, created_at: "", updated_at: "" },
  { id: "m2", project_id: "p1", title: "Design", description: "UI/UX wireframes and mockups", status: "active", sort_order: 1, created_at: "", updated_at: "" },
  { id: "m3", project_id: "p1", title: "Development", description: "Core feature implementation", status: "not_started", sort_order: 2, created_at: "", updated_at: "" },
  { id: "m4", project_id: "p1", title: "Testing", description: "QA and bug fixes", status: "not_started", sort_order: 3, created_at: "", updated_at: "" },
  { id: "m5", project_id: "p1", title: "Launch", description: "Deploy and go live", status: "not_started", sort_order: 4, created_at: "", updated_at: "" },
];

const demoActivity: ActivityFeedItem[] = [
  { id: "a1", project_id: "p1", user_id: "demo-1", type: "task_completed", message: "sarahkim completed \"Design UI mockups in Figma\"", created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: "a2", project_id: "p1", user_id: "demo-2", type: "task_started", message: "jamesliu started \"Set up database schema\"", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "a3", project_id: "p1", user_id: "demo-1", type: "milestone_completed", message: "Planning milestone completed 🎉", created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: "a4", project_id: "p1", user_id: "demo-3", type: "member_joined", message: "priyapatel joined the project", created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
];

const demoTasks: Task[] = [
  {
    id: "t1",
    project_id: "p1",
    title: "Design UI mockups in Figma",
    description: "Create high-fidelity mockups for the main screens",
    milestone_id: null,
    completed: true,
    status: "done",
    assigned_to: "demo-1",
    priority: "high",
    deadline: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t2",
    project_id: "p1",
    title: "Set up database schema",
    description: "Design and implement the PostgreSQL schema",
    milestone_id: null,
    completed: false,
    status: "in_progress",
    assigned_to: "demo-2",
    priority: "high",
    deadline: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t3",
    project_id: "p1",
    title: "Implement authentication flow",
    description: "Email/password + OAuth setup",
    milestone_id: null,
    completed: false,
    status: "todo",
    assigned_to: null,
    priority: "medium",
    deadline: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t4",
    project_id: "p1",
    title: "Build AI quiz generator",
    description: "ML model for adaptive quiz generation",
    milestone_id: null,
    completed: false,
    status: "todo",
    assigned_to: null,
    priority: "medium",
    deadline: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "t5",
    project_id: "p1",
    title: "Deploy to production",
    description: "Set up CI/CD and deploy",
    milestone_id: null,
    completed: false,
    status: "todo",
    assigned_to: null,
    priority: "low",
    deadline: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const demoChatMessages: {
  id: string;
  user: { username: string; avatar_url: string | null };
  content: string;
  created_at: string;
}[] = [
  {
    id: "msg1",
    user: { username: "sarahkim", avatar_url: null },
    content: "Hey team! I just pushed the new UI designs. Check them out!",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg2",
    user: { username: "jamesliu", avatar_url: null },
    content: "Looks amazing! I'll start on the database schema today.",
    created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg3",
    user: { username: "sarahkim", avatar_url: null },
    content: "Perfect. Let's aim to have the auth flow done by Friday.",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
];

const taskStatusConfig = {
  todo: { icon: Circle, label: "To Do", color: "text-[#94A3B8]" },
  in_progress: { icon: Clock, label: "In Progress", color: "text-amber-500" },
  done: { icon: CheckCircle2, label: "Done", color: "text-emerald-500" },
};

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const user = useAppStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>(demoMilestones);
  const [activity, setActivity] = useState<ActivityFeedItem[]>(demoActivity);
  const [chatMessages, setChatMessages] = useState<typeof demoChatMessages>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low"|"medium"|"high">("medium");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const supabase = createClient();
        const [projectRes, tasksRes, milestonesRes, activityRes, membersRes, postsRes] = await Promise.all([
          supabase.from("projects").select("*").eq("id", id).single(),
          supabase.from("tasks").select("*").eq("project_id", id).order("created_at", { ascending: true }),
          supabase.from("milestones").select("*").eq("project_id", id).order("sort_order", { ascending: true }),
          supabase.from("activity_feed").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(20),
          supabase.from("project_members").select("*, user:users!project_members_user_id_fkey(*)").eq("project_id", id),
          supabase.from("posts").select("*, user:users!posts_user_id_fkey(*)").eq("project_id", id).order("created_at", { ascending: true }).limit(100),
        ]);

        if (projectRes.data) setProject(projectRes.data);
        if (tasksRes.data) setTasks(tasksRes.data);
        if (milestonesRes.data && milestonesRes.data.length > 0) setMilestones(milestonesRes.data);
        if (activityRes.data && activityRes.data.length > 0) setActivity(activityRes.data);
        if (membersRes.data) setMembers(membersRes.data);
        if (postsRes.data && postsRes.data.length > 0) {
          setChatMessages(postsRes.data.map((p: any) => ({
            id: p.id,
            user: { username: p.user?.username || "User", avatar_url: p.user?.avatar_url || null },
            content: p.content,
            created_at: p.created_at,
          })));
        }
      } catch {
        // Keep demo data on error
      } finally {
        setDataLoaded(true);
      }
    };

    fetchProject();
  }, [id]);

  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const next =
      task.status === "todo" ? "in_progress" :
      task.status === "in_progress" ? "done" : "todo";
    // Optimistic update
    setTasks(tasks.map((t) => t.id === taskId ? { ...t, status: next } : t));
    try {
      const supabase = createClient();
      await supabase.rpc("update_task_status", { p_task_id: taskId, p_status: next });
    } catch {
      // Revert on failure
      setTasks(tasks.map((t) => t.id === taskId ? { ...t, status: task.status } : t));
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;
    const tempId = crypto.randomUUID();
    const task: Task = {
      id: tempId,
      project_id: id,
      title: newTaskTitle,
      milestone_id: null,
      description: null,
      completed: false,
      status: "todo",
      assigned_to: user?.id || null,
      priority: newTaskPriority,
      deadline: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTasks([...tasks, task]);
    setNewTaskTitle("");
    setShowNewTask(false);
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("tasks")
        .insert({
          project_id: id,
          title: task.title,
          priority: task.priority,
          assigned_to: task.assigned_to,
          status: "todo",
          completed: false,
        })
        .select()
        .single();
      // Replace temp id with real DB id
      if (data) {
        setTasks((prev) => prev.map((t) => t.id === tempId ? { ...t, id: data.id } : t));
      }
    } catch {
      // Task remains locally; will sync on next reload
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const tempMsg = {
      id: crypto.randomUUID(),
      user: { username: user.username, avatar_url: user.avatar_url || null },
      content: newMessage,
      created_at: new Date().toISOString(),
    };
    setChatMessages([...chatMessages, tempMsg]);
    const text = newMessage;
    setNewMessage("");
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("posts")
        .insert({ project_id: id, user_id: user.id, content: text })
        .select()
        .single();
      if (data) {
        setChatMessages((prev) => prev.map((m) => m.id === tempMsg.id ? { ...m, id: data.id } : m));
      }
    } catch { /* message stays locally */ }
  };

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: Target },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "milestones", label: "Milestones", icon: Flag },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "members", label: "Members", icon: Users },
    { id: "activity", label: "Activity", icon: Activity },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#0A0A0F] transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />Back to Projects
        </Link>

        {!dataLoaded && !project && (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-2 border-[#FF2D2D]/30 border-t-[#FF2D2D] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#9CA3AF] text-sm">Loading project…</p>
          </div>
        )}

        {/* Project Header */}
        {project && (
        <div className="glass-strong rounded-3xl border border-white/80 overflow-hidden mb-6" style={{boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500" />
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md">
                  {project.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-black text-[#0A0A0F] tracking-tight">{project.name}</h1>
                  <p className="text-[#9CA3AF] text-sm">{project.description}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{project.status}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#374151]">Progress</span>
                <span className="text-sm font-black text-[#FF2D2D]">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-black/[0.06] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 glass-strong rounded-2xl border border-white/80 p-1 sm:p-1.5 mb-5 sm:mb-6 overflow-x-auto scrollbar-hide" style={{boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
          {tabs.map((tab) => (
            <motion.button key={tab.id} whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap",
                activeTab === tab.id
                  ? "gradient-bg text-white shadow-md shadow-red-200/60"
                  : "text-[#9CA3AF] hover:text-[#0A0A0F] hover:bg-black/[0.04]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
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
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "To Do", count: tasks.filter((t) => t.status === "todo").length, accent: "from-gray-100 to-slate-100", num: "text-[#374151]" },
                    { label: "In Progress", count: tasks.filter((t) => t.status === "in_progress").length, accent: "from-amber-50 to-orange-50", num: "text-amber-600" },
                    { label: "Done", count: doneCount, accent: "from-emerald-50 to-teal-50", num: "text-emerald-600" },
                    { label: "Members", count: members.length, accent: "from-blue-50 to-indigo-50", num: "text-blue-600" },
                  ].map((stat) => (
                    <div key={stat.label} className={cn("rounded-3xl p-5 bg-gradient-to-br border border-white/80", stat.accent)} style={{boxShadow:"0 2px 8px rgba(0,0,0,0.04)"}}>
                      <p className={cn("text-3xl font-black", stat.num)}>{stat.count}</p>
                      <p className="text-xs font-semibold text-[#9CA3AF] mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Milestone roadmap */}
                <div className="glass-strong rounded-3xl border border-white/80 p-5" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                  <h3 className="text-sm font-bold text-[#0A0A0F] mb-4 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-[#FF2D2D]" />Milestone Roadmap
                  </h3>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {milestones.map((m, i) => (
                      <div key={m.id} className="flex items-center gap-2 flex-shrink-0">
                        <div className={cn(
                          "flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl min-w-[96px] text-center border",
                          m.status === "completed" ? "bg-emerald-50 border-emerald-100" :
                          m.status === "active" ? "bg-[#FFF0F0] border-red-200" :
                          "bg-black/[0.02] border-black/[0.05]"
                        )}>
                          {m.status === "completed" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            : m.status === "active" ? <Zap className="w-4 h-4 text-[#FF2D2D]" />
                            : <Circle className="w-4 h-4 text-[#D1D5DB]" />}
                          <span className={cn("text-xs font-semibold",
                            m.status === "completed" ? "text-emerald-700" :
                            m.status === "active" ? "text-[#FF2D2D]" : "text-[#9CA3AF]"
                          )}>{m.title}</span>
                        </div>
                        {i < milestones.length - 1 && <ChevronRight className="w-4 h-4 text-[#D1D5DB] flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent activity */}
                <div className="glass-strong rounded-3xl border border-white/80 p-5" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                  <h3 className="text-sm font-bold text-[#0A0A0F] mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#FF2D2D]" />Recent Activity
                  </h3>
                  <div className="space-y-3">
                    {activity.slice(0, 4).map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <div className={cn("w-2 h-2 mt-1.5 rounded-full flex-shrink-0",
                          item.type === "task_completed" ? "bg-emerald-500" :
                          item.type === "milestone_completed" ? "bg-[#FF2D2D]" :
                          item.type === "member_joined" ? "bg-blue-500" : "bg-amber-400"
                        )} />
                        <div className="flex-1">
                          <p className="text-sm text-[#374151]">{item.message}</p>
                          <p className="text-xs text-[#9CA3AF]" suppressHydrationWarning>{timeAgo(item.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Onboarding checklist */}
                <div className="bg-gradient-to-br from-[#FFF0F0] to-white rounded-3xl border border-red-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#0A0A0F] flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#FF2D2D]" />Getting Started
                    </h3>
                    <button onClick={() => setShowOnboarding(!showOnboarding)} className="text-xs text-[#FF2D2D] font-bold cursor-pointer">
                      {showOnboarding ? "Hide" : "Show"}
                    </button>
                  </div>
                  {showOnboarding && (
                    <div className="space-y-1.5">
                      {[
                        { done: true, text: "Project created" },
                        { done: true, text: "Team assembled" },
                        { done: false, text: "Set your first milestone" },
                        { done: false, text: "Create and assign tasks" },
                        { done: false, text: "Complete your first milestone" },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                          {step.done
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            : <Circle className="w-4 h-4 text-[#D1D5DB] flex-shrink-0" />}
                          <span className={cn("text-sm", step.done ? "line-through text-[#9CA3AF]" : "text-[#0A0A0F] font-medium")}>{step.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tasks (Kanban) Tab */}
            {activeTab === "tasks" && (
              <div className="glass-strong rounded-3xl border border-white/80 p-5" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-[#0A0A0F]">Tasks ({tasks.length})</h2>
                  <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                    onClick={() => setShowNewTask(true)}
                    className="flex items-center gap-1.5 gradient-bg text-white px-4 py-2 rounded-2xl font-bold text-sm shadow-md shadow-red-200/40 cursor-pointer"
                  ><Plus className="w-4 h-4" />Add Task</motion.button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["todo", "in_progress", "done"] as const).map((status) => {
                    const config = taskStatusConfig[status];
                    const statusTasks = tasks.filter((t) => t.status === status);
                    return (
                      <div key={status} className="bg-black/[0.02] rounded-2xl p-3 border border-black/[0.05]">
                        <div className="flex items-center gap-2 mb-3">
                          <config.icon className={cn("w-4 h-4", config.color)} />
                          <span className="text-xs font-bold text-[#374151]">{config.label}</span>
                          <span className="ml-auto text-[10px] font-bold text-[#9CA3AF] bg-white px-1.5 py-0.5 rounded-full border border-black/[0.06]">{statusTasks.length}</span>
                        </div>
                        <div className="space-y-2">
                          {statusTasks.map((task) => (
                            <motion.div key={task.id} layout whileHover={{y:-2}}
                              className="bg-white rounded-2xl p-3 border border-black/[0.06] cursor-pointer hover:border-[#FF2D2D]/20 transition-colors"
                              style={{boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
                              onClick={() => toggleTaskStatus(task.id)}
                            >
                              <p className={cn("text-xs font-semibold mb-2",
                                status === "done" ? "line-through text-[#9CA3AF]" : "text-[#0A0A0F]"
                              )}>{task.title}</p>
                              <div className="flex items-center justify-between">
                                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border",
                                  task.priority === "high" ? "bg-red-50 text-red-500 border-red-100" :
                                  task.priority === "medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                                  "bg-gray-100 text-gray-500 border-gray-200"
                                )}>{task.priority}</span>
                                {task.assigned_to && (() => {
                                  const assignee = members.find((m) => m.user_id === task.assigned_to);
                                  const label = assignee?.user?.username?.charAt(0).toUpperCase() ?? "?";
                                  return (
                                    <div className="w-5 h-5 rounded-full gradient-bg flex items-center justify-center text-white text-[9px] font-black" title={assignee?.user?.username ?? task.assigned_to}>
                                      {label}
                                    </div>
                                  );
                                })()}
                              </div>
                            </motion.div>
                          ))}
                          {statusTasks.length === 0 && (
                            <p className="text-xs text-[#D1D5DB] text-center py-4">No tasks</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
              <div className="glass-strong rounded-3xl border border-white/80 p-5" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                <h2 className="font-bold text-[#0A0A0F] mb-5 flex items-center gap-2">
                  <Flag className="w-4 h-4 text-[#FF2D2D]" />Milestones
                </h2>
                <div className="space-y-3">
                  {milestones.map((m, i) => {
                    const milestoneTasks = tasks.filter((t) => t.milestone_id === m.id);
                    const doneTasks = milestoneTasks.filter((t) => t.status === "done").length;
                    const pct = milestoneTasks.length > 0 ? Math.round((doneTasks / milestoneTasks.length) * 100) : 0;
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn("p-4 rounded-2xl border transition-all",
                          m.status === "completed" ? "border-emerald-100 bg-emerald-50" :
                          m.status === "active" ? "border-red-100 bg-[#FFF8F8]" :
                          "border-black/[0.05] bg-black/[0.02]"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-black",
                              m.status === "completed" ? "bg-emerald-500 text-white" :
                              m.status === "active" ? "bg-[#FF2D2D] text-white" :
                              "bg-black/[0.08] text-[#9CA3AF]"
                            )}>{i + 1}</span>
                            <div>
                              <p className="font-bold text-[#0A0A0F] text-sm">{m.title}</p>
                              {m.description && <p className="text-xs text-[#9CA3AF]">{m.description}</p>}
                            </div>
                          </div>
                          <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border",
                            m.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            m.status === "active" ? "bg-amber-50 text-amber-600 border-amber-100" :
                            "bg-gray-100 text-gray-500 border-gray-200"
                          )}>{m.status === "not_started" ? "Not started" : m.status === "active" ? "Active" : "Done"}</span>
                        </div>
                        {milestoneTasks.length > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-[#9CA3AF]">{doneTasks}/{milestoneTasks.length} tasks</span>
                              <span className="font-bold text-[#FF2D2D]">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                className="h-full rounded-full gradient-bg"
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && (
              <div className="glass-strong rounded-3xl border border-white/80 overflow-hidden" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                <div className="p-5 h-96 overflow-y-auto space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <Avatar src={msg.user.avatar_url} name={msg.user.username} size="sm" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-[#0A0A0F]">{msg.user.username}</span>
                          <span className="text-xs text-[#9CA3AF]">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm text-[#374151] bg-black/[0.03] rounded-2xl rounded-tl-sm px-4 py-2.5 inline-block border border-black/[0.05]">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-black/[0.06] p-4">
                  <div className="relative">
                    <input type="text" placeholder="Type a message…"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                      className="w-full h-12 pl-4 pr-14 rounded-2xl border border-black/[0.08] bg-white text-[#0A0A0F] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF2D2D] focus:ring-2 focus:ring-red-100 transition-all text-sm"
                      style={{boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
                    />
                    <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                      onClick={sendMessage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 gradient-bg text-white rounded-xl cursor-pointer"
                    ><Send className="w-4 h-4" /></motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="glass-strong rounded-3xl border border-white/80 p-5" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                <h2 className="font-bold text-[#0A0A0F] mb-5">Team Members ({members.length})</h2>
                <div className="space-y-2.5">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] border border-black/[0.05]">
                      <div className="flex items-center gap-3">
                        <Avatar src={member.user?.avatar_url || null} name={member.user?.username || "User"} />
                        <div>
                          <p className="font-bold text-[#0A0A0F] text-sm">{member.user?.username}</p>
                          <p className="text-xs text-[#9CA3AF]">{member.user?.email}</p>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {(member.user?.skills ?? []).slice(0, 4).map((s: string) => (
                              <span key={s} className="text-[10px] font-semibold px-2 py-0.5 bg-black/[0.04] text-[#6B7280] rounded-full border border-black/[0.06]">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full border",
                        member.role === "owner" ? "bg-[#FFF0F0] text-[#FF2D2D] border-red-100" : "bg-gray-100 text-gray-500 border-gray-200"
                      )}>{member.role}</span>
                    </div>
                  ))}
                  {members.length === 0 && !dataLoaded && (
                    <p className="text-sm text-[#9CA3AF] text-center py-6">Loading members…</p>
                  )}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="glass-strong rounded-3xl border border-white/80 p-5" style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}>
                <h2 className="font-bold text-[#0A0A0F] mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#FF2D2D]" />Activity Feed
                </h2>
                <div className="space-y-1">
                  {activity.map((item, i) => (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 p-3 rounded-2xl hover:bg-black/[0.02] transition-colors"
                    >
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                        item.type === "task_completed" ? "bg-emerald-50" :
                        item.type === "milestone_completed" ? "bg-[#FFF0F0]" :
                        item.type === "member_joined" ? "bg-blue-50" : "bg-amber-50"
                      )}>
                        {item.type === "task_completed" || item.type === "task_started" || item.type === "task_claimed"
                          ? <ListTodo className={cn("w-4 h-4", item.type === "task_completed" ? "text-emerald-500" : "text-amber-500")} />
                          : item.type === "milestone_completed" ? <Flag className="w-4 h-4 text-[#FF2D2D]" />
                          : <Users className="w-4 h-4 text-blue-500" />
                        }
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-[#374151] font-medium">{item.message}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5" suppressHydrationWarning>{timeAgo(item.created_at)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* New Task Modal */}
      <Modal isOpen={showNewTask} onClose={() => setShowNewTask(false)} title="Add New Task">
        <div className="space-y-4">
          <Input
            label="Task Title"
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
          />
          <div>
            <label className="block text-sm font-bold text-[#0A0A0F] mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button key={p} type="button" onClick={() => setNewTaskPriority(p)}
                  className={cn(
                    "flex-1 py-2 rounded-2xl text-sm font-semibold border transition-all cursor-pointer capitalize",
                    newTaskPriority === p
                      ? p === "high" ? "border-red-300 bg-red-50 text-red-600"
                        : p === "medium" ? "border-amber-300 bg-amber-50 text-amber-600"
                        : "border-emerald-300 bg-emerald-50 text-emerald-600"
                      : "border-black/[0.08] text-[#9CA3AF] hover:border-black/20"
                  )}
                >{p}</button>
              ))}
            </div>
          </div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
            onClick={addTask}
            className="w-full gradient-bg text-white py-3 rounded-2xl font-bold text-sm shadow-md shadow-red-200/40 cursor-pointer"
          >Add Task</motion.button>
        </div>
      </Modal>
    </div>
  );
}
