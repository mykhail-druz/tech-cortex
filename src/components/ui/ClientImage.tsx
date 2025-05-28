'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

type ClientImageProps = ImageProps & {
  fallbackContent?: React.ReactNode;
};

export default function ClientImage({ fallbackContent, ...props }: ClientImageProps) {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  if (error && fallbackContent) {
    return <>{fallbackContent}</>;
  }

  return <Image {...props} onError={handleError} />;
}