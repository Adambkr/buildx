"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Users, TrendingUp } from "lucide-react";
import { useRef } from "react";
import { useAppStore } from "@/lib/store";

const cards = [
  {
    emoji: "🤖", title: "AI Study Assistant", by: "Sarah K.",
    slots: "7/10", color: "from-violet-500 to-purple-600",
    tag: "Almost Full", tagColor: "text-orange-500 bg-orange-50",
    members: ["bg-blue-400","bg-purple-400","bg-pink-400","bg-indigo-400"],
    skills: ["React","Python","ML"],
  },
  {
    emoji: "🌿", title: "Eco Marketplace", by: "James L.",
    slots: "3/10", color: "from-emerald-500 to-teal-600",
    tag: "Open", tagColor: "text-emerald-600 bg-emerald-50",
    members: ["bg-teal-400","bg-green-400"],
    skills: ["Next.js","Node","UI/UX"],
  },
  {
    emoji: "💪", title: "Fitness Tracker Pro", by: "Mike R.",
    slots: "9/10", color: "from-orange-500 to-red-500",
    tag: "🔥 1 slot left", tagColor: "text-red-600 bg-red-50",
    members: ["bg-red-400","bg-orange-400","bg-amber-400","bg-rose-400"],
    skills: ["Swift","Firebase","Design"],
  },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const user = useAppStore((s) => s.user);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden mesh-bg min-h-screen flex items-center">
      {/* Animated orbs */}
      <div className="orb w-[500px] h-[500px] bg-red-300/30 top-[-100px] right-[-100px] animate-blob" />
      <div className="orb w-[400px] h-[400px] bg-violet-300/20 bottom-[-80px] left-[-80px] animate-blob" style={{ animationDelay: "3s" }} />
      <div className="orb w-[300px] h-[300px] bg-orange-200/25 top-1/2 left-1/3 animate-blob" style={{ animationDelay: "6s" }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(0,0,0,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />

      <motion.div style={{ y, opacity }} className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full shadow-sm border border-red-100"
            >
              <span className="w-2 h-2 bg-[#FF2D2D] rounded-full animate-pulse" />
              <Sparkles className="w-3.5 h-3.5 text-[#FF2D2D]" />
              <span className="text-sm font-semibold text-[#FF2D2D]">Where ideas become reality</span>
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 100 }}
                className="font-black tracking-tight text-[#0A0A0F] leading-[1.03]"
                style={{ fontSize: "clamp(2.8rem, 7vw, 5.5rem)" }}
              >
                Build Real Things
                <br />
                <span className="gradient-text">With Real People</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-lg sm:text-xl text-[#6B7280] max-w-md leading-relaxed"
              >
                Post your idea, form an exclusive team of up to 10, and ship together.
                No fluff — just builders, building.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col sm:flex-row flex-wrap gap-3"
            >
              <Link href={user ? "/ideas" : "/signup"}>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(255,45,45,0.35)" }}
                  whileTap={{ scale: 0.97 }}
                  className="gradient-bg-vibrant text-white px-7 py-4 rounded-2xl font-bold text-base flex items-center gap-2 shadow-lg shadow-red-200/60 cursor-pointer"
                >
                  Start Building <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
              <Link href="/ideas">
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(0,0,0,0.05)" }}
                  whileTap={{ scale: 0.97 }}
                  className="glass px-7 py-4 rounded-2xl font-semibold text-base text-[#0A0A0F] border border-black/10 cursor-pointer"
                >
                  Explore Ideas
                </motion.button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap items-center gap-6 pt-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2.5">
                  {["bg-red-400","bg-violet-400","bg-amber-400","bg-emerald-400","bg-blue-400"].map((c,i) => (
                    <div key={i} className={`w-8 h-8 ${c} rounded-full border-2 border-white shadow-sm`} />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0A0A0F]">2,400+ builders</p>
                  <p className="text-xs text-[#9CA3AF]">already creating</p>
                </div>
              </div>
              <div className="h-8 w-px bg-black/10" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0A0A0F]">340+ projects</p>
                  <p className="text-xs text-[#9CA3AF]">shipped this month</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right — stacked floating cards */}
          <div className="relative h-[480px] hidden lg:block">
            {cards.map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60, rotate: i === 1 ? -3 : i === 2 ? 2 : 0 }}
                animate={{ opacity: 1, y: 0, rotate: i === 1 ? -3 : i === 2 ? 2 : 0 }}
                transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 80 }}
                whileHover={{ y: -8, rotate: 0, zIndex: 10 }}
                className={`absolute glass-strong rounded-3xl p-5 w-72 cursor-pointer
                  ${i === 0 ? "top-0 right-0 animate-float" : ""}
                  ${i === 1 ? "top-36 left-0 animate-float-delay" : ""}
                  ${i === 2 ? "bottom-0 right-12 animate-float-delay-2" : ""}
                `}
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center text-xl shadow-md`}>
                    {card.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0A0A0F] truncate">{card.title}</p>
                    <p className="text-xs text-[#9CA3AF]">by {card.by}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {card.skills.map(s => (
                    <span key={s} className="text-[10px] font-medium px-2 py-0.5 bg-black/[0.05] rounded-full text-[#6B7280]">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {card.members.map((c, j) => (
                      <div key={j} className={`w-6 h-6 ${c} rounded-full border-2 border-white`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${card.tagColor}`}>{card.tag}</span>
                    <span className="text-xs font-bold text-[#6B7280]">{card.slots}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Floating stat badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: "spring" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass rounded-2xl px-4 py-3 shadow-lg flex items-center gap-2 z-20"
            >
              <Zap className="w-4 h-4 text-[#FF2D2D]" />
              <span className="text-xs font-bold text-[#0A0A0F]">12 new ideas today</span>
            </motion.div>
          </div>
        </div>

        {/* Mobile cards preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:hidden mt-12 flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory"
        >
          {cards.map((card, i) => (
            <div key={i} className="glass-strong rounded-3xl p-4 min-w-[260px] snap-start flex-shrink-0"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-lg`}>
                  {card.emoji}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0A0A0F]">{card.title}</p>
                  <p className="text-xs text-[#9CA3AF]">by {card.by}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${card.tagColor}`}>{card.tag}</span>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span className="text-xs font-bold text-[#6B7280]">{card.slots}</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-[#9CA3AF] font-medium tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-5 h-8 border-2 border-black/15 rounded-full flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 bg-black/30 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
