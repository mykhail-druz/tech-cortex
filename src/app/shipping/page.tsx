import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Returns - TechCortex',
  description: 'Information about TechCortex shipping methods, delivery times, return policies, and refund procedures.',
  openGraph: {
    title: 'Shipping & Returns - TechCortex',
    description: 'Information about TechCortex shipping methods, delivery times, return policies, and refund procedures.',
    url: 'https://tech-cortex.com/shipping',
    siteName: 'TechCortex',
    images: [
      {
        url: 'https://tech-cortex.com/shipping-og.jpg',
        width: 1200,
        height: 630,
        alt: 'TechCortex - Shipping & Returns',
      },
    ],
  },
};

// Shipping and Returns content component
function ShippingContent() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 py-16 mb-12 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Shipping & Returns</h1>
            <p className="text-lg text-gray-600 mb-8">
              Last updated: June 5, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Shipping & Returns Content */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Shipping Information */}
            <div className="bg-white p-8 rounded-lg shadow-md mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Shipping Information</h2>
              
              <div className="prose prose-lg max-w-none">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Shipping Methods</h3>
                <p className="mb-4">
                  At TechCortex, we offer several shipping options to meet your needs. All orders are processed within 1-2 business days (excluding weekends and holidays) after payment verification.
                </p>
                
                <div className="overflow-x-auto mb-8">
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr>
                        <th className="py-3 px-4 bg-gray-50 text-left text-gray-700 font-semibold border-b">Shipping Method</th>
                        <th className="py-3 px-4 bg-gray-50 text-left text-gray-700 font-semibold border-b">Estimated Delivery Time</th>
                        <th className="py-3 px-4 bg-gray-50 text-left text-gray-700 font-semibold border-b">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3 px-4 border-b">Standard Shipping</td>
                        <td className="py-3 px-4 border-b">5-7 business days</td>
                        <td className="py-3 px-4 border-b">$5.99 (Free on orders over $75)</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 border-b">Expedited Shipping</td>
                        <td className="py-3 px-4 border-b">2-3 business days</td>
                        <td className="py-3 px-4 border-b">$12.99</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 border-b">Next Day Shipping</td>
                        <td className="py-3 px-4 border-b">1 business day (if ordered before 12 PM EST)</td>
                        <td className="py-3 px-4 border-b">$24.99</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Shipping Restrictions</h3>
                <p className="mb-4">
                  We currently ship to all 50 states in the United States, as well as APO/FPO addresses. Unfortunately, we do not ship internationally at this time.
                </p>
                <p className="mb-4">
                  Certain items, particularly those containing lithium-ion batteries or hazardous materials, may have shipping restrictions or require special handling. These items will be clearly marked on the product page.
                </p>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Order Tracking</h3>
                <p className="mb-4">
                  Once your order ships, you will receive a shipping confirmation email with a tracking number. You can track your package by:
                </p>
                <ul className="list-disc pl-8 mb-4">
                  <li>Clicking the tracking link in your shipping confirmation email</li>
                  <li>Logging into your TechCortex account and viewing your order history</li>
                  <li>Contacting our customer service team with your order number</li>
                </ul>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Delivery Information</h3>
                <p className="mb-4">
                  Most packages are delivered via USPS, UPS, or FedEx, depending on the shipping method selected and your location. For security purposes, some items may require a signature upon delivery.
                </p>
                <p className="mb-4">
                  Please note that shipping carriers do not deliver on weekends or holidays, and delivery times may be affected by weather conditions, customs clearance, or other factors beyond our control.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h4 className="font-bold text-blue-700 mb-2">COVID-19 Update</h4>
                  <p className="text-blue-700">
                    Due to the ongoing impact of COVID-19, some deliveries may experience delays. We are working closely with our shipping partners to ensure your orders arrive as quickly as possible.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Returns & Refunds */}
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Returns & Refunds</h2>
              
              <div className="prose prose-lg max-w-none">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Return Policy</h3>
                <p className="mb-4">
                  We want you to be completely satisfied with your purchase. If you're not happy with your order for any reason, you can return it within 30 days of delivery for a full refund or exchange.
                </p>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Return Eligibility</h3>
                <p className="mb-4">
                  To be eligible for a return, your item must be:
                </p>
                <ul className="list-disc pl-8 mb-4">
                  <li>In the same condition that you received it</li>
                  <li>In the original packaging</li>
                  <li>Unused and undamaged</li>
                  <li>Accompanied by the receipt or proof of purchase</li>
                </ul>
                
                <p className="mb-4">
                  The following items cannot be returned:
                </p>
                <ul className="list-disc pl-8 mb-4">
                  <li>Software with broken seals or activated license keys</li>
                  <li>Custom-built computers or components that have been installed</li>
                  <li>Items marked as non-returnable on the product page</li>
                  <li>Gift cards</li>
                </ul>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Return Process</h3>
                <p className="mb-4">
                  To initiate a return, please follow these steps:
                </p>
                <ol className="list-decimal pl-8 mb-4">
                  <li>Log in to your TechCortex account and navigate to your order history</li>
                  <li>Select the order containing the item(s) you wish to return</li>
                  <li>Click on "Return Items" and follow the instructions</li>
                  <li>Print the return shipping label (if provided) or note the return address</li>
                  <li>Package the item securely in its original packaging</li>
                  <li>Attach the return shipping label to the outside of the package</li>
                  <li>Drop off the package at the specified carrier location</li>
                </ol>
                
                <p className="mb-4">
                  If you don't have a TechCortex account or prefer to process your return offline, please contact our customer service team at <a href="mailto:returns@tech-cortex.com" className="text-primary hover:underline">returns@tech-cortex.com</a> or call (800) 555-1234.
                </p>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Return Shipping</h3>
                <p className="mb-4">
                  For standard returns, you are responsible for paying the return shipping costs. If the item is defective, damaged during shipping, or if we sent you the wrong item, we will cover the return shipping costs.
                </p>
                <p className="mb-4">
                  We recommend using a trackable shipping service and purchasing shipping insurance for valuable items. We cannot guarantee that we will receive your returned item.
                </p>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Refund Process</h3>
                <p className="mb-4">
                  Once we receive your return, we will inspect it and notify you of the status of your refund. If your return is approved, we will initiate a refund to your original method of payment. You will receive the credit within a certain amount of time, depending on your card issuer's policies.
                </p>
                <p className="mb-4">
                  Refund processing times:
                </p>
                <ul className="list-disc pl-8 mb-4">
                  <li>Credit Card: 5-10 business days</li>
                  <li>Debit Card: 5-10 business days</li>
                  <li>PayPal: 3-5 business days</li>
                  <li>Store Credit: 1-2 business days</li>
                </ul>
                
                <p className="mb-4">
                  Shipping costs are non-refundable. If you received free shipping on your order, the standard shipping cost will be deducted from your refund.
                </p>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Exchanges</h3>
                <p className="mb-4">
                  If you need to exchange an item for the same product, please follow the return process above and place a new order for the replacement item. This ensures you receive the replacement as quickly as possible.
                </p>
                <p className="mb-4">
                  If you need to exchange an item for a different product, please return the original item for a refund and place a new order for the desired product.
                </p>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Damaged or Defective Items</h3>
                <p className="mb-4">
                  If you receive a damaged or defective item, please contact our customer service team within 48 hours of delivery. Please provide photos of the damaged item and packaging to help us process your claim more efficiently.
                </p>
                <p className="mb-4">
                  For defective items within the manufacturer's warranty period, you may be directed to contact the manufacturer directly for warranty service. We will assist you in this process if needed.
                </p>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Late or Missing Refunds</h3>
                <p className="mb-4">
                  If you haven't received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted. Next contact your bank. There is often some processing time before a refund is posted. If you've done all of this and you still have not received your refund yet, please contact us at <a href="mailto:returns@tech-cortex.com" className="text-primary hover:underline">returns@tech-cortex.com</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-2">How long will it take to receive my order?</h3>
                <p className="text-gray-600">
                  Most orders are processed within 1-2 business days. Delivery time depends on the shipping method you select at checkout. Standard shipping typically takes 5-7 business days, while expedited shipping takes 2-3 business days.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Can I change or cancel my order?</h3>
                <p className="text-gray-600">
                  You can change or cancel your order within 1 hour of placing it. After that, we begin processing orders and cannot guarantee changes or cancellations. Please contact our customer service team immediately if you need to make changes.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Do you ship internationally?</h3>
                <p className="text-gray-600">
                  Currently, we only ship within the United States, including Alaska, Hawaii, and APO/FPO addresses. We hope to expand our shipping options to international destinations in the future.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-2">What should I do if my package is damaged?</h3>
                <p className="text-gray-600">
                  If your package arrives damaged, please take photos of the damaged packaging and contents, and contact our customer service team within 48 hours of delivery. We'll work with you to resolve the issue promptly.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Can I return a gift?</h3>
                <p className="text-gray-600">
                  Yes, gifts can be returned within 30 days of delivery. You'll need the order number or gift receipt. The refund will be issued as store credit unless the original purchaser authorizes a refund to their payment method.
                </p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/terms" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Terms of Service</h3>
                <p className="text-gray-600 mb-4">Read our terms and conditions for using our website and services.</p>
                <span className="text-primary font-medium">Read More →</span>
              </Link>
              <Link href="/privacy" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Privacy Policy</h3>
                <p className="text-gray-600 mb-4">Learn how we collect, use, and protect your personal information.</p>
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Need Help With Your Order?</h2>
              <p className="text-lg mb-6">Our customer service team is ready to assist you with any questions about shipping, returns, or refunds.</p>
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

// Main Shipping and Returns page component with suspense for loading state
export default function Shipping() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <ShippingContent />
      </Suspense>
    </main>
  );
}