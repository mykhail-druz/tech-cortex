'use client';

import { useState } from 'react';
import { toast } from 'react-toastify';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubscribing(true);

    try {
      // Имитируем отправку данных
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Здесь можно интегрировать с любым сервисом рассылки
      // Например: Mailchimp, ConvertKit, или просто отправить на ваш API
      console.log('Newsletter subscription for:', email);

      toast.success('Successfully subscribed to our newsletter!');
      setEmail('');
    } catch (error) {
      console.error('Error subscribing to newsletter:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <section className="mb-12 sm:mb-16 md:mb-20">
      <div className="container mx-auto px-4">
        <div className="relative bg-gradient-to-r from-gray-900 to-blue-900 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 opacity-10"></div>

          <div className="relative p-4 sm:p-6 md:p-16 flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0 md:pr-12">
              <span className="inline-block px-3 py-1 sm:px-4 bg-blue-500/20 text-blue-300 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                Stay Connected
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-4 sm:mb-6 leading-tight">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-lg leading-relaxed">
                Stay updated with the latest products, exclusive offers, and tech news directly in
                your inbox.
              </p>

              <div className="flex sm:flex-row flex-wrap gap-3 sm:gap-4">
                <div className="flex items-center">
                  <div className="bg-blue-500/20 p-1.5 sm:p-2 rounded-full mr-2 sm:mr-3 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base text-gray-300">Product Alerts</span>
                </div>

                <div className="flex items-center">
                  <div className="bg-blue-500/20 p-1.5 sm:p-2 rounded-full mr-2 sm:mr-3 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base text-gray-300">Exclusive Deals</span>
                </div>

                <div className="flex items-center">
                  <div className="bg-blue-500/20 p-1.5 sm:p-2 rounded-full mr-2 sm:mr-3 flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-base text-gray-300">Weekly Updates</span>
                </div>
              </div>
            </div>

            <div className="md:w-1/2 w-full">
              <div className="bg-white/10 backdrop-blur-sm p-4 sm:p-6 md:p-8 rounded-lg sm:rounded-xl">
                <form onSubmit={handleNewsletterSubscribe} className="space-y-4 sm:space-y-5">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-white/5 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 text-base"
                      required
                    />
                  </div>

                  <div className="flex items-start sm:items-center">
                    <input
                      id="terms-of-use"
                      type="checkbox"
                      className="h-5 w-5 text-blue-500 focus:ring-blue-400 border-gray-700 rounded mt-0.5 sm:mt-0 flex-shrink-0"
                      required
                    />
                    <label
                      htmlFor="terms-of-use"
                      className="ml-2 sm:ml-3 block text-sm text-gray-300 leading-relaxed"
                    >
                      I agree to receive marketing emails and understand I can unsubscribe anytime
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubscribing}
                    className="w-full px-6 py-3 sm:py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold text-base flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
                  >
                    {isSubscribing ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Subscribing...
                      </>
                    ) : (
                      <>
                        Subscribe Now
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <p className="text-xs text-gray-400 mt-4 text-center">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
