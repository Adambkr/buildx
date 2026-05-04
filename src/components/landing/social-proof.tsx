"use client";

import { motion } from "framer-motion";
import { FadeIn, SlideIn } from "@/components/ui/animated-section";

const stats = [
  { value: "2,400+", label: "Active Builders", gradient: "from-red-400 to-orange-400", bg: "bg-red-50" },
  { value: "850+", label: "Ideas Posted", gradient: "from-violet-400 to-purple-500", bg: "bg-violet-50" },
  { value: "320+", label: "Projects Launched", gradient: "from-emerald-400 to-teal-500", bg: "bg-emerald-50" },
  { value: "95%", label: "Team Satisfaction", gradient: "from-blue-400 to-indigo-500", bg: "bg-blue-50" },
];

const testimonials = [
  { name: "Alex M.", role: "Full-stack Dev", text: "BuildX helped me find a co-founder for my SaaS idea in under 24 hours. The quality of applicants is insane.", avatar: "AM", color: "from-violet-400 to-purple-500" },
  { name: "Sarah K.", role: "Product Designer", text: "I love how focused the teams are. Everyone on BuildX is here to actually build — no fluff, just execution.", avatar: "SK", color: "from-pink-400 to-rose-500" },
  { name: "James L.", role: "ML Engineer", text: "Shipped my first side project in 6 weeks with a team I met here. The project tools are exactly what we needed.", avatar: "JL", color: "from-emerald-400 to-teal-500" },
];

export function SocialProof() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#F0F0F5] rounded-full text-sm font-semibold text-[#6B7280] border border-black/[0.06] mb-6">
            ♥ Community Love
          </span>
          <h2 className="font-black text-[#0A0A0F] mt-2" style={{fontSize:"clamp(2rem,5vw,3.2rem)",letterSpacing:"-0.025em"}}>
            Builders Love BuildX
          </h2>
        </FadeIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {stats.map((stat, i) => (
            <SlideIn key={stat.label} delay={i * 0.1}>
              <motion.div whileHover={{ y: -4 }} className={`${stat.bg} rounded-3xl p-6 text-center border border-white`}>
                <p className={`text-3xl font-black bg-gradient-to-br ${stat.gradient} bg-clip-text`}
                  style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {stat.value}
                </p>
                <p className="text-sm text-[#6B7280] mt-1 font-medium">{stat.label}</p>
              </motion.div>
            </SlideIn>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {testimonials.map((t, i) => (
            <SlideIn key={t.name} delay={i * 0.1}>
              <motion.div whileHover={{ y: -6 }} className="glass-strong rounded-3xl p-6 border border-white/80" style={{boxShadow:"0 4px 20px rgba(0,0,0,0.06)"}}>
                <p className="text-[#374151] leading-relaxed mb-5 text-sm">“{t.text}”</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${t.color} rounded-xl flex items-center justify-center text-white text-xs font-bold`}>{t.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-[#0A0A0F]">{t.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            </SlideIn>
          ))}
        </div>

        {/* Live preview strip */}
        <FadeIn>
          <div className="glass-strong rounded-3xl p-8 sm:p-10 border border-white/80" style={{boxShadow:"0 8px 40px rgba(0,0,0,0.07)"}}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1.5"><div className="w-3 h-3 bg-red-400 rounded-full"/><div className="w-3 h-3 bg-amber-400 rounded-full"/><div className="w-3 h-3 bg-emerald-400 rounded-full"/></div>
              <div className="flex-1 bg-black/[0.05] rounded-lg px-3 py-1.5 text-xs text-[#9CA3AF] font-mono">buildx.app/projects/team-workflow</div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-black/[0.06]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xs">TW</div>
                  <div><p className="text-sm font-bold text-[#0A0A0F]">Team Workflow App</p><p className="text-xs text-[#9CA3AF]">by Alex M. · 2h ago</p></div>
                </div>
                <p className="text-xs text-[#6B7280] mb-4 leading-relaxed">A Kanban-style PM tool with real-time collaboration features and AI task suggestions...</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {["React","Node.js","AI"].map(s => <span key={s} className="text-[10px] font-medium px-2 py-0.5 bg-white rounded-full border border-black/[0.08] text-[#6B7280]">{s}</span>)}
                  </div>
                  <span className="text-xs font-bold text-orange-500">6/8 slots</span>
                </div>
              </div>
              <div className="bg-[#FAFAFA] rounded-2xl p-5 border border-black/[0.06]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-[#0A0A0F]">Sprint Tasks</p>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full">Active</span>
                </div>
                <div className="space-y-2">
                  {[{t:"Design UI mockups",done:true},{t:"Set up database",done:true},{t:"Build auth flow",done:false},{t:"Add notifications",done:false}].map(task => (
                    <div key={task.t} className="flex items-center gap-2.5 bg-white rounded-xl p-2.5 border border-black/[0.05]">
                      <div className={`w-4 h-4 rounded-md border ${task.done ? "bg-[#FF2D2D] border-[#FF2D2D]" : "border-black/20"} flex items-center justify-center flex-shrink-0`}>
                        {task.done && <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                      </div>
                      <span className={`text-xs ${task.done ? "line-through text-[#9CA3AF]" : "text-[#0A0A0F] font-medium"}`}>{task.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
