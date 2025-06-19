
import { Link } from "react-router-dom";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/Logo";
export const Footer = () => {
  return <footer className="border-t bg-gray-50 py-12 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-blue-50/30 to-transparent"></div>
      <Container className="relative z-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4 animate-fade-in">
            <Logo size="md" />
            <p className="text-sm text-gray-600">
              Build, optimize, and monitor with{" "}
              <span className="text-blue-600">StratAIge</span>.
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-4 pt-2">
              <a href="https://x.com/StratAIge_cc" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="transition-transform hover:scale-110">
                <img src="/lovable-uploads/aac26b68-b933-46e7-a9c0-ff7c76f65f4f.png" alt="X logo" className="w-6 h-6 object-contain rounded" style={{
                background: "#fff"
              }} />
              </a>
              <a href="https://discord.gg/EEEnGUwDEF" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="transition-transform hover:scale-110">
                <img src="/lovable-uploads/8708168b-5adf-4599-9513-99c7e4c7bcc8.png" alt="Discord logo" className="w-6 h-6 object-contain rounded" style={{
                background: "#fff"
              }} />
              </a>
            </div>
          </div>
          <div className="animate-fade-in col-span-3 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-4 sm:gap-8">
            {/* Footer Main Links */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <Link to="/privacy-policy" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm font-medium">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-gray-600 hover:text-blue-600 transition-colors duration-200 text-sm font-medium">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600 animate-fade-in" style={{
        animationDelay: '400ms'
      }}>
          © 2025 StratAlge. All rights reserved.
        </div>
      </Container>
    </footer>;
};
