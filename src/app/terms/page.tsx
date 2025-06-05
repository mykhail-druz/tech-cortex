import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - TechCortex',
  description: 'Read the Terms of Service for TechCortex, including user agreements, purchasing policies, and legal information.',
  openGraph: {
    title: 'Terms of Service - TechCortex',
    description: 'Read the Terms of Service for TechCortex, including user agreements, purchasing policies, and legal information.',
    url: 'https://tech-cortex.com/terms',
    siteName: 'TechCortex',
    images: [
      {
        url: 'https://tech-cortex.com/terms-og.jpg',
        width: 1200,
        height: 630,
        alt: 'TechCortex - Terms of Service',
      },
    ],
  },
};

// Terms of Service content component
function TermsContent() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 py-16 mb-12 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
            <p className="text-lg text-gray-600 mb-8">
              Last updated: June 5, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="mb-4">
                Welcome to TechCortex. These Terms of Service ("Terms") govern your use of our website located at <Link href="/" className="text-primary hover:underline">tech-cortex.com</Link> (the "Site") and any related services offered by TechCortex.
              </p>
              <p className="mb-4">
                By accessing or using our Site, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Site.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Definitions</h2>
              <p className="mb-4">
                <strong>"User"</strong> refers to any individual who accesses or uses our Site.
              </p>
              <p className="mb-4">
                <strong>"Products"</strong> refers to computer hardware, components, accessories, and any other items available for purchase on our Site.
              </p>
              <p className="mb-4">
                <strong>"Content"</strong> refers to text, images, videos, and other materials displayed on our Site.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
              <p className="mb-4">
                When you create an account with us, you must provide accurate, complete, and current information at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
              </p>
              <p className="mb-4">
                You are responsible for safeguarding the password that you use to access the Site and for any activities or actions under your password. We encourage you to use "strong" passwords (passwords that use a combination of upper and lower case letters, numbers, and symbols) with your account.
              </p>
              <p className="mb-4">
                You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Purchases</h2>
              <p className="mb-4">
                All purchases through our Site are subject to product availability. We reserve the right to discontinue any product at any time.
              </p>
              <p className="mb-4">
                Prices for our products are subject to change without notice. We reserve the right to modify or discontinue the Site (or any part or content thereof) without notice at any time.
              </p>
              <p className="mb-4">
                We shall not be liable to you or to any third-party for any modification, price change, suspension, or discontinuance of the Site or products.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Payment</h2>
              <p className="mb-4">
                We accept various payment methods, including credit cards, debit cards, and other forms of electronic payment. By submitting a payment, you represent and warrant that you have the legal right to use the payment method you provide.
              </p>
              <p className="mb-4">
                All payment information is encrypted and processed securely through our payment processors. We do not store your full credit card details on our servers.
              </p>
              <p className="mb-4">
                All prices displayed on our Site are in US dollars and do not include taxes, which will be added at checkout based on your location.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Shipping and Delivery</h2>
              <p className="mb-4">
                We ship to addresses within the United States. Shipping times and costs vary depending on the shipping method selected and your location. Estimated delivery times are provided at checkout but are not guaranteed.
              </p>
              <p className="mb-4">
                For more information about our shipping policies, please refer to our <Link href="/shipping" className="text-primary hover:underline">Shipping and Returns</Link> page.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Returns and Refunds</h2>
              <p className="mb-4">
                We offer returns and refunds in accordance with our return policy. For more information, please refer to our <Link href="/shipping" className="text-primary hover:underline">Shipping and Returns</Link> page.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Product Warranties</h2>
              <p className="mb-4">
                All products sold on our Site come with a manufacturer's warranty. The terms and duration of the warranty vary by product and manufacturer. We do not offer additional warranties beyond those provided by the manufacturer.
              </p>
              <p className="mb-4">
                For warranty claims, please contact the manufacturer directly using the information provided with the product or contact our customer service team for assistance.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Intellectual Property</h2>
              <p className="mb-4">
                The Site and its original content, features, and functionality are owned by TechCortex and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>
              <p className="mb-4">
                You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on our Site, except as follows:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials.</li>
                <li>You may store files that are automatically cached by your Web browser for display enhancement purposes.</li>
                <li>You may print or download one copy of a reasonable number of pages of the Site for your own personal, non-commercial use and not for further reproduction, publication, or distribution.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Prohibited Uses</h2>
              <p className="mb-4">
                You may use the Site only for lawful purposes and in accordance with these Terms. You agree not to use the Site:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation.</li>
                <li>To impersonate or attempt to impersonate TechCortex, a TechCortex employee, another user, or any other person or entity.</li>
                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Site, or which, as determined by us, may harm TechCortex or users of the Site or expose them to liability.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Limitation of Liability</h2>
              <p className="mb-4">
                In no event shall TechCortex, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Your access to or use of or inability to access or use the Site.</li>
                <li>Any conduct or content of any third party on the Site.</li>
                <li>Any content obtained from the Site.</li>
                <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Indemnification</h2>
              <p className="mb-4">
                You agree to defend, indemnify, and hold harmless TechCortex, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Site.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Governing Law</h2>
              <p className="mb-4">
                These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
              </p>
              <p className="mb-4">
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">14. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p className="mb-4">
                By continuing to access or use our Site after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Site.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">15. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="mb-4">
                <strong>Email:</strong> legal@tech-cortex.com<br />
                <strong>Phone:</strong> (800) 555-1234<br />
                <strong>Address:</strong> 123 Tech Way, San Francisco, CA 94105
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Related Policies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/privacy" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy Policy</h3>
                <p className="text-gray-600 mb-4">Learn how we collect, use, and protect your personal information.</p>
                <span className="text-primary font-medium">Read More →</span>
              </Link>
              <Link href="/shipping" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Shipping & Returns</h3>
                <p className="text-gray-600 mb-4">Information about our shipping methods, delivery times, and return policies.</p>
                <span className="text-primary font-medium">Read More →</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
            <div className="p-8 md:p-12 text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Have Questions About Our Terms?</h2>
              <p className="text-lg mb-6">Our customer service team is here to help clarify any questions you might have.</p>
              <Link 
                href="/contact" 
                className="bg-white text-blue-600 px-8 py-3 rounded-md hover:bg-gray-100 transition-colors inline-block"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Main Terms of Service page component with suspense for loading state
export default function Terms() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <TermsContent />
      </Suspense>
    </main>
  );
}