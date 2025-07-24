'use client';

import React from 'react';
import { ValidationResult } from '@/lib/supabase/types/specifications';

interface CompatibilityPanelProps {
  validationResult: ValidationResult;
}

export default function CompatibilityPanel({ validationResult }: CompatibilityPanelProps) {
  const { issues, warnings, powerConsumption, actualPowerConsumption, recommendedPsuPower } =
    validationResult;

  return (
    <div className="bg-white rounded-lg shadow-md border">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Compatibility Check</h3>
      </div>

      <div className="p-4">
        {/* Overall status */}
        <div
          className={`p-3 rounded-lg mb-4 ${
            issues.length === 0
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <div className={`font-medium ${issues.length === 0 ? 'text-green-800' : 'text-red-800'}`}>
            {issues.length === 0
              ? '✅ Configuration is compatible'
              : '❌ Compatibility issues detected'}
          </div>
        </div>

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

        {/* Power consumption information */}
        {(actualPowerConsumption || recommendedPsuPower || powerConsumption) && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Power Analysis</h4>
            <div className="space-y-2">
              {actualPowerConsumption && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">Actual Power Consumption:</span>
                  <span className="font-bold text-orange-600 text-lg">
                    {actualPowerConsumption}W
                  </span>
                </div>
              )}
              {recommendedPsuPower && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">Recommended PSU Power:</span>
                  <span className="font-bold text-blue-800 text-lg">{recommendedPsuPower}W</span>
                </div>
              )}
              {!recommendedPsuPower && powerConsumption && (
                <div className="flex justify-between items-center">
                  <span className="text-blue-600">Recommended PSU Power:</span>
                  <span className="font-bold text-blue-800 text-lg">{powerConsumption}W</span>
                </div>
              )}
              <div className="text-xs text-blue-600 mt-2">
                ℹ️ This recommendation includes safety margin and efficiency considerations
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
