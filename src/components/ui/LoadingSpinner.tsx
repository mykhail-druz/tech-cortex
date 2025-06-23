import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="flex flex-col justify-center items-center h-screen">
      <div className="relative">
        <div className="w-10 h-10 border-4 border-gray-200 rounded-full"></div>
        <div className="absolute top-0 left-0 w-10 h-10 border-4 border-primary rounded-full animate-spin border-t-transparent"></div>
      </div>
      {message && (
        <span className="mt-4 text-gray-600 font-medium text-sm">{message}</span>
      )}
    </div>
  );
};

export default LoadingSpinner;