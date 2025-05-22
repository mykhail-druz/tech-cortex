'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';

interface MainContentProps {
  children: ReactNode;
}

export default function MainContent({ children }: MainContentProps) {
  const { isOpen } = useSidebar();
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <main 
      className={`
        flex-grow px-4 md:px-8 
        transition-all duration-300 ease-in-out
        ${!isAdminPage && (isOpen ? 'md:ml-64' : 'md:ml-[25px]')}
      `}
    >
      {children}
    </main>
  );
}
