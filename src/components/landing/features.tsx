"use client";

import { motion } from "framer-motion";
import {
  Lightbulb, Users, Rocket, Shield, BarChart3, Sparkles,
} from "lucide-react";
import {
  StaggerContainer,
  StaggerItem,
  FadeIn,
} from "@/components/ui/animated-section";

const features = [
  {
    icon: Lightbulb,
    title: "Post Your Idea",
    description: "Share your vision. Define the skills you need and watch talented builders discover your idea.",
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-50",
    glow: "shadow-amber-200/60",
  },
  {
    icon: Users,
    title: "Exclusive Teams",
    description: "Form tight-knit teams of up to 10. Quality over quantity — every seat counts.",
    gradient: "from-blue-400 to-indigo-500",
    bg: "bg-blue-50",
    glow: "shadow-blue-200/60",
  },
  {
    icon: Rocket,
    title: "Launch Projects",
    description: "Go from idea to execution with built-in project management, tasks, and milestones.",
    gradient: "from-emerald-400 to-teal-500",
    bg: "bg-emerald-50",
    glow: "shadow-emerald-200/60",
  },
  {
    icon: Shield,
    title: "Smart Matching",
    description: "Our algorithm matches your idea with builders who have the exact skills you need.",
    gradient: "from-violet-400 to-purple-500",
    bg: "bg-violet-50",
    glow: "shadow-violet-200/60",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description: "Monitor milestones, manage tasks, and stay aligned as your project evolves.",
    gradient: "from-pink-400 to-rose-500",
    bg: "bg-pink-50",
    glow: "shadow-pink-200/60",
  },
  {
    icon: Sparkles,
    title: "Build Reputation",
    description: "Earn points for contributions and completed projects. Your track record matters.",
    gradient: "from-orange-400 to-red-500",
    bg: "bg-orange-50",
    glow: "shadow-orange-200/60",
  },
];

export function Features() {
  return (
    <section className="py-16 sm:py-28 mesh-bg-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-12 sm:mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white rounded-full text-sm font-semibold text-[#FF2D2D] shadow-sm border border-red-100 mb-6">
            ✦ Platform Features
          </span>
          <h2 className="font-black text-[#0A0A0F] mt-2" style={{fontSize:"clamp(2rem,5vw,3.2rem)",letterSpacing:"-0.025em"}}>
            Everything You Need to Build
          </h2>
          <p className="text-lg text-[#6B7280] mt-4 max-w-xl mx-auto">
            A platform designed for creators who want to move fast and ship real things.
          </p>
        </FadeIn>

        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.div
                whileHover={{ y: -6, boxShadow: "0 20px 60px rgba(0,0,0,0.1)" }}
                className="group glass-strong p-7 rounded-3xl border border-white/80 h-full cursor-default transition-colors"
              >
                <div className={`w-13 h-13 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg ${feature.glow} transition-transform duration-300 group-hover:scale-110 w-12 h-12`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[#0A0A0F] mb-2">{feature.title}</h3>
                <p className="text-[#6B7280] text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
