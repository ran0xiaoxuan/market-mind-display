import { Container } from "@/components/ui/container";
import BackToLandingNavbar from "@/components/BackToLandingNavbar";
import { CtaSection } from "@/components/CtaSection";
import { Footer } from "@/components/Footer";

const PrivacyPolicy = () => (
  <div>
    <BackToLandingNavbar />
    <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 overflow-x-hidden py-16">
      <Container>
        <div className="bg-white/80 shadow-lg rounded-xl p-8 md:p-16 max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 text-center">
            Privacy Policy
          </h1>
          <p className="text-gray-700 mb-8 text-center">
            Last updated: June 14, 2025
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Introduction</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              Welcome to StratAIge, an AI trading strategy generator created to help you create effective and efficient trading strategies only in seconds. At StratAIge, we value your privacy and are committed to protecting your personal information. This Privacy Policy outlines how we collect, use, store, and share your information when you use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Information Collection and Use</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              We collect various types of information to provide and improve our services. The types of data we collect include:
            </p>
            <div className="space-y-4 ml-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information:</h3>
                <p className="text-gray-700 leading-relaxed">
                  When you create an account with us, we collect your email address, username, and any other information you provide during registration.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Details:</h3>
                <p className="text-gray-700 leading-relaxed">
                  We collect information about how you use our platform, including the strategies you create, backtesting data, and performance metrics.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Device Information:</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may collect information about the device you use to access our services, including IP address, browser type, and operating system.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookies:</h3>
                <p className="text-gray-700 leading-relaxed">
                  We use cookies and similar technologies to enhance your experience and collect information about how you use our website.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment and Billing Information:</h3>
                <p className="text-gray-700 leading-relaxed">
                  If you make purchases through our platform, we collect payment information necessary to process your transactions.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Data Storage and Security</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              We take the security of your personal information seriously. We implement a variety of security measures to protect your data from unauthorized access, use, or disclosure. Your information is stored on secure servers, and we use encryption and other technologies to safeguard your data.
            </p>
            <p className="text-gray-700 leading-relaxed">
              However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Information Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4 leading-relaxed">
              We do not sell, trade, or otherwise transfer your personal information to outside parties without your consent, except in the following circumstances:
            </p>
            <div className="space-y-4 ml-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Providers:</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may share your information with third-party service providers who assist us in operating our website, conducting our business, or servicing you, as long as those parties agree to keep this information confidential.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Compliance:</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may disclose your information if required to do so by law or in response to valid requests by public authorities.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this privacy policy, please join our Discord community for support:
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

export default PrivacyPolicy;
