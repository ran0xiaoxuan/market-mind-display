
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Link } from "react-router-dom";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    priceDescription: "/month",
    description: "Access StratAIge's core features at no cost.",
    features: [
      "AI-powered strategy generation",
      "Backtesting on historical data",
      "Up to 3 saved strategies",
      "Basic support",
    ],
    buttonText: "Get Started Free",
    buttonLink: "/signup",
    isFeatured: false,
  },
  {
    name: "Pro",
    price: "$29",
    priceDescription: "/month",
    description: "For professional traders and businesses.",
    features: [
      "Everything in Free, plus:",
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

interface PricingSectionProps {
  isPage?: boolean;
}

export const PricingSection = ({ isPage = false }: PricingSectionProps) => {
  const TitleTag = isPage ? "h1" : "h2";
  
  return (
    <section className={isPage ? "bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-x-hidden py-16" : "py-20 bg-white"}>
      <Container>
        <div className="text-center mb-12 animate-fade-in">
          <TitleTag className={isPage ? "text-4xl md:text-5xl font-bold mb-4 text-gray-900" : "text-3xl md:text-4xl font-bold mb-4 text-gray-900"}>
            Find the perfect plan for your needs
          </TitleTag>
          <p className={isPage ? "text-lg text-gray-700 max-w-2xl mx-auto" : "text-xl text-gray-600 max-w-2xl mx-auto"}>
            Start with a generous free plan and upgrade as your trading scales.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch animate-fade-in max-w-4xl mx-auto" style={{ animationDelay: '200ms' }}>
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
                <Button asChild className={`w-full hover:scale-105 transition-transform duration-200 ${
                  plan.isFeatured 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg' 
                    : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white'
                }`}>
                    <Link to={plan.buttonLink}>{plan.buttonText}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
};
