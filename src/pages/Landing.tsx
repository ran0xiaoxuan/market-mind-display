import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { TrendingUp, BarChart3, Brain, Shield, PlayIcon, Users, Target, CheckCircle, ArrowRight, Sparkles, Zap } from "lucide-react";
const Landing = () => {
  const features = [{
    icon: Brain,
    title: "AI-Powered Strategy Creation",
    description: "Generate sophisticated trading strategies using advanced AI algorithms and market analysis.",
    delay: "0ms"
  }, {
    icon: PlayIcon,
    title: "Advanced Backtesting",
    description: "Test your strategies with real market data and optimize performance with detailed analytics.",
    delay: "100ms"
  }, {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track returns, Sharpe ratios, drawdowns, and other key metrics to optimize your trading.",
    delay: "200ms"
  }, {
    icon: Shield,
    title: "Risk Management",
    description: "Built-in risk controls and position sizing to protect your capital and maximize returns.",
    delay: "300ms"
  }, {
    icon: Target,
    title: "Multi-Asset Support",
    description: "Trade stocks, ETFs, and other assets with strategies tailored to each market.",
    delay: "400ms"
  }, {
    icon: Users,
    title: "Strategy Recommendations",
    description: "Get personalized strategy suggestions based on market conditions and your preferences.",
    delay: "500ms"
  }];
  const benefits = ["Create unlimited trading strategies", "Backtest with historical market data", "AI-powered strategy optimization", "Real-time performance monitoring", "Risk management tools", "Multi-asset trading support"];
  const stats = [{
    label: "Active Strategies",
    value: "10,000+",
    icon: Target
  }, {
    label: "Backtests Run",
    value: "50K+",
    icon: PlayIcon
  }, {
    label: "Average Return",
    value: "+12.5%",
    icon: TrendingUp
  }, {
    label: "Users",
    value: "5,000+",
    icon: Users
  }];
  return <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-all duration-300">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="animate-fade-in">
              <Logo size="md" />
            </div>
            <div className="flex items-center gap-4 animate-fade-in" style={{
            animationDelay: '200ms'
          }}>
              <Link to="/login">
                
              </Link>
              <Link to="/signup">
                <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
        
        {/* Floating Animation Elements */}
        
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
        
        {/* Additional Floating Elements */}
        <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-primary/20 rounded-full animate-ping" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-primary/30 rounded-full animate-ping" style={{
        animationDelay: '3s'
      }}></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-primary/25 rounded-full animate-ping" style={{
        animationDelay: '5s'
      }}></div>
        
        {/* Geometric Shapes */}
        
        <div className="absolute bottom-32 left-20 w-6 h-6 border border-primary/15 rotate-12 animate-spin" style={{
        animationDuration: '15s',
        animationDirection: 'reverse'
      }}></div>
        
        <Container className="relative z-10">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              {/* Enhanced Badge with Animation */}
              
              
              {/* Enhanced Main Heading with Staggered Animation */}
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                <span style={{
                animationDelay: '200ms'
              }} className="block animate-fade-in hover:scale-105 transition-transform duration-500 py-[5px]">
                  Build Winning Trading
                </span>
                <span style={{
                animationDelay: '400ms'
              }} className="block text-primary bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent animate-fade-in hover:scale-105 transition-all duration-500 py-[5px]">
                  Strategies with AI
                </span>
              </h1>
              
              {/* Enhanced Description with Typewriter Effect Simulation */}
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in hover:text-foreground/80 transition-colors duration-300" style={{
              animationDelay: '600ms'
            }}>
                Create, backtest, and optimize trading strategies using advanced AI algorithms. 
                <br className="hidden md:block" />
                <span className="animate-fade-in inline-block" style={{
                animationDelay: '800ms'
              }}>
                  Turn market data into profitable trading decisions with StratAlge.
                </span>
              </p>
            </div>
            
            {/* Enhanced CTA Buttons with Ripple Effect */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{
            animationDelay: '1000ms'
          }}>
              <Link to="/signup">
                <Button size="lg" className="px-8 hover:scale-110 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-2xl group relative overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Start Building Strategies
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  {/* Ripple Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8 hover:scale-110 transition-all duration-300 hover:bg-primary/5 hover:border-primary/30 hover:shadow-lg group">
                  <span className="group-hover:animate-pulse">View Demo</span>
                </Button>
              </Link>
            </div>

            {/* Enhanced Stats with Hover Animations */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16">
              {stats.map((stat, index) => <div key={index} className="text-center group cursor-pointer animate-fade-in hover:scale-110 transition-all duration-500 hover:bg-primary/5 rounded-lg p-4 hover:shadow-lg" style={{
              animationDelay: `${1200 + index * 150}ms`
            }}>
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:rotate-12">
                      <stat.icon className="h-6 w-6 text-primary group-hover:scale-125 transition-transform duration-300" />
                    </div>
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-primary group-hover:text-primary/80 transition-colors duration-300 group-hover:animate-pulse">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    {stat.label}
                  </div>
                </div>)}
            </div>

            {/* Enhanced Floating Action Hint */}
            <div className="pt-8 animate-fade-in" style={{
            animationDelay: '1800ms'
          }}>
              <div className="flex justify-center">
                <div className="animate-bounce cursor-pointer hover:scale-110 transition-transform duration-300">
                  <ArrowRight className="h-6 w-6 text-primary/60 rotate-90" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2 animate-pulse">
                Scroll to explore features
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/50 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/2 to-transparent"></div>
        
        <Container className="relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Trade Successfully
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From AI-powered strategy creation to advanced backtesting, 
              we provide all the tools you need to build profitable trading strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer animate-fade-in hover:scale-105 bg-gradient-to-br from-background to-background/50" style={{
            animationDelay: feature.delay
          }}>
                <CardHeader>
                  <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit group-hover:bg-primary/20 transition-colors duration-300">
                    <feature.icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-200" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-200">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>)}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How StratAlge Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start building profitable trading strategies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((step, index) => <div key={step} className="text-center space-y-4 group animate-fade-in hover:scale-105 transition-all duration-300" style={{
            animationDelay: `${index * 200}ms`
          }}>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    {step}
                  </div>
                  {index < 2 && <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent"></div>}
                </div>
                <h3 className="text-xl font-semibold group-hover:text-primary transition-colors duration-200">
                  {step === 1 && "Create Your Strategy"}
                  {step === 2 && "Backtest & Optimize"}
                  {step === 3 && "Deploy & Monitor"}
                </h3>
                <p className="text-muted-foreground">
                  {step === 1 && "Use our AI-powered tools or build custom strategies with technical indicators and trading rules."}
                  {step === 2 && "Test your strategies against historical data and optimize parameters for better performance."}
                  {step === 3 && "Monitor your strategies' performance in real-time and make data-driven adjustments."}
                </p>
              </div>)}
          </div>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-full blur-3xl"></div>
        
        <Container className="relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose StratAlge?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of traders who are already using StratAlge to build 
                and optimize their trading strategies with cutting-edge AI technology.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => <div key={index} className="flex items-center gap-3 group animate-fade-in hover:translate-x-2 transition-all duration-300" style={{
                animationDelay: `${index * 100}ms`
              }}>
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-base group-hover:text-primary transition-colors duration-200">{benefit}</span>
                  </div>)}
              </div>

              <div className="mt-8 animate-fade-in" style={{
              animationDelay: '600ms'
            }}>
                <Link to="/signup">
                  <Button size="lg" className="px-8 hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl group">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative animate-fade-in" style={{
            animationDelay: '200ms'
          }}>
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 rounded-2xl blur-xl"></div>
              <Card className="p-8 shadow-xl relative z-10 hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-gradient-to-br from-background to-background/80 backdrop-blur">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 animate-fade-in" style={{
                  animationDelay: '400ms'
                }}>
                    <div className="p-2 rounded-lg bg-green-100">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold">RSI Strategy</div>
                      <div className="text-sm text-muted-foreground">Active • AAPL</div>
                    </div>
                    <div className="ml-auto text-green-600 font-semibold text-xl animate-pulse">+12.5%</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[{
                    label: "Sharpe Ratio",
                    value: "1.85"
                  }, {
                    label: "Max Drawdown",
                    value: "-4.1%"
                  }, {
                    label: "Win Rate",
                    value: "68%"
                  }, {
                    label: "Total Trades",
                    value: "156"
                  }].map((metric, index) => <div key={metric.label} className="animate-fade-in hover:scale-105 transition-all duration-200 p-2 rounded-lg hover:bg-muted/50" style={{
                    animationDelay: `${600 + index * 100}ms`
                  }}>
                        <div className="text-muted-foreground">{metric.label}</div>
                        <div className="font-semibold text-lg">{metric.value}</div>
                      </div>)}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"></div>
        
        <Container className="relative z-10">
          <div className="text-center space-y-8 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Building Winning Strategies?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of traders using StratAlge to create, test, and optimize 
              their trading strategies with AI-powered tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{
            animationDelay: '200ms'
          }}>
              <Link to="/signup">
                <Button size="lg" className="px-8 hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8 hover:scale-105 transition-all duration-300 hover:bg-primary/5 hover:border-primary/30">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent"></div>
        
        <Container className="relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4 animate-fade-in">
              <Logo size="md" />
              <p className="text-sm text-muted-foreground">
                Build winning trading strategies with AI-powered tools and advanced backtesting.
              </p>
            </div>
            
            {[{
            title: "Product",
            links: ["Strategies", "Backtesting", "AI Tools", "Analytics"]
          }, {
            title: "Company",
            links: ["About", "Contact", "Support", "Privacy"]
          }, {
            title: "Resources",
            links: ["Documentation", "Tutorials", "Blog", "Community"]
          }].map((section, index) => <div key={section.title} className="animate-fade-in" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <div className="space-y-2 text-sm">
                  {section.links.map(link => <div key={link}>
                      <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors duration-200 hover:translate-x-1 inline-block">
                        {link}
                      </Link>
                    </div>)}
                </div>
              </div>)}
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground animate-fade-in" style={{
          animationDelay: '400ms'
        }}>
            © 2024 StratAlge. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>;
};
export default Landing;