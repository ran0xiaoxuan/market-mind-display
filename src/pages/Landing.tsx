
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  BarChart3, 
  Brain, 
  Shield, 
  PlayIcon, 
  Users, 
  Target,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Strategy Creation",
      description: "Generate sophisticated trading strategies using advanced AI algorithms and market analysis."
    },
    {
      icon: PlayIcon,
      title: "Advanced Backtesting",
      description: "Test your strategies with real market data and optimize performance with detailed analytics."
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track returns, Sharpe ratios, drawdowns, and other key metrics to optimize your trading."
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Built-in risk controls and position sizing to protect your capital and maximize returns."
    },
    {
      icon: Target,
      title: "Multi-Asset Support",
      description: "Trade stocks, ETFs, and other assets with strategies tailored to each market."
    },
    {
      icon: Users,
      title: "Strategy Recommendations",
      description: "Get personalized strategy suggestions based on market conditions and your preferences."
    }
  ];

  const benefits = [
    "Create unlimited trading strategies",
    "Backtest with historical market data",
    "AI-powered strategy optimization",
    "Real-time performance monitoring",
    "Risk management tools",
    "Multi-asset trading support"
  ];

  const stats = [
    { label: "Active Strategies", value: "10,000+" },
    { label: "Backtests Run", value: "50K+" },
    { label: "Average Return", value: "+12.5%" },
    { label: "Users", value: "5,000+" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <section className="py-20 md:py-32">
        <Container>
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                Build Winning Trading
                <span className="block text-primary">Strategies with AI</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Create, backtest, and optimize trading strategies using advanced AI algorithms. 
                Turn market data into profitable trading decisions with StratAlge.
              </p>
            </div>
            
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

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
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
              <Card key={index} className="border-0 shadow-sm">
                <CardHeader>
                  <feature.icon className="h-12 w-12 text-primary mb-4" />
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
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Create Your Strategy</h3>
              <p className="text-muted-foreground">
                Use our AI-powered tools or build custom strategies with technical indicators and trading rules.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Backtest & Optimize</h3>
              <p className="text-muted-foreground">
                Test your strategies against historical data and optimize parameters for better performance.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Deploy & Monitor</h3>
              <p className="text-muted-foreground">
                Monitor your strategies' performance in real-time and make data-driven adjustments.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <Container>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why Choose StratAlge?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of traders who are already using StratAlge to build 
                and optimize their trading strategies with cutting-edge AI technology.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-base">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link to="/signup">
                  <Button size="lg" className="px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <Card className="p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="font-semibold">RSI Strategy</div>
                      <div className="text-sm text-muted-foreground">Active • AAPL</div>
                    </div>
                    <div className="ml-auto text-green-600 font-semibold">+12.5%</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Sharpe Ratio</div>
                      <div className="font-semibold">1.85</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Max Drawdown</div>
                      <div className="font-semibold">-4.1%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Win Rate</div>
                      <div className="font-semibold">68%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total Trades</div>
                      <div className="font-semibold">156</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <Container>
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
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <div><Link to="/signup" className="text-muted-foreground hover:text-foreground">Strategies</Link></div>
                <div><Link to="/signup" className="text-muted-foreground hover:text-foreground">Backtesting</Link></div>
                <div><Link to="/signup" className="text-muted-foreground hover:text-foreground">AI Tools</Link></div>
                <div><Link to="/signup" className="text-muted-foreground hover:text-foreground">Analytics</Link></div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground">About</div>
                <div className="text-muted-foreground">Contact</div>
                <div className="text-muted-foreground">Support</div>
                <div className="text-muted-foreground">Privacy</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <div className="space-y-2 text-sm">
                <div className="text-muted-foreground">Documentation</div>
                <div className="text-muted-foreground">Tutorials</div>
                <div className="text-muted-foreground">Blog</div>
                <div className="text-muted-foreground">Community</div>
              </div>
            </div>
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
