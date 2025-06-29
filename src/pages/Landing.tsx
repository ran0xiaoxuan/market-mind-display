import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";
import { Brain, Zap, MessageSquare, Bell, Users, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { PricingSection } from "@/components/PricingSection";
import { usePageTitle } from "@/hooks/usePageTitle";
const Landing = () => {
  usePageTitle("StratAIge - AI-Powered Trading Strategy Platform");
  const features = [{
    icon: Brain,
    title: "AI-Powered Strategy Creation",
    description: "Generate sophisticated trading strategies using advanced AI algorithms that understand your trading requirements and market preferences.",
    delay: "0ms",
    gradient: "from-blue-500 to-cyan-500"
  }, {
    icon: Bell,
    title: "Multi-Platform Notifications",
    description: "Receive trading signals via Email, Discord, and Telegram to stay updated on your strategy performance wherever you are.",
    delay: "100ms",
    gradient: "from-green-500 to-emerald-500"
  }, {
    icon: MessageSquare,
    title: "Natural Language Processing",
    description: "Describe your trading ideas in plain English and let our AI translate them into actionable trading strategies.",
    delay: "200ms",
    gradient: "from-purple-500 to-violet-500"
  }, {
    icon: Zap,
    title: "Real-Time Signal Generation",
    description: "Get instant notifications when your AI-generated strategies identify trading opportunities in the market.",
    delay: "300ms",
    gradient: "from-orange-500 to-red-500"
  }];
  const benefits = ["Create unlimited AI-powered trading strategies", "Receive real-time trading signals", "Multi-platform notification delivery", "Natural language strategy description", "No coding required", "Instant strategy activation"];
  const stats = [{
    label: "Active Strategies",
    value: "10,000+",
    icon: Brain,
    color: "text-blue-600"
  }, {
    label: "Signals Sent",
    value: "1M+",
    icon: Zap,
    color: "text-yellow-600"
  }, {
    label: "Happy Users",
    value: "5K+",
    icon: Users,
    color: "text-green-600"
  }];
  const faqs = [{
    question: "How do I open a StratAIge account?",
    answer: "Click the 'Get Started' button and create an account. You can create a StratAIge account via Google or Email."
  }, {
    question: "Where will my assets be held?",
    answer: "StratAIge does not need you to deposit your principal, you can still hold your assets in brokers/exchanges."
  }, {
    question: "How does StratAIge work?",
    answer: "StratAIge platform can manage several trading strategies. When the strategies are activated and send trading signals, you can receive these signals via Email, Telegram, Discord, or the app itself."
  }, {
    question: "What are the paid features of StratAIge?",
    answer: "As a free user of StratAIge, you can only receive trading signals on the app, while pro users can receive live trading signals via Email/Telegram/Discord."
  }, {
    question: "How can I contact customer support for help?",
    answer: "If you have any questions or need assistance, please join our Discord community for support: https://discord.com/invite/EEEnGUwDEF"
  }];
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const section = document.getElementById(targetId);
    if (!section) return;
    const targetPosition = section.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1000;
    let startTime: number | null = null;
    const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    };
    const animateScroll = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const nextPosition = easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, nextPosition);
      if (timeElapsed < duration) {
        requestAnimationFrame(animateScroll);
      } else {
        window.scrollTo(0, targetPosition);
      }
    };
    requestAnimationFrame(animateScroll);
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-hidden">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 transition-all duration-300 shadow-sm">
        <Container>
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8 animate-fade-in">
              <Logo size="md" />
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" onClick={e => handleNavClick(e, 'features')}>
                  Features
                </a>
                <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" onClick={e => handleNavClick(e, 'how-it-works')}>
                  How It Works
                </a>
                <Link to="/pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Pricing
                </Link>
                <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors cursor-pointer" onClick={e => handleNavClick(e, 'faq')}>
                  FAQ
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4 animate-fade-in" style={{
            animationDelay: '200ms'
          }}>
              <Link to="/login">
                <Button variant="ghost" className="hover:scale-105 transition-transform duration-200">
                  Log In
                </Button>
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
            {/* Product Hunt Badge */}
            <div className="flex justify-center mb-2 animate-fade-in" style={{
            animationDelay: '90ms'
          }}>
              <a href="https://www.producthunt.com/products/strataige?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-strataige" target="_blank" rel="noopener noreferrer" aria-label="StratAIge on Product Hunt" className="inline-block">
                <img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=978493&theme=light&t=1749919594963" alt="StratAIge - Financial tool;Trading assistant | Product Hunt" style={{
                width: "250px",
                height: "54px"
              }} width="250" height="54" />
              </a>
            </div>
            <div className="space-y-6">
              {/* Enhanced Main Heading with Staggered Animation */}
              <h1 className="text-4xl md:text-6xl font-bold leading-tight group">
                <span style={{
                animationDelay: '200ms'
              }} className="block bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent animate-fade-in group-hover:scale-105 transition-all duration-500 my-0 py-[10px]">Create AI-Powered</span>
                <span style={{
                animationDelay: '400ms'
              }} className="block animate-fade-in group-hover:scale-105 transition-transform duration-500 text-gray-900 py-[5px]">Trading Strategies in Seconds</span>
              </h1>
              
              {/* Enhanced Description */}
              <p style={{
              animationDelay: '600ms'
            }} className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in hover:text-gray-800 transition-colors duration-300 my-[20px]">
                Describe your trading ideas in natural language and get AI-generated strategies with real-time notifications.
                <br className="hidden md:block" />
                <span className="animate-fade-in inline-block" style={{
                animationDelay: '800ms'
              }}>
                  No coding required, just smart trading made simple.
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
                    Start Creating Strategies
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300"></div>
                </Button>
              </Link>
            </div>

            {/* Enhanced Stats with Bright Colors */}
            

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
      <section id="features" className="py-20 bg-gradient-to-r from-gray-50 to-blue-50/30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/20 to-transparent"></div>
        
        <Container className="relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Everything You Need for AI-Powered Trading
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From natural language strategy creation to multi-platform notifications, 
              we provide all the tools you need to build and monitor trading strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
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
      <section id="how-it-works" className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              How StratAIge Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to start creating AI-powered trading strategies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[{
            step: 1,
            title: "Describe Your Strategy",
            description: "Tell our AI what kind of trading strategy you want using plain English. No technical knowledge required.",
            color: "from-blue-500 to-cyan-500"
          }, {
            step: 2,
            title: "AI Creates Your Strategy",
            description: "Our advanced AI processes your requirements and generates a sophisticated trading strategy tailored to your needs.",
            color: "from-green-500 to-emerald-500"
          }, {
            step: 3,
            title: "Receive Real-Time Signals",
            description: "Get instant notifications via Email, Discord, or Telegram when your strategy identifies trading opportunities.",
            color: "from-purple-500 to-violet-500"
          }].map((item, index) => <div key={item.step} className="text-center space-y-4 group animate-fade-in hover:scale-105 transition-all duration-300" style={{
            animationDelay: `${index * 200}ms`
          }}>
                <div className="relative">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {item.step}
                  </div>
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
                Why Choose StratAIge?
              </h2>
              <p className="text-lg text-gray-600 mb-8">Join thousands of traders using StratAIge to create and monitor AI-powered trading strategies with cutting-edge technology.</p>
              
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
                      <Bell className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">AI Strategy Alert</div>
                      <div className="text-sm text-gray-500">Active • AAPL Signal</div>
                    </div>
                    <div className="ml-auto text-green-600 font-semibold text-xl animate-pulse">BUY</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[{
                    label: "Signal Type",
                    value: "Long Entry"
                  }, {
                    label: "Confidence",
                    value: "High"
                  }, {
                    label: "Notification",
                    value: "Email + Discord"
                  }, {
                    label: "Time",
                    value: "2 min ago"
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

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-r from-blue-100/40 to-cyan-100/40 relative">
        <Container>
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it – here's what our users think about StratAIge.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-white rounded-xl shadow-lg py-8 px-6 flex flex-col items-center animate-fade-in">
              <img src="/lovable-uploads/b0c24627-b719-457c-bdd7-e5a78effba37.png" alt="Thomas Brown testimonial" className="w-16 h-16 rounded-full object-cover mb-4 ring-2 ring-blue-400" />
              <div className="font-semibold text-gray-900 mb-2">Thomas Brown</div>
              <div className="text-gray-600 text-center mb-2">"As someone without a coding background, StratAIge's AI-powered platform has been a game-changer. I can easily turn my trading ideas into strategies without any technical hurdles. It's incredibly user-friendly!"</div>
              <div className="flex gap-1 mt-2">
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg py-8 px-6 flex flex-col items-center animate-fade-in" style={{
            animationDelay: "100ms"
          }}>
              <img src="/lovable-uploads/efffc395-e026-4d17-a2bd-bc05cf2b3235.png" alt="Daniel Kim testimonial" className="w-16 h-16 rounded-full object-cover mb-4 ring-2 ring-green-400" />
              <div className="font-semibold text-gray-900 mb-2">Daniel Kim</div>
              <div className="text-gray-600 text-center mb-2">"Running a business leaves me little time for trading. StratAIge's efficiency is remarkable—it creates strategies quickly and sends me notifications so I can manage trading alongside my daily tasks without stress."</div>
              <div className="flex gap-1 mt-2">
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg py-8 px-6 flex flex-col items-center animate-fade-in" style={{
            animationDelay: "200ms"
          }}>
              <img src="/lovable-uploads/e1ba2654-83c2-4e67-b3b6-822ae2901951.png" alt="Maria Rodriguez testimonial" className="w-16 h-16 rounded-full object-cover mb-4 ring-2 ring-cyan-400" />
              <div className="font-semibold text-gray-900 mb-2">Maria Rodriguez</div>
              <div className="text-gray-600 text-center mb-2">"The AI-powered strategy creation in StratAIge is top-notch. It provides detailed, accurate strategies that boost my confidence in every trade. It's a smart and efficient way to enhance my trading."</div>
              <div className="flex gap-1 mt-2">
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
                <span className="text-yellow-400">&#9733;</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-[#f8f9fc]">
        <Container>
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Still have questions? We're here to help.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => <AccordionItem value={`faq-${index + 1}`} key={faq.question}>
                  <AccordionTrigger>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>)}
            </Accordion>
          </div>
        </Container>
      </section>

      <PricingSection />

      {/* CTA Section */}
      <CtaSection />

      {/* Footer */}
      <Footer />
    </div>;
};
export default Landing;