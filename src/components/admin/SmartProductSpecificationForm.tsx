'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { SmartSpecificationSystem } from '@/lib/specifications/SmartSpecificationSystem';
import { StandardSpecification } from '@/lib/supabase/types/semanticTags';
import { SpecificationDataType } from '@/lib/supabase/types/specifications';

interface ProductSpecificationValue {
  specificationId: string;
  name: string;
  value: string;
  isValid?: boolean;
  errors?: string[];
  warnings?: string[];
}

interface SmartProductSpecificationFormProps {
  categoryId: string;
  productId?: string;
  initialSpecifications?: ProductSpecificationValue[];
  onSpecificationsChange?: (specifications: ProductSpecificationValue[]) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export default function SmartProductSpecificationForm({
  categoryId,
  productId: _productId, // eslint-disable-line @typescript-eslint/no-unused-vars -- Reserved for future use
  initialSpecifications = [],
  onSpecificationsChange,
  onValidationChange,
}: SmartProductSpecificationFormProps) {
  const toast = useToast();
  const [smartSystem] = useState(() => SmartSpecificationSystem.getInstance());

  // State
  const [loading, setLoading] = useState(true);
  const [specifications, setSpecifications] = useState<StandardSpecification[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [validationResults, setValidationResults] = useState<
    Record<
      string,
      {
        isValid: boolean;
        errors: string[];
        warnings: string[];
      }
    >
  >({});

  // Initialize
  useEffect(() => {
    initializeForm();
  }, [categoryId]);

  // Initialize values from props
  useEffect(() => {
    if (initialSpecifications.length > 0) {
      const initialValues: Record<string, string> = {};
      initialSpecifications.forEach(spec => {
        initialValues[spec.name] = spec.value;
      });
      setValues(initialValues);
    }
  }, [initialSpecifications]);

  // Validate specifications when values change
  useEffect(() => {
    validateAllSpecifications();
  }, [values, specifications]);

  const initializeForm = async () => {
    try {
      setLoading(true);

      // Initialize smart system
      await smartSystem.initialize();

      // Get specifications for this category
      const specs = await smartSystem.getSpecificationsForCategory(categoryId);
      setSpecifications(specs.all);

      // Get category tags (for context)
      // Note: In a real implementation, you'd fetch this from the database
      // For now, we'll leave it empty as it's not critical for basic functionality
      // setCategoryTags([]) - removed as this function is not defined
    } catch (error) {
      console.error('Failed to initialize SmartProductSpecificationForm:', error);
      toast.error('Failed to load product specifications');
    } finally {
      setLoading(false);
    }
  };

  const validateAllSpecifications = async () => {
    const results: Record<string, { isValid: boolean; errors: string[]; warnings: string[] }> = {};
    let overallValid = true;

    for (const spec of specifications) {
      const value = values[spec.name];

      if (spec.isRequired && (!value || value.trim() === '')) {
        results[spec.name] = {
          isValid: false,
          errors: [`${spec.displayName} is required`],
          warnings: [],
        };
        overallValid = false;
      } else if (value && value.trim() !== '') {
        try {
          // Убираем проверку на validationRule - позволяем SmartSpecificationSystem обработать это
          const validationResult = smartSystem.validateSpecification(value, spec, values);
          results[spec.name] = {
            isValid: validationResult.isValid,
            errors: validationResult.errors,
            warnings: validationResult.warnings,
          };

          if (!validationResult.isValid) {
            overallValid = false;
          }
        } catch (error) {
          console.error('Validation error for spec:', spec.name, 'value:', value, 'error:', error);
          results[spec.name] = {
            isValid: false,
            errors: [
              `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ],
            warnings: [],
          };
          overallValid = false;
        }
      } else {
        results[spec.name] = {
          isValid: true,
          errors: [],
          warnings: [],
        };
      }
    }

    setValidationResults(results);

    // Notify parent of validation status
    if (onValidationChange) {
      onValidationChange(overallValid);
    }

    // Notify parent of specification changes
    if (onSpecificationsChange) {
      const specValues: ProductSpecificationValue[] = specifications.map(spec => ({
        specificationId: spec.name,
        name: spec.name,
        value: values[spec.name] || '',
        isValid: results[spec.name]?.isValid ?? true,
        errors: results[spec.name]?.errors ?? [],
        warnings: results[spec.name]?.warnings ?? [],
      }));
      onSpecificationsChange(specValues);
    }
  };

  const handleValueChange = (specName: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [specName]: value,
    }));
  };

  const renderSpecificationInput = (spec: StandardSpecification) => {
    const value = values[spec.name] || '';
    const validation = validationResults[spec.name];
    const hasErrors = validation && !validation.isValid;
    const hasWarnings = validation && validation.warnings.length > 0;

    const inputClasses = `
      w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary
      ${hasErrors ? 'border-red-300 bg-red-50' : hasWarnings ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'}
    `;

    switch (spec.dataType) {
      case SpecificationDataType.BOOLEAN:
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={spec.name}
              checked={value === 'true'}
              onChange={e => handleValueChange(spec.name, e.target.checked ? 'true' : 'false')}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor={spec.name} className="text-sm text-gray-700">
              Yes
            </label>
          </div>
        );

      case SpecificationDataType.ENUM:
        return (
          <select
            value={value}
            onChange={e => handleValueChange(spec.name, e.target.value)}
            className={inputClasses}
          >
            <option value="">Select {spec.displayName}</option>
            {spec.validationRule?.enumValues?.map(enumValue => (
              <option key={enumValue} value={enumValue}>
                {enumValue}
              </option>
            ))}
          </select>
        );

      case SpecificationDataType.NUMBER:
      case SpecificationDataType.FREQUENCY:
      case SpecificationDataType.MEMORY_SIZE:
      case SpecificationDataType.POWER_CONSUMPTION:
        return (
          <div className="flex">
            <input
              type="number"
              value={value}
              onChange={e => handleValueChange(spec.name, e.target.value)}
              className={`${inputClasses} ${spec.validationRule?.unit ? 'rounded-r-none' : ''}`}
              placeholder={`Enter ${spec.displayName.toLowerCase()}`}
              min={spec.validationRule?.minValue}
              max={spec.validationRule?.maxValue}
            />
            {spec.validationRule?.unit && (
              <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-lg">
                {spec.validationRule?.unit}
              </span>
            )}
          </div>
        );

      case SpecificationDataType.SOCKET:
      case SpecificationDataType.MEMORY_TYPE:
      case SpecificationDataType.CHIPSET:
        // These are handled by the existing enum logic above
        return (
          <input
            type="text"
            value={value}
            onChange={e => handleValueChange(spec.name, e.target.value)}
            className={inputClasses}
            placeholder={`Enter ${spec.displayName.toLowerCase()}`}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={e => handleValueChange(spec.name, e.target.value)}
            className={inputClasses}
            placeholder={`Enter ${spec.displayName.toLowerCase()}`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading specifications...</span>
      </div>
    );
  }

  if (specifications.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No specifications configured for this category.</p>
        <p className="text-sm text-gray-500 mt-1">
          Configure specifications in the category settings to enable smart product forms.
        </p>
      </div>
    );
  }

  // Group specifications by type
  const requiredSpecs = specifications.filter(spec => spec.isRequired);
  const optionalSpecs = specifications.filter(spec => !spec.isRequired);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-1">Product Specifications</h3>
        <p className="text-blue-700 text-sm">
          Fill in the product specifications. Required fields are marked with an asterisk (*).
        </p>
      </div>

      {/* Required Specifications */}
      {requiredSpecs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-red-500 mr-1">*</span>
            Required Specifications
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredSpecs.map(spec => {
              const validation = validationResults[spec.name];
              return (
                <div key={spec.name} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {spec.displayName}
                    <span className="text-red-500 ml-1">*</span>
                    {spec.description && (
                      <span className="text-gray-500 font-normal ml-1">- {spec.description}</span>
                    )}
                  </label>

                  {renderSpecificationInput(spec)}

                  {/* Validation Messages */}
                  {validation && validation.errors.length > 0 && (
                    <div className="text-sm text-red-600">
                      {validation.errors.map((error, index) => (
                        <div key={index} className="flex items-center">
                          <span className="mr-1">⚠️</span>
                          {error}
                        </div>
                      ))}
                    </div>
                  )}

                  {validation && validation.warnings.length > 0 && (
                    <div className="text-sm text-yellow-600">
                      {validation.warnings.map((warning, index) => (
                        <div key={index} className="flex items-center">
                          <span className="mr-1">⚠️</span>
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Compatibility Key Indicator */}
                  {spec.isCompatibilityKey && (
                    <div className="text-xs text-blue-600 flex items-center">
                      <span className="mr-1">🔗</span>
                      Used for compatibility checking
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optional Specifications */}
      {optionalSpecs.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Optional Specifications</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalSpecs.map(spec => {
              const validation = validationResults[spec.name];
              return (
                <div key={spec.name} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {spec.displayName}
                    {spec.description && (
                      <span className="text-gray-500 font-normal ml-1">- {spec.description}</span>
                    )}
                  </label>

                  {renderSpecificationInput(spec)}

                  {/* Validation Messages */}
                  {validation && validation.errors.length > 0 && (
                    <div className="text-sm text-red-600">
                      {validation.errors.map((error, index) => (
                        <div key={index} className="flex items-center">
                          <span className="mr-1">⚠️</span>
                          {error}
                        </div>
                      ))}
                    </div>
                  )}

                  {validation && validation.warnings.length > 0 && (
                    <div className="text-sm text-yellow-600">
                      {validation.warnings.map((warning, index) => (
                        <div key={index} className="flex items-center">
                          <span className="mr-1">⚠️</span>
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Compatibility Key Indicator */}
                  {spec.isCompatibilityKey && (
                    <div className="text-xs text-blue-600 flex items-center">
                      <span className="mr-1">🔗</span>
                      Used for compatibility checking
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation Summary */}
      {Object.keys(validationResults).length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Validation Summary</h4>

          {(() => {
            const totalErrors = Object.values(validationResults).reduce(
              (sum, result) => sum + result.errors.length,
              0
            );
            const totalWarnings = Object.values(validationResults).reduce(
              (sum, result) => sum + result.warnings.length,
              0
            );
            const validSpecs = Object.values(validationResults).filter(
              result => result.isValid
            ).length;
            const totalSpecs = Object.keys(validationResults).length;

            return (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center text-green-600">
                  <span className="mr-1">✅</span>
                  {validSpecs}/{totalSpecs} specifications valid
                </div>

                {totalErrors > 0 && (
                  <div className="flex items-center text-red-600">
                    <span className="mr-1">❌</span>
                    {totalErrors} error{totalErrors !== 1 ? 's' : ''}
                  </div>
                )}

                {totalWarnings > 0 && (
                  <div className="flex items-center text-yellow-600">
                    <span className="mr-1">⚠️</span>
                    {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
