"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn } from "@/components/ui/animated-section";
import { ArrowRight, Zap, Star } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function CTA() {
  const user = useAppStore((s) => s.user);
  return (
    <section className="py-16 sm:py-28 mesh-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <FadeIn>
          <div className="relative overflow-hidden rounded-[2.5rem] p-1"
            style={{ background: "linear-gradient(135deg,#FF2D2D,#FF6B6B,#FF9A3C,#7C3AED)" }}>
            <div className="relative bg-[#0A0A0F] rounded-[2.2rem] px-8 py-16 sm:px-16 sm:py-20 text-center overflow-hidden">
              {/* Orbs */}
              <div className="orb w-64 h-64 bg-red-500/20 top-[-60px] left-[-60px]" />
              <div className="orb w-48 h-48 bg-violet-500/20 bottom-[-40px] right-[-40px]" />
              <div className="orb w-32 h-32 bg-orange-400/20 top-1/2 right-1/4" />

              {/* Grid */}
              <div className="absolute inset-0 opacity-[0.04]"
                style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6 border border-white/20"
                >
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-white/80">Join 2,400+ builders</span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="font-black text-white mb-6 leading-tight"
                  style={{ fontSize: "clamp(2.2rem,6vw,4rem)", letterSpacing: "-0.03em" }}
                >
                  Ready to build
                  <br />
                  <span style={{ background: "linear-gradient(135deg,#FF6B6B,#FF9A3C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    something real?
                  </span>
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-white/60 mb-10 max-w-lg mx-auto"
                >
                  Post your idea, find your team, and ship together. Your next big project starts here.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center"
                >
                  <Link href={user ? "/ideas" : "/signup"}>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,107,107,0.5)" }}
                      whileTap={{ scale: 0.97 }}
                      className="gradient-bg-vibrant text-white px-8 py-4 rounded-2xl font-bold text-base flex items-center gap-2 shadow-2xl cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      Start Building Free
                    </motion.button>
                  </Link>
                  <Link href="/ideas">
                    <motion.button
                      whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.15)" }}
                      className="bg-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-base border border-white/20 flex items-center gap-2 cursor-pointer"
                    >
                      Browse Ideas <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
