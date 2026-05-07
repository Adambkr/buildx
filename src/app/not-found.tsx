import Link from "next/link";
import { Flame } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050507] px-4">
      <div className="text-center">
        <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#FF3366]/20">
          <Flame className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-6xl font-extrabold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">
          Page Not Found
        </h2>
        <p className="text-[#64748B] mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 gradient-bg text-white font-semibold rounded-2xl shadow-lg shadow-[#FF3366]/20 hover:shadow-xl hover:shadow-[#FF3366]/30 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
