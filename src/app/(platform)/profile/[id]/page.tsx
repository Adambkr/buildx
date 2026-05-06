"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Calendar,
  MapPin,
  Lightbulb,
  FolderKanban,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

const demoProfile: User = {
  id: "demo-1",
  email: "sarah@example.com",
  username: "sarahkim",
  avatar_url: null,
  bio: "Full-stack developer passionate about EdTech and AI. Building things that make learning accessible to everyone.",
  skills: ["React", "Python", "TensorFlow", "Next.js", "PostgreSQL", "UI/UX"],
  role: "user",
  reputation_score: 85,
  xp: 1020,
  level: 5,
  created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
};

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const currentUser = useAppStore((s) => s.user);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ideasCount, setIdeasCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const isOwnProfile = currentUser?.id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
          setProfile(data);
        }

        const { count: iCount } = await supabase
          .from("challenges")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", id);
        setIdeasCount(iCount ?? 0);

        const { count: pCount } = await supabase
          .from("run_members")
          .select("*", { count: "exact", head: true })
          .eq("user_id", id);
        setProjectsCount(pCount ?? 0);
      } catch {
        // leave profile null
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/ideas" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>

        {/* Loading skeleton */}
        {loading && (
          <div className="glass-dark rounded-2xl border border-white/[0.08] p-12 text-center animate-pulse">
            <div className="w-24 h-24 bg-white/[0.06] rounded-full mx-auto mb-4" />
            <div className="h-4 bg-white/[0.06] rounded-full w-32 mx-auto mb-2" />
            <div className="h-3 bg-white/[0.04] rounded-full w-48 mx-auto" />
          </div>
        )}
        {!loading && !profile && (
          <div className="glass-dark rounded-2xl border border-white/[0.08] p-12 text-center">
            <p className="text-[#64748B]">Profile not found.</p>
          </div>
        )}

        {/* Profile Card */}
        {profile && (
          <>
            <div className="glass-dark rounded-2xl border border-white/[0.08] overflow-hidden">
              {/* Banner */}
              <div className="h-1.5 w-full bg-gradient-to-r from-[#FF3366] via-[#FF6B9D] to-[#A855F7]" />
              <div className="h-28 bg-gradient-to-r from-[#FF3366]/20 via-[#A855F7]/10 to-[#00E5FF]/10 relative">
                <div className="absolute inset-0 opacity-30" style={{backgroundImage:"radial-gradient(circle at 30% 50%, rgba(255,51,102,0.3) 0%, transparent 60%)"}} />
                <div className="absolute -bottom-10 left-6 sm:left-8">
                  <Avatar src={profile.avatar_url} name={profile.username} size="lg"
                    className="w-20 h-20 text-2xl border-4 border-[#050507] shadow-xl"
                  />
                </div>
              </div>

              <div className="pt-14 px-6 sm:px-8 pb-8">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">{profile.username}</h1>
                    <p className="text-[#64748B] text-sm">{profile.email}</p>
                  </div>
                  {isOwnProfile && (
                    <Link href="/profile/settings">
                      <motion.button whileHover={{scale:1.04}} whileTap={{scale:0.97}}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-white hover:border-[#FF3366]/30 hover:bg-white/[0.06] transition-all cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />Edit Profile
                      </motion.button>
                    </Link>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-[#94A3B8] mb-6 max-w-2xl leading-relaxed">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 mb-6">
                  <span className="flex items-center gap-1.5 text-sm">
                    <span className="w-7 h-7 rounded-xl bg-[#FF3366]/10 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-[#FF3366]" />
                    </span>
                    <span className="font-black text-white">{profile.reputation_score}</span>
                    <span className="text-[#64748B]">rep</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-[#64748B]">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>

                {profile.skills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-white mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span key={skill} className="text-xs font-semibold px-3 py-1.5 bg-white/[0.04] text-[#94A3B8] rounded-full border border-white/[0.08] hover:bg-[#FF3366]/10 hover:text-[#FF3366] hover:border-[#FF3366]/20 transition-colors">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-5 sm:mt-6">
              {[
                { icon: Lightbulb, label: "Challenges Posted", count: ideasCount, color: "text-[#FF3366]", bg: "bg-[#FF3366]/10", bar: "from-[#FF3366] to-[#FF6B9D]" },
                { icon: FolderKanban, label: "Runs Joined", count: projectsCount, color: "text-[#00FFA3]", bg: "bg-[#00FFA3]/10", bar: "from-[#00FFA3] to-[#10B981]" },
              ].map((stat) => (
                <motion.div key={stat.label} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="glass-dark rounded-2xl border border-white/[0.08] overflow-hidden"
                >
                  <div className={`h-1 w-full bg-gradient-to-r ${stat.bar}`} />
                  <div className="p-5 flex items-center gap-4">
                    <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-white">{stat.count}</p>
                      <p className="text-sm text-[#64748B] font-medium">{stat.label}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
