import Link from "next/link";
import { Zap } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#0A0A0F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 gradient-bg rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-xl font-black tracking-tight">
                Build<span className="gradient-text">X</span>
              </span>
            </Link>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              The platform where builders turn ideas into real products with real teams. No fluff, just execution.
            </p>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Product</p>
            <div className="space-y-3">
              {[
                { href: "/ideas", label: "Discover Ideas" },
                { href: "/projects", label: "Projects" },
                { href: "/signup", label: "Get Started" },
              ].map(l => (
                <Link key={l.href} href={l.href} className="block text-sm text-white/50 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Account</p>
            <div className="space-y-3">
              {[
                { href: "/login", label: "Sign In" },
                { href: "/signup", label: "Sign Up Free" },
              ].map(l => (
                <Link key={l.href} href={l.href} className="block text-sm text-white/50 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.07] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">
            &copy; {new Date().getFullYear()} BuildX. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-white/30">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
