import { Container } from "@/components/ui/container";
import BackToLandingNavbar from "@/components/BackToLandingNavbar";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";

const TermsOfService = () => (
  <div>
    <BackToLandingNavbar />
    <div className="bg-gradient-to-br from-cyan-50 via-white to-blue-50 overflow-x-hidden py-16">
      <Container>
        <div className="bg-white/80 shadow-lg rounded-xl p-8 md:p-16 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 text-center">
            Terms of Service
          </h1>
          <p className="text-gray-700 mb-8 text-center">
            Last updated: June 14, 2025
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Introduction and Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Welcome to StratAIge, an AI trading strategy generator created to help you create effective and efficient trading strategies only in seconds. By accessing or using our services, you agree to comply with and be bound by these Terms of Service. If you disagree with these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Use of the Service</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              StratAIge provides users with tools to generate trading strategy configuration profiles using artificial intelligence. You agree to use the service only for lawful purposes and following these Terms. You are responsible for ensuring that your use of the service complies with all applicable laws and regulations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">User Accounts and Registration</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              To access certain features of StratAIge, you may be required to create an account. When registering for an account, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Provide accurate, current, and complete information.</li>
              <li>Maintain the security of your password and account.</li>
              <li>Notify us immediately of any unauthorized use of your account or any other breach of security.</li>
              <li>Take responsibility for all activities that occur under your account.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Content and Intellectual Property Rights</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              All content generated through StratAIge, as well as the software and technology used to provide the service, are the intellectual property of strataige.cc. You may not reproduce, distribute, or create derivative works from any content without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Prohibited Activities</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Using the service for any illegal or unauthorized purpose.</li>
              <li>Interfering with or disrupting the security, integrity, or performance of the service.</li>
              <li>Attempting to gain unauthorized access to the service or its related systems or networks.</li>
              <li>Transmitting any viruses, malware, or harmful code.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Privacy and Data Collection</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              StratAIge collects various types of data to provide and improve our services. The types of data we collect include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Account Information:</strong> Information you provide when creating an account.</li>
              <li><strong>Usage Details:</strong> Information about how you use our service.</li>
              <li><strong>Device Information:</strong> Information about the device you use to access our service.</li>
              <li><strong>Cookies:</strong> Data stored on your device to enhance your experience.</li>
              <li><strong>Payment and Billing Information:</strong> Information necessary for processing payments.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              For more details on how we handle your data, please refer to our separate Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Termination</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              We reserve the right to suspend or terminate your access to the service at our discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Disclaimer of Warranties</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              StratAIge is provided on an "as is" and "as available" basis. We make no warranties, express or implied, regarding the service, including but not limited to the accuracy, reliability, or availability of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Limitation of Liability</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              To the fullest extent permitted by law, in no event shall strataige.cc, its affiliates, or their respective officers, directors, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or in connection with your use of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Indemnification</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              You agree to indemnify, defend, and hold harmless strataige.cc and its affiliates from any claims, losses, liabilities, damages, costs, or expenses (including reasonable attorneys' fees) arising out of or related to your use of the service, your violation of these Terms, or your violation of any rights of another party.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Governing Law and Dispute Resolution</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              These Terms shall be governed by and construed by the laws of the jurisdiction in which strataige.cc operates, without regard to its conflict of law principles. Any disputes arising out of or related to these Terms or the service shall be resolved through binding arbitration by the rules of the applicable arbitration association.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Changes to These Terms</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on our website. Your continued use of the service after any changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions or concerns about these Terms, please join our Discord community for support:
            </p>
            <p className="text-gray-700 mt-2">
              Discord: <a href="https://discord.gg/EEEnGUwDEF" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://discord.gg/EEEnGUwDEF</a>
            </p>
          </section>
        </div>
      </Container>
    </div>
    <CtaSection />
    <Footer />
  </div>
);

export default TermsOfService;
