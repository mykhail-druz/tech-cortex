import React from 'react';

interface SpinnerProps {
  /**
   * Size of the spinner
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Primary color of the spinner (border-t and border-b)
   * @default 'blue-500'
   */
  color?: string;
  
  /**
   * Secondary color of the spinner (border-r and border-l)
   * @default 'transparent'
   */
  secondaryColor?: string;
  
  /**
   * Text to display below the spinner
   */
  text?: string;
  
  /**
   * Whether to center the spinner in its container
   * @default false
   */
  centered?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Spinner component for loading states
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = 'blue-500',
  secondaryColor = 'transparent',
  text,
  centered = false,
  className = '',
}) => {
  // Size mappings
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  };
  
  // Container classes
  const containerClasses = centered ? 'flex items-center justify-center' : '';
  
  // Spinner classes
  const spinnerClasses = `
    ${sizeClasses[size]}
    border-t-${color} 
    border-b-${color} 
    border-r-${secondaryColor} 
    border-l-${secondaryColor} 
    rounded-full 
    animate-spin
    ${className}
  `;
  
  return (
    <div className={containerClasses}>
      <div className="text-center">
        <div className={spinnerClasses}></div>
        {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
      </div>
    </div>
  );
};

/**
 * Button spinner component for loading states in buttons
 */
export const ButtonSpinner: React.FC<Omit<SpinnerProps, 'text' | 'centered'> & { buttonText?: string }> = ({
  size = 'small',
  color = 'white',
  secondaryColor = 'transparent',
  buttonText = 'Loading...',
  className = '',
}) => {
  // Size mappings
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-5 h-5 border-2',
    large: 'w-6 h-6 border-3',
  };
  
  // Spinner classes
  const spinnerClasses = `
    ${sizeClasses[size]}
    border-t-${color} 
    border-r-${secondaryColor} 
    border-b-${secondaryColor} 
    border-l-${secondaryColor} 
    rounded-full 
    animate-spin
    mr-2
    ${className}
  `;
  
  return (
    <>
      <div className={spinnerClasses}></div>
      {buttonText}
    </>
  );
};

export default Spinner;