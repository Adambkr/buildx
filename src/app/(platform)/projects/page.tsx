"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Flame, Users, Clock, CheckCircle2, Pause, Crosshair, Zap, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Project, Idea, User } from "@/lib/types";

const demoUser = (id: string, username: string, rep: number): User => ({
  id, email: `${username}@example.com`, username, avatar_url: null,
  bio: null, skills: [], role: "user", reputation_score: rep,
  xp: rep * 12, level: Math.floor(rep / 20) + 1, created_at: "",
});

const demoProjects: Project[] = [
  {
    id: "p1", challenge_id: "1", name: "AI Pair Programmer Run",
    description: "Squad building an AI-powered pair programming tool.",
    status: "active", completed_at: null, progress_pct: 42, xp_earned: 210,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    members: [
      { id: "m1", run_id: "p1", user_id: "demo-1", squad_role: "leader", joined_at: "", user: demoUser("demo-1", "sarahkim", 85) },
      { id: "m2", run_id: "p1", user_id: "demo-2", squad_role: "member", joined_at: "", user: demoUser("demo-2", "jamesliu", 72) },
      { id: "m3", run_id: "p1", user_id: "demo-5", squad_role: "member", joined_at: "", user: demoUser("demo-5", "emmawilson", 58) },
    ],
  },
  {
    id: "p2", challenge_id: "4", name: "Edge Router Run",
    description: "Designing a lightweight edge computing router.",
    status: "active", completed_at: null, progress_pct: 15, xp_earned: 45,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    members: [
      { id: "m3", run_id: "p2", user_id: "demo-4", squad_role: "leader", joined_at: "", user: demoUser("demo-4", "priyapatel", 67) },
    ],
  },
];

const STATUS_STYLES = {
  active: { pill: "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20", dot: "bg-[#00E5FF]", bar: "from-[#00E5FF] to-[#00B4D8]" },
  completed: { pill: "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20", dot: "bg-[#00FFA3]", bar: "from-[#00FFA3] to-[#10B981]" },
  archived: { pill: "bg-white/[0.03] text-[#64748B] border-white/[0.06]", dot: "bg-[#64748B]", bar: "from-[#64748B] to-[#475569]" },
};

const IDEA_STATUS = {
  open: { pill: "bg-[#00FFA3]/10 text-[#00FFA3] border-[#00FFA3]/20", dot: "bg-[#00FFA3]", bar: "from-[#00FFA3] to-[#10B981]" },
  in_progress: { pill: "bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20", dot: "bg-[#00E5FF]", bar: "from-[#00E5FF] to-[#00B4D8]" },
  full: { pill: "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20", dot: "bg-[#FF3366]", bar: "from-[#FF3366] to-[#FF6B9D]" },
  closed: { pill: "bg-white/[0.03] text-[#64748B] border-white/[0.06]", dot: "bg-[#64748B]", bar: "from-[#64748B] to-[#475569]" },
};

export default function RunsPage() {
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
          supabase.from("run_members").select("run_id").eq("user_id", user.id),
          supabase.from("challenges").select("*").eq("creator_id", user.id).order("created_at", { ascending: false }),
        ]);
        setMyIdeas(ideasRes.data ?? []);
        if (!memberRows.data || memberRows.data.length === 0) { setProjects([]); return; }
        const runIds = memberRows.data.map((r: any) => r.run_id);
        const { data } = await supabase.from("challenge_runs").select("*, members:run_members(*, user:users!run_members_user_id_fkey(*))").in("id", runIds).order("updated_at", { ascending: false });
        setProjects(data ?? []);
      } catch { setProjects(demoProjects); }
      finally { setDataLoaded(true); }
    };
    fetchProjects();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5 text-[#FF3366]" />
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">My Runs</h1>
        </div>
        <p className="text-[#64748B] mt-1 text-sm">Manage your active challenge runs and squads</p>
      </motion.div>

      {/* My Challenges — recruiting squad */}
      {myIdeas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Crosshair className="w-4 h-4 text-[#FF3366]" />
            <h2 className="text-sm font-bold text-white">My Challenges</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/20">{myIdeas.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {myIdeas.map((idea, i) => {
              const fillPct = idea.max_squad_size > 0 ? Math.round((idea.current_members / idea.max_squad_size) * 100) : 0;
              const s = IDEA_STATUS[idea.status as keyof typeof IDEA_STATUS] ?? IDEA_STATUS.open;
              return (
                <motion.div key={idea.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/ideas/${idea.id}`}>
                    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="group glass-dark rounded-2xl border border-white/[0.06] overflow-hidden h-full cursor-pointer card-hover-glow"
                    >
                      <div className={cn("h-1.5 w-full bg-gradient-to-r", s.bar)} />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md", s.bar)}>
                              {idea.title.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-white group-hover:text-[#FF3366] transition-colors truncate">{idea.title}</h3>
                              <p className="text-xs text-[#64748B] line-clamp-1">{idea.description}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/20">Challenge</span>
                            <span className={cn("flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border", s.pill)}>
                              <span className={cn("w-1 h-1 rounded-full", s.dot)} />{idea.status === "in_progress" ? "In Progress" : idea.status}
                            </span>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-white/[0.04]">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-[#64748B] font-medium flex items-center gap-1"><Users className="w-3 h-3" />{idea.current_members}/{idea.max_squad_size} squad</span>
                            <span className="font-bold text-[#FF3366]">{fillPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${fillPct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                              className={cn("h-full bg-gradient-to-r rounded-full", s.bar)} />
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

      {/* Active Runs */}
      {projects.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-4 h-4 text-[#00E5FF]" />
            <h2 className="text-sm font-bold text-white">Active Runs</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">{projects.length}</span>
          </div>
        </div>
      )}

      {projects.length === 0 && myIdeas.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24">
          <div className="w-16 h-16 glass-dark rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.06]">
            <Flame className="w-8 h-8 text-[#64748B]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No runs yet</h3>
          <p className="text-[#64748B] mb-6 text-sm">Launch a challenge or join a squad to get started</p>
          <div className="flex gap-3 justify-center">
            <Link href="/ideas/new">
              <motion.button whileHover={{scale:1.04, boxShadow:"0 6px 20px rgba(255,51,102,0.25)"}} whileTap={{scale:0.97}}
                className="bg-gradient-hero text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#FF3366]/20 cursor-pointer"
              >Launch Challenge</motion.button>
            </Link>
            <Link href="/ideas">
              <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}}
                className="glass-dark px-6 py-2.5 rounded-xl font-bold text-sm border border-white/[0.06] text-white cursor-pointer"
              >Explore Challenges</motion.button>
            </Link>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {projects.map((project, i) => {
            const s = STATUS_STYLES[project.status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.active;
            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/projects/${project.id}`}>
                  <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    className="group glass-dark rounded-2xl border border-white/[0.06] overflow-hidden h-full cursor-pointer card-hover-glow"
                  >
                    <div className={cn("h-1.5 w-full bg-gradient-to-r", s.bar)} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md", s.bar)}>
                            {project.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-white group-hover:text-[#FF3366] transition-colors">{project.name}</h3>
                            <p className="text-sm text-[#64748B] line-clamp-1">{project.description}</p>
                          </div>
                        </div>
                        <span className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border", s.pill)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />{project.status}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-[#64748B] font-medium">Run Progress</span>
                          <span className="font-bold text-[#00E5FF]">{project.progress_pct ?? 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress_pct ?? 0}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={cn("h-full bg-gradient-to-r rounded-full", s.bar)} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/[0.04]">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {project.members?.slice(0, 5).map((member) => (
                              <Avatar key={member.id} src={member.user?.avatar_url} name={member.user?.username || "Member"} size="sm" className="border-2 border-[#050507]" />
                            ))}
                          </div>
                          <span className="text-xs text-[#64748B] font-medium">{project.members?.length || 0} squad</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#64748B]">
                          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#FFD700]" />{project.xp_earned ?? 0} XP</span>
                          <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                        </div>
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
