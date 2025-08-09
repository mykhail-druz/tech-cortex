import React, { useState } from 'react';
import { PriceRangeFilter } from '@/types/filters';

interface PriceRangeFilterComponentProps {
  filter: PriceRangeFilter;
  onChange: (value: { min: number | null; max: number | null }) => void;
}

export const PriceRangeFilterComponent: React.FC<PriceRangeFilterComponentProps> = ({
  filter,
  onChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempMin, setTempMin] = useState<string>(filter.value.min?.toString() || '');
  const [tempMax, setTempMax] = useState<string>(filter.value.max?.toString() || '');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: filter.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getSelectionText = () => {
    if (filter.value.min !== null && filter.value.max !== null) {
      return `${formatPrice(filter.value.min)} - ${formatPrice(filter.value.max)}`;
    } else if (filter.value.min !== null) {
      return `From ${formatPrice(filter.value.min)}`;
    } else if (filter.value.max !== null) {
      return `Up to ${formatPrice(filter.value.max)}`;
    }
    return '';
  };

  const handleOpenModal = () => {
    setTempMin(filter.value.min?.toString() || '');
    setTempMax(filter.value.max?.toString() || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleApply = () => {
    const minValue = tempMin ? parseFloat(tempMin) : null;
    const maxValue = tempMax ? parseFloat(tempMax) : null;

    // Validate values
    if (minValue !== null && maxValue !== null && minValue > maxValue) {
      alert('Minimum price cannot be greater than maximum price');
      return;
    }

    if (minValue !== null && minValue < filter.range.min) {
      alert(`Minimum price cannot be less than ${formatPrice(filter.range.min)}`);
      return;
    }

    if (maxValue !== null && maxValue > filter.range.max) {
      alert(`Maximum price cannot be greater than ${formatPrice(filter.range.max)}`);
      return;
    }

    onChange({ min: minValue, max: maxValue });
    setIsModalOpen(false);
  };

  const handleClear = () => {
    onChange({ min: null, max: null });
    setIsModalOpen(false);
  };

  return (
    <>
      <style jsx>{`
        .slider-min::-webkit-slider-thumb,
        .slider-max::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .slider-min::-webkit-slider-thumb:hover,
        .slider-max::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .slider-min::-moz-range-thumb,
        .slider-max::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .slider-min::-moz-range-thumb:hover,
        .slider-max::-moz-range-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .slider-min::-moz-range-track,
        .slider-max::-moz-range-track {
          background: transparent;
          border: none;
        }
      `}</style>
      <button
        onClick={handleOpenModal}
        aria-label={`${filter.displayName || 'Price'} filter`}
        className={`px-4 py-2 text-sm border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm ${
          filter.isActive
            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 shadow-md'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">{filter.displayName || 'Price'}</span>
          {getSelectionText() && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getSelectionText()}
            </span>
          )}
          <span className="text-gray-400">▼</span>
        </div>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCloseModal}
            />

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold text-gray-900">Set Price Range</h3>
                      <button
                        onClick={handleCloseModal}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Dual Range Slider */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
                      <div className="px-4">
                        <div className="relative mb-4 h-6">
                          {/* Track Background */}
                          <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-200 rounded-lg">
                            {/* Active Range */}
                            <div
                              className="absolute h-full bg-blue-500 rounded-lg"
                              style={{
                                left: `${(((tempMin || filter.range.min) - filter.range.min) / (filter.range.max - filter.range.min)) * 100}%`,
                                width: `${(((tempMax || filter.range.max) - (tempMin || filter.range.min)) / (filter.range.max - filter.range.min)) * 100}%`,
                              }}
                            />
                          </div>

                          {/* Min Range Slider */}
                          <input
                            type="range"
                            min={filter.range.min}
                            max={filter.range.max}
                            value={tempMin || filter.range.min}
                            onChange={e => {
                              const value = e.target.value;
                              const maxVal = tempMax || filter.range.max;
                              if (parseInt(value) <= parseInt(maxVal)) {
                                setTempMin(value);
                              }
                            }}
                            className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer slider-min"
                            style={{
                              zIndex: 1,
                              background: 'transparent',
                            }}
                          />

                          {/* Max Range Slider */}
                          <input
                            type="range"
                            min={filter.range.min}
                            max={filter.range.max}
                            value={tempMax || filter.range.max}
                            onChange={e => {
                              const value = e.target.value;
                              const minVal = tempMin || filter.range.min;
                              if (parseInt(value) >= parseInt(minVal)) {
                                setTempMax(value);
                              }
                            }}
                            className="absolute w-full h-6 bg-transparent appearance-none cursor-pointer slider-max"
                            style={{
                              zIndex: 2,
                              background: 'transparent',
                            }}
                          />
                        </div>

                        {/* Current Range Display - Now Below Slider */}
                        <div className="flex justify-between items-center mb-4 pt-4">
                          <div className="text-sm font-medium text-blue-600">
                            {formatPrice(parseInt(tempMin || filter.range.min.toString()))}
                          </div>
                          <div className="text-xs text-gray-500">to</div>
                          <div className="text-sm font-medium text-blue-600">
                            {formatPrice(parseInt(tempMax || filter.range.max.toString()))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Manual Input Section */}
                    <div className="mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Minimum Price
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              $
                            </span>
                            <input
                              type="number"
                              value={tempMin}
                              onChange={e => setTempMin(e.target.value)}
                              placeholder={filter.range.min.toString()}
                              min={filter.range.min}
                              max={filter.range.max}
                              className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Maximum Price
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              $
                            </span>
                            <input
                              type="number"
                              value={tempMax}
                              onChange={e => setTempMax(e.target.value)}
                              placeholder={filter.range.max.toString()}
                              min={filter.range.min}
                              max={filter.range.max}
                              className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600 text-center">
                          Available range: {formatPrice(filter.range.min)} -{' '}
                          {formatPrice(filter.range.max)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal actions */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    className="px-8 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Apply Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
