"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = true, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={onClick}
      className={cn(
        "bg-white rounded-2xl border border-[#E2E8F0] p-6",
        "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        hover && "hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] cursor-pointer",
        "transition-shadow duration-300",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
