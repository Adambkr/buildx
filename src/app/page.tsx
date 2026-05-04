import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { SocialProof } from "@/components/landing/social-proof";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <SocialProof />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
