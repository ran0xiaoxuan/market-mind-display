
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/Badge";
import { Link } from "react-router-dom";
import { useState } from "react";

interface PricingSectionProps {
  isPage?: boolean;
}

export const PricingSection = ({
  isPage = false
}: PricingSectionProps) => {
  const [isAnnual, setIsAnnual] = useState(true);
  
  const pricingPlans = [{
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    priceDescription: isAnnual ? "/year" : "/month",
    description: "Access StratAIge's core features at no cost.",
    features: ["Unlimited strategy generation", "Unlimited strategy backtest and modification", "Strategy management"],
    buttonText: "Get Started Free",
    buttonLink: "/signup",
    isFeatured: false
  }, {
    name: "Pro",
    monthlyPrice: "$50",
    annualPrice: "$480",
    priceDescription: isAnnual ? "/year" : "/month",
    description: "For professional traders and businesses.",
    features: ["Everything in the free plan", "Live signals to Email/Discord/Telegram", "Priority Customer Service"],
    buttonText: "Get Started",
    buttonLink: "/signup",
    isFeatured: true
  }];

  const TitleTag = isPage ? "h1" : "h2";
  const annualSavings = 50 * 12 - 480; // $600 - $480 = $120 savings

  return <section className={isPage ? "bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-x-hidden py-16" : "py-20 bg-white"}>
      <Container>
        <div className="text-center mb-12 animate-fade-in">
          <TitleTag className={isPage ? "text-4xl md:text-5xl font-bold mb-4 text-gray-900" : "text-3xl md:text-4xl font-bold mb-4 text-gray-900"}>
            Find the perfect plan for your needs
          </TitleTag>
          <p className={isPage ? "text-lg text-gray-700 max-w-2xl mx-auto mb-8" : "text-xl text-gray-600 max-w-2xl mx-auto mb-8"}>
            Start with a generous free plan and upgrade as your trading scales.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button onClick={() => setIsAnnual(!isAnnual)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isAnnual ? 'bg-blue-600' : 'bg-gray-200'}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Yearly</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch animate-fade-in max-w-4xl mx-auto" style={{
        animationDelay: '200ms'
      }}>
          {pricingPlans.map((plan, index) => <Card key={plan.name} className={`flex flex-col transition-all duration-300 hover:shadow-2xl ${plan.isFeatured ? 'border-blue-600 shadow-xl scale-105' : 'shadow-lg'}`} style={{
          animationDelay: `${200 + index * 100}ms`
        }}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {plan.isFeatured && isAnnual && <Badge variant="pro" className="text-xs px-2 py-1 animate-fade-in">
                      Save ${annualSavings}
                    </Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">{plan.priceDescription}</span>
                  {isAnnual && plan.name === "Pro"}
                </div>
                <ul className="space-y-4 pb-12">
                  {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                      <span>{feature}</span>
                    </li>)}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className={`w-full hover:scale-105 transition-transform duration-200 ${plan.isFeatured ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white'}`}>
                  <Link to={plan.buttonLink}>{plan.buttonText}</Link>
                </Button>
              </CardFooter>
            </Card>)}
        </div>
      </Container>
    </section>;
};
