import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProducts, getCategories } from '@/lib/supabase/db';
import { Product } from '@/lib/supabase/types/types';
import { cn } from '@/lib/utils/utils';
import BackToTopButton from '@/components/ui/BackToTopButton';
import NewsletterSection from '@/components/ui/NewsletterSection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import HomeSidebar from '@/components/layout/HomeSidebar';
import FeaturesSection from '@/components/ui/FeaturesSection';

// Типы для данных
interface FeaturedCategory {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  cta_link?: string;
  is_active: boolean;
}

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

// Server component to fetch and display homepage content without hero section
async function HomeContent() {
  // Типизированные пустые массивы для динамического контента
  const featuredCategories: FeaturedCategory[] = [];
  const promotions: Promotion[] = [];
  const trustIndicators: TrustIndicator[] = [];

  // Fetch featured products (newest products with the highest rating)
  const { data: allProducts } = await getProducts();
  const { data: categories } = await getCategories();

  // Display all available categories

  // Sort products by created_at (newest first) and take the first 8
  const newArrivals = [...(allProducts || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  // Sort products by rating (highest first) and take the first 8
  const featuredProducts = [...(allProducts || [])].sort((a, b) => b.rating - a.rating).slice(0, 8);

  // Get products with discounts
  const discountedProducts = (allProducts || [])
    .filter(product => product.old_price && product.old_price > product.price)
    .slice(0, 4);

  return (
    <div className="w-full">
      {/* Featured Categories */}
      <section className="mb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 relative">
              <span className="relative z-10">Shop by Category</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-blue-100 opacity-50 -z-10 transform -rotate-1"></span>
            </h2>
            <Link
              href="/products"
              className="text-primary hover:text-primary/80 font-medium flex items-center mt-4 md:mt-0"
            >
              View All Categories
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

          {/* Layout with HomeSidebar on a left and categories grid on right */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* HomeSidebar */}
            <div className="lg:w-1/4 flex-shrink-0">
              <HomeSidebar />
            </div>

            {/* Categories Grid */}
            <div className="lg:w-3/4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Display featured categories if available */}
                {featuredCategories && featuredCategories.length > 0
                  ? featuredCategories.map(category => (
                      <Link
                        key={category.id}
                        href={category.cta_link || '/products'}
                        className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-primary transition-colors duration-200"
                      >
                        {category.image_url && (
                          <div className="h-56 w-full bg-gray-50 flex items-center justify-center">
                            <Image
                              src={category.image_url}
                              alt={category.title || ''}
                              width={400}
                              height={224}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                            {category.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {category.subtitle}
                          </p>
                          <div className="inline-flex items-center text-primary font-medium text-sm">
                            Browse Products
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))
                  : /* If no featured categories, display all regular categories */
                    (categories || []).map(category => (
                      <Link
                        key={category.id}
                        href={`/products?category=${category.slug}`}
                        className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-primary transition-colors duration-200"
                      >
                        {category.image_url && (
                          <div className="h-56 w-full bg-white flex items-center justify-center">
                            <Image
                              src={category.image_url}
                              alt={category.name}
                              width={400}
                              height={224}
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {category.description}
                          </p>
                          <div className="inline-flex items-center text-primary font-medium text-sm">
                            Browse Products
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 ml-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* Just Arrived Section */}
      <section className="mb-20 py-20 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
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
              New Arrivals
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Just Arrived</h2>

            <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
              Discover our latest collection of cutting-edge products and innovative solutions
            </p>

            <Link
              href="/products?sort=newest"
              className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              View All New Arrivals
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} isNew={true} />
            ))}
          </div>
        </div>
      </section>

      {/* Hot Deals Section */}
      {discountedProducts.length > 0 && (
        <section className="mb-20 py-20 bg-gradient-to-b from-red-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Special Offers
              </div>

              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Hot Deals</h2>

              <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
                Don&apos;t miss out on these amazing limited-time discounts and exclusive offers
              </p>

              <Link
                href="/products?discount=true"
                className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                View All Special Offers
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {discountedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Indicators */}
      {trustIndicators && trustIndicators.length > 0 && (
        <section className="mb-20 py-16 bg-gray-50">
          <div className="container mx-auto px-4">
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

// Main page component with suspense for loading state
export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<LoadingSpinner message="Loading amazing deals..." />}>
        {/* Hero Section Only */}
        <section className="relative overflow-hidden mb-16 h-[75vh] md:h-[55vh] flex items-center rounded-3xl mt-8">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 "></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>

          {/* Animated Particles */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60 z-10"></div>
            <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40 z-10"></div>
            <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-pink-400 rounded-full animate-bounce opacity-50 z-10"></div>
            <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse opacity-70 z-10"></div>
            <div className="absolute bottom-20 right-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping opacity-50 z-10"></div>
          </div>

          {/* Geometric Shapes */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 rounded-full blur-3xl animate-spin"
              style={{ animationDuration: '20s' }}
            ></div>
          </div>

          <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
                {/* Badge */}
                {/*<div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-6 animate-fade-in">*/}
                {/*  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>*/}
                {/*  New Products Available*/}
                {/*</div>*/}

                <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight animate-fade-in-up">
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Next-Gen Tech
                  </span>
                  <br />
                  <span className="text-white">For Your Digital World</span>
                </h1>

                <p className="text-xl text-blue-100 mb-8 max-w-xl leading-relaxed animate-fade-in-up delay-200">
                  Discover premium computer hardware for gaming, productivity, and creative
                  workflows. Build the perfect setup with our cutting-edge components.
                </p>

                <div className="flex flex-wrap gap-4 justify-center md:justify-start animate-fade-in-up delay-300 z-20">
                  <Link
                    href="/products"
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 inline-flex items-center shadow-lg hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                  >
                    <span>Browse Catalog</span>
                    <svg
                      className="w-5 h-5 ml-2 transform transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                  <Link
                    href="/pc-builder"
                    className="group bg-transparent text-white border-2 border-white/30 hover:border-white/60 px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all duration-300 inline-flex items-center backdrop-blur-sm"
                  >
                    <span>Build Your PC</span>
                    <svg
                      className="w-5 h-5 ml-2 transform transition-transform group-hover:rotate-12"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                      />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="md:w-1/2 relative animate-fade-in-right hidden md:block">
                {/* Floating Elements */}
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl backdrop-blur-sm border border-white/10 animate-float"></div>
                <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-xl backdrop-blur-sm border border-white/10 animate-float delay-1000"></div>
                <div className="absolute top-1/2 -left-8 w-12 h-12 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full backdrop-blur-sm border border-white/10 animate-float delay-500"></div>

                {/*<div className="relative hidden md:block w-full h-64 md:h-96 lg:h-[500px]">*/}
                {/*  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl"></div>*/}
                {/*  <Image*/}
                {/*    src="/hero-computer.png"*/}
                {/*    alt="High-performance computer hardware"*/}
                {/*    fill*/}
                {/*    className="object-contain drop-shadow-2xl relative z-10 filter brightness-110"*/}
                {/*    priority*/}
                {/*  />*/}
                {/*</div>*/}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content (without a hero) */}
        <HomeContent />

        {/* Floating "Back to Top" button */}
        <BackToTopButton />
      </Suspense>
    </main>
  );
}
