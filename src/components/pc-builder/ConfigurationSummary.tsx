import React from 'react';
import { ConfigurationSummaryData } from '@/types/pc-builder';

interface ConfigurationSummaryProps {
  data: ConfigurationSummaryData;
  onRemoveComponent: (categorySlug: string) => void;
  onSaveConfiguration?: () => void;
  onClearConfiguration?: () => void;
}

export const ConfigurationSummary: React.FC<ConfigurationSummaryProps> = ({
  data,
  onRemoveComponent,
  onSaveConfiguration,
  onClearConfiguration,
}) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: 'valid' | 'warning' | 'error') => {
    switch (status) {
      case 'valid':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: 'valid' | 'warning' | 'error') => {
    switch (status) {
      case 'valid':
        return 'Compatible';
      case 'warning':
        return 'Has Warnings';
      case 'error':
        return 'Has Errors';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Configuration</h2>
        <p className="text-sm text-gray-600 mt-1">Selected components: {data.totalComponents}</p>
      </div>

      {/* Configuration Status */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Compatibility:</span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(data.compatibilityStatus)}`}
          >
            {getStatusText(data.compatibilityStatus)}
          </span>
        </div>

        {/* Missing Required Categories */}
        {data.missingCategories.length > 0 && (
          <div className="mb-3">
            <p className="text-sm font-medium text-red-600 mb-2">Required components:</p>
            <div className="space-y-1">
              {data.missingCategories.map(category => (
                <div key={category} className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                  {category}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Components */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Selected Components</h3>

        {data.selectedComponents.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-gray-400 mb-2">
              <svg
                className="w-8 h-8 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No components selected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.selectedComponents.map(component => (
              <div
                key={component.categorySlug}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {component.product.title}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{component.categorySlug}</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatPrice(component.product.price)}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveComponent(component.categorySlug)}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                  title="Remove component"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Price */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">Total:</span>
          <span className="text-xl font-bold text-blue-600">{formatPrice(data.totalPrice)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        {onSaveConfiguration && (
          <button
            onClick={onSaveConfiguration}
            disabled={data.selectedComponents.length === 0}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            Save Configuration
          </button>
        )}

        {onClearConfiguration && data.selectedComponents.length > 0 && (
          <button
            onClick={onClearConfiguration}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );
};
