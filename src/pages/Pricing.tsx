
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Link } from "react-router-dom";
import { CheckCircle, X } from "lucide-react";
import BackToLandingNavbar from "@/components/BackToLandingNavbar";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started with basic trading strategies",
      features: [
        "3 strategies per month",
        "Basic backtesting",
        "Community support",
        "Standard indicators",
        "Basic risk management"
      ],
      limitations: [
        "Advanced AI features",
        "Real-time data",
        "Premium indicators",
        "Priority support"
      ],
      cta: "Get Started Free",
      popular: false,
      href: "/signup"
    },
    {
      name: "Pro",
      price: "$29",
      period: "month",
      description: "Everything you need to build professional trading strategies",
      features: [
        "Unlimited strategies",
        "Advanced backtesting",
        "AI-powered optimization",
        "Real-time market data",
        "Premium indicators",
        "Advanced risk management",
        "Priority support",
        "Strategy recommendations",
        "Performance analytics"
      ],
      limitations: [],
      cta: "Start Pro Trial",
      popular: true,
      href: "/signup"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "Custom solutions for teams and institutions",
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Dedicated support",
        "Team collaboration",
        "Advanced security",
        "Custom indicators",
        "API access",
        "Training & onboarding"
      ],
      limitations: [],
      cta: "Contact Sales",
      popular: false,
      href: "mailto:help@strataige.cc"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <BackToLandingNavbar />
      
      <div className="py-20">
        <Container>
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that's right for you. Start free and scale as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={plan.name} 
                className={`relative hover:shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in ${
                  plan.popular ? 'border-blue-500 border-2 shadow-lg' : 'border-gray-200'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    {plan.period !== "contact us" && (
                      <span className="text-gray-500">/{plan.period}</span>
                    )}
                  </div>
                  <CardDescription className="mt-4 text-base">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, idx) => (
                      <div key={idx} className="flex items-center gap-3 opacity-50">
                        <X className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6">
                    {plan.href.startsWith('mailto:') ? (
                      <a href={plan.href}>
                        <Button 
                          className={`w-full hover:scale-105 transition-all duration-300 ${
                            plan.popular 
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg' 
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                          }`}
                          size="lg"
                        >
                          {plan.cta}
                        </Button>
                      </a>
                    ) : (
                      <Link to={plan.href}>
                        <Button 
                          className={`w-full hover:scale-105 transition-all duration-300 ${
                            plan.popular 
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg' 
                              : 'bg-gray-900 hover:bg-gray-800 text-white'
                          }`}
                          size="lg"
                        >
                          {plan.cta}
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="bg-white/80 backdrop-blur rounded-xl p-8 max-w-2xl mx-auto shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">
                Questions about pricing?
              </h3>
              <p className="text-gray-600 mb-6">
                We're here to help. Contact our support team for any questions about our pricing plans.
              </p>
              <a href="mailto:help@strataige.cc">
                <Button variant="outline" size="lg" className="hover:scale-105 transition-transform duration-200">
                  Contact Support
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </div>

      <CtaSection />
      <Footer />
    </div>
  );
};

export default Pricing;
