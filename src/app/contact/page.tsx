import { Suspense } from 'react';
import { Metadata } from 'next';
import ContactForm from '@/components/contact/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us - TechCortex | St. Petersburg, FL',
  description:
    'Contact TechCortex in St. Petersburg, Florida for computer hardware, custom PC builds, and tech support. Fast response within 2 business hours.',
  openGraph: {
    title: 'Contact Us - TechCortex | St. Petersburg, FL',
    description:
      'Contact TechCortex in St. Petersburg, Florida for computer hardware, custom PC builds, and tech support. Fast response within 2 business hours.',
    url: 'https://tech-cortex.com/contact',
    siteName: 'TechCortex',
    images: [
      {
        url: 'https://tech-cortex.com/contact-og.jpg',
        width: 1200,
        height: 630,
        alt: 'TechCortex Contact - St. Petersburg, FL',
      },
    ],
  },
};

// Contact Us content component
function ContactUsContent() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-100 py-16 mb-12 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Contact TechCortex
            </h1>
            <p className="text-xl text-gray-700 mb-6">
              Your Local Computer Hardware Experts in St. Petersburg, Florida
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="bg-white px-4 py-2 rounded-full shadow-sm">📍 St. Petersburg, FL</div>
              <div className="bg-white px-4 py-2 rounded-full shadow-sm">
                ⏱️ 2-Hour Response Time
              </div>
              <div className="bg-white px-4 py-2 rounded-full shadow-sm">📞 (727) 254-8324</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form and Information */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <ContactForm />

            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full mr-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Us</h3>
                    <p className="text-gray-600">
                      General Inquiries:{' '}
                      <a
                        href="mailto:info@tech-cortex.com"
                        className="text-primary hover:underline"
                      >
                        info@tech-cortex.com
                      </a>
                      <br />
                      Customer Support:{' '}
                      <a
                        href="mailto:support@tech-cortex.com"
                        className="text-primary hover:underline"
                      >
                        support@tech-cortex.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full mr-4">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9:00 AM - 9:00 PM EST
                      <br />
                      Saturday - Sunday: 10:00 AM - 8:00 PM EST
                    </p>
                  </div>
                </div>

                {/* Response guarantee */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-green-800">
                        Fast Response Guarantee
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        We respond to all inquiries within 2 business hours during office hours.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer same-day delivery in St. Petersburg?
              </h3>
              <p className="text-gray-600">
                Yes! If available, we offer same-day delivery for orders placed before 2 PM on weekdays within St.
                Petersburg and surrounding areas. Express delivery is available for urgent business
                needs.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What is your return and warranty policy?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day return policy for most items in original condition. All products
                come with manufacturer warranties, and we provide additional warranty services.
                Custom-built PCs include our comprehensive 1-year service warranty.
              </p>
            </div>
            {/*<div className="bg-white p-6 rounded-lg shadow-md">*/}
            {/*  <h3 className="text-lg font-semibold text-gray-900 mb-2">*/}
            {/*    Do you provide on-site technical support?*/}
            {/*  </h3>*/}
            {/*  <p className="text-gray-600">*/}
            {/*    Absolutely! We provide on-site technical support throughout the Tampa Bay area. Our*/}
            {/*    certified technicians can help with installations, troubleshooting, network setup,*/}
            {/*    and maintenance at your home or business.*/}
            {/*  </p>*/}
            {/*</div>*/}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can you build custom PCs for gaming and business?
              </h3>
              <p className="text-gray-600">
                Yes! We specialize in custom PC builds for gaming, business, content creation, and
                specialized applications. We&#39;ll work with you to design the perfect system for
                your needs and budget, with professional assembly and testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form CTA */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-lg overflow-hidden">
            <div className="p-8 md:p-12 text-white text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg mb-6">
                Contact us today and experience the TechCortex difference. Fast, professional
                service you can trust.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#contact-form"
                  className="bg-white text-green-600 px-8 py-3 rounded-md hover:bg-gray-100 transition-colors inline-block font-semibold"
                >
                  Send Us a Message
                </a>
                <a
                  href="tel:+17272548324"
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md hover:bg-white hover:text-green-600 transition-colors inline-block font-semibold"
                >
                  Call (727) 254-8324
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Main Contact Us page component with suspense for loading state
export default function ContactUs() {
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }
      >
        <ContactUsContent />
      </Suspense>
    </main>
  );
}
