
import BackToLandingNavbar from "@/components/BackToLandingNavbar"; 
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { PricingSection } from "@/components/PricingSection";
import { usePageTitle } from "@/hooks/usePageTitle";

const PricingPage = () => {
  usePageTitle("Pricing - StratAIge");

  return (
    <div>
      <BackToLandingNavbar />
      <PricingSection isPage />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default PricingPage;
