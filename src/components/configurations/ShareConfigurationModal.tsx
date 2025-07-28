import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { PCConfigurationSummary } from '@/lib/supabase/types/pc-configurations';

interface ShareConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  configuration: PCConfigurationSummary;
}

const ShareConfigurationModal: React.FC<ShareConfigurationModalProps> = ({
  isOpen,
  onClose,
  configuration,
}) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Generate share URL when modal opens
  useEffect(() => {
    if (isOpen && configuration) {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const url = `${baseUrl}/configurations/${configuration.id}`;
      setShareUrl(url);
    }
  }, [isOpen, configuration]);

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // Reset copied state after 3 seconds
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Configuration"
      size="lg"
    >
      <div className="space-y-6">
        {/* Configuration Preview */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">{configuration.name}</h3>
          {configuration.description && (
            <p className="text-gray-600 text-sm mb-3">{configuration.description}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Components:</span>
              <span className="ml-2 font-medium">{configuration.component_count}</span>
            </div>
            {configuration.total_price && (
              <div>
                <span className="text-gray-500">Total Price:</span>
                <span className="ml-2 font-medium text-primary">
                  {formatPrice(configuration.total_price)}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Compatibility:</span>
              <span className={`ml-2 font-medium ${
                configuration.compatibility_status === 'valid' ? 'text-green-600' :
                configuration.compatibility_status === 'error' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {configuration.compatibility_status === 'valid' && '✅ Compatible'}
                {configuration.compatibility_status === 'error' && '❌ Has Errors'}
                {configuration.compatibility_status === 'warning' && '⚠️ Has Warnings'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Visibility:</span>
              <span className="ml-2 font-medium text-blue-600">
                {configuration.is_public ? '🌐 Public' : '🔒 Private'}
              </span>
            </div>
          </div>
        </div>

        {/* Share URL Section */}
        {configuration.is_public ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share this configuration with others:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm"
                />
                <button
                  onClick={handleCopyToClipboard}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    copied
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What others can do with this link:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• View your complete PC configuration</li>
                <li>• See all components, prices, and compatibility status</li>
                <li>• Load the configuration into their own PC Builder</li>
                <li>• Add all components to their cart for purchase</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleOpenInNewTab}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Preview Shared Page
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Private Configuration Message */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h4 className="font-medium text-yellow-800">Configuration is Private</h4>
              </div>
              <p className="text-sm text-yellow-700 mb-4">
                This configuration is currently private and cannot be shared. To share it with others, you need to make it public first.
              </p>
              <div className="text-sm text-yellow-700">
                <strong>To make it public:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Edit your configuration</li>
                  <li>Check the &quot;Make this configuration public&quot; option</li>
                  <li>Save your changes</li>
                  <li>Return here to get the shareable link</li>
                </ol>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ShareConfigurationModal;