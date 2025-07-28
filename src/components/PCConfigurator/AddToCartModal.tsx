import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Product } from '@/lib/supabase/types/types';
import { useCart } from '@/contexts/CartContext';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedComponents: [string, string | string[]][];
  products: Record<string, Product>;
  getCategoryNameBySlug: (slug: string) => string;
  totalPrice: number;
}

const AddToCartModal: React.FC<AddToCartModalProps> = ({
  isOpen,
  onClose,
  selectedComponents,
  products,
  getCategoryNameBySlug,
  totalPrice,
}) => {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [addedItems, setAddedItems] = useState<string[]>([]);
  const [failedItems, setFailedItems] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    setAddedItems([]);
    setFailedItems([]);

    const added: string[] = [];
    const failed: string[] = [];

    try {
      // Add each component to the cart
      for (const [, componentId] of selectedComponents) {
        if (typeof componentId === 'string') {
          // Single component
          const product = products[componentId];
          if (product) {
            const { error } = await addItem(componentId, 1);
            if (error) {
              failed.push(product.title);
            } else {
              added.push(product.title);
            }
          }
        } else if (Array.isArray(componentId)) {
          // Multiple components (e.g., RAM sticks, storage drives)
          for (const id of componentId) {
            const product = products[id];
            if (product) {
              const { error } = await addItem(id, 1);
              if (error) {
                failed.push(product.title);
              } else {
                added.push(product.title);
              }
            }
          }
        }
      }

      setAddedItems(added);
      setFailedItems(failed);
      setIsComplete(true);
    } catch (error) {
      console.error('Error adding configuration to cart:', error);
      setFailedItems(['An unexpected error occurred']);
      setIsComplete(true);
    } finally {
      setIsAdding(false);
    }
  };

  const handleClose = () => {
    setIsAdding(false);
    setAddedItems([]);
    setFailedItems([]);
    setIsComplete(false);
    onClose();
  };

  const renderComponentList = () => (
    <div className="space-y-3 mb-6">
      {selectedComponents.map(([categorySlug, componentId]) => {
        if (typeof componentId === 'string') {
          const product = products[componentId];
          if (!product) return null;

          return (
            <div key={categorySlug} className="flex justify-between items-center py-2 border-b border-gray-100">
              <div>
                <div className="font-medium text-gray-900">{getCategoryNameBySlug(categorySlug)}</div>
                <div className="text-sm text-gray-600">{product.title}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">${product.price.toFixed(2)}</div>
                {!product.in_stock && <div className="text-xs text-red-600">Out of stock</div>}
              </div>
            </div>
          );
        }

        if (Array.isArray(componentId)) {
          const componentProducts = componentId.map(id => products[id]).filter(Boolean);
          if (componentProducts.length === 0) return null;

          const totalCategoryPrice = componentProducts.reduce((sum, product) => sum + product.price, 0);

          return (
            <div key={categorySlug} className="py-2 border-b border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium text-gray-900">
                  {getCategoryNameBySlug(categorySlug)} ({componentProducts.length})
                </div>
                <div className="font-medium">${totalCategoryPrice.toFixed(2)}</div>
              </div>
              <div className="space-y-1">
                {componentProducts.map((product, index) => (
                  <div key={product.id} className="flex justify-between items-center text-sm">
                    <div className="text-gray-600">{index + 1}. {product.title}</div>
                    <div className="text-gray-700">${product.price.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );

  const renderResults = () => (
    <div className="space-y-4">
      {addedItems.length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h4 className="font-medium text-green-800">Successfully Added ({addedItems.length})</h4>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            {addedItems.map((item, index) => (
              <div key={index}>• {item}</div>
            ))}
          </div>
        </div>
      )}

      {failedItems.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h4 className="font-medium text-red-800">Failed to Add ({failedItems.length})</h4>
          </div>
          <div className="text-sm text-red-700 space-y-1">
            {failedItems.map((item, index) => (
              <div key={index}>• {item}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Configuration to Cart"
      size="lg"
    >
      {!isComplete ? (
        <>
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Add all components from your PC configuration to the cart?
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Configuration Price:</span>
                <span className="text-xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedComponents.length} components
              </div>
            </div>
          </div>

          {renderComponentList()}

          <div className="flex space-x-3">
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Adding to Cart...
                </>
              ) : (
                'Add All to Cart'
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={isAdding}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {renderResults()}
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};

export default AddToCartModal;