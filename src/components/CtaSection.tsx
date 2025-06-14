
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ArrowRight } from "lucide-react";

export const CtaSection = () => {
  return (
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
          </div>
        </div>
      </Container>
    </section>
  );
};
