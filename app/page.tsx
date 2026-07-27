import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { WhyNexarSection } from "@/components/sections/WhyNexarSection";
import { TokenomicsSection } from "@/components/sections/TokenomicsSection";
import { EcosystemSection } from "@/components/sections/EcosystemSection";
import { RoadmapSection } from "@/components/sections/RoadmapSection";
import { SecuritySection } from "@/components/sections/SecuritySection";
import { FounderSection } from "@/components/sections/FounderSection";
import { WhitepaperSection } from "@/components/sections/WhitepaperSection";
import { Footer } from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <HeroSection />
      <AboutSection />
      <WhyNexarSection />
      <TokenomicsSection />
      <EcosystemSection />
      <RoadmapSection />
      <SecuritySection />
      <FounderSection />
      <WhitepaperSection />
      <Footer />
    </main>
  );
}
