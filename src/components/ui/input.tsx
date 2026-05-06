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
        <label className="block text-sm font-medium text-white mb-1.5">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full h-11 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-[#64748B] transition-all duration-200",
          "focus:outline-none focus:border-[#FF3366]/40",
          error && "border-[#FF3366]/40 focus:border-[#FF3366]/60",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
