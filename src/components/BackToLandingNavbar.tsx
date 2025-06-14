
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/Logo";
import React from "react";

const getSectionLink = (loc: string, hash: string) =>
  loc === "/" ? hash : `/#${hash}`;

export default function BackToLandingNavbar() {
  const location = useLocation();
  // Used so that link to sections works from any page
  return (
    <nav className="border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Left side: logo and nav links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 animate-fade-in">
              <Logo size="md" />
            </Link>
            {/* Nav links beside logo */}
            <nav className="flex gap-6 ml-2">
              <Link to={getSectionLink(location.pathname, "features")}
                className="text-gray-700 hover:text-blue-700 font-medium transition-colors duration-150"
              >
                Features
              </Link>
              <Link to={getSectionLink(location.pathname, "how-it-works")}
                className="text-gray-700 hover:text-blue-700 font-medium transition-colors duration-150"
              >
                How It Works
              </Link>
              <Link to="/pricing"
                className="text-gray-700 hover:text-blue-700 font-medium transition-colors duration-150"
              >
                Pricing
              </Link>
              <Link to={getSectionLink(location.pathname, "faq")}
                className="text-gray-700 hover:text-blue-700 font-medium transition-colors duration-150"
              >
                FAQ
              </Link>
            </nav>
          </div>
          {/* Right side: Auth actions */}
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
