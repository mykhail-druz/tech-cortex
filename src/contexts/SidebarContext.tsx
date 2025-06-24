'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  isMobile: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage if available, otherwise default to false for all devices
  const [isOpen, setIsOpen] = useState(false); // Initially false by default
  const [isMobile, setIsMobile] = useState(false);

  // Effect to initialize sidebar state based on localStorage and screen size
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Check localStorage for saved preference
      const savedState = localStorage.getItem('sidebarOpen');

      // Check if we're on mobile
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
        return window.innerWidth < 768;
      };

      const isMobileView = checkMobile();

      // Set initial state based on saved preference or screen size
      if (savedState !== null) {
        setIsOpen(savedState === 'true' && !isMobileView);
      } else {
        // Default: closed on both desktop and mobile
        setIsOpen(false);
      }

      // Add resize listener
      const handleResize = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);

        // Auto close on mobile if transitioning from desktop to mobile
        if (mobile && isOpen) {
          setIsOpen(false);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', isOpen.toString());
    }
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const openSidebar = () => {
    setIsOpen(true);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, openSidebar, closeSidebar, isMobile }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
