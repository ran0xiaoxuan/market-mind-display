
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/Logo";

export default function BackToLandingNavbar() {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="animate-fade-in">
            <Logo size="md" />
          </Link>
          <div className="hidden md:flex items-center gap-8 animate-fade-in" style={{
            animationDelay: '150ms'
          }}>
            <Link to="/#features" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 hover:scale-105 transform">
              Features
            </Link>
            <Link to="/#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 hover:scale-105 transform">
              How It Works
            </Link>
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 hover:scale-105 transform">
              Pricing
            </Link>
            <Link to="/#faq" className="text-gray-600 hover:text-gray-900 transition-colors duration-200 hover:scale-105 transform">
              FAQ
            </Link>
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
  );
}
