import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Sidebar from '@/components/layout/Sidebar';
import MainContent from '@/components/layout/MainContent';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { StripeProvider } from '@/contexts/StripeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

export const metadata: Metadata = {
    title: 'TechCortex - Premium Computer Hardware',
    description: 'High-quality computers and components for the US market',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body className="min-h-screen flex flex-col">
            <AuthProvider>
                <CartProvider>
                    <StripeProvider>
                        <ToastProvider>
                            <SidebarProvider>
                                <Header />
                                <div className="flex flex-grow">
                                    <Sidebar />
                                    <MainContent>
                                        {children}
                                    </MainContent>
                                </div>
                                <Footer />
                            </SidebarProvider>
                        </ToastProvider>
                    </StripeProvider>
                </CartProvider>
            </AuthProvider>
        </body>
        </html>
    );
}
