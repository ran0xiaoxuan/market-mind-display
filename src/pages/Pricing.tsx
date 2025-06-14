import { Container } from "@/components/ui/container";
import BackToLandingNavbar from "@/components/BackToLandingNavbar";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    price: "$0",
    features: [
      "Create 1 trading strategy",
      "Basic backtesting",
      "Access to core analytics",
      "Email support"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Pro",
    price: "$19/mo",
    features: [
      "Unlimited strategies",
      "Advanced backtesting",
      "Premium analytics",
      "Strategy recommendations",
      "Priority email support"
    ],
    cta: "Start Free Trial",
    popular: true
  }
];

export default function Pricing() {
  return (
    <div>
      <BackToLandingNavbar />
      <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-x-hidden py-16 min-h-[70vh]">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Pricing</h1>
            <p className="text-lg text-gray-600 mb-4">
              Choose the plan that fits your trading needs. Simple, transparent, and no hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map(plan => (
              <div
                key={plan.name}
                className={`bg-white/90 rounded-2xl p-8 flex flex-col shadow-lg border hover:scale-105 transition-transform duration-300 ${
                  plan.popular ? "border-blue-600 ring-2 ring-blue-200 relative z-10" : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full font-semibold shadow text-xs">
                    Most Popular
                  </div>
                )}
                <h2 className="text-xl font-bold mb-2">{plan.name}</h2>
                <div className="text-3xl font-extrabold mb-4">
                  {plan.price}
                  {plan.price.startsWith("$") && plan.name !== "Enterprise" && (
                    <span className="text-base font-normal text-gray-500">/mo</span>
                  )}
                </div>
                <ul className="text-gray-700 mb-6 flex-1 space-y-2 text-left">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span> {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </div>
      <CtaSection />
      <Footer />
    </div>
  );
}
