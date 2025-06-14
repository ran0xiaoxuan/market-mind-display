import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Code,
  FileCode,
  GaugeCircle,
  Keyboard,
  LayoutPanelLeft,
  LineChart,
  LucideIcon,
  Rocket,
  Settings,
  TrendingUp,
  Twitter,
  Youtube,
} from "lucide-react";
import { Link } from "react-router-dom";
import BackToLandingNavbar from "@/components/BackToLandingNavbar";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Logo";

const Feature = ({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) => {
  return (
    <div className="flex gap-4 animate-fade-in">
      <div className="rounded-lg bg-blue-100 p-3">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};

const HowItWorksItem = ({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="rounded-full bg-blue-100 p-4 mb-4">
        <Icon className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="font-semibold text-xl mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default function Index() {
  return (
    <div>
      <BackToLandingNavbar />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-x-hidden">
        <Container className="py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left side: Text Content */}
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Unlock the Power of AI for Algorithmic Trading
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Generate, backtest, and optimize trading strategies with
                AI-powered tools. Start building your automated trading system
                today.
              </p>
              <div className="flex gap-4">
                <Link to="/signup">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/ai-strategy">
                  <Button variant="outline">
                    Generate AI Strategy
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side: Image */}
            <div className="hidden md:block animate-fade-in">
              <img
                src="/hero-image.png"
                alt="AI Trading Platform"
                className="rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 animate-fade-in">
              Key Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto animate-fade-in">
              Explore the powerful features that make our AI trading strategy
              generator the best choice for traders of all levels.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Feature
              title="AI Strategy Generation"
              description="Generate custom trading strategies based on your preferences and risk tolerance."
              icon={Code}
            />
            <Feature
              title="Advanced Backtesting"
              description="Test your strategies with historical data to evaluate performance and optimize parameters."
              icon={LineChart}
            />
            <Feature
              title="Real-time Analytics"
              description="Monitor your strategies in real-time with comprehensive analytics and performance metrics."
              icon={TrendingUp}
            />
            <Feature
              title="Customization Options"
              description="Tailor your strategies with a wide range of technical indicators, filters, and risk management tools."
              icon={Settings}
            />
            <Feature
              title="Automated Trading"
              description="Automatically execute your strategies with our integrated trading platform."
              icon={LayoutPanelLeft}
            />
            <Feature
              title="Strategy Marketplace"
              description="Discover, share, and monetize successful trading strategies with our community."
              icon={Briefcase}
            />
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-gray-50">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 animate-fade-in">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto animate-fade-in">
              Learn how to create, test, and deploy AI-powered trading
              strategies in just a few simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <HowItWorksItem
              title="Generate Strategy"
              description="Use our AI-powered generator to create a custom trading strategy based on your criteria."
              icon={FileCode}
            />
            <HowItWorksItem
              title="Backtest & Optimize"
              description="Test your strategy with historical data and optimize parameters for maximum performance."
              icon={GaugeCircle}
            />
            <HowItWorksItem
              title="Automate Trading"
              description="Connect your strategy to your brokerage account and automate your trading."
              icon={Rocket}
            />
          </div>
        </Container>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 animate-fade-in">
              Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto animate-fade-in">
              Choose the plan that fits your trading needs. Simple,
              transparent, and no hidden fees.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Card */}
            <div className="bg-white/90 rounded-2xl p-8 flex flex-col shadow-lg border border-gray-200">
              <h2 className="text-xl font-bold mb-2">Free</h2>
              <div className="text-3xl font-extrabold mb-4">
                $0
                <span className="text-base font-normal text-gray-500">/mo</span>
              </div>
              <ul className="text-gray-700 mb-6 flex-1 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Create 1
                  trading strategy
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Basic
                  backtesting
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Access to
                  core analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Email
                  support
                </li>
              </ul>
              <Link to="/signup" className="block">
                <button className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg py-2 font-semibold transition">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Pro Card */}
            <div className="bg-white/90 rounded-2xl p-8 flex flex-col shadow-lg border border-blue-600 ring-2 ring-blue-200 relative z-10">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full font-semibold shadow text-xs">
                Most Popular
              </div>
              <h2 className="text-xl font-bold mb-2">Pro</h2>
              <div className="text-3xl font-extrabold mb-4">
                $19
                <span className="text-base font-normal text-gray-500">/mo</span>
              </div>
              <ul className="text-gray-700 mb-6 flex-1 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Unlimited
                  strategies
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Advanced
                  backtesting
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Premium
                  analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Strategy
                  recommendations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span> Priority
                  email support
                </li>
              </ul>
              <Link to="/signup" className="block">
                <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 rounded-lg py-2 font-semibold transition">
                  Start Free Trial
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-gray-50">
        <Container>
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our AI trading strategy
              generator.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                How does the AI strategy generator work?
              </h3>
              <p className="text-gray-600">
                Our AI strategy generator uses machine learning algorithms to
                analyze historical data and identify profitable trading
                strategies based on your specified criteria.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Can I customize the generated strategies?
              </h3>
              <p className="text-gray-600">
                Yes, you can fully customize the generated strategies with a
                wide range of technical indicators, filters, and risk
                management tools.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                How accurate are the backtesting results?
              </h3>
              <p className="text-gray-600">
                Our backtesting engine uses high-quality historical data and
                advanced simulation techniques to provide accurate and reliable
                results.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Is automated trading supported?
              </h3>
              <p className="text-gray-600">
                Yes, you can automatically execute your strategies with our
                integrated trading platform, which supports multiple brokerage
                accounts.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <CtaSection />
      <Footer />
    </div>
  );
}
