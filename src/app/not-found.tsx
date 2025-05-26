import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found | TechCortex',
  description: 'The page you are looking for does not exist or has been moved.',
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-3xl w-full text-center">
        {/* Creative 404 visualization */}
        <div className="relative h-64 w-full mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Circuit board pattern background */}
            <div className="absolute inset-0 opacity-10 bg-gradient-to-r from-primary to-secondary"></div>

            {/* Animated 404 text */}
            <div className="relative z-10">
              <h1 className="text-9xl font-bold text-primary animate-pulse">
                404
              </h1>

              {/* Decorative elements */}
              <div className="absolute -top-8 -right-8 w-16 h-16 border-4 border-secondary rounded-full opacity-70 animate-spin-slow"></div>
              <div className="absolute -bottom-8 -left-8 w-12 h-12 border-4 border-primary rounded-full opacity-70 animate-ping"></div>
            </div>

          </div>
        </div>

        {/* Error message */}
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Oops! Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
          The page you are looking for might have been removed, had its name changed, 
          or is temporarily unavailable. Our tech experts are on the case!
        </p>

        {/* Tech-themed error code explanation */}
        <div className="bg-gray-900 p-5 rounded-lg mb-8 inline-block text-left w-full max-w-lg shadow-lg border border-gray-700">
          <div className="flex items-center mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-400 text-xs ml-2">terminal@techcortex:~</span>
          </div>
          <code className="text-sm font-mono block">
            <div className="text-green-400">$ searching_for_page.exe</div>
            <div className="text-red-500 mt-2 animate-pulse">FATAL ERROR: 404_PAGE_NOT_FOUND</div>
            <div className="text-gray-400 mt-1">
              <span className="text-yellow-400">Exception</span>: PageNotFoundException
            </div>
            <div className="text-gray-400 mt-1">
              <span className="text-blue-400">at</span> TechCortex.Router.navigate(url: "<span className="text-green-400">current_path</span>")
            </div>
            <div className="text-gray-400">
              <span className="text-blue-400">at</span> TechCortex.PageLoader.load(timeout: 3000ms)
            </div>
            <div className="text-gray-400">
              <span className="text-blue-400">at</span> TechCortex.UserRequest.process()
            </div>
            <div className="text-gray-300 mt-3">
              <span className="text-yellow-400">System</span>: Attempting recovery...
            </div>
            <div className="text-gray-300">
              <span className="text-green-400">Recommendation</span>: Try navigating to homepage or browse products
            </div>
            <div className="text-white mt-3">$ _<span className="animate-ping">|</span></div>
          </code>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/"
            className="bg-primary text-white px-8 py-3 rounded-md hover:bg-primary/90 transition-colors inline-block"
          >
            Return to Homepage
          </Link>
          <Link 
            href="/products"
            className="bg-white text-primary border border-primary px-8 py-3 rounded-md hover:bg-gray-50 transition-colors inline-block"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </main>
  );
}
