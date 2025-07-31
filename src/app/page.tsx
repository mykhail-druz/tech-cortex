import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProducts } from '@/lib/supabase/db';
import { Product } from '@/lib/supabase/types/types';
import { cn } from '@/lib/utils/utils';
import BackToTopButton from '@/components/ui/BackToTopButton';
import NewsletterSection from '@/components/ui/NewsletterSection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import HomeSidebar from '@/components/layout/HomeSidebar';
import FeaturesSection from '@/components/ui/FeaturesSection';
import SwipeableHeroBanner from '@/components/ui/SwipeableHeroBanner';
import { FaFire, FaRegClock } from 'react-icons/fa';

// Типы для данных
interface Promotion {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  cta_text?: string;
  cta_link?: string;
  is_active: boolean;
}

interface TrustIndicator {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  icon?: string;
  value?: string;
  is_active: boolean;
}

// Format price with currency
function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

// Calculate discount percentage
function calculateDiscount(price: number, oldPrice: number | null) {
  if (!oldPrice || oldPrice <= price) return null;
  const discount = Math.round(((oldPrice - price) / oldPrice) * 100);
  return discount > 0 ? discount : null;
}

// Product card component
function ProductCard({ product, isNew = false }: { product: Product; isNew?: boolean }) {
  const discountPercentage = calculateDiscount(product.price, product.old_price);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative h-56 w-full bg-white overflow-hidden">
          {product.main_image_url ? (
            <Image
              src={product.main_image_url}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain p-2"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {discountPercentage && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              {discountPercentage}% OFF
            </div>
          )}

          {!product.in_stock && (
            <div className="absolute top-3 left-3 bg-gray-800 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
              Out of Stock
            </div>
          )}

          {isNew && product.in_stock && (
            <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              NEW
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-gray-900 font-semibold text-base mb-2 line-clamp-2">
            {product.title}
          </h3>

          {product.brand && <p className="text-gray-500 text-sm mb-3">{product.brand}</p>}

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-gray-900 font-bold text-lg">{formatPrice(product.price)}</span>
              {product.old_price && product.old_price > 0 && (
                <span className="text-gray-500 text-sm line-through">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>

            {product.rating > 0 && (
              <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-gray-700 font-medium text-sm ml-1">
                  {product.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

// Server component to fetch and display homepage content - only full-width sections
async function HomeContent() {
  // Типизированные пустые массивы для динамического контента
  const promotions: Promotion[] = [];
  const trustIndicators: TrustIndicator[] = [];

  // Fetch featured products (newest products with the highest rating)
  const { data: allProducts } = await getProducts();

  // Sort products by rating (highest first) and take the first 8
  const featuredProducts = [...(allProducts || [])].sort((a, b) => b.rating - a.rating).slice(0, 8);

  return (
    <div className="w-full">
      {/* Featured Products */}
      <section className="mb-20 py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 relative">
              <span className="relative z-10">Featured Products</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-yellow-100 opacity-50 -z-10 transform -rotate-1"></span>
            </h2>
            <Link
              href="/products"
              className="text-primary hover:text-primary/80 font-medium flex items-center mt-4 md:mt-0"
            >
              View All Products
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {featuredProducts.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {featuredProducts.length > 4 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {featuredProducts.slice(4, 8).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promotions Banner */}
      {promotions && promotions.length > 0 && (
        <section className="mb-20">
          <div className="container mx-auto px-4">
            <div className="relative bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-[url('/promo-pattern.svg')] mix-blend-overlay opacity-20"></div>

              <div className="relative flex flex-col md:flex-row items-center">
                <div className="md:w-1/2 p-8 md:p-12 lg:p-16 text-white">
                  <span className="inline-block px-4 py-1 bg-white/20 rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
                    Special Offer
                  </span>
                  <h2 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight">
                    {promotions[0].title}
                  </h2>
                  <p className="text-xl text-blue-100 mb-8 max-w-lg">{promotions[0].subtitle}</p>
                  {promotions[0].cta_link && (
                    <Link
                      href={promotions[0].cta_link}
                      className="group bg-white text-blue-700 px-8 py-3.5 rounded-full font-semibold hover:bg-blue-50 transition-colors inline-flex items-center shadow-lg"
                    >
                      {promotions[0].cta_text || 'Learn More'}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2 transform transition-transform group-hover:translate-x-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                  )}
                </div>

                {promotions[0].image_url && (
                  <div className="md:w-1/2 relative">
                    <div className="h-64 md:h-full w-full md:absolute md:inset-0">
                      <Image
                        src={promotions[0].image_url}
                        alt={promotions[0].title || 'Promotion'}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover md:object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust Indicators */}
      {trustIndicators && trustIndicators.length > 0 && (
        <section className="mb-20 py-16 bg-gray-50">
          <div className="container mx-auto px-0 md:px-4">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12 relative inline-block mx-auto">
              <span className="relative z-10">Why Choose Us</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-purple-100 opacity-50 -z-10 transform -rotate-1"></span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {trustIndicators.map((indicator, index) => (
                <div
                  key={indicator.id}
                  className="bg-white p-8 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 text-center group"
                >
                  {indicator.image_url ? (
                    <div className="mb-6 transform transition-transform duration-300 group-hover:scale-110">
                      <Image
                        src={indicator.image_url}
                        alt={indicator.title || ''}
                        width={64}
                        height={64}
                        className="mx-auto"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'mb-6 rounded-full w-16 h-16 flex items-center justify-center mx-auto transform transition-transform duration-300 group-hover:scale-110',
                        index % 4 === 0
                          ? 'bg-blue-100 text-blue-600'
                          : index % 4 === 1
                            ? 'bg-green-100 text-green-600'
                            : index % 4 === 2
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-amber-100 text-amber-600'
                      )}
                    >
                      <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{indicator.title}</h3>
                  <p className="text-gray-600">{indicator.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Signup */}
      <NewsletterSection />

      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
}

// Component for sections under hero banner (Just Arrived and Hot Deals)
async function HeroSections() {
  // Fetch products for these sections
  const { data: allProducts } = await getProducts();

  // Sort products by created_at (newest first) and take the first 4
  const newArrivals = [...(allProducts || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  // Get products with discounts
  const discountedProducts = (allProducts || [])
    .filter(product => product.old_price && product.old_price > product.price)
    .slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Hot Deals Section */}
      {discountedProducts.length > 0 && (
        <section className="py-8 bg-gradient-to-b from-red-50 to-white rounded-2xl">
          <div className="px-6">
            <div className="text-center mb-12">
              <div className="flex flex-row items-center justify-between gap-4 mb-6">
                <div className="flex flex-row items-center space-x-2 px-6 py-3 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                  <FaFire />
                  <p>Special Offers</p>
                </div>
                <Link
                  href="/products?discount=true"
                  className="inline-flex items-center px-3 md:px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg md:rounded-2xl transition-colors duration-200 text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">View All Special Offers</span>
                  <span className="sm:hidden"> All</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 ml-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Hot Deals</h2>

              <p className="text-gray-600 text-base max-w-xl mx-auto mb-6">
                Don&apos;t miss out on these amazing limited-time discounts and exclusive offers
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {discountedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Just Arrived Section */}
      <section className="py-8 bg-gradient-to-b from-green-50 to-white rounded-2xl">
        <div className="px-6">
          <div className="text-center mb-12">
            <div className="flex flex-row items-center justify-between gap-4 mb-6">
              <div className="flex flex-row items-center space-x-2 px-6 py-3 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                <FaRegClock />
                <p>New Arrivals</p>
              </div>
              <Link
                href="/products?sort=newest"
                className="inline-flex items-center px-3 md:px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg md:rounded-2xl transition-colors duration-200 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">View All New Arrivals</span>
                <span className="sm:hidden">All</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 sm:h-5 sm:w-5 ml-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Just Arrived</h2>

            <p className="text-gray-600 text-base max-w-xl mx-auto mb-6">
              Discover our latest collection of cutting-edge products and innovative solutions
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} isNew={true} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Main page component with suspense for loading state
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<LoadingSpinner message="Loading amazing deals..." />}>
        {/* Hero Section with Banner, Sidebar, and additional sections */}
        <section className="mb-16 mt-8">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-0 md:gap-8">
              {/* Sticky HomeSidebar on the left */}
              <div className="lg:w-1/4 flex-shrink-0 hidden md:block">
                <div className="sticky top-20 z-10">
                  <HomeSidebar />
                </div>
              </div>

              {/* Hero Banner and sections on the right */}
              <div className="lg:w-3/4 space-y-8">
                {/* Hero Banner */}
                <SwipeableHeroBanner
                  images={[
                    '/hero-banner.png',
                    '/hero-banner-promo.png',
                    '/hero-banner-builder.png',
                  ]}
                  autoSlide={true}
                />

                {/* Just Arrived and Hot Deals sections */}
                <HeroSections />
              </div>
            </div>
          </div>
        </section>

        {/* Main Content - Full width sections */}
        <HomeContent />

        {/* Floating "Back to Top" button */}
        <BackToTopButton />
      </Suspense>
    </main>
  );
}
