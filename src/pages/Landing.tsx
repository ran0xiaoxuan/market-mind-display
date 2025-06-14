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
    delay: "0ms",
    gradient: "from-blue-500 to-cyan-500"
  }, {
    icon: PlayIcon,
    title: "Advanced Backtesting",
    description: "Test your strategies with real market data and optimize performance with detailed analytics.",
    delay: "100ms",
    gradient: "from-green-500 to-emerald-500"
  }, {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track returns, Sharpe ratios, drawdowns, and other key metrics to optimize your trading.",
    delay: "200ms",
    gradient: "from-purple-500 to-violet-500"
  }, {
    icon: Shield,
    title: "Risk Management",
    description: "Built-in risk controls and position sizing to protect your capital and maximize returns.",
    delay: "300ms",
    gradient: "from-orange-500 to-red-500"
  }, {
    icon: Target,
    title: "Multi-Asset Support",
    description: "Trade stocks, ETFs, and other assets with strategies tailored to each market.",
    delay: "400ms",
    gradient: "from-teal-500 to-blue-500"
  }, {
    icon: Users,
    title: "Strategy Recommendations",
    description: "Get personalized strategy suggestions based on market conditions and your preferences.",
    delay: "500ms",
    gradient: "from-pink-500 to-rose-500"
  }];
  const benefits = ["Create unlimited trading strategies", "Backtest with historical market data", "AI-powered strategy optimization", "Real-time performance monitoring", "Risk management tools", "Multi-asset trading support"];
  const stats = [{
    label: "Active Strategies",
    value: "10,000+",
    icon: Target,
    color: "text-blue-600"
  }, {
    label: "Backtests Run",
    value: "50K+",
    icon: PlayIcon,
    color: "text-green-600"
  }, {
    label: "Average Return",
    value: "+12.5%",
    icon: TrendingUp,
    color: "text-emerald-600"
  }, {
    label: "Users",
    value: "5,000+",
    icon: Users,
    color: "text-purple-600"
  }];
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 transition-all duration-300 shadow-sm">
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
                <Button className="hover:scale-105 transition-transform duration-200 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-transparent to-cyan-100/50"></div>
        
        {/* Floating Animation Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse" style={{
        animationDelay: '2s'
      }}></div>
        
        {/* Additional Floating Elements */}
        <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-blue-400/60 rounded-full animate-ping" style={{
        animationDelay: '1s'
      }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-green-400/60 rounded-full animate-ping" style={{
        animationDelay: '3s'
      }}></div>
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-purple-400/60 rounded-full animate-ping" style={{
        animationDelay: '5s'
      }}></div>
        
        <Container className="relative z-10">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              {/* Enhanced Badge with Animation */}
              <div className="animate-fade-in" style={{
              animationDelay: '100ms'
            }}>
                
              </div>
              
              {/* Enhanced Main Heading with Staggered Animation */}
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                <span className="block animate-fade-in hover:scale-105 transition-transform duration-500 text-gray-900" style={{
                animationDelay: '200ms'
              }}>
                  Build Winning Trading
                </span>
                <span className="block bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent animate-fade-in hover:scale-105 transition-all duration-500" style={{
                animationDelay: '400ms'
              }}>
                  Strategies with AI
                </span>
              </h1>
              
              {/* Enhanced Description */}
              <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in hover:text-gray-800 transition-colors duration-300" style={{
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
            
            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{
            animationDelay: '1000ms'
          }}>
              <Link to="/signup">
                <Button size="lg" className="px-8 hover:scale-110 transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-2xl group relative overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Start Building Strategies
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="px-8 hover:scale-110 transition-all duration-300 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg group">
                  <span className="group-hover:animate-pulse">View Demo</span>
                </Button>
              </Link>
            </div>

            {/* Enhanced Stats with Bright Colors */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16">
              {stats.map((stat, index) => <div key={index} className="text-center group cursor-pointer animate-fade-in hover:scale-110 transition-all duration-500 hover:bg-white/60 rounded-lg p-4 hover:shadow-lg" style={{
              animationDelay: `${1200 + index * 150}ms`
            }}>
                  <div className="flex items-center justify-center mb-3">
                    <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 group-hover:from-blue-200 group-hover:to-cyan-200 transition-all duration-300 group-hover:rotate-12">
                      <stat.icon className={`h-6 w-6 ${stat.color} group-hover:scale-125 transition-transform duration-300`} />
                    </div>
                  </div>
                  <div className={`text-3xl md:text-4xl font-bold ${stat.color} group-hover:animate-pulse`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
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
                  <ArrowRight className="h-6 w-6 text-blue-400 rotate-90" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2 animate-pulse">
                Scroll to explore features
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50/30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/20 to-transparent"></div>
        
        <Container className="relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Everything You Need to Trade Successfully
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From AI-powered strategy creation to advanced backtesting, 
              we provide all the tools you need to build profitable trading strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => <Card key={index} className="border-0 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer animate-fade-in hover:scale-105 bg-white/80 backdrop-blur" style={{
            animationDelay: feature.delay
          }}>
                <CardHeader>
                  <div className={`mb-4 p-3 rounded-lg bg-gradient-to-r ${feature.gradient} w-fit group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors duration-200">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>)}
          </div>
        </Container>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              How StratAlge Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to start building profitable trading strategies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[{
            step: 1,
            title: "Create Your Strategy",
            description: "Use our AI-powered tools or build custom strategies with technical indicators and trading rules.",
            color: "from-blue-500 to-cyan-500"
          }, {
            step: 2,
            title: "Backtest & Optimize",
            description: "Test your strategies against historical data and optimize parameters for better performance.",
            color: "from-green-500 to-emerald-500"
          }, {
            step: 3,
            title: "Deploy & Monitor",
            description: "Monitor your strategies' performance in real-time and make data-driven adjustments.",
            color: "from-purple-500 to-violet-500"
          }].map((item, index) => <div key={item.step} className="text-center space-y-4 group animate-fade-in hover:scale-105 transition-all duration-300" style={{
            animationDelay: `${index * 200}ms`
          }}>
                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {item.step}
                  </div>
                  {index < 2}
                </div>
                <h3 className="text-xl font-semibold group-hover:text-blue-600 transition-colors duration-200 text-gray-900">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </div>)}
          </div>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-200/30 via-cyan-200/20 to-purple-200/30 rounded-full blur-3xl"></div>
        
        <Container className="relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Why Choose StratAlge?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join thousands of traders who are already using StratAlge to build 
                and optimize their trading strategies with cutting-edge AI technology.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => <div key={index} className="flex items-center gap-3 group animate-fade-in hover:translate-x-2 transition-all duration-300" style={{
                animationDelay: `${index * 100}ms`
              }}>
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-base group-hover:text-blue-600 transition-colors duration-200 text-gray-700">{benefit}</span>
                  </div>)}
              </div>

              <div className="mt-8 animate-fade-in" style={{
              animationDelay: '600ms'
            }}>
                <Link to="/signup">
                  <Button size="lg" className="px-8 hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl group">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative animate-fade-in" style={{
            animationDelay: '200ms'
          }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-200/40 via-transparent to-cyan-200/30 rounded-2xl blur-xl"></div>
              <Card className="p-8 shadow-xl relative z-10 hover:shadow-2xl transition-all duration-500 hover:scale-105 bg-white/90 backdrop-blur">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 animate-fade-in" style={{
                  animationDelay: '400ms'
                }}>
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">RSI Strategy</div>
                      <div className="text-sm text-gray-500">Active • AAPL</div>
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
                  }].map((metric, index) => <div key={metric.label} className="animate-fade-in hover:scale-105 transition-all duration-200 p-2 rounded-lg hover:bg-blue-50/50" style={{
                    animationDelay: `${600 + index * 100}ms`
                  }}>
                        <div className="text-gray-500">{metric.label}</div>
                        <div className="font-semibold text-lg text-gray-900">{metric.value}</div>
                      </div>)}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-cyan-600/90"></div>
        
        <Container className="relative z-10">
          <div className="text-center space-y-8 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Start Building Winning Strategies?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join thousands of traders using StratAlge to create, test, and optimize 
              their trading strategies with AI-powered tools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{
            animationDelay: '200ms'
          }}>
              <Link to="/signup">
                <Button size="lg" className="px-8 hover:scale-105 transition-all duration-300 bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Link to="/login">
                
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-50/30 to-transparent"></div>
        <Container className="relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4 animate-fade-in">
              <Logo size="md" />
              <p className="text-sm text-gray-600">
                Build winning trading strategies with AI-powered tools and advanced backtesting.
              </p>
              {/* Social Media Links */}
              <div className="flex space-x-4 pt-2">
                <a
                  href="https://x.com/StratAIge_cc"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="transition-transform hover:scale-110"
                >
                  <img
                    src="/lovable-uploads/aac26b68-b933-46e7-a9c0-ff7c76f65f4f.png"
                    alt="X logo"
                    className="w-6 h-6 object-contain rounded"
                    style={{ background: "#fff" }}
                  />
                </a>
                <a
                  href="https://discord.gg/hjyC8bSrxT"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord"
                  className="transition-transform hover:scale-110"
                >
                  <img
                    src="/lovable-uploads/8708168b-5adf-4599-9513-99c7e4c7bcc8.png"
                    alt="Discord logo"
                    className="w-6 h-6 object-contain rounded"
                    style={{ background: "#fff" }}
                  />
                </a>
              </div>
            </div>
            <div className="animate-fade-in col-span-3 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 sm:gap-8">
              {/* Footer Main Links */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
                <a href="/privacy-policy" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm font-medium">
                  Privacy Policy
                </a>
                <a href="/terms-of-service" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm font-medium">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600 animate-fade-in" style={{
            animationDelay: '400ms'
          }}>
            © 2024 StratAlge. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>;
};
export default Landing;
