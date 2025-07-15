
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/Badge";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserSubscription, isPro } from "@/hooks/useUserSubscription";

interface PricingSectionProps {
  isPage?: boolean;
}

export const PricingSection = ({
  isPage = false
}: PricingSectionProps) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { tier, isLoading: subscriptionLoading } = useUserSubscription();
  const userIsPro = isPro(tier);
  
  const handleSubscribe = async (planType: 'monthly' | 'annual') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive"
      });
      return;
    }

    if (userIsPro) {
      toast({
        title: "Already subscribed",
        description: "You already have an active subscription. Use the manage subscription button to make changes.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Subscription error",
        description: error.message || "Failed to start subscription process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pricingPlans = [{
    name: "Free",
    monthlyPrice: "$0",
    annualPrice: "$0",
    priceDescription: isAnnual ? "/year" : "/month",
    description: "Access StratAIge's core features at no cost.",
    features: ["Unlimited strategy generation", "Unlimited strategy modification", "Strategy management"],
    buttonText: userIsPro ? "Current Plan" : "Get Started Free",
    buttonLink: "/signup",
    isFeatured: false,
    isCurrentPlan: !subscriptionLoading && !userIsPro
  }, {
    name: "Pro",
    monthlyPrice: "$25",
    annualPrice: "$240",
    priceDescription: isAnnual ? "/year" : "/month",
    description: "For professional traders and businesses.",
    features: ["Everything in the free plan", "Live signals to Email/Discord/Telegram", "Priority Customer Service"],
    buttonText: userIsPro ? "Current Plan" : "Get Started",
    buttonLink: "/signup",
    isFeatured: true,
    isCurrentPlan: !subscriptionLoading && userIsPro
  }];

  const TitleTag = isPage ? "h1" : "h2";
  const annualSavings = 25 * 12 - 240; // $300 - $240 = $60 savings

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
          {pricingPlans.map((plan, index) => <Card key={plan.name} className={`flex flex-col transition-all duration-300 hover:shadow-2xl ${plan.isFeatured ? 'border-blue-600 shadow-xl scale-105' : 'shadow-lg'} ${plan.isCurrentPlan ? 'border-green-500 bg-green-50' : ''}`} style={{
          animationDelay: `${200 + index * 100}ms`
        }}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  {plan.isFeatured && isAnnual && <Badge variant="pro" className="text-xs px-2 py-1 animate-fade-in">
                      Save ${annualSavings}
                    </Badge>}
                  {plan.isCurrentPlan && <Badge variant="free" className="text-xs px-2 py-1 bg-green-100 text-green-800">
                      Current Plan
                    </Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">{plan.priceDescription}</span>
                </div>
                <ul className="space-y-4 pb-12">
                  {plan.features.map((feature, featureIndex) => <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-1" />
                      <span>{feature}</span>
                    </li>)}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.name === "Free" ? (
                  <Button asChild className={`w-full hover:scale-105 transition-transform duration-200 ${plan.isFeatured ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white'}`}>
                    <Link to={plan.buttonLink}>{plan.buttonText}</Link>
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleSubscribe(isAnnual ? 'annual' : 'monthly')}
                    disabled={isLoading || plan.isCurrentPlan}
                    className={`w-full hover:scale-105 transition-transform duration-200 ${plan.isFeatured ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white'}`}
                  >
                    {isLoading ? "Processing..." : plan.buttonText}
                  </Button>
                )}
              </CardFooter>
            </Card>)}
        </div>
      </Container>
    </section>;
};
