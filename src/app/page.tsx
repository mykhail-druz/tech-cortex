import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProducts, getCategories } from '@/lib/supabase/db';
import { Product } from '@/lib/supabase/types/types';
import { cn } from '@/lib/utils/utils';
import BackToTopButton from '@/components/ui/BackToTopButton';
import NewsletterSection from '@/components/ui/NewsletterSection';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
function ProductCard({ product }: { product: Product }) {
  const discountPercentage = calculateDiscount(product.price, product.old_price);

  return (
    <div className="group bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-lg hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative h-52 w-full bg-gray-50">
          {product.main_image_url ? (
            <Image
              src={product.main_image_url}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
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

          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        <div className="p-5">
          <h3 className="text-gray-900 font-semibold text-lg mb-1.5 line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {product.title}
          </h3>

          {product.brand && <p className="text-gray-500 text-sm mb-3">{product.brand}</p>}

          <div className="flex items-center justify-between mt-2">
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

// Server component to fetch and display homepage content
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
      {/* Hero Section */}
      <section className="relative overflow-hidden mb-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-90"></div>
        <div className="absolute inset-0 opacity-20"></div>

        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                Next-Gen Tech For Your Digital World
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-xl">
                Discover premium computer hardware for gaming, productivity, and creative workflows.
              </p>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Link
                  href="/products"
                  className="bg-white text-blue-700 px-8 py-3.5 rounded-full font-semibold hover:bg-blue-50 transition-colors inline-block shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
                >
                  Browse Catalog
                </Link>
                <Link
                  href="/pc-builder"
                  className="bg-transparent text-white border-2 border-white px-8 py-3.5 rounded-full font-semibold hover:bg-white/10 transition-colors inline-block"
                >
                  Build Your PC
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="relative w-full h-64 md:h-96 lg:h-[450px]">
                <Image
                  src="/hero-computer.png"
                  alt="High-performance computer hardware"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
      </section>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Display featured categories if available */}
            {featuredCategories && featuredCategories.length > 0
              ? featuredCategories.map((category, index) => (
                  <Link
                    key={category.id}
                    href={category.cta_link || '/products'}
                    className={cn(
                      'group relative overflow-hidden rounded-xl shadow-lg border border-transparent h-72 flex items-end transition-all duration-500 hover:-translate-y-2 hover:shadow-xl',
                      index % 4 === 0
                        ? 'hover:border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50'
                        : index % 4 === 1
                          ? 'hover:border-green-200 bg-gradient-to-br from-green-50 to-green-100/50'
                          : index % 4 === 2
                            ? 'hover:border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50'
                            : 'hover:border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50'
                    )}
                  >
                    {category.image_url && (
                      <div className="absolute inset-0 w-full h-full">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                        <Image
                          src={category.image_url}
                          alt={category.title || ''}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="relative z-20 p-7 w-full">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-white/95 transition-colors">
                        {category.title}
                      </h3>
                      <p className="text-sm text-gray-200 mb-5 group-hover:text-white/90 transition-colors">
                        {category.subtitle}
                      </p>
                      <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white hover:bg-white/30 transition-all duration-300 group-hover:shadow-md">
                        Browse Products
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-2 transform transition-transform group-hover:translate-x-1"
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
                (categories || []).map((category, index) => (
                  <Link
                    key={category.id}
                    href={`/products?category=${category.slug}`}
                    className={cn(
                      'group relative overflow-hidden rounded-xl shadow-lg border border-transparent h-72 flex items-end transition-all duration-500 hover:-translate-y-2 hover:shadow-xl',
                      index % 4 === 0
                        ? 'hover:border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50'
                        : index % 4 === 1
                          ? 'hover:border-green-200 bg-gradient-to-br from-green-50 to-green-100/50'
                          : index % 4 === 2
                            ? 'hover:border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50'
                            : 'hover:border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50'
                    )}
                  >
                    {category.image_url && (
                      <div className="absolute inset-0 w-full h-full">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
                        <Image
                          src={category.image_url}
                          alt={category.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="relative z-20 p-7 w-full">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-white/95 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-gray-200 mb-5 group-hover:text-white/90 transition-colors">
                        {category.description}
                      </p>
                      <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white hover:bg-white/30 transition-all duration-300 group-hover:shadow-md">
                        Browse Products
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-2 transform transition-transform group-hover:translate-x-1"
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

      {/* New Arrivals & Special Offers in Tabs */}
      <section className="mb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 relative">
              <span className="relative z-10">Latest Products</span>
              <span className="absolute bottom-0 left-0 w-full h-3 bg-green-100 opacity-50 -z-10 transform -rotate-1"></span>
            </h2>

            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link
                href="/products?sort=newest"
                className="text-primary hover:text-primary/80 font-medium flex items-center"
              >
                New Arrivals
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

              {discountedProducts.length > 0 && (
                <Link
                  href="/products?discount=true"
                  className="text-red-500 hover:text-red-600 font-medium flex items-center"
                >
                  Special Offers
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
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* New Arrivals Column */}
            <div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2 text-green-500"
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
                  Just Arrived
                </h3>
                <p className="text-gray-600 mb-2">Check out our newest products</p>
              </div>

              <div className="space-y-6">
                {newArrivals.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>

            {/* Special Offers Column */}
            {discountedProducts.length > 0 && (
              <div>
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl mb-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2 text-red-500"
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
                    Hot Deals
                  </h3>
                  <p className="text-gray-600 mb-2">Limited-time discounts on popular items</p>
                </div>

                <div className="space-y-6">
                  {discountedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

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
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose TechCortex?</h2>
            <p className="text-xl text-gray-600">Your trusted partner in PC building</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                🔧
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Guidance</h3>
              <p className="text-gray-600">
                Our compatibility checker ensures all your components work perfectly together
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                ⚡
              </div>
              <h3 className="text-xl font-semibold mb-2">Premium Quality</h3>
              <p className="text-gray-600">
                Only the highest quality components from trusted brands and manufacturers
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                🚚
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Quick and secure shipping to get your components to you as soon as possible
              </p>
            </div>
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
        <HomeContent />

        {/* Floating "Back to Top" button */}
        <BackToTopButton />
      </Suspense>
    </main>
  );
}
