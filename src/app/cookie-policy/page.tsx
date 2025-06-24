import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Cookie Policy - TechCortex',
  description:
    'Learn how TechCortex uses cookies and similar technologies when you visit our website and use our services.',
  openGraph: {
    title: 'Cookie Policy - TechCortex',
    description:
      'Learn how TechCortex uses cookies and similar technologies when you visit our website and use our services.',
    url: 'https://tech-cortex.com/cookie-policy',
    siteName: 'TechCortex',
    images: [
      {
        url: 'https://tech-cortex.com/cookie-policy-og.jpg',
        width: 1200,
        height: 630,
        alt: 'TechCortex - Cookie Policy',
      },
    ],
  },
};

// Cookie Policy content component
function CookiePolicyContent() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 py-16 mb-12 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Cookie Policy</h1>
          </div>
        </div>
      </section>
      {/* Cookie Policy Content */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="prose prose-lg max-w-none">
                <div name="termly-embed" data-id="41b78bdf-5aeb-47ee-9922-4004c8fe7eb3"></div>
                <Script
                  id="termly-jssdk"
                  src="https://app.termly.io/embed-policy.min.js"
                  strategy="afterInteractive"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Related Policies</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/terms-of-use"
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">Terms of Use</h3>
                <p className="text-gray-600 mb-4">
                  Read our terms and conditions for using our website and services.
                </p>
                <span className="text-primary font-medium">Read More →</span>
              </Link>
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
                Have Questions About Cookies?
              </h2>
              <p className="text-lg mb-6">
                Our team is here to address any concerns you might have about how we use cookies
                and similar technologies.
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

// Main Cookie Policy page component with suspense for loading state
export default function CookiePolicy() {
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        <CookiePolicyContent />
      </Suspense>
    </main>
  );
}
