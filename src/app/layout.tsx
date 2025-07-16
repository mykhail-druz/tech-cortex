import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MainContent from '@/components/layout/MainContent';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { CompareProvider } from '@/contexts/CompareContext';
import { StripeProvider } from '@/contexts/StripeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { OrganizationStructuredData, WebsiteStructuredData } from '@/components/seo/StructuredData';

export const metadata: Metadata = {
  title: 'TechCortex - Premium Computer Hardware',
  description:
    'High-quality computers and components for the US market. Shop for the latest CPUs, GPUs, motherboards, and more.',
  metadataBase: new URL('https://tech-cortex.com'),
  keywords:
    'computer hardware, tech, CPU, GPU, motherboard, RAM, storage, PC components, gaming hardware',
  authors: [{ name: 'TechCortex Team' }],
  creator: 'TechCortex',
  publisher: 'TechCortex',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tech-cortex.com',
    title: 'TechCortex - Premium Computer Hardware',
    description:
      'High-quality computers and components for the US market. Shop for the latest CPUs, GPUs, motherboards, and more.',
    siteName: 'TechCortex',
    images: [
      {
        url: 'https://tech-cortex.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TechCortex - Premium Computer Hardware',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechCortex - Premium Computer Hardware',
    description:
      'High-quality computers and components for the US market. Shop for the latest CPUs, GPUs, motherboards, and more.',
    images: ['https://tech-cortex.com/twitter-image.jpg'],
    creator: '@techcortex',
  },
  alternates: {
    canonical: 'https://tech-cortex.com',
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US">
      <body className="min-h-screen flex flex-col">
        {/* Structured Data for SEO */}
        <OrganizationStructuredData
          name="TechCortex"
          url="https://tech-cortex.com"
          logo="https://tech-cortex.com/header-logo.svg"
        />
        <WebsiteStructuredData
          name="TechCortex - Premium Computer Hardware"
          url="https://tech-cortex.com"
        />

        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <WishlistProvider>
                <CompareProvider>
                  <StripeProvider>
                    <SidebarProvider>
                      <Header />
                      <div className="flex flex-grow">
                        <MainContent>{children}</MainContent>
                      </div>
                      <Footer />
                    </SidebarProvider>
                  </StripeProvider>
                </CompareProvider>
              </WishlistProvider>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
