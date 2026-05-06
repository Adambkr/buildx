"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store";

const categories = [
  "Education", "Health", "E-Commerce", "Developer Tools",
  "Social", "Finance", "Entertainment", "AI/ML", "Web3", "Productivity", "Food", "Other",
];

const suggestedRoles = [
  "Frontend Developer", "Backend Developer", "Full-Stack Developer",
  "UI/UX Designer", "Mobile Developer", "DevOps Engineer",
  "Data Scientist", "ML Engineer", "Product Manager",
  "Marketing", "Growth Hacker", "Content Writer",
];

interface RoleSlot {
  role_name: string;
  required_count: number;
  priority: "low" | "medium" | "critical";
}

export default function NewIdeaPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const [authChecked, setAuthChecked] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [roleSlots, setRoleSlots] = useState<RoleSlot[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [roleCount, setRoleCount] = useState(1);
  const [rolePriority, setRolePriority] = useState<"low" | "medium" | "critical">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (!authUser) {
        router.replace("/login?next=/ideas/new");
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  const maxMembers = roleSlots.reduce((sum, r) => sum + r.required_count, 0) + 1; // +1 for creator

  const addRole = (name?: string) => {
    const trimmed = (name ?? roleInput).trim();
    if (!trimmed) return;
    if (roleSlots.some((r) => r.role_name.toLowerCase() === trimmed.toLowerCase())) return;
    setRoleSlots([...roleSlots, { role_name: trimmed, required_count: roleCount, priority: rolePriority }]);
    setRoleInput("");
    setRoleCount(1);
    setRolePriority("medium");
  };

  const removeRole = (name: string) => setRoleSlots(roleSlots.filter((r) => r.role_name !== name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError("You must be logged in to post an idea."); return; }
    if (roleSlots.length === 0) { setError("Add at least one role slot to define your team."); return; }
    if (maxMembers < 2) { setError("Your team must have at least 2 members total."); return; }
    if (maxMembers > 10) { setError("Max team size is 10. Reduce your role slots."); return; }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("challenges")
        .insert({
          creator_id: user.id,
          title,
          description,
          category,
          difficulty,
          tags,
          required_skills: roleSlots.map((r) => r.role_name),
          max_members: maxMembers,
          current_members: 1,
          status: "open",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert role slots — the DB trigger on idea_roles automatically
      // calls notify_skill_matches() for each insert, notifying matched users.
      if (roleSlots.length > 0) {
        await supabase.from("challenge_roles").insert(
          roleSlots.map((r) => ({ challenge_id: data.id, ...r }))
        );
      }

      router.push(`/ideas/${data.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-2 border-[#FF2D2D]/30 border-t-[#FF2D2D] rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Link href="/ideas" className="inline-flex items-center gap-2 text-sm text-[#64748B] hover:text-white transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />Back to Challenges
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">Launch a Challenge</h1>
        <p className="text-[#64748B] mb-8 text-sm">Share your vision and find your dream squad.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-[#FF3366]/10 border border-[#FF3366]/20 rounded-xl text-sm text-[#FF3366] font-medium"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </motion.div>
          )}

          {/* Main form card */}
          <div className="glass-dark rounded-2xl border border-white/[0.08] p-6 space-y-5">
            <div>
              <label className="block text-sm font-bold text-white mb-1.5">Title</label>
              <input
                type="text"
                placeholder="Give your challenge a clear, catchy title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/40 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-1.5">Description</label>
              <textarea
                placeholder="Describe your challenge. What problem does it solve? What's your vision?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/40 transition-colors text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-[#0D0D12] text-white focus:outline-none focus:border-[#FF3366]/40 transition-colors text-sm cursor-pointer"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-1.5">Difficulty Level</label>
              <div className="flex gap-2">
                {(["beginner", "intermediate", "advanced"] as const).map((level) => (
                  <button key={level} type="button" onClick={() => setDifficulty(level)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer capitalize ${
                      difficulty === level
                        ? level === "advanced" ? "border-[#FF3366]/30 bg-[#FF3366]/10 text-[#FF3366]"
                          : level === "intermediate" ? "border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700]"
                          : "border-[#00FFA3]/30 bg-[#00FFA3]/10 text-[#00FFA3]"
                        : "border-white/[0.08] text-[#64748B] hover:border-white/20 hover:text-white"
                    }`}
                  >{level}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-white mb-1.5">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add a tag and press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = tagInput.trim().toLowerCase();
                      if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
                        setTags([...tags, trimmed]);
                        setTagInput("");
                      }
                    }
                  }}
                  className="flex-1 h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/40 transition-colors text-sm"
                />
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/[0.04] text-[#94A3B8] rounded-full border border-white/[0.08]">
                      #{tag}
                      <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}
                        className="hover:text-[#FF3366] cursor-pointer transition-colors"
                      ><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-[#64748B] mt-1.5">{5 - tags.length} tags remaining</p>
            </div>
          </div>

          {/* Role Slots Builder */}
          <div className="glass-dark rounded-2xl border border-white/[0.08] p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-white">Squad Roles</label>
              {maxMembers > 1 && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/[0.04] text-[#94A3B8] border border-white/[0.06]">
                  <Users className="w-3.5 h-3.5" />
                  {maxMembers} total
                  {maxMembers > 10 && <span className="text-[#FF3366] ml-0.5">— over limit!</span>}
                </span>
              )}
            </div>

            {/* Suggested roles */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {suggestedRoles
                .filter((r) => !roleSlots.some((s) => s.role_name === r))
                .map((r) => (
                  <button key={r} type="button" onClick={() => addRole(r)}
                    className="px-2.5 py-1 text-xs rounded-full border border-white/[0.08] text-[#64748B] hover:border-[#FF3366]/30 hover:text-[#FF3366] hover:bg-[#FF3366]/5 transition-all cursor-pointer font-medium"
                  >+ {r}</button>
                ))}
            </div>

            {/* Custom role input */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-4">
              <input
                placeholder="Custom role name..."
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRole(); } }}
                className="flex-1 h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-[#64748B] focus:outline-none focus:border-[#FF3366]/40 transition-colors text-sm"
              />
              <select value={roleCount} onChange={(e) => setRoleCount(Number(e.target.value))}
                className="h-11 px-3 rounded-xl border border-white/[0.08] text-sm text-white bg-[#0D0D12] focus:outline-none focus:border-[#FF3366]/40 transition-colors cursor-pointer"
              >
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} slot{n>1?"s":""}</option>)}
              </select>
              <select value={rolePriority} onChange={(e) => setRolePriority(e.target.value as "low"|"medium"|"critical")}
                className="h-11 px-3 rounded-xl border border-white/[0.08] text-sm text-white bg-[#0D0D12] focus:outline-none focus:border-[#FF3366]/40 transition-colors cursor-pointer"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="critical">Critical</option>
              </select>
              <motion.button whileHover={{scale:1.06}} whileTap={{scale:0.94}}
                type="button" onClick={() => addRole()}
                className="flex-shrink-0 w-11 h-11 bg-gradient-hero text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#FF3366]/20 cursor-pointer"
              ><Plus className="w-4 h-4" /></motion.button>
            </div>

            {/* Added roles */}
            <AnimatePresence>
              {roleSlots.length > 0 && (
                <div className="space-y-2">
                  {roleSlots.map((role) => (
                    <motion.div key={role.role_name}
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                      className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.06]"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{role.role_name}</span>
                        <span className="text-xs text-[#64748B] font-medium">{role.required_count} slot{role.required_count>1?"s":""}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          role.priority === "critical" ? "bg-[#FF3366]/10 text-[#FF3366] border-[#FF3366]/20" :
                          role.priority === "medium" ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/20" :
                          "bg-white/[0.04] text-[#64748B] border-white/[0.08]"
                        }`}>{role.priority}</span>
                      </div>
                      <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                        type="button" onClick={() => removeRole(role.role_name)}
                        className="cursor-pointer p-1.5 rounded-xl hover:bg-[#FF3366]/10 transition-colors"
                      ><X className="w-3.5 h-3.5 text-[#64748B] hover:text-[#FF3366]" /></motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {roleSlots.length === 0 && (
              <div className="flex items-center gap-2.5 p-3.5 bg-[#FFD700]/5 rounded-xl border border-[#FFD700]/15">
                <AlertTriangle className="w-4 h-4 text-[#FFD700] flex-shrink-0" />
                <p className="text-xs text-[#FFD700]/80 font-medium">Add at least one role to define your squad structure.</p>
              </div>
            )}
          </div>

          <motion.button whileHover={{scale:1.02, boxShadow:"0 8px 30px rgba(255,51,102,0.3)"}} whileTap={{scale:0.98}}
            type="submit" disabled={loading}
            className="w-full bg-gradient-hero text-white py-4 rounded-xl font-black text-base shadow-lg shadow-[#FF3366]/20 cursor-pointer disabled:opacity-60 tracking-wide"
          >
            {loading ? "Publishing…" : "✦ Launch Challenge"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
