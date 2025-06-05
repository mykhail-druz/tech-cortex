import { Suspense } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - TechCortex',
  description: 'Learn how TechCortex collects, uses, and protects your personal information when you use our website and services.',
  openGraph: {
    title: 'Privacy Policy - TechCortex',
    description: 'Learn how TechCortex collects, uses, and protects your personal information when you use our website and services.',
    url: 'https://tech-cortex.com/privacy',
    siteName: 'TechCortex',
    images: [
      {
        url: 'https://tech-cortex.com/privacy-og.jpg',
        width: 1200,
        height: 630,
        alt: 'TechCortex - Privacy Policy',
      },
    ],
  },
};

// Privacy Policy content component
function PrivacyContent() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 py-16 mb-12 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
            <p className="text-lg text-gray-600 mb-8">
              Last updated: June 5, 2025
            </p>
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="mb-4">
                At TechCortex, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
              </p>
              <p className="mb-4">
                This privacy policy applies to personal data we collect when you use our website, <Link href="/" className="text-primary hover:underline">tech-cortex.com</Link>, purchase our products, or interact with us through other channels.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Important Information</h2>
              <p className="mb-4">
                <strong>Controller:</strong> TechCortex is the controller and responsible for your personal data (collectively referred to as "TechCortex", "we", "us", or "our" in this privacy policy).
              </p>
              <p className="mb-4">
                <strong>Contact Details:</strong> If you have any questions about this privacy policy or our privacy practices, please contact our data privacy manager at:
              </p>
              <p className="mb-4">
                <strong>Email:</strong> privacy@tech-cortex.com<br />
                <strong>Phone:</strong> (800) 555-1234<br />
                <strong>Address:</strong> 123 Tech Way, San Francisco, CA 94105
              </p>
              <p className="mb-4">
                You have the right to make a complaint at any time to the Federal Trade Commission (FTC) or other relevant supervisory authority for data protection issues. However, we would appreciate the chance to deal with your concerns before you approach the authorities, so please contact us in the first instance.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. The Data We Collect About You</h2>
              <p className="mb-4">
                Personal data, or personal information, means any information about an individual from which that person can be identified. It does not include data where the identity has been removed (anonymous data).
              </p>
              <p className="mb-4">
                We may collect, use, store, and transfer different kinds of personal data about you which we have grouped together as follows:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier, and date of birth.</li>
                <li><strong>Contact Data</strong> includes billing address, delivery address, email address, and telephone numbers.</li>
                <li><strong>Financial Data</strong> includes payment card details. Note that we do not store complete payment card information on our servers.</li>
                <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of products you have purchased from us.</li>
                <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website.</li>
                <li><strong>Profile Data</strong> includes your username and password, purchases or orders made by you, your interests, preferences, feedback, and survey responses.</li>
                <li><strong>Usage Data</strong> includes information about how you use our website and products.</li>
                <li><strong>Marketing and Communications Data</strong> includes your preferences in receiving marketing from us and our third parties and your communication preferences.</li>
              </ul>
              <p className="mb-4">
                We also collect, use, and share <strong>Aggregated Data</strong> such as statistical or demographic data for any purpose. Aggregated Data could be derived from your personal data but is not considered personal data in law as this data will not directly or indirectly reveal your identity.
              </p>
              <p className="mb-4">
                We do not collect any <strong>Special Categories of Personal Data</strong> about you (this includes details about your race or ethnicity, religious or philosophical beliefs, sex life, sexual orientation, political opinions, trade union membership, information about your health, and genetic and biometric data). Nor do we collect any information about criminal convictions and offenses.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. How We Collect Your Personal Data</h2>
              <p className="mb-4">
                We use different methods to collect data from and about you including through:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li><strong>Direct interactions.</strong> You may give us your Identity, Contact, and Financial Data by filling in forms or by corresponding with us by mail, phone, email, or otherwise. This includes personal data you provide when you:
                  <ul className="list-disc pl-8 mt-2">
                    <li>Create an account on our website;</li>
                    <li>Purchase our products;</li>
                    <li>Subscribe to our newsletter or publications;</li>
                    <li>Request marketing to be sent to you;</li>
                    <li>Enter a competition, promotion, or survey; or</li>
                    <li>Give us feedback or contact us.</li>
                  </ul>
                </li>
                <li><strong>Automated technologies or interactions.</strong> As you interact with our website, we will automatically collect Technical Data about your equipment, browsing actions, and patterns. We collect this personal data by using cookies, server logs, and other similar technologies.</li>
                <li><strong>Third parties or publicly available sources.</strong> We will receive personal data about you from various third parties and public sources, such as analytics providers, advertising networks, and search information providers.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. How We Use Your Personal Data</h2>
              <p className="mb-4">
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                <li>Where we need to comply with a legal obligation.</li>
              </ul>
              <p className="mb-4">
                Generally, we do not rely on consent as a legal basis for processing your personal data although we will get your consent before sending third-party direct marketing communications to you via email or text message. You have the right to withdraw consent to marketing at any time by contacting us.
              </p>
              <p className="mb-4">
                <strong>Purposes for which we will use your personal data:</strong>
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>To register you as a new customer</li>
                <li>To process and deliver your order</li>
                <li>To manage our relationship with you</li>
                <li>To enable you to participate in a promotion or survey</li>
                <li>To administer and protect our business and this website</li>
                <li>To deliver relevant website content and advertisements to you</li>
                <li>To use data analytics to improve our website, products, marketing, customer relationships, and experiences</li>
                <li>To make suggestions and recommendations to you about goods or services that may be of interest to you</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Disclosures of Your Personal Data</h2>
              <p className="mb-4">
                We may share your personal data with the parties set out below for the purposes outlined in section 5:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>Service providers who provide IT and system administration services.</li>
                <li>Professional advisers including lawyers, bankers, auditors, and insurers.</li>
                <li>Regulators and other authorities who require reporting of processing activities in certain circumstances.</li>
                <li>Third parties to whom we may choose to sell, transfer, or merge parts of our business or our assets. Alternatively, we may seek to acquire other businesses or merge with them. If a change happens to our business, then the new owners may use your personal data in the same way as set out in this privacy policy.</li>
              </ul>
              <p className="mb-4">
                We require all third parties to respect the security of your personal data and to treat it in accordance with the law. We do not allow our third-party service providers to use your personal data for their own purposes and only permit them to process your personal data for specified purposes and in accordance with our instructions.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. International Transfers</h2>
              <p className="mb-4">
                We primarily process your personal data within the United States. However, some of our service providers may be based outside of the United States, which involves a transfer of your data outside the country.
              </p>
              <p className="mb-4">
                Whenever we transfer your personal data out of the United States, we ensure a similar degree of protection is afforded to it by ensuring at least one of the following safeguards is implemented:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li>We will only transfer your personal data to countries that have been deemed to provide an adequate level of protection for personal data.</li>
                <li>Where we use certain service providers, we may use specific contracts approved for use which give personal data the same protection it has in the United States.</li>
              </ul>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Data Security</h2>
              <p className="mb-4">
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know. They will only process your personal data on our instructions, and they are subject to a duty of confidentiality.
              </p>
              <p className="mb-4">
                We have put in place procedures to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">9. Data Retention</h2>
              <p className="mb-4">
                We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements. We may retain your personal data for a longer period in the event of a complaint or if we reasonably believe there is a prospect of litigation in respect to our relationship with you.
              </p>
              <p className="mb-4">
                To determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we process your personal data and whether we can achieve those purposes through other means, and the applicable legal, regulatory, tax, accounting, or other requirements.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">10. Your Legal Rights</h2>
              <p className="mb-4">
                Under certain circumstances, you have rights under data protection laws in relation to your personal data. You have the right to:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li><strong>Request access</strong> to your personal data.</li>
                <li><strong>Request correction</strong> of your personal data.</li>
                <li><strong>Request erasure</strong> of your personal data.</li>
                <li><strong>Object to processing</strong> of your personal data.</li>
                <li><strong>Request restriction of processing</strong> your personal data.</li>
                <li><strong>Request transfer</strong> of your personal data.</li>
                <li><strong>Right to withdraw consent</strong> where we are relying on consent to process your personal data.</li>
              </ul>
              <p className="mb-4">
                If you wish to exercise any of the rights set out above, please contact us using the details provided in section 2.
              </p>
              <p className="mb-4">
                <strong>No fee usually required:</strong> You will not have to pay a fee to access your personal data (or to exercise any of the other rights). However, we may charge a reasonable fee if your request is clearly unfounded, repetitive, or excessive. Alternatively, we could refuse to comply with your request in these circumstances.
              </p>
              <p className="mb-4">
                <strong>What we may need from you:</strong> We may need to request specific information from you to help us confirm your identity and ensure your right to access your personal data (or to exercise any of your other rights). This is a security measure to ensure that personal data is not disclosed to any person who has no right to receive it. We may also contact you to ask you for further information in relation to your request to speed up our response.
              </p>
              <p className="mb-4">
                <strong>Time limit to respond:</strong> We try to respond to all legitimate requests within one month. Occasionally it could take us longer than a month if your request is particularly complex or you have made a number of requests. In this case, we will notify you and keep you updated.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">11. Cookies</h2>
              <p className="mb-4">
                Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site.
              </p>
              <p className="mb-4">
                A cookie is a small file of letters and numbers that we store on your browser or the hard drive of your computer if you agree. Cookies contain information that is transferred to your computer's hard drive.
              </p>
              <p className="mb-4">
                We use the following cookies:
              </p>
              <ul className="list-disc pl-8 mb-4">
                <li><strong>Strictly necessary cookies.</strong> These are cookies that are required for the operation of our website.</li>
                <li><strong>Analytical/performance cookies.</strong> They allow us to recognize and count the number of visitors and to see how visitors move around our website when they are using it.</li>
                <li><strong>Functionality cookies.</strong> These are used to recognize you when you return to our website.</li>
                <li><strong>Targeting cookies.</strong> These cookies record your visit to our website, the pages you have visited, and the links you have followed.</li>
              </ul>
              <p className="mb-4">
                You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies. If you disable or refuse cookies, please note that some parts of this website may become inaccessible or not function properly.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">12. Changes to the Privacy Policy</h2>
              <p className="mb-4">
                We may update this privacy policy from time to time. We will notify you of significant changes by posting the new privacy policy on this page and, where feasible, by sending you a notification.
              </p>
              <p className="mb-4">
                You are advised to review this privacy policy periodically for any changes. Changes to this privacy policy are effective when they are posted on this page.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">13. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about this privacy policy, please contact us at:
              </p>
              <p className="mb-4">
                <strong>Email:</strong> privacy@tech-cortex.com<br />
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
              <Link href="/terms" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Terms of Service</h3>
                <p className="text-gray-600 mb-4">Read our terms and conditions for using our website and services.</p>
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
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Have Questions About Your Privacy?</h2>
              <p className="text-lg mb-6">Our data privacy team is here to address any concerns you might have about your personal information.</p>
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

// Main Privacy Policy page component with suspense for loading state
export default function Privacy() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <PrivacyContent />
      </Suspense>
    </main>
  );
}