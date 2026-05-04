"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        .from("ideas")
        .insert({
          creator_id: user.id,
          title,
          description,
          category,
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
        await supabase.from("idea_roles").insert(
          roleSlots.map((r) => ({ idea_id: data.id, ...r }))
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
        <Link href="/ideas" className="inline-flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#0A0A0F] transition-colors mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />Back to Ideas
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-[#0A0A0F] tracking-tight mb-1">Post a New Idea</h1>
        <p className="text-[#9CA3AF] mb-8 text-sm">Share your vision and find your dream team.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600 font-medium"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{error}
            </motion.div>
          )}

          {/* Main form card */}
          <div className="glass-strong rounded-3xl border border-white/80 p-6 space-y-5"
            style={{boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
            <Input
              label="Title"
              placeholder="Give your idea a clear, catchy title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-bold text-[#0A0A0F] mb-1.5">Description</label>
              <textarea
                placeholder="Describe your idea in detail. What problem does it solve? What's your vision?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                className="w-full px-4 py-3 rounded-2xl border border-black/[0.08] bg-white text-[#0A0A0F] placeholder-[#9CA3AF] focus:outline-none focus:border-[#FF2D2D] focus:ring-2 focus:ring-red-100 transition-all text-sm resize-none"
                style={{boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0A0A0F] mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full h-11 px-4 rounded-2xl border border-black/[0.08] bg-white text-[#0A0A0F] focus:outline-none focus:border-[#FF2D2D] focus:ring-2 focus:ring-red-100 transition-all text-sm cursor-pointer"
                style={{boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Role Slots Builder */}
          <div className="glass-strong rounded-3xl border border-white/80 p-6"
            style={{boxShadow:"0 8px 40px rgba(0,0,0,0.08)"}}>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-[#0A0A0F]">Team Roles</label>
              {maxMembers > 1 && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-black/[0.04] text-[#6B7280]">
                  <Users className="w-3.5 h-3.5" />
                  {maxMembers} total
                  {maxMembers > 10 && <span className="text-red-500 ml-0.5">— over limit!</span>}
                </span>
              )}
            </div>

            {/* Suggested roles */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {suggestedRoles
                .filter((r) => !roleSlots.some((s) => s.role_name === r))
                .map((r) => (
                  <button key={r} type="button" onClick={() => addRole(r)}
                    className="px-2.5 py-1 text-xs rounded-full border border-black/[0.08] text-[#6B7280] hover:border-[#FF2D2D] hover:text-[#FF2D2D] hover:bg-[#FFF0F0] transition-all cursor-pointer font-medium"
                  >+ {r}</button>
                ))}
            </div>

            {/* Custom role input */}
            <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-4">
              <Input
                placeholder="Custom role name..."
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRole(); } }}
              />
              <select value={roleCount} onChange={(e) => setRoleCount(Number(e.target.value))}
                className="h-11 px-3 rounded-2xl border border-black/[0.08] text-sm text-[#0A0A0F] focus:outline-none focus:border-[#FF2D2D] transition-colors cursor-pointer bg-white"
              >
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} slot{n>1?"s":""}</option>)}
              </select>
              <select value={rolePriority} onChange={(e) => setRolePriority(e.target.value as "low"|"medium"|"critical")}
                className="h-11 px-3 rounded-2xl border border-black/[0.08] text-sm text-[#0A0A0F] focus:outline-none focus:border-[#FF2D2D] transition-colors cursor-pointer bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="critical">Critical</option>
              </select>
              <motion.button whileHover={{scale:1.06}} whileTap={{scale:0.94}}
                type="button" onClick={() => addRole()}
                className="flex-shrink-0 w-11 h-11 gradient-bg text-white rounded-2xl flex items-center justify-center shadow-md shadow-red-200/40 cursor-pointer"
              ><Plus className="w-4 h-4" /></motion.button>
            </div>

            {/* Added roles */}
            <AnimatePresence>
              {roleSlots.length > 0 && (
                <div className="space-y-2">
                  {roleSlots.map((role) => (
                    <motion.div key={role.role_name}
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }}
                      className="flex items-center justify-between p-3 bg-black/[0.02] rounded-2xl border border-black/[0.05]"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-[#0A0A0F]">{role.role_name}</span>
                        <span className="text-xs text-[#9CA3AF] font-medium">{role.required_count} slot{role.required_count>1?"s":""}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          role.priority === "critical" ? "bg-red-50 text-red-500 border-red-100" :
                          role.priority === "medium" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          "bg-gray-100 text-gray-500 border-gray-200"
                        }`}>{role.priority}</span>
                      </div>
                      <motion.button whileHover={{scale:1.1}} whileTap={{scale:0.9}}
                        type="button" onClick={() => removeRole(role.role_name)}
                        className="cursor-pointer p-1.5 rounded-xl hover:bg-red-50 transition-colors"
                      ><X className="w-3.5 h-3.5 text-[#9CA3AF] hover:text-red-500" /></motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {roleSlots.length === 0 && (
              <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700 font-medium">Add at least one role to define your team structure.</p>
              </div>
            )}
          </div>

          <motion.button whileHover={{scale:1.02, boxShadow:"0 8px 24px rgba(255,45,45,0.3)"}} whileTap={{scale:0.98}}
            type="submit" disabled={loading}
            className="w-full gradient-bg text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-red-200/40 cursor-pointer disabled:opacity-60 tracking-wide"
          >
            {loading ? "Publishing…" : "✦ Publish Idea"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
