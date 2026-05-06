import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-white/[0.04] text-[#94A3B8] border border-white/[0.08]",
    primary: "bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/20",
    success: "bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/20",
    warning: "bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20",
    danger: "bg-[#FF3366]/10 text-[#FF3366] border border-[#FF3366]/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
