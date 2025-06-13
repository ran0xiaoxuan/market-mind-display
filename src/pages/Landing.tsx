
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, Brain, Shield, PlayIcon, Users, Target, CheckCircle, ArrowRight, Star, Award, Zap, Globe } from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Strategy Creation",
      description: "Generate sophisticated trading strategies using advanced AI algorithms and market analysis.",
      delay: "0ms"
    },
    {
      icon: PlayIcon,
      title: "Advanced Backtesting",
      description: "Test your strategies with real market data and optimize performance with detailed analytics.",
      delay: "100ms"
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track returns, Sharpe ratios, drawdowns, and other key metrics to optimize your trading.",
      delay: "200ms"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Built-in risk controls and position sizing to protect your capital and maximize returns.",
      delay: "300ms"
    },
    {
      icon: Target,
      title: "Multi-Asset Support",
      description: "Trade stocks, ETFs, and other assets with strategies tailored to each market.",
      delay: "400ms"
    },
    {
      icon: Users,
      title: "Strategy Recommendations",
      description: "Get personalized strategy suggestions based on market conditions and your preferences.",
      delay: "500ms"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Portfolio Manager",
      content: "StratAlge has transformed how I approach trading. The AI-powered insights are incredible.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Day Trader",
      content: "The backtesting feature saved me from costly mistakes. Highly recommended platform.",
      rating: 5
    },
    {
      name: "Emily Rodriguez",
      role: "Investment Advisor",
      content: "Clean interface, powerful tools, and excellent support. Everything I need in one place.",
      rating: 5
    }
  ];

  const stats = [
    {
      label: "Active Strategies",
      value: "10,000+",
      icon: Target
    },
    {
      label: "Backtests Run",
      value: "50K+",
      icon: PlayIcon
    },
    {
      label: "Average Return",
      value: "+12.5%",
      icon: TrendingUp
    },
    {
      label: "Users",
      value: "5,000+",
      icon: Users
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      {/* Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
        
        <Container className="relative z-10">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-4 w-4" />
              AI-Powered Trading Platform
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Your Trading Edge,
              <span className="block text-primary bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Perfected by AI
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create, backtest, and optimize trading strategies with advanced AI. 
              Join thousands of traders using StratAlge to maximize their returns.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="px-8">
                  Start Building Strategies
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50">
        <Container>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Award className="h-4 w-4" />
              Platform Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Trade Successfully
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From AI-powered strategy creation to advanced backtesting, 
              we provide all the tools you need to build profitable trading strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer">
                <CardHeader>
                  <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors duration-300">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How StratAlge Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start building profitable trading strategies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Create Your Strategy",
                description: "Use our AI-powered tools or build custom strategies with technical indicators and trading rules."
              },
              {
                step: 2,
                title: "Backtest & Optimize",
                description: "Test your strategies against historical data and optimize parameters for better performance."
              },
              {
                step: 3,
                title: "Deploy & Monitor",
                description: "Monitor your strategies' performance in real-time and make data-driven adjustments."
              }
            ].map((item, index) => (
              <div key={item.step} className="text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto shadow-lg">
                    {item.step}
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Trusted by thousands of traders worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"></div>
        
        <Container className="relative z-10">
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Building Winning Strategies?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of traders using StratAlge to create, test, and optimize 
              their trading strategies with AI-powered tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <Container>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo size="md" />
              <p className="text-sm text-muted-foreground">
                Build winning trading strategies with AI-powered tools and advanced backtesting.
              </p>
            </div>
            
            {[
              {
                title: "Product",
                links: ["Strategies", "Backtesting", "AI Tools", "Analytics"]
              },
              {
                title: "Company",
                links: ["About", "Contact", "Support", "Privacy"]
              },
              {
                title: "Resources",
                links: ["Documentation", "Tutorials", "Blog", "Community"]
              }
            ].map((section, index) => (
              <div key={section.title}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <div className="space-y-2 text-sm">
                  {section.links.map(link => (
                    <div key={link}>
                      <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                        {link}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 StratAlge. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Landing;
