import { Container } from "@/components/ui/container";
import BackToLandingNavbar from "@/components/BackToLandingNavbar";

const PrivacyPolicy = () => (
  <div>
    <BackToLandingNavbar />
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-x-hidden py-16">
      <Container>
        <div className="bg-white/80 shadow-lg rounded-xl p-8 md:p-16 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 text-center">
            Privacy Policy
          </h1>
          <p className="text-gray-700 mb-8 text-center">
            Last updated: June 14, 2025
          </p>
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-700">1. Introduction</h2>
            <p className="text-gray-700">
              Thank you for choosing StratAlge. This policy describes how we collect, use, and protect your data when you use our services.
            </p>
          </section>
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-700">2. Data Collection</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>We collect information you provide (account details, preferences, feedback).</li>
              <li>We store strategy data, trading performance, and analytics you generate using our platform.</li>
            </ul>
          </section>
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-700">3. Use of Data</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>To operate, maintain, and improve our services.</li>
              <li>For analytics, platform improvements, and relevant communication.</li>
            </ul>
          </section>
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-2 text-blue-700">4. Security</h2>
            <p className="text-gray-700">
              We use industry-standard security to protect your data. However, no platform can guarantee absolute safety.
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

export default PrivacyPolicy;
