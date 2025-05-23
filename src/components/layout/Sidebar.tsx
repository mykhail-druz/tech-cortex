'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCategories } from '@/lib/supabase/db';
import { Category } from '@/lib/supabase/types';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Sidebar() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { isOpen, toggleSidebar, closeSidebar } = useSidebar();
    const pathname = usePathname();

    // Fetch categories on component mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await getCategories();
                if (error) {
                    console.error('Error fetching categories:', error);
                } else {
                    setCategories(data || []);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);


    // Don't render sidebar on admin pages
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div 
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={closeSidebar}
                ></div>
            )}

            {/* Sidebar container */}
            <div className="relative">
                {/* Toggle button - fixed at the bottom for mobile, inside sidebar for desktop */}
                <button
                    onClick={toggleSidebar}
                    className="fixed bottom-4 left-4 z-50 md:hidden bg-primary text-white p-3 rounded-full shadow-lg"
                    aria-label="Toggle sidebar"
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        className="h-6 w-6"
                    >
                        {isOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>

                {/* Sidebar content */}
                <div 
                    className={`
                        fixed top-16 left-0 z-40 
                        h-[calc(100vh-4rem)] overflow-y-auto 
                        bg-white shadow-lg 
                        transition-all duration-300 ease-in-out
                        ${isOpen ? 'translate-x-0 w-64' : 'translate-x-[-90%] w-64'}
                    `}
                >
                    {/* Collapsed sidebar handle */}
                    <div 
                        className={`absolute top-1/2 right-0 transform -translate-y-1/2 
                            bg-primary text-white p-2 rounded-r-md cursor-pointer
                            ${isOpen ? 'hidden' : 'block'}`}
                        onClick={toggleSidebar}
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor" 
                            className="h-6 w-6"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                    {/* Sidebar header */}
                    <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                        <div className="flex items-center justify-between p-4">
                            <h2 className="text-lg font-semibold text-gray-800">Shop By</h2>
                            <button 
                                onClick={toggleSidebar}
                                className="text-primary hover:text-primary/80 p-1 rounded-md hover:bg-gray-100"
                                aria-label="Toggle sidebar"
                                title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Categories section */}
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            Categories
                        </h3>

                        {isLoading ? (
                            <div className="text-gray-400 p-2">Loading...</div>
                        ) : categories.length === 0 ? (
                            <div className="text-gray-400 p-2">No categories found</div>
                        ) : (
                            <ul className="space-y-1">
                                {categories.map((category) => (
                                    <li key={category.id}>
                                        <Link
                                            href={`/products/${category.slug}`}
                                            className="flex items-center py-2 px-3 text-gray-600 hover:bg-gray-100 hover:text-primary rounded-md transition-colors"
                                            onClick={closeSidebar}
                                        >
                                            {category.image_url ? (
                                                <span className="w-6 h-6 mr-2 flex-shrink-0 relative">
                                                    <img 
                                                        src={category.image_url} 
                                                        alt={category.name} 
                                                        className="w-full h-full object-contain"
                                                    />
                                                </span>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            )}
                                            <span>{category.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                </div>
            </div>
        </>
    );
}
