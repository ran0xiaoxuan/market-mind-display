
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import BackToLandingNavbar from "@/components/BackToLandingNavbar";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

const pricingPlans = [
  {
    name: "Starter",
    price: "$9",
    priceDescription: "/month",
    description: "For individuals and small teams.",
    features: [
      "AI-powered strategy generation",
      "Backtesting on historical data",
      "Limited to 10 strategies",
      "Basic support",
    ],
    buttonText: "Get Started",
    buttonLink: "/signup",
    isFeatured: false,
  },
  {
    name: "Pro",
    price: "$29",
    priceDescription: "/month",
    description: "For professional traders and businesses.",
    features: [
      "Everything in Starter, plus:",
      "Unlimited strategies",
      "Advanced backtesting options",
      "Real-time market data",
      "Priority support",
    ],
    buttonText: "Get Started",
    buttonLink: "/signup",
    isFeatured: true,
  },
];

const PricingPage = () => (
  <div>
    <BackToLandingNavbar />
    <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-x-hidden py-16">
      <Container>
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Find the perfect plan for your needs
          </h1>
          <p className="text-lg text-gray-700 max-w-2xl mx-auto">
            Start with a generous free plan and upgrade as your trading scales.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch animate-fade-in" style={{ animationDelay: '200ms' }}>
          {pricingPlans.map((plan, index) => (
            <Card key={plan.name} className={`flex flex-col transition-all duration-300 hover:shadow-2xl ${plan.isFeatured ? 'border-blue-600 shadow-xl scale-105' : 'shadow-lg'}`} style={{ animationDelay: `${200 + index * 100}ms` }}>
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.priceDescription}</span>
                </div>
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full hover:scale-105 transition-transform duration-200">
                    <Link to={plan.buttonLink}>{plan.buttonText}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Container>
    </div>
    <CtaSection />
    <Footer />
  </div>
);

export default PricingPage;
