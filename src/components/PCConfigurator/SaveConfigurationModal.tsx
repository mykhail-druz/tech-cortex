import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Product } from '@/lib/supabase/types/types';
import { EnhancedPCConfiguration } from '@/lib/supabase/types/specifications';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { saveConfiguration, generateConfigurationName } from '@/lib/supabase/services/configurationService';

interface SaveConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  configuration: EnhancedPCConfiguration;
  selectedComponents: [string, string | string[]][];
  products: Record<string, Product>;
  totalPrice: number;
}

const SaveConfigurationModal: React.FC<SaveConfigurationModalProps> = ({
  isOpen,
  onClose,
  configuration,
  selectedComponents,
  products,
  totalPrice,
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const [configName, setConfigName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [savedConfigId, setSavedConfigId] = useState<string | null>(null);

  // Generate default name when modal opens
  useEffect(() => {
    if (isOpen && !configName) {
      const defaultName = generateConfigurationName(configuration.components, products);
      setConfigName(defaultName);
      setDescription(`PC configuration with ${selectedComponents.length} components`);
    }
  }, [isOpen, configuration.components, products, selectedComponents.length, configName]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setConfigName('');
      setDescription('');
      setIsPublic(false);
      setIsSaving(false);
      setError(null);
      setIsComplete(false);
      setSavedConfigId(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    // Check if user is logged in
    if (!user) {
      setError('Please log in to save configurations');
      return;
    }

    // Validate form
    if (!configName.trim()) {
      setError('Configuration name is required');
      return;
    }

    if (selectedComponents.length === 0) {
      setError('Please select components before saving the configuration');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await saveConfiguration({
        name: configName.trim(),
        description: description.trim() || undefined,
        components: configuration.components,
        total_price: totalPrice,
        power_consumption: configuration.powerConsumption,
        recommended_psu_power: configuration.recommendedPsuPower,
        compatibility_status: configuration.compatibilityStatus,
        is_public: isPublic,
      });

      if (result.success && result.data) {
        setSavedConfigId(result.data.id);
        setIsComplete(true);
      } else {
        setError(result.error || 'Failed to save configuration');
      }
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError('An unexpected error occurred while saving the configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewConfigurations = () => {
    router.push('/account/configurations');
    onClose();
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  const renderForm = () => (
    <>
      <div className="space-y-6">
        {/* Configuration Name */}
        <div>
          <label htmlFor="configName" className="block text-sm font-medium text-gray-700 mb-2">
            Configuration Name *
          </label>
          <input
            id="configName"
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Enter configuration name"
            maxLength={255}
            disabled={isSaving}
          />
          <div className="text-xs text-gray-500 mt-1">
            {configName.length}/255 characters
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Describe your PC configuration..."
            maxLength={1000}
            disabled={isSaving}
          />
          <div className="text-xs text-gray-500 mt-1">
            {description.length}/1000 characters
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Configuration Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Components:</span>
              <span className="ml-2 font-medium">{selectedComponents.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Price:</span>
              <span className="ml-2 font-medium text-primary">${totalPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Compatibility:</span>
              <span className={`ml-2 font-medium ${
                configuration.compatibilityStatus === 'valid' ? 'text-green-600' :
                configuration.compatibilityStatus === 'error' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {configuration.compatibilityStatus === 'valid' && '✅ Compatible'}
                {configuration.compatibilityStatus === 'error' && '❌ Has Errors'}
                {configuration.compatibilityStatus === 'warning' && '⚠️ Has Warnings'}
              </span>
            </div>
            {configuration.recommendedPsuPower && configuration.recommendedPsuPower > 0 && (
              <div>
                <span className="text-gray-600">Recommended PSU:</span>
                <span className="ml-2 font-medium">{configuration.recommendedPsuPower}W</span>
              </div>
            )}
          </div>
        </div>

        {/* Public Configuration Toggle */}
        <div className="flex items-center">
          <input
            id="isPublic"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            disabled={isSaving}
          />
          <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
            Make this configuration public (others can view it)
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 mt-6">
        <button
          onClick={handleSave}
          disabled={isSaving || !configName.trim()}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving Configuration...
            </>
          ) : (
            'Save Configuration'
          )}
        </button>
        <button
          onClick={handleClose}
          disabled={isSaving}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </>
  );

  const renderSuccess = () => (
    <>
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuration Saved Successfully!</h3>
        <p className="text-gray-600 mb-6">
          Your PC configuration &quot;{configName}&quot; has been saved to your account.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Name:</strong> {configName}</div>
            {description && <div><strong>Description:</strong> {description}</div>}
            <div><strong>Components:</strong> {selectedComponents.length}</div>
            <div><strong>Total Price:</strong> ${totalPrice.toFixed(2)}</div>
            <div><strong>Visibility:</strong> {isPublic ? 'Public' : 'Private'}</div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleViewConfigurations}
          className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          View My Configurations
        </button>
        <button
          onClick={handleClose}
          className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isComplete ? "Configuration Saved" : "Save PC Configuration"}
      size="lg"
      showCloseButton={!isSaving}
    >
      {isComplete ? renderSuccess() : renderForm()}
    </Modal>
  );
};

export default SaveConfigurationModal;