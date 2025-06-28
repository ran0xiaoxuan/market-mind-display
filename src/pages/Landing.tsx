import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Zap, Shield, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PricingSection } from "@/components/PricingSection";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";
import { TestEmailButton } from "@/components/TestEmailButton";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <TestEmailButton />
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            AI-Powered Trading Strategies
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create, backtest, and deploy sophisticated trading strategies with the power of artificial intelligence. No coding required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="px-8 py-3">
                View Pricing
              </Button>
            </Link>
          </div>

          <img
            src="/hero-image.png"
            alt="AI Trading Strategies"
            className="rounded-xl shadow-lg mx-auto max-w-full h-auto"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-800 mb-8">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Zap className="h-8 w-8 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Automated Trading
              </h3>
              <p className="text-gray-600">
                Deploy your strategies to trade automatically, 24/7, without
                manual intervention.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Backtesting Tools
              </h3>
              <p className="text-gray-600">
                Evaluate your strategies with historical data to optimize
                performance and reduce risk.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Risk Management
              </h3>
              <p className="text-gray-600">
                Implement advanced risk management tools to protect your
                capital and minimize potential losses.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <TrendingUp className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Real-time Analytics
              </h3>
              <p className="text-gray-600">
                Monitor your strategies in real-time with comprehensive
                analytics and performance metrics.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Customizable Alerts
              </h3>
              <p className="text-gray-600">
                Receive instant alerts and notifications for critical trading
                events and strategy performance updates.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <BarChart3 className="h-8 w-8 text-teal-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Strategy Optimization
              </h3>
              <p className="text-gray-600">
                Fine-tune your strategies with AI-driven optimization tools to
                maximize profitability and efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold text-gray-800 mb-8">
            Trusted by Traders Worldwide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Stat 1 */}
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-gray-600">Active Strategies</p>
            </div>

            {/* Stat 2 */}
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                $1M+
              </div>
              <p className="text-gray-600">Total Volume Traded</p>
            </div>

            {/* Stat 3 */}
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
              <p className="text-gray-600">Customer Satisfaction</p>
            </div>

            {/* Stat 4 */}
            <div>
              <div className="text-4xl font-bold text-red-600 mb-2">24/7</div>
              <p className="text-gray-600">Dedicated Support</p>
            </div>
          </div>
        </div>
      </section>

      <PricingSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Landing;
