'use client';

import React from 'react';
import { ValidationResult } from '@/lib/supabase/types/specifications';
import {
  FaRocket,
  FaWrench,
  FaBolt,
  FaCheckCircle,
  FaRegTimesCircle,
  FaLightbulb,
  FaInfoCircle,
} from 'react-icons/fa';

interface CompatibilityPanelProps {
  validationResult: ValidationResult;
  componentCount: number;
  selectedComponents: Record<string, string | string[]>;
  recommendedPsuPower?: number;
}

export default function CompatibilityPanel({
  validationResult,
  componentCount,
  selectedComponents,
  recommendedPsuPower: configRecommendedPsuPower,
}: CompatibilityPanelProps) {
  const {
    issues,
    warnings,
    recommendations,
    recommendedPsuPower: validationRecommendedPsuPower,
  } = validationResult;

  // Use configuration power values as primary source, fallback to validation result
  const displayRecommendedPsuPower = configRecommendedPsuPower || validationRecommendedPsuPower;

  // Helper function to determine validation mode
  const getValidationMode = () => {
    if (componentCount === 0) return 'empty';
    if (componentCount === 1) return 'building';
    if (componentCount < 4) return 'partial';
    return 'full';
  };

  // Helper function to check if we have core components
  const hasCoreComponents = () => {
    // Use the same logic as PCConfigurator.tsx for consistency
    const components = selectedComponents;
    const hasProcessorAndMotherboard = components['cpu'] && components['motherboard'];
    const hasProcessorWithOthers = components['cpu'] && componentCount >= 2;
    const hasMotherboardWithOthers = components['cpu'] && componentCount >= 2;

    return hasProcessorAndMotherboard || hasProcessorWithOthers || hasMotherboardWithOthers;
  };

  // Helper function to get a contextual message
  const getContextualMessage = () => {
    const mode = getValidationMode();
    const coreComponents = hasCoreComponents();

    if (mode === 'empty') {
      return {
        title: (
          <span className="flex items-center gap-1">
            <FaRocket className="w-4 h-4" />
            Start Building Your PC
          </span>
        ),
        message: 'Select components to begin building your configuration',
        type: 'info',
      };
    }

    if (mode === 'building') {
      const selectedCategory = Object.keys(selectedComponents)[0];
      const nextRecommendation = getNextRecommendedComponent(selectedCategory);
      return {
        title: (
          <span className="flex items-center gap-1">
            <FaWrench className="w-4 h-4" />
            Building Your Configuration...
          </span>
        ),
        message: `Great choice! Now add ${nextRecommendation} to continue building`,
        type: 'building',
      };
    }

    if (mode === 'partial' && !coreComponents) {
      return {
        title: (
          <span className="flex items-center gap-1">
            <FaBolt className="w-4 h-4" />
            Add Core Components
          </span>
        ),
        message: 'Add a processor and motherboard to check compatibility',
        type: 'partial',
      };
    }

    return null; // Full validation mode - show normal compatibility results
  };

  // Helper function to suggest next component
  const getNextRecommendedComponent = (selectedCategory: string) => {
    const recommendations: Record<string, string> = {
      cpu: 'a motherboard',
      motherboard: 'a processor',
      ram: 'a processor or motherboard',
      gpu: 'a power supply',
      psu: 'a case',
      case: 'storage',
      storage: 'memory (RAM)',
      cooling: 'a graphics card',
    };

    return recommendations[selectedCategory] || 'more components';
  };

  // Get contextual message for current state
  const contextualMessage = getContextualMessage();

  return (
    <div className="bg-white rounded-lg shadow-md border">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Compatibility Check</h3>
      </div>

      <div className="p-4">
        {/* Show contextual message for incomplete configurations */}
        {contextualMessage && (
          <div
            className={`p-3 rounded-lg mb-4 ${
              contextualMessage.type === 'info'
                ? 'bg-blue-50 border border-blue-200'
                : contextualMessage.type === 'building'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-yellow-50 border border-yellow-200'
            }`}
          >
            <div
              className={`font-medium ${
                contextualMessage.type === 'info'
                  ? 'text-blue-800'
                  : contextualMessage.type === 'building'
                    ? 'text-green-800'
                    : 'text-yellow-800'
              }`}
            >
              {contextualMessage.title}
            </div>
            <div
              className={`text-sm mt-1 ${
                contextualMessage.type === 'info'
                  ? 'text-blue-600'
                  : contextualMessage.type === 'building'
                    ? 'text-green-600'
                    : 'text-yellow-600'
              }`}
            >
              {contextualMessage.message}
            </div>
          </div>
        )}

        {/* Show traditional compatibility results only for full validation */}
        {!contextualMessage && (
          <div
            className={`p-3 rounded-lg mb-4 ${
              issues.length === 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div
              className={`font-medium ${issues.length === 0 ? 'text-green-800' : 'text-red-800'}`}
            >
              {issues.length === 0 ? (
                <span className="flex items-center gap-1">
                  <FaCheckCircle className="w-4 h-4" />
                  Configuration is compatible
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <FaRegTimesCircle className="w-4 h-4" />
                  Compatibility issues detected
                </span>
              )}
            </div>
          </div>
        )}

        {/* Critical errors */}
        {issues.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-red-800 mb-2">Critical Errors:</h4>
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="font-medium text-red-800">{issue.message}</div>
                  {issue.details && (
                    <div className="text-sm text-red-600 mt-1">{issue.details}</div>
                  )}
                  <div className="text-xs text-red-500 mt-1">
                    {issue.component1} ↔ {issue.component2}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Warnings:</h4>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <div className="font-medium text-yellow-800">{warning.message}</div>
                  {warning.details && (
                    <div className="text-sm text-yellow-600 mt-1">{warning.details}</div>
                  )}
                  {warning.component1 && warning.component2 && (
                    <div className="text-xs text-yellow-500 mt-1">
                      {warning.component1} ↔ {warning.component2}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-1">
              <FaLightbulb className="w-4 h-4" />
              Recommendations:
            </h4>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
                  <div className="font-medium text-blue-800">{recommendation.message}</div>
                  {recommendation.details && (
                    <div className="text-sm text-blue-600 mt-1">{recommendation.details}</div>
                  )}
                  {recommendation.component1 && recommendation.component2 && (
                    <div className="text-xs text-blue-500 mt-1">
                      {recommendation.component1} ↔ {recommendation.component2}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Power Information - shown when PSU recommendation is available */}
        {displayRecommendedPsuPower && displayRecommendedPsuPower > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-1">
              <FaBolt className="w-4 h-4" />
              Power Information
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-blue-600">Recommended PSU:</span>
                <span className="font-bold text-blue-800 text-lg">
                  {displayRecommendedPsuPower}W
                </span>
              </div>
              <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                <FaInfoCircle className="w-3 h-3" />
                Based on component specifications and safety margins
              </div>
            </div>
          </div>
        )}
        {/* If no issues */}
        {issues.length === 0 && warnings.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            All components are compatible with each other!
          </div>
        )}
      </div>
    </div>
  );
}
