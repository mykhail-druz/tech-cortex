'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import ProductGrid from '@/components/product/ProductGrid';
import { getProductBySlug, getRelatedProducts } from '@/lib/supabase/db';
import { ProductWithDetails, Product } from '@/lib/supabase/types';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import AddToWishlistButton from '@/components/product/AddToWishlistButton';
import ReviewSection from '@/components/review/ReviewSection';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const unwrappedParams = React.use(params);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [activeImage, setActiveImage] = useState(0);
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { addItem } = useCart();
  const toast = useToast();

  // Handle quantity changes
  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      setIsLoading(true);
      try {
        // Get product by slug
        const { data: productData, error } = await getProductBySlug(unwrappedParams.slug);

        if (error || !productData) {
          console.error('Error fetching product:', error);
          return;
        }

        setProduct(productData);

        // Get related products
        if (productData.category_id) {
          const { data: relatedData } = await getRelatedProducts(
            productData.id,
            productData.category_id
          );
          setRelatedProducts(relatedData || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductData();
  }, [unwrappedParams.slug]);

  // Handle adding to cart
  const addToCart = async () => {
    if (!product) return;

    const { error } = await addItem(product.id, quantity);

    if (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
    } else {
      toast.success(`Product added to cart`);
    }
  };

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Render the product rating stars
  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`h-5 w-5 ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if product not found
  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you are looking for does not exist or has been removed.</p>
          <button
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary-dark transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb navigation */}
      <nav className="flex text-sm mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/" className="text-gray-600 hover:text-primary">
              Home
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <Link href="/products" className="ml-1 text-gray-600 hover:text-primary md:ml-2">
                Products
              </Link>
            </div>
          </li>
          {product.category && (
            <li>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <Link
                  href={`/products/category/${product.category.slug}`}
                  className="ml-1 text-gray-600 hover:text-primary md:ml-2"
                >
                  {product.category.name}
                </Link>
              </div>
            </li>
          )}
          {product.subcategory && (
            <li>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <Link
                  href={`/products/category/${product.subcategory.slug}`}
                  className="ml-1 text-gray-600 hover:text-primary md:ml-2"
                >
                  {product.subcategory.name}
                </Link>
              </div>
            </li>
          )}
          <li aria-current="page">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 text-gray-500 md:ml-2 font-medium truncate">
                {product.title}
              </span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Product details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product images */}
          <div className="space-y-4">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden h-80 w-full">
              <Image
                src={product.images && product.images.length > 0 
                  ? product.images[activeImage].image_url 
                  : product.main_image_url || '/placeholder-product.jpg'}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
              />
              {product.discount_percentage > 0 && (
                <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-medium px-2 py-1 rounded">
                  -{product.discount_percentage}%
                </span>
              )}
            </div>

            {/* Thumbnail gallery */}
            <div className="grid grid-cols-4 gap-2">
              {product.images && product.images.length > 0 ? (
                product.images.map((image, index) => (
                  <button
                    key={index}
                    className={cn(
                      'relative bg-gray-100 rounded border h-20',
                      activeImage === index ? 'border-primary' : 'border-gray-200'
                    )}
                    onClick={() => setActiveImage(index)}
                  >
                    <Image
                      src={image.image_url}
                      alt={`${product.title} - Image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 25vw, 10vw"
                      className="object-contain p-1"
                    />
                  </button>
                ))
              ) : (
                <button
                  className="relative bg-gray-100 rounded border h-20 border-primary"
                >
                  <Image
                    src={product.main_image_url || '/placeholder-product.jpg'}
                    alt={product.title}
                    fill
                    sizes="(max-width: 768px) 25vw, 10vw"
                    className="object-contain p-1"
                  />
                </button>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.title}</h1>

            {/* Brand */}
            <div className="mb-3">
              <span className="text-gray-600">Brand: </span>
              <span className="font-medium">{product.brand}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center mb-4">
              <div className="flex mr-2">{renderRating(product.rating || 0)}</div>
              <span className="text-gray-600 text-sm">
                {(product.rating || 0).toFixed(1)} ({product.review_count || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.old_price > 0 && (
                  <span className="ml-2 text-gray-500 line-through">
                    {formatPrice(product.old_price)}
                  </span>
                )}
              </div>
              {product.in_stock ? (
                <span className="text-green-600 font-medium mt-1 inline-block">In Stock</span>
              ) : (
                <span className="text-red-600 font-medium mt-1 inline-block">Out of Stock</span>
              )}
            </div>

            {/* Brief description */}
            <p className="text-gray-600 mb-6">{product.description}</p>

            {/* Quantity selector */}
            <div className="flex items-center mb-6">
              <span className="text-gray-700 mr-3">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={decrementQuantity}
                  className="flex-shrink-0 px-3 py-1 text-gray-600 hover:bg-gray-100 focus:outline-none disabled:opacity-50"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-3 py-1 border-x border-gray-300">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  className="flex-shrink-0 px-3 py-1 text-gray-600 hover:bg-gray-100 focus:outline-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart, wishlist, and buy now buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={addToCart}
                disabled={!product.in_stock}
                className={cn(
                  'px-6 py-3 rounded-md font-medium flex-1 transition-colors',
                  product.in_stock
                    ? 'bg-primary text-white hover:bg-primary-dark'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                Add to Cart
              </button>
              <AddToWishlistButton 
                productId={product.id} 
                variant="icon-button" 
                className="flex-1"
              />
              <button
                disabled={!product.in_stock}
                className={cn(
                  'px-6 py-3 rounded-md font-medium flex-1 border transition-colors',
                  product.in_stock
                    ? 'border-primary text-primary hover:bg-primary hover:text-white'
                    : 'border-gray-300 text-gray-500 cursor-not-allowed'
                )}
              >
                Buy Now
              </button>
            </div>

            {/* Additional product details */}
            <div className="mt-auto space-y-4">
              {/* SKU, Category, etc */}
              <div className="text-sm text-gray-600">
                <p>SKU: {product.sku || product.id}</p>
                <p>Category: {product.category?.name || 'Uncategorized'}</p>
              </div>

              {/* Share buttons */}
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Share:</span>
                <button className="text-gray-500 hover:text-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </button>
                <button className="text-gray-500 hover:text-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </button>
                <button className="text-gray-500 hover:text-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.593 7.203a2.506 2.506 0 0 0-1.762-1.766C18.265 5.007 12 5 12 5s-6.264-.007-7.831.404a2.56 2.56 0 0 0-1.766 1.778C2.036 8.746 2 12 2 12s.036 3.254.403 4.815a2.5 2.5 0 0 0 1.767 1.763c1.566.43 7.83.437 7.83.437s6.265.007 7.831-.403a2.51 2.51 0 0 0 1.767-1.763C21.964 15.254 22 12 22 12s-.036-3.254-.407-4.797zM10 15.5v-7l6 3.5-6 3.5z" />
                  </svg>
                </button>
                <button className="text-gray-500 hover:text-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product tabs - Description, Specifications, Reviews */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-10">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('description')}
              className={cn(
                'py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === 'description'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specifications')}
              className={cn(
                'py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === 'specifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={cn(
                'py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === 'reviews'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              Reviews ({product.review_count || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'description' && (
            <div className="prose max-w-none">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br />') }} />
              ) : (
                <p>No detailed description available for this product.</p>
              )}
            </div>
          )}

          {activeTab === 'specifications' && (
            <div>
              {product.specifications && product.specifications.length > 0 ? (
                <>
                  {/* Copy to clipboard button */}
                  <div className="flex justify-start mb-4">
                    <button
                      onClick={() => {
                        // Create a formatted string of all specifications
                        const specsText = product.specifications
                          .map(spec => `${spec.name}: ${spec.value}`)
                          .join('\n');

                        // Copy to clipboard
                        navigator.clipboard.writeText(specsText)
                          .then(() => {
                            toast.success('Specifications copied to clipboard');
                          })
                          .catch(err => {
                            console.error('Failed to copy specifications: ', err);
                            toast.error('Failed to copy specifications');
                          });
                      }}
                      className="flex items-center text-sm text-primary hover:text-primary-dark transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy Specifications
                    </button>
                  </div>

                  {/* Simple list of specifications */}
                  {product.specifications.map((spec, index) => (
                    <div 
                      key={index} 
                      className="py-2 flex items-baseline"
                    >
                      <div className="flex items-baseline" style={{ width: '40%' }}>
                        <span className="text-sm font-medium text-gray-900 min-w-[120px]">{spec.name}</span>
                        <div className="mx-1 flex-grow border-b border-dotted border-gray-300"></div>
                      </div>
                      <div className="text-gray-700 flex-1">
                        {/* Format values based on content */}
                        {spec.name.toLowerCase().includes('color') ? (
                          <div className="flex items-center">
                            <span 
                              className="inline-block w-4 h-4 mr-2 rounded-full border border-gray-300" 
                              style={{ 
                                backgroundColor: spec.value.toLowerCase().includes('black') ? 'black' : 
                                                spec.value.toLowerCase().includes('white') ? 'white' :
                                                spec.value.toLowerCase().includes('silver') ? 'silver' :
                                                spec.value.toLowerCase().includes('gold') ? 'gold' :
                                                spec.value.toLowerCase().includes('blue') ? 'blue' :
                                                spec.value.toLowerCase().includes('red') ? 'red' : 
                                                'transparent'
                              }}
                            ></span>
                            <span className="font-medium">{spec.value}</span>
                          </div>
                        ) : spec.name.toLowerCase().includes('capacity') || 
                           spec.name.toLowerCase().includes('memory') || 
                           spec.name.toLowerCase().includes('storage') || 
                           spec.name.toLowerCase().includes('ram') ? (
                          <span className="font-medium">
                            {spec.value.replace(/(\d+)/, '$1')}
                          </span>
                        ) : spec.name.toLowerCase().includes('resolution') ? (
                          <span className="font-medium">
                            <span className="px-2 py-1 bg-gray-100 rounded text-sm">{spec.value}</span>
                          </span>
                        ) : spec.name.toLowerCase().includes('processor') || 
                           spec.name.toLowerCase().includes('cpu') ? (
                          <span className="font-medium">
                            <span className="font-semibold">{spec.value.split(' ')[0]}</span> {spec.value.split(' ').slice(1).join(' ')}
                          </span>
                        ) : (
                          <span className="font-medium">{spec.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No specifications available for this product.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <ReviewSection
              productId={product.id}
              initialReviews={product.reviews}
              reviewCount={product.review_count || 0}
              averageRating={product.rating || 0}
            />
          )}
        </div>
      </div>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <ProductGrid products={relatedProducts.map(product => ({
            id: product.id,
            title: product.title,
            price: product.price,
            oldPrice: product.old_price || undefined,
            image: product.main_image_url || '/placeholder-product.jpg',
            category: product.category_id || '',
            rating: product.rating,
            inStock: product.in_stock,
            slug: product.slug,
          }))} />
        </div>
      )}

      {/* Recently viewed */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
          <ProductGrid products={relatedProducts.slice(0, Math.min(3, relatedProducts.length)).map(product => ({
            id: product.id,
            title: product.title,
            price: product.price,
            oldPrice: product.old_price || undefined,
            image: product.main_image_url || '/placeholder-product.jpg',
            category: product.category_id || '',
            rating: product.rating,
            inStock: product.in_stock,
            slug: product.slug,
          }))} />
        </div>
      )}
    </div>
  );
}
