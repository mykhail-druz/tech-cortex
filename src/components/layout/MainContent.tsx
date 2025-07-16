'use client';

import { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {

  return (
    <main 
      className="flex-grow px-4 md:px-8 transition-all duration-300 ease-in-out"
    >
      {children}
    </main>
  );
}
