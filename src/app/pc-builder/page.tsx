'use client';
import React from 'react';
import PCConfigurator from '@/components/PCConfigurator/PCConfigurator';

export default function PCBuilderPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">PC Builder</h1>
          <p className="text-gray-600">
            Build your custom PC with our compatibility-checked configurator. Select components that
            work together perfectly for your ideal system.
          </p>
        </div>

        <PCConfigurator />

        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Select Components</h3>
              <p className="text-gray-600">
                Choose your CPU, motherboard, memory, and other components from our curated
                selection.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Check Compatibility</h3>
              <p className="text-gray-600">
                Our system automatically checks compatibility between components to ensure they work
                together.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Complete Your Build</h3>
              <p className="text-gray-600">
                Review your configuration, check the total price, and proceed to purchase your
                custom PC.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-2">Compatibility Features</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Socket compatibility between CPUs and motherboards (AM4, AM5, LGA1700, etc.)</li>
              <li>Memory type compatibility (DDR4, DDR5) with motherboards</li>
              <li>Power supply wattage requirements for your components</li>
              <li>Physical size compatibility between cases and components</li>
              <li>Connector compatibility for all components</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
