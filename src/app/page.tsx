import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getHomepageContent, getProducts, getCategories } from '@/lib/supabase/db';
import { Product } from '@/lib/supabase/types';

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
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:border-primary transition-colors">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative h-48 w-full bg-gray-100">
          {product.main_image_url ? (
            <Image
              src={product.main_image_url}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {discountPercentage && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {discountPercentage}% OFF
            </div>
          )}

          {!product.in_stock && (
            <div className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-bold px-4 py-1 rounded">
              Out of Stock
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-gray-900 font-medium text-lg mb-1 line-clamp-2">{product.title}</h3>

          {product.brand && (
            <p className="text-gray-500 text-sm mb-2">{product.brand}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            <div>
              <span className="text-gray-900 font-bold">{formatPrice(product.price)}</span>
              {product.old_price && (
                <span className="text-gray-500 text-sm line-through ml-2">
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>

            {product.rating > 0 && (
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-gray-600 text-sm ml-1">
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
  // Fetch homepage content from Supabase
  const { data: heroContent } = await getHomepageContentBySection('hero');
  const { data: featuredCategories } = await getHomepageContentBySection('featured_category');
  const { data: promotions } = await getHomepageContentBySection('promotion');

  // Fetch featured products (newest products with highest rating)
  const { data: allProducts } = await getProducts();
  const { data: categories } = await getCategories();

  // Sort products by created_at (newest first) and take the first 8
  const newArrivals = [...(allProducts || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 4);

  // Sort products by rating (highest first) and take the first 8
  const featuredProducts = [...(allProducts || [])].sort(
    (a, b) => b.rating - a.rating
  ).slice(0, 8);

  // Get products with discounts
  const discountedProducts = (allProducts || [])
    .filter(product => product.old_price && product.old_price > product.price)
    .slice(0, 4);

  const hero = heroContent?.[0];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-gray-100 to-gray-200 py-16 mb-12 rounded-lg">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {hero?.title || 'TechCortex - Computer Hardware Store'}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {hero?.subtitle || 'Your trusted provider of high-quality computer hardware'}
            </p>
            <Link 
              href={hero?.cta_link || '/products'} 
              className="bg-primary text-white px-8 py-3 rounded-md hover:bg-primary/90 transition-colors inline-block"
            >
              {hero?.cta_text || 'Browse Catalog'}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredCategories?.map((category) => (
              <Link 
                key={category.id} 
                href={category.cta_link || '/products'} 
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-primary transition-colors text-center"
              >
                {category.image_url && (
                  <div className="relative h-24 w-24 mx-auto mb-4">
                    <Image
                      src={category.image_url}
                      alt={category.title || ''}
                      fill
                      sizes="96px"
                      className="object-contain"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                <p className="text-sm text-gray-500">{category.subtitle}</p>
              </Link>
            ))}
            {categories?.map((category, index) => {
              // Only show categories if we don't have enough featured categories
              if (index >= (4 - (featuredCategories?.length || 0))) return null;

              return (
                <Link 
                  key={category.id} 
                  href={`/products?category=${category.slug}`} 
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-primary transition-colors text-center"
                >
                  {category.image_url && (
                    <div className="relative h-24 w-24 mx-auto mb-4">
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        sizes="96px"
                        className="object-contain"
                      />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products" className="text-primary hover:text-primary/80">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promotions Banner */}
      {promotions && promotions.length > 0 && (
        <section className="mb-16">
          <div className="container mx-auto px-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg overflow-hidden">
              <div className="p-8 md:p-12 text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">{promotions[0].title}</h2>
                <p className="text-lg mb-6">{promotions[0].subtitle}</p>
                {promotions[0].cta_link && (
                  <Link 
                    href={promotions[0].cta_link} 
                    className="bg-white text-blue-600 px-6 py-2 rounded-md hover:bg-gray-100 transition-colors inline-block"
                  >
                    {promotions[0].cta_text || 'Learn More'}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
            <Link href="/products?sort=newest" className="text-primary hover:text-primary/80">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Special Offers */}
      {discountedProducts.length > 0 && (
        <section className="mb-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Special Offers</h2>
              <Link href="/products?discount=true" className="text-primary hover:text-primary/80">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {discountedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Indicators */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg className="h-10 w-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Free Shipping</h3>
              <p className="text-gray-500 text-sm">On orders over $100</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg className="h-10 w-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Returns</h3>
              <p className="text-gray-500 text-sm">30-day return policy</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg className="h-10 w-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-500 text-sm">Protected by encryption</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-primary mb-4">
                <svg className="h-10 w-10 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-500 text-sm">We&apos;re here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="mb-16">
        <div className="container mx-auto px-4">
          <div className="bg-gray-100 rounded-lg p-8 md:p-12">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscribe to Our Newsletter</h2>
              <p className="text-gray-600 mb-6">Stay updated with the latest products, exclusive offers, and tech news.</p>
              <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Helper function to get homepage content by section
async function getHomepageContentBySection(section: string) {
  const { data, error } = await getHomepageContent();

  if (error) {
    console.error('Error fetching homepage content:', error);
    return { data: [] };
  }

  return { 
    data: data?.filter(item => item.section === section) || [] 
  };
}

// Main page component with suspense for loading state
export default function Home() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </main>
  );
}
