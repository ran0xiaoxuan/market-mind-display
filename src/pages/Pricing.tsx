
import BackToLandingNavbar from "@/components/BackToLandingNavbar";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { PricingSection } from "@/components/PricingSection";

const PricingPage = () => (
  <div>
    <BackToLandingNavbar />
    <PricingSection isPage />
    <CtaSection />
    <Footer />
  </div>
);

export default PricingPage;
