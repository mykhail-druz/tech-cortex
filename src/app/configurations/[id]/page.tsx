'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/contexts/CartContext';
import {
  PCConfigurationWithComponents,
  COMPATIBILITY_STATUS_LABELS,
  COMPATIBILITY_STATUS_COLORS,
} from '@/lib/supabase/types/pc-configurations';
import { getPublicConfiguration } from '@/lib/supabase/services/configurationService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PublicConfigurationPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const { addItem } = useCart();
  const [configuration, setConfiguration] = useState<PCConfigurationWithComponents | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const configId = params.id as string;

  useEffect(() => {
    const fetchConfiguration = async () => {
      if (!configId) {
        setError('Invalid configuration ID');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await getPublicConfiguration(configId);

        if (!result.success) {
          setError(result.error || 'Failed to load configuration');
          return;
        }

        setConfiguration(result.data || null);
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error('Error fetching public configuration:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfiguration();
  }, [configId]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Load configuration in PC Builder
  const handleLoadInBuilder = () => {
    localStorage.setItem('loadPublicConfigurationId', configId);
    router.push('/pc-builder');
    toast.success('Configuration will be loaded in PC Builder');
  };

  // Add all components to cart
  const handleAddToCart = async () => {
    if (!configuration || isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      let addedCount = 0;
      let failedCount = 0;
      const failedItems: string[] = [];
      
      // Add each component to the cart
      for (const component of configuration.components) {
        try {
          const { error } = await addItem(component.product_id, component.quantity);
          if (error) {
            failedCount++;
            failedItems.push(component.product.title);
            console.error(`Failed to add ${component.product.title} to cart:`, error);
          } else {
            addedCount++;
          }
        } catch (err) {
          failedCount++;
          failedItems.push(component.product.title);
          console.error(`Error adding ${component.product.title} to cart:`, err);
        }
      }
      
      // Show appropriate success/error messages
      if (addedCount > 0 && failedCount === 0) {
        toast.success(`Successfully added all ${addedCount} components to cart!`);
      } else if (addedCount > 0 && failedCount > 0) {
        toast.success(`Added ${addedCount} components to cart. ${failedCount} failed to add.`);
        if (failedItems.length > 0) {
          console.warn('Failed items:', failedItems);
        }
      } else {
        toast.error('Failed to add components to cart. Please try again.');
      }
      
    } catch (error) {
      console.error('Error adding configuration to cart:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Get compatibility status styling
  const getCompatibilityStatusStyle = (status: 'valid' | 'warning' | 'error') => {
    const color = COMPATIBILITY_STATUS_COLORS[status];
    return {
      valid: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    }[color];
  };

  // Group components by category
  const groupedComponents = configuration?.components.reduce((acc, component) => {
    if (!acc[component.category_slug]) {
      acc[component.category_slug] = [];
    }
    acc[component.category_slug].push(component);
    return acc;
  }, {} as Record<string, typeof configuration.components>) || {};

  // Get category display name
  const getCategoryDisplayName = (slug: string): string => {
    const names: Record<string, string> = {
      cpu: 'Processor',
      motherboard: 'Motherboard',
      memory: 'Memory',
      'graphics-cards': 'Graphics Card',
      storage: 'Storage',
      'power-supplies': 'Power Supply',
      cases: 'Case',
      cooling: 'Cooling',
    };
    return names[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading configuration..." />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-800 mb-2">Configuration Not Found</h1>
            <p className="text-red-700 mb-6">{error}</p>
            <Link
              href="/pc-builder"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Build Your Own PC
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!configuration) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Configuration Not Available</h1>
            <p className="text-gray-600 mb-6">This configuration may be private or no longer exists.</p>
            <Link
              href="/pc-builder"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Build Your Own PC
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/pc-builder" className="hover:text-primary">PC Builder</Link>
            <span>›</span>
            <span>Shared Configuration</span>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{configuration.name}</h1>
              {configuration.description && (
                <p className="text-gray-600 mb-4">{configuration.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Shared on {formatDate(configuration.created_at)}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompatibilityStatusStyle(configuration.compatibility_status)}`}
                >
                  {COMPATIBILITY_STATUS_LABELS[configuration.compatibility_status]}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Public
                </span>
              </div>
            </div>

            <div className="text-right">
              {configuration.total_price && (
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatPrice(configuration.total_price)}
                </div>
              )}
              <div className="text-sm text-gray-600">
                {configuration.component_count} components
              </div>
            </div>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Configuration Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {configuration.component_count}
              </div>
              <div className="text-sm text-gray-600">Components</div>
            </div>
            
            {configuration.total_price && (
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(configuration.total_price)}
                </div>
                <div className="text-sm text-gray-600">Total Price</div>
              </div>
            )}
            
            {configuration.recommended_psu_power && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {configuration.recommended_psu_power}W
                </div>
                <div className="text-sm text-gray-600">Recommended PSU</div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleLoadInBuilder}
              className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Load in PC Builder
            </button>
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`flex-1 border border-primary py-3 px-6 rounded-lg font-medium transition-colors ${
                isAddingToCart
                  ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                  : 'text-primary hover:bg-primary/5'
              }`}
            >
              {isAddingToCart ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-2"></div>
                  Adding to Cart...
                </div>
              ) : (
                'Add All to Cart'
              )}
            </button>
          </div>
        </div>

        {/* Components List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Components</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {Object.entries(groupedComponents).map(([categorySlug, components]) => (
                <div key={categorySlug} className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {getCategoryDisplayName(categorySlug)}
                    {components.length > 1 && (
                      <span className="text-sm text-gray-500 ml-2">({components.length})</span>
                    )}
                  </h3>
                  
                  <div className="space-y-3">
                    {components.map((component) => (
                      <div key={component.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          {component.product.main_image_url && (
                            <img
                              src={component.product.main_image_url}
                              alt={component.product.title}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{component.product.title}</h4>
                            {component.quantity > 1 && (
                              <p className="text-sm text-gray-600">Quantity: {component.quantity}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                component.product.in_stock 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {component.product.in_stock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatPrice(component.product.price * component.quantity)}
                          </div>
                          {component.quantity > 1 && (
                            <div className="text-sm text-gray-600">
                              {formatPrice(component.product.price)} each
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Want to build your own PC configuration?
          </p>
          <Link
            href="/pc-builder"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Start Building
          </Link>
        </div>
      </div>
    </div>
  );
}