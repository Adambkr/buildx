"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#0F172A] mb-1.5">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full h-11 px-4 rounded-2xl border-2 border-[#E2E8F0] bg-white text-[#0F172A] placeholder-[#94A3B8] transition-all duration-200",
          "focus:outline-none focus:border-[#FF2D2D] focus:ring-2 focus:ring-red-100",
          error && "border-red-400 focus:border-red-400",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
