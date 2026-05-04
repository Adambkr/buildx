"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  children,
  className,
  loading,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer select-none";

  const variants = {
    primary:
      "gradient-bg text-white shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300",
    secondary:
      "bg-[#FFF0F0] text-[#FF2D2D] hover:bg-[#FFE0E0]",
    outline:
      "border-2 border-[#E2E8F0] text-[#0F172A] hover:border-[#FF2D2D] hover:text-[#FF2D2D]",
    ghost:
      "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F7F7F9]",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm rounded-xl",
    md: "h-11 px-6 text-sm rounded-2xl",
    lg: "h-[3.25rem] px-8 text-base rounded-2xl",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(base, variants[variant], sizes[size], className, {
        "opacity-50 pointer-events-none": disabled || loading,
      })}
      disabled={disabled || loading}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
