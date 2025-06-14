
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackToLandingNavbar() {
  return (
    <nav className="bg-gradient-to-r from-blue-100 to-cyan-100 px-4 py-2 flex items-center shadow-md sticky top-0 z-20">
      <Link to="/" className="flex items-center gap-2 text-blue-700 font-medium hover:text-cyan-700 transition-colors">
        <ArrowLeft className="h-5 w-5" />
        <span>Back to Home</span>
      </Link>
    </nav>
  );
}
