'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  PCConfigurationSummary,
  COMPATIBILITY_STATUS_LABELS,
  COMPATIBILITY_STATUS_COLORS,
} from '@/lib/supabase/types/pc-configurations';
import { getUserConfigurations, deleteConfiguration } from '@/lib/supabase/services/configurationService';
import ShareConfigurationModal from '@/components/configurations/ShareConfigurationModal';

export default function ConfigurationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [configurations, setConfigurations] = useState<PCConfigurationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [configToShare, setConfigToShare] = useState<PCConfigurationSummary | null>(null);
  const router = useRouter();
  const toast = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/account/configurations');
    }
  }, [user, authLoading, router]);

  // Fetch configurations when user is available
  useEffect(() => {
    const fetchConfigurations = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);

      try {
        const result = await getUserConfigurations();

        if (!result.success) {
          setError(result.error || 'Failed to load configurations');
          return;
        }

        setConfigurations(result.data || []);
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        console.error('Error fetching configurations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchConfigurations();
    }
  }, [user]);

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
      month: 'short',
      day: 'numeric',
    });
  };

  // Delete configuration
  const handleDeleteConfiguration = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration? This action cannot be undone.')) {
      return;
    }

    setDeletingId(configId);

    try {
      const result = await deleteConfiguration(configId);

      if (!result.success) {
        toast.error(result.error || 'Failed to delete configuration');
        return;
      }

      // Remove from local state
      setConfigurations(configurations.filter(config => config.id !== configId));
      toast.success('Configuration deleted successfully');
    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error('Error deleting configuration:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Share configuration
  const handleShareConfiguration = (config: PCConfigurationSummary) => {
    setConfigToShare(config);
    setShareModalOpen(true);
  };

  // Load configuration in PC Builder
  const handleLoadInBuilder = (config: PCConfigurationSummary) => {
    // Store configuration ID in localStorage to be picked up by PC Builder
    localStorage.setItem('loadConfigurationId', config.id);
    router.push('/pc-builder');
    toast.success('Configuration will be loaded in PC Builder');
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

  if (authLoading || (isLoading && !error)) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">My PC Configurations</h1>
          <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading configurations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/account" className="text-primary hover:text-primary/80 text-sm font-medium">
              Back to Account
            </Link>
            <h1 className="text-2xl font-bold mt-2">My PC Configurations</h1>
            <p className="text-gray-600 mt-1">
              Manage your saved PC configurations and load them back into the builder
            </p>
          </div>
          <Link
            href="/pc-builder"
            className="bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Create New Configuration
          </Link>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Configurations list */}
        {configurations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No configurations yet</h3>
            <p className="text-gray-600 mb-6">
              Start building your first PC configuration and save it for later.
            </p>
            <Link
              href="/pc-builder"
              className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Build Your First PC
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {configurations.map((config) => (
              <div key={config.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCompatibilityStatusStyle(config.compatibility_status)}`}
                      >
                        {COMPATIBILITY_STATUS_LABELS[config.compatibility_status]}
                      </span>
                      {config.is_public && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Public
                        </span>
                      )}
                    </div>
                    
                    {config.description && (
                      <p className="text-gray-600 mb-3">{config.description}</p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Components:</span>
                        <span className="ml-2 font-medium">{config.component_count}</span>
                      </div>
                      {config.total_price && (
                        <div>
                          <span className="text-gray-500">Total Price:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {formatPrice(config.total_price)}
                          </span>
                        </div>
                      )}
                      {config.power_consumption && (
                        <div>
                          <span className="text-gray-500">Power:</span>
                          <span className="ml-2 font-medium">{config.power_consumption}W</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Created:</span>
                        <span className="ml-2 font-medium">{formatDate(config.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-6">
                    <button
                      onClick={() => handleLoadInBuilder(config)}
                      className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Load in Builder
                    </button>
                    <button
                      onClick={() => handleShareConfiguration(config)}
                      className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
                      title={config.is_public ? 'Share this configuration' : 'Configuration must be public to share'}
                    >
                      Share
                    </button>
                    <button
                      onClick={() => handleDeleteConfiguration(config.id)}
                      disabled={deletingId === config.id}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      {deletingId === config.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Share Configuration Modal */}
        {configToShare && (
          <ShareConfigurationModal
            isOpen={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false);
              setConfigToShare(null);
            }}
            configuration={configToShare}
          />
        )}
      </div>
    </div>
  );
}