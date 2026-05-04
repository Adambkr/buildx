"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  FolderKanban,
  Users,
  Clock,
  CheckCircle2,
  Pause,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import type { Project, Idea } from "@/lib/types";

const demoProjects: Project[] = [
  {
    id: "p1",
    idea_id: "1",
    name: "AI Study Companion",
    description: "An intelligent study app with personalized learning paths.",
    status: "active",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    members: [
      {
        id: "m1",
        project_id: "p1",
        user_id: "demo-1",
        role: "owner",
        joined_at: "",
        user: {
          id: "demo-1",
          email: "sarah@example.com",
          username: "sarahkim",
          avatar_url: null,
          bio: null,
          skills: [],
          role: "user",
          reputation_score: 85,
          created_at: "",
        },
      },
      {
        id: "m2",
        project_id: "p1",
        user_id: "demo-2",
        role: "member",
        joined_at: "",
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
    ],
  },
  {
    id: "p2",
    idea_id: "4",
    name: "DevPortfolio Builder",
    description: "Auto-generate portfolios from GitHub activity.",
    status: "active",
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    members: [
      {
        id: "m3",
        project_id: "p2",
        user_id: "demo-4",
        role: "owner",
        joined_at: "",
        user: {
          id: "demo-4",
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
    ],
  },
];

const statusConfig = {
  active: { icon: Clock, label: "Active", variant: "success" as const },
  completed: { icon: CheckCircle2, label: "Completed", variant: "primary" as const },
  paused: { icon: Pause, label: "Paused", variant: "warning" as const },
};

export default function ProjectsPage() {
  const user = useAppStore((s) => s.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [myIdeas, setMyIdeas] = useState<Idea[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (user === null && !dataLoaded) return;
      if (user === null) { setProjects(demoProjects); setDataLoaded(true); return; }
      try {
        const supabase = createClient();
        const [memberRows, ideasRes] = await Promise.all([
          supabase.from("project_members").select("project_id").eq("user_id", user.id),
          supabase.from("ideas").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }),
        ]);

        setMyIdeas(ideasRes.data ?? []);

        if (!memberRows.data || memberRows.data.length === 0) {
          setProjects([]);
          return;
        }

        const projectIds = memberRows.data.map((r: any) => r.project_id);
        const { data } = await supabase
          .from("projects")
          .select("*, members:project_members(*, user:users!project_members_user_id_fkey(*))")
          .in("id", projectIds)
          .order("updated_at", { ascending: false });

        setProjects(data ?? []);
      } catch {
        setProjects(demoProjects);
      } finally {
        setDataLoaded(true);
      }
    };

    fetchProjects();
  }, [user]);

  const STATUS_STYLES = {
    active: { pill: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-400", bar: "from-emerald-400 to-teal-500" },
    completed: { pill: "bg-blue-50 text-blue-600 border-blue-100", dot: "bg-blue-400", bar: "from-blue-400 to-indigo-500" },
    paused: { pill: "bg-amber-50 text-amber-600 border-amber-100", dot: "bg-amber-400", bar: "from-amber-400 to-orange-500" },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-[#0A0A0F] tracking-tight">Your Projects</h1>
        <p className="text-[#6B7280] mt-1 text-sm">Manage your active project workspaces</p>
      </motion.div>

      {/* My Ideas — posted by the user, recruiting team */}
      {myIdeas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-[#FF2D2D]" />
            <h2 className="text-sm font-bold text-[#0A0A0F]">My Ideas</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-[#FF2D2D] border border-red-100">{myIdeas.length}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {myIdeas.map((idea, i) => {
              const fillPct = idea.max_members > 0 ? Math.round((idea.current_members / idea.max_members) * 100) : 0;
              const statusStyles: Record<string, { pill: string; dot: string; bar: string }> = {
                open: { pill: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-400", bar: "from-emerald-400 to-teal-500" },
                full: { pill: "bg-blue-50 text-blue-600 border-blue-100", dot: "bg-blue-400", bar: "from-blue-400 to-indigo-500" },
                closed: { pill: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400", bar: "from-gray-300 to-gray-400" },
              };
              const s = statusStyles[idea.status] ?? statusStyles.open;
              return (
                <motion.div key={idea.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/ideas/${idea.id}`}>
                    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="group glass-strong rounded-3xl border border-white/80 overflow-hidden h-full cursor-pointer"
                      style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}
                    >
                      <div className={`h-1.5 w-full bg-gradient-to-r ${s.bar}`} />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 bg-gradient-to-br ${s.bar} rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md`}>
                              {idea.title.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-[#0A0A0F] group-hover:text-[#FF2D2D] transition-colors truncate">{idea.title}</h3>
                              <p className="text-xs text-[#9CA3AF] line-clamp-1">{idea.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF0F0] text-[#FF2D2D] border border-red-100">Idea</span>
                            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.pill}`}>
                              <span className={`w-1 h-1 rounded-full ${s.dot}`} />{idea.status}
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-black/[0.06]">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-[#9CA3AF] font-medium flex items-center gap-1"><Users className="w-3 h-3" />{idea.current_members}/{idea.max_members} members</span>
                            <span className="font-bold text-[#FF2D2D]">{fillPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className={`h-full bg-gradient-to-r ${s.bar} rounded-full`}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fully-staffed projects */}
      {projects.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <FolderKanban className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-[#0A0A0F]">Active Projects</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">{projects.length}</span>
          </div>
        </div>
      )}

      {projects.length === 0 && myIdeas.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <div className="w-16 h-16 glass-strong rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/80"
            style={{boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
            <FolderKanban className="w-8 h-8 text-[#9CA3AF]" />
          </div>
          <h3 className="text-lg font-bold text-[#0A0A0F] mb-2">No projects yet</h3>
          <p className="text-[#9CA3AF] mb-6 text-sm">Post an idea or get accepted into one to get started</p>
          <div className="flex gap-3 justify-center">
            <Link href="/ideas/new">
              <motion.button whileHover={{scale:1.04, boxShadow:"0 6px 20px rgba(255,45,45,0.25)"}} whileTap={{scale:0.97}}
                className="gradient-bg text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md shadow-red-200/40 cursor-pointer"
              >Post an Idea</motion.button>
            </Link>
            <Link href="/ideas">
              <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                className="glass-strong px-6 py-2.5 rounded-2xl font-bold text-sm border border-white/80 text-[#374151] cursor-pointer"
              >Explore Ideas</motion.button>
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {projects.map((project, i) => {
            const s = STATUS_STYLES[project.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.active;
            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/projects/${project.id}`}>
                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="group glass-strong rounded-3xl border border-white/80 overflow-hidden h-full cursor-pointer"
                    style={{boxShadow:"0 2px 12px rgba(0,0,0,0.06)"}}
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r ${s.bar}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-gradient-to-br ${s.bar} rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md`}>
                            {project.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#0A0A0F] group-hover:text-[#FF2D2D] transition-colors">{project.name}</h3>
                            <p className="text-sm text-[#9CA3AF] line-clamp-1">{project.description}</p>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${s.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {project.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-black/[0.06]">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {project.members?.slice(0, 5).map((member) => (
                              <Avatar key={member.id} src={member.user?.avatar_url}
                                name={member.user?.username || "Member"} size="sm"
                                className="border-2 border-white"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[#9CA3AF] font-medium">
                            {project.members?.length || 0} members
                          </span>
                        </div>
                        <span className="text-xs text-[#9CA3AF]">
                          {new Date(project.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
