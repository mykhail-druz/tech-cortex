'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCategories } from '@/lib/supabase/db';
import { Category } from '@/lib/supabase/types/types';
import { FaFacebookF, FaInstagram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export default function Footer() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch only categories data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await getCategories();
        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
        } else {
          setCategories(categoriesData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* About Company */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About TechCortex</h3>
            <p className="text-gray-600 mb-4">
              Your trusted provider of high-quality computer hardware. We offer a wide range of
              products at competitive prices.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary">
                <FaFacebookF className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <FaInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary">
                <FaXTwitter className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:mr-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-600 hover:text-primary">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="text-gray-600 hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="md:ml-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            {isLoading ? (
              <div className="text-gray-400">Loading...</div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: Math.ceil(categories.length / 7) }).map((_, colIndex) => (
                  <ul key={colIndex} className="space-y-2">
                    {categories.slice(colIndex * 7, colIndex * 7 + 7).map(category => (
                      <li key={category.id}>
                        <Link
                          href={`/products?category=${category.slug}`}
                          className="text-gray-600 hover:text-primary"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/products?category=laptops"
                      className="text-gray-600 hover:text-primary"
                    >
                      Laptops
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?category=desktops"
                      className="text-gray-600 hover:text-primary"
                    >
                      Desktops
                    </Link>
                  </li>
                </ul>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/products?category=components"
                      className="text-gray-600 hover:text-primary"
                    >
                      Components
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/products?category=peripherals"
                      className="text-gray-600 hover:text-primary"
                    >
                      Peripherals
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-gray-600">St.Petersburg, FL, USA</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="h-6 w-6 text-gray-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-gray-600">support@tech-cortex.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} TechCortex. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-6">
                <li>
                  <Link href="/terms-of-use" className="text-gray-500 hover:text-primary text-sm">
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-gray-500 hover:text-primary text-sm">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/shipping-policy" className="text-gray-500 hover:text-primary text-sm">
                    Shipping & Returns
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="text-gray-500 hover:text-primary text-sm">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
