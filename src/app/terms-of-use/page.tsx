import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Terms of Use - TechCortex',
  description:
    'Read the Terms of Use for TechCortex, including user agreements, purchasing policies, and legal information.',
  openGraph: {
    title: 'Terms of Use - TechCortex',
    description:
      'Read the Terms of Use for TechCortex, including user agreements, purchasing policies, and legal information.',
    url: 'https://tech-cortex.com/terms-of-use',
    siteName: 'TechCortex',
    images: [
      {
        url: 'https://tech-cortex.com/terms-og.jpg',
        width: 1200,
        height: 630,
        alt: 'TechCortex - Terms of Use',
      },
    ],
  },
};

// Terms of Use content component
function TermsContent() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 py-16 mb-12 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Use</h1>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="prose prose-lg max-w-none">
              <div name="termly-embed" data-id="72124518-7817-407e-923f-15cc46734ba5"></div>
              <Script
                id="termly-jssdk"
                src="https://app.termly.io/embed-policy.min.js"
                strategy="afterInteractive"
              />
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
              <Link
                href="/privacy-policy"
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy Policy</h3>
                <p className="text-gray-600 mb-4">
                  Learn how we collect, use, and protect your personal information.
                </p>
                <span className="text-primary font-medium">Read More →</span>
              </Link>
              <Link
                href="/shipping-policy"
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Shipping & Returns</h3>
                <p className="text-gray-600 mb-4">
                  Information about our shipping methods, delivery times, and return policies.
                </p>
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Have Questions About Our Terms?
              </h2>
              <p className="text-lg mb-6">
                Our customer service team is here to help clarify any questions you might have.
              </p>
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

// Main Terms of Use page component with suspense for loading state
export default function Terms() {
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        <TermsContent />
      </Suspense>
    </main>
  );
}
