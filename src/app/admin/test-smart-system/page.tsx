'use client';

import React, { useState } from 'react';
import { runSmartSystemTests } from '@/lib/specifications/test-smart-system';

export default function TestSmartSystemPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setHasError(false);

    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];

    console.log = (...args) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      logs.push(`[LOG] ${message}`);
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' ');
      logs.push(`[ERROR] ${message}`);
      originalError(...args);
    };

    try {
      await runSmartSystemTests();
      logs.push('✅ All tests completed successfully!');
    } catch (error) {
      logs.push(`❌ Tests failed: ${error}`);
      setHasError(true);
    } finally {
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      
      setTestResults(logs);
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Smart Tag-Based Specification System Tests
            </h1>
            <p className="mt-2 text-gray-600">
              Test the new semantic tag system to ensure it works correctly and maintains backward compatibility.
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <button
                onClick={runTests}
                disabled={isRunning}
                className={`px-6 py-3 rounded-lg font-medium text-white ${
                  isRunning
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isRunning ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Running Tests...
                  </div>
                ) : (
                  'Run Smart System Tests'
                )}
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
                <div className="mb-2 text-gray-300">Test Results:</div>
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`mb-1 ${
                      result.includes('[ERROR]') || result.includes('❌')
                        ? 'text-red-400'
                        : result.includes('✅')
                        ? 'text-green-400'
                        : result.includes('⚠️')
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            )}

            {!isRunning && testResults.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Ready to test
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Click the button above to run comprehensive tests of the Smart Tag-Based Specification System.
                        This will test:
                      </p>
                      <ul className="mt-2 list-disc list-inside">
                        <li>System initialization</li>
                        <li>Profile detection</li>
                        <li>Semantic tags functionality</li>
                        <li>Specification validation</li>
                        <li>Smart compatibility engine</li>
                        <li>Backward compatibility</li>
                        <li>Performance metrics</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Tests failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Some tests failed. Please check the console output above for details.
                        This might indicate issues with the Smart Tag-Based Specification System setup.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}