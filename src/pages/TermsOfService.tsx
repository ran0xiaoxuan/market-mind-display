import { Container } from "@/components/ui/container";
import BackToLandingNavbar from "@/components/BackToLandingNavbar";

const TermsOfService = () => (
  <div>
    <BackToLandingNavbar />
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 overflow-x-hidden py-16">
      <Container>
        <div className="bg-white/80 shadow-lg rounded-xl p-8 md:p-16 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 text-center">
            Terms of Service
          </h1>
          <p className="text-gray-700 mb-8 text-center">
            Last updated: June 14, 2025
          </p>
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-700">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By using StratAlge, you agree to be bound by these terms and all applicable laws and regulations.
            </p>
          </section>
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-700">2. Use of Service</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>You may use StratAlge for lawful purposes only.</li>
              <li>Do not misuse or attempt to disrupt our services.</li>
            </ul>
          </section>
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-700">3. Intellectual Property</h2>
            <p className="text-gray-700">
              All platform content is owned by StratAlge or its licensors. You may not reproduce, copy, or distribute platform material without permission.
            </p>
          </section>
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-700">4. Disclaimer</h2>
            <p className="text-gray-700">
              No investment advice is provided. Use the platform at your own risk.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-bold mb-2 text-blue-700">5. Contact</h2>
            <p className="text-gray-700">
              Questions? Contact us at <a href="mailto:support@stratalge.com" className="text-blue-600 hover:underline">support@stratalge.com</a>.
            </p>
          </section>
        </div>
      </Container>
    </div>
  </div>
);

export default TermsOfService;
