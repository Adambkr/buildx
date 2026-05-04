"use client";

import { motion } from "framer-motion";
import { Lightbulb, Users, Rocket } from "lucide-react";
import {
  StaggerContainer,
  StaggerItem,
  FadeIn,
} from "@/components/ui/animated-section";

const steps = [
  {
    icon: Lightbulb,
    title: "Post an Idea",
    description:
      "Share your vision with the community. Describe what you want to build and the skills you need.",
    color: "bg-amber-50",
    iconColor: "text-amber-500",
    gradient: "from-amber-400 to-orange-500",
    number: "01",
  },
  {
    icon: Users,
    title: "Build Your Team",
    description:
      "Receive applications from talented people. Choose up to 10 members for your exclusive team.",
    color: "bg-[#FFF0F0]",
    iconColor: "text-[#FF2D2D]",
    gradient: "from-red-400 to-rose-500",
    number: "02",
  },
  {
    icon: Rocket,
    title: "Launch a Project",
    description:
      "Once your team is ready, your idea transforms into a private project workspace with all the tools you need.",
    color: "bg-emerald-50",
    iconColor: "text-emerald-500",
    gradient: "from-emerald-400 to-teal-500",
    number: "03",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <FadeIn className="text-center mb-12 sm:mb-20">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#FFF0F0] rounded-full text-sm font-semibold text-[#FF2D2D] border border-red-100 mb-6">
            → How It Works
          </span>
          <h2 className="font-black text-[#0A0A0F] mt-2" style={{fontSize:"clamp(2rem,5vw,3.2rem)",letterSpacing:"-0.025em"}}>
            Three Steps to Launch
          </h2>
          <p className="text-lg text-[#6B7280] mt-4 max-w-xl mx-auto">
            From idea to shipped project. No complexity, just momentum.
          </p>
        </FadeIn>

        <StaggerContainer className="grid md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[#FF2D2D]/30 to-transparent" />

          {steps.map((step, i) => (
            <StaggerItem key={step.number}>
              <motion.div
                whileHover={{ y: -8 }}
                className="glass-strong rounded-3xl p-8 border border-white/80 h-full relative group"
                style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                    <step.icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-5xl font-black text-black/[0.04] select-none">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-[#0A0A0F] mb-3">{step.title}</h3>
                <p className="text-[#6B7280] leading-relaxed">{step.description}</p>
                {i < steps.length - 1 && (
                  <div className="md:hidden mt-6 flex justify-center">
                    <div className="w-px h-8 bg-gradient-to-b from-[#FF2D2D]/30 to-transparent" />
                  </div>
                )}
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
