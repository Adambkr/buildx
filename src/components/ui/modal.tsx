"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Bottom sheet on mobile, centered card on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full sm:max-w-lg glass-strong rounded-t-3xl sm:rounded-3xl border border-white/80 p-5 sm:p-8 z-10 max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
          >
            {/* Drag handle indicator for mobile */}
            <div className="sm:hidden flex justify-center mb-3">
              <div className="w-10 h-1 bg-black/10 rounded-full" />
            </div>
            <div className="flex items-center justify-between mb-5">
              {title && (
                <h2 className="text-lg sm:text-xl font-bold text-[#0A0A0F]">{title}</h2>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-black/[0.05] transition-colors cursor-pointer ml-auto"
              >
                <X className="w-5 h-5 text-[#9CA3AF]" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
