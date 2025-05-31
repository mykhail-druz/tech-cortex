# E-Commerce Development Guidelines with Supabase, Next.js, Tailwind CSS, and TypeScript

## Table of Contents
- [Introduction](#introduction)
- [Project Structure](#project-structure)
- [SOLID Principles Implementation](#solid-principles-implementation)
- [TypeScript Best Practices](#typescript-best-practices)
- [UI/UX Guidelines](#uiux-guidelines)
- [Next.js App Router Configuration](#nextjs-app-router-configuration)
- [Supabase Integration](#supabase-integration)
- [Tailwind CSS Configuration](#tailwind-css-configuration)
- [Code Generation and Testing](#code-generation-and-testing)
- [Sample Reusable Component](#sample-reusable-component)
- [Maintenance and Scalability](#maintenance-and-scalability)

## Introduction

This document provides guidelines for developing an e-commerce project using Supabase, Next.js, Tailwind CSS, and TypeScript. These guidelines are tailored for use with IntelliJ IDEA and AI assistance, focusing on creating clean, maintainable, and scalable code.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   ├── (auth)/             # Authentication routes (grouped)
│   ├── products/           # Product-related routes
│   │   ├── [slug]/         # Dynamic product page
│   │   └── category/       # Category pages
│   └── checkout/           # Checkout flow
├── components/             # React components
│   ├── ui/                 # Reusable UI components
│   │   ├── Button/         # Button component with variants
│   │   ├── Input/          # Form inputs
│   │   └── Modal/          # Modal dialogs
│   ├── product/            # Product-specific components
│   ├── cart/               # Cart-related components
│   └── layout/             # Layout components
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts          # Authentication hook
│   ├── useCart.ts          # Cart management hook
│   └── useProducts.ts      # Product data hook
├── services/               # Service layer
│   ├── api.ts              # API client
│   ├── auth.ts             # Authentication service
│   └── products.ts         # Product service
├── lib/                    # Utility libraries
│   ├── supabase/           # Supabase client and helpers
│   │   ├── client.ts       # Supabase client initialization
│   │   ├── auth.ts         # Auth utilities
│   │   └── db.ts           # Database utilities
│   └── utils/              # General utilities
├── types/                  # TypeScript type definitions
│   ├── product.ts          # Product-related types
│   ├── user.ts             # User-related types
│   └── api.ts              # API response types
└── contexts/               # React context providers
    ├── AuthContext.tsx     # Authentication context
    └── CartContext.tsx     # Shopping cart context
```

### Key Organization Principles:

1. **Feature-based organization**: Group related files by feature rather than by type where appropriate
2. **Component isolation**: Each component should have its own directory with index.ts export
3. **Clear separation of concerns**: UI components, business logic, and data fetching should be separate
4. **Consistent naming**: Use PascalCase for components, camelCase for functions/variables
5. **Barrel exports**: Use index.ts files to simplify imports

## SOLID Principles Implementation

### Single Responsibility Principle (SRP)
- Each component, hook, or service should have only one reason to change
- Extract complex logic from components into custom hooks
- Separate UI rendering from data fetching and business logic

```typescript
// BAD: Component doing too much
const ProductCard = ({ productId }: { productId: string }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('products').select('*').eq('id', productId).single();
        setProduct(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);
  
  // Rendering logic...
};

// GOOD: Separate concerns
const useProduct = (productId: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
        if (error) throw new Error(error.message);
        setProduct(data);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [productId]);
  
  return { product, loading, error };
};

const ProductCard = ({ productId }: { productId: string }) => {
  const { product, loading, error } = useProduct(productId);
  
  // Only rendering logic here...
};
```

### Open/Closed Principle (OCP)
- Components should be open for extension but closed for modification
- Use composition over inheritance
- Create base components that can be extended with props

```typescript
// Button component that's extensible through props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  ...props
}) => {
  // Base classes
  const baseClasses = 'font-medium rounded focus:outline-none transition-colors';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-secondary text-white hover:bg-secondary-dark',
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary/10'
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <span className="spinner mr-2" /> : null}
      {children}
    </button>
  );
};
```

### Liskov Substitution Principle (LSP)
- Derived components should be substitutable for their base components
- Maintain consistent props and behavior across related components
- Use TypeScript interfaces to enforce contract adherence

```typescript
// Base interface for all form inputs
interface InputProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
}

// Text input that extends the base interface
interface TextInputProps extends InputProps {
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

// Number input that extends the base interface
interface NumberInputProps extends InputProps {
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
}

// Both components can be used interchangeably where InputProps is expected
```

### Interface Segregation Principle (ISP)
- Don't force components to depend on props they don't use
- Create specific, focused interfaces rather than large, general ones
- Split large components into smaller, more focused ones

```typescript
// BAD: One large interface with many properties
interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
  onAddToWishlist: () => void;
  onCompare: () => void;
  showRating: boolean;
  showPrice: boolean;
  showDescription: boolean;
  isInCart: boolean;
  isInWishlist: boolean;
  isCompared: boolean;
}

// GOOD: Smaller, focused interfaces
interface ProductBaseProps {
  product: Product;
}

interface ProductDisplayProps extends ProductBaseProps {
  showRating?: boolean;
  showPrice?: boolean;
  showDescription?: boolean;
}

interface ProductActionsProps extends ProductBaseProps {
  onAddToCart?: () => void;
  isInCart?: boolean;
}

interface WishlistActionsProps extends ProductBaseProps {
  onAddToWishlist?: () => void;
  isInWishlist?: boolean;
}

// Components can now use only what they need
const ProductInfo: React.FC<ProductDisplayProps> = ({ product, showRating, showPrice, showDescription }) => {
  // Display logic only
};

const ProductActions: React.FC<ProductActionsProps> = ({ product, onAddToCart, isInCart }) => {
  // Cart action logic only
};
```

### Dependency Inversion Principle (DIP)
- High-level modules should not depend on low-level modules
- Both should depend on abstractions
- Use dependency injection to provide services to components

```typescript
// BAD: Direct dependency on Supabase implementation
const ProductList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*');
      setProducts(data || []);
    };
    
    fetchProducts();
  }, []);
  
  // Rendering logic...
};

// GOOD: Depend on abstraction via custom hook
interface UseProductsOptions {
  category?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}

const useProducts = ({ category, sort }: UseProductsOptions = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = supabase.from('products').select('*');
        
        if (category) {
          query = query.eq('category', category);
        }
        
        if (sort) {
          switch (sort) {
            case 'price_asc':
              query = query.order('price', { ascending: true });
              break;
            case 'price_desc':
              query = query.order('price', { ascending: false });
              break;
            case 'newest':
              query = query.order('created_at', { ascending: false });
              break;
          }
        }
        
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        setProducts(data || []);
      } catch (error) {
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [category, sort]);
  
  return { products, loading, error };
};

// Component now depends on the abstraction
const ProductList = ({ category, sort }: UseProductsOptions) => {
  const { products, loading, error } = useProducts({ category, sort });
  
  // Rendering logic...
};
```

## TypeScript Best Practices

### Type Definitions

1. **Create explicit interfaces** for all data structures:

```typescript
// Define clear interfaces for your data models
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: ProductImage[];
  category: Category;
  subcategory?: Subcategory;
  specifications: Record<string, string>;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Subcategory extends Category {
  parentId: string;
}
```

2. **Avoid using `any`** - use proper types or `unknown` when necessary:

```typescript
// BAD
const processData = (data: any) => {
  console.log(data.name); // No type safety
};

// GOOD
const processData = (data: unknown) => {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    console.log((data as { name: string }).name);
  }
};

// BETTER
interface DataWithName {
  name: string;
  [key: string]: unknown;
}

const processData = (data: DataWithName) => {
  console.log(data.name); // Type-safe
};
```

3. **Use discriminated unions** for state management:

```typescript
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

const ProductDetail = ({ productId }: { productId: string }) => {
  const [state, setState] = useState<FetchState<Product>>({ status: 'idle' });
  
  useEffect(() => {
    const fetchProduct = async () => {
      setState({ status: 'loading' });
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
          
        if (error) throw new Error(error.message);
        setState({ status: 'success', data });
      } catch (error) {
        setState({ status: 'error', error: error as Error });
      }
    };
    
    fetchProduct();
  }, [productId]);
  
  // Render based on state
  switch (state.status) {
    case 'idle':
      return <div>Ready to load product</div>;
    case 'loading':
      return <div>Loading...</div>;
    case 'error':
      return <div>Error: {state.error.message}</div>;
    case 'success':
      return <div>{state.data.name}</div>;
  }
};
```

4. **Use generics** for reusable components and hooks:

```typescript
// Generic hook for fetching data
function useFetch<T>(url: string, options?: RequestInit) {
  const [state, setState] = useState<FetchState<T>>({ status: 'idle' });
  
  useEffect(() => {
    const fetchData = async () => {
      setState({ status: 'loading' });
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setState({ status: 'success', data });
      } catch (error) {
        setState({ status: 'error', error: error as Error });
      }
    };
    
    fetchData();
  }, [url, options]);
  
  return state;
}

// Usage with specific type
const { status, data, error } = useFetch<Product[]>('/api/products');
```

5. **Use type guards** for runtime type checking:

```typescript
// Type guard function
function isProduct(value: unknown): value is Product {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'price' in value
  );
}

// Usage
function processProductData(data: unknown) {
  if (isProduct(data)) {
    // TypeScript knows data is Product here
    console.log(data.name, data.price);
  } else {
    console.error('Invalid product data');
  }
}
```

## UI/UX Guidelines

### Accessibility

1. **Semantic HTML**: Use appropriate HTML elements for their intended purpose

```tsx
// BAD
<div onClick={handleClick}>Click me</div>

// GOOD
<button onClick={handleClick}>Click me</button>
```

2. **ARIA attributes**: Add ARIA attributes when necessary

```tsx
<button 
  aria-label="Close modal"
  aria-pressed={isPressed}
  onClick={closeModal}
>
  <svg>...</svg>
</button>
```

3. **Keyboard navigation**: Ensure all interactive elements are keyboard accessible

```tsx
const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);
  
  // Focus trap implementation
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);
  
  // Modal implementation...
};
```

4. **Color contrast**: Ensure sufficient contrast between text and background

```tsx
// Use Tailwind's contrast-safe color combinations
<p className="text-gray-900 dark:text-gray-100">High contrast text</p>
```

### Responsive Design

1. **Mobile-first approach**: Design for mobile first, then enhance for larger screens

```tsx
// Using Tailwind's responsive prefixes
<div className="p-2 md:p-4 lg:p-6">
  <h1 className="text-xl md:text-2xl lg:text-3xl">Responsive Heading</h1>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Grid items */}
  </div>
</div>
```

2. **Flexible layouts**: Use CSS Grid and Flexbox for adaptive layouts

```tsx
// Product grid that adapts to screen size
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {products.map(product => (
    <ProductCard key={product.id} product={product} />
  ))}
</div>
```

3. **Responsive images**: Use Next.js Image component with responsive sizes

```tsx
import Image from 'next/image';

<div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64">
  <Image
    src={product.image}
    alt={product.name}
    fill
    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
    className="object-cover"
  />
</div>
```

### User Experience

1. **Minimal clicks**: Design user flows that require minimal clicks to complete tasks

```tsx
// Quick add to cart without page navigation
const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  
  return (
    <div className="relative group">
      <Link href={`/products/${product.slug}`}>
        <div className="product-image">
          <Image src={product.image} alt={product.name} />
        </div>
        <h3>{product.name}</h3>
        <p>${product.price.toFixed(2)}</p>
      </Link>
      
      {/* Quick add button appears on hover */}
      <button
        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          addToCart(product);
        }}
        aria-label={`Add ${product.name} to cart`}
      >
        Add to Cart
      </button>
    </div>
  );
};
```

2. **Clear feedback**: Provide clear feedback for all user actions

```tsx
const AddToCartButton = ({ product }: { product: Product }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { addToCart } = useCart();
  
  const handleAddToCart = async () => {
    setStatus('loading');
    try {
      await addToCart(product);
      setStatus('success');
      // Reset after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };
  
  return (
    <button
      onClick={handleAddToCart}
      disabled={status === 'loading'}
      className={`px-4 py-2 rounded transition-colors ${
        status === 'success' ? 'bg-green-500' :
        status === 'error' ? 'bg-red-500' :
        'bg-primary hover:bg-primary-dark'
      }`}
    >
      {status === 'loading' && <span className="spinner mr-2" />}
      {status === 'success' && 'Added!'}
      {status === 'error' && 'Failed!'}
      {status === 'idle' && 'Add to Cart'}
    </button>
  );
};
```

3. **Progressive disclosure**: Show information progressively to avoid overwhelming users

```tsx
const ProductSpecifications = ({ specifications }: { specifications: Record<string, string> }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get the first 3 specs for preview
  const previewSpecs = Object.entries(specifications).slice(0, 3);
  const remainingSpecs = Object.entries(specifications).slice(3);
  
  return (
    <div className="mt-4">
      <h3 className="font-medium">Specifications</h3>
      
      <dl className="mt-2 divide-y">
        {/* Always show first 3 specs */}
        {previewSpecs.map(([key, value]) => (
          <div key={key} className="py-2 flex justify-between">
            <dt className="text-gray-500">{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        
        {/* Show remaining specs when expanded */}
        {isExpanded && remainingSpecs.map(([key, value]) => (
          <div key={key} className="py-2 flex justify-between">
            <dt className="text-gray-500">{key}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      
      {remainingSpecs.length > 0 && (
        <button
          className="mt-2 text-primary hover:text-primary-dark"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};
```

## Next.js App Router Configuration

### Route Organization

1. **Route Groups**: Use route groups to organize related routes

```
app/
├── (auth)/             # Authentication route group
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   └── layout.tsx      # Shared layout for auth pages
├── (shop)/             # Shop route group
│   ├── products/       # Products listing
│   ├── cart/           # Shopping cart
│   └── layout.tsx      # Shop layout with navigation
└── layout.tsx          # Root layout
```

2. **Dynamic Routes**: Use dynamic routes for product pages, categories, etc.

```
app/
├── products/
│   ├── [slug]/         # Dynamic product page
│   │   └── page.tsx    # /products/[product-slug]
│   ├── category/
│   │   └── [slug]/     # Dynamic category page
│   │       └── page.tsx # /products/category/[category-slug]
```

3. **Route Handlers**: Create API routes using route handlers

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  const supabase = createRouteHandlerClient({ cookies });
  
  let query = supabase.from('products').select('*');
  
  if (category) {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

### Server Components vs. Client Components

1. **Server Components**: Use for data fetching and static content

```typescript
// app/products/page.tsx (Server Component)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import ProductGrid from '@/components/product/ProductGrid';

export default async function ProductsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: products } = await supabase.from('products').select('*');
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>
      <ProductGrid products={products || []} />
    </div>
  );
}
```

2. **Client Components**: Use for interactive elements

```typescript
// components/product/AddToCartButton.tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';

export default function AddToCartButton({ productId }: { productId: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  
  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addToCart(productId);
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <button
      onClick={handleAddToCart}
      disabled={isAdding}
      className="bg-primary text-white px-4 py-2 rounded"
    >
      {isAdding ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}
```

3. **Hybrid Approach**: Combine server and client components

```typescript
// app/products/[slug]/page.tsx (Server Component)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import ProductDetails from '@/components/product/ProductDetails';
import AddToCartButton from '@/components/product/AddToCartButton';

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('slug', params.slug)
    .single();
  
  if (!product) {
    notFound();
  }
  
  return (
    <div className="container mx-auto py-8">
      <ProductDetails product={product} />
      {/* Client component for interactivity */}
      <AddToCartButton productId={product.id} />
    </div>
  );
}
```

### Data Fetching

1. **Server-side data fetching**: Use in Server Components

```typescript
// app/products/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function ProductsPage() {
  const supabase = createServerComponentClient({ cookies });
  
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching products:', error);
    return <div>Error loading products</div>;
  }
  
  return (
    <div>
      <h1>Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

2. **Client-side data fetching**: Use SWR or React Query in Client Components

```typescript
// hooks/useProducts.ts
'use client';

import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';

export function useProducts(category?: string) {
  const fetcher = async () => {
    let query = supabase.from('products').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) throw new Error(error.message);
    return data;
  };
  
  const { data, error, isLoading, mutate } = useSWR(
    category ? `products-${category}` : 'products',
    fetcher
  );
  
  return {
    products: data || [],
    isLoading,
    isError: error,
    refresh: mutate
  };
}

// Usage in a client component
'use client';

import { useProducts } from '@/hooks/useProducts';

export default function FilterableProductList({ initialCategory }: { initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory);
  const { products, isLoading, isError } = useProducts(category);
  
  // Rendering logic...
}
```

## Supabase Integration

### Client Setup

1. **Client initialization**:

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

2. **Server component client**:

```typescript
// In server components
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function Page() {
  const supabase = createServerComponentClient({ cookies });
  // Use supabase client...
}
```

3. **Route handler client**:

```typescript
// In API routes
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  // Use supabase client...
}
```

### Authentication

1. **Auth setup with middleware**:

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // If accessing a protected route and not logged in, redirect to login
  if (!session && req.nextUrl.pathname.startsWith('/account')) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  return res;
}

export const config = {
  matcher: ['/account/:path*', '/checkout/:path*'],
};
```

2. **Auth hooks**:

```typescript
// hooks/useAuth.ts
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    router.refresh();
  };
  
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };
  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.refresh();
  };
  
  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Row Level Security (RLS)

1. **RLS policies setup**:

```sql
-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Products: Anyone can view, only admins can modify
CREATE POLICY "Products are viewable by everyone" 
ON products FOR SELECT USING (true);

CREATE POLICY "Products are insertable by admins" 
ON products FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

CREATE POLICY "Products are updatable by admins" 
ON products FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- Orders: Users can view their own orders, admins can view all
CREATE POLICY "Users can view their own orders" 
ON orders FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT user_id FROM admin_users)
);

CREATE POLICY "Users can create their own orders" 
ON orders FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Order items: Same rules as orders
CREATE POLICY "Users can view their own order items" 
ON order_items FOR SELECT USING (
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  ) OR 
  auth.uid() IN (SELECT user_id FROM admin_users)
);

-- User profiles: Users can view and update their own profiles
CREATE POLICY "Users can view their own profiles" 
ON user_profiles FOR SELECT USING (
  auth.uid() = id
);

CREATE POLICY "Users can update their own profiles" 
ON user_profiles FOR UPDATE USING (
  auth.uid() = id
);
```

2. **Implementing RLS in application code**:

```typescript
// Example: Fetching orders (automatically filtered by RLS)
const { data: orders, error } = await supabase
  .from('orders')
  .select('*, order_items(*, product:products(*))');

// Example: Creating an order (RLS ensures user can only create their own)
const { data, error } = await supabase
  .from('orders')
  .insert({
    user_id: user.id, // This must match auth.uid() for RLS to allow
    total: cartTotal,
    status: 'pending'
  })
  .select()
  .single();
```

### Database Schema

```sql
-- Example schema for e-commerce
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id),
  subcategory_id UUID REFERENCES subcategories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total DECIMAL(10, 2) NOT NULL,
  shipping_address JSONB,
  billing_address JSONB,
  payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Tailwind CSS Configuration

### Base Configuration

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // Blue
          dark: '#2563EB',
          light: '#93C5FD',
        },
        secondary: {
          DEFAULT: '#10B981', // Green
          dark: '#059669',
          light: '#6EE7B7',
        },
        accent: {
          DEFAULT: '#F59E0B', // Amber
          dark: '#D97706',
          light: '#FCD34D',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
```

### Custom Utilities

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .btn {
    @apply px-4 py-2 rounded font-medium transition-colors;
  }
  
  .btn-primary {
    @apply btn bg-primary text-white hover:bg-primary-dark;
  }
  
  .btn-secondary {
    @apply btn bg-secondary text-white hover:bg-secondary-dark;
  }
  
  .btn-outline {
    @apply btn bg-transparent border border-primary text-primary hover:bg-primary/10;
  }
  
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md overflow-hidden;
  }
  
  .card-body {
    @apply p-4;
  }
}
```

### Responsive Design

```tsx
// Example of responsive design with Tailwind
<div className="container mx-auto px-4 py-8">
  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">Product Catalog</h1>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {products.map(product => (
      <div key={product.id} className="card">
        <div className="aspect-w-1 aspect-h-1">
          <img 
            src={product.image} 
            alt={product.name}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="card-body">
          <h2 className="text-lg font-medium">{product.name}</h2>
          <p className="text-gray-500 text-sm mb-2">{product.category}</p>
          <div className="flex justify-between items-center">
            <span className="font-bold">${product.price.toFixed(2)}</span>
            <button className="btn-primary text-sm">Add to Cart</button>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>
```

### Dark Mode

```javascript
// tailwind.config.js
module.exports = {
  // ...
  darkMode: 'class',
  // ...
};
```

```tsx
// components/ThemeToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  
  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  
  if (!mounted) return null;
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-800"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <SunIcon className="w-5 h-5" />
      ) : (
        <MoonIcon className="w-5 h-5" />
      )}
    </button>
  );
}
```

## Code Generation and Testing

### Code Generation with AI

1. **Component generation**: Use AI to generate component templates

```
Prompt: "Create a ProductCard component that displays a product image, name, price, and an 'Add to Cart' button. Use TypeScript and Tailwind CSS. The component should be responsive and follow accessibility best practices."
```

2. **Test generation**: Generate test cases for components

```
Prompt: "Write Jest tests for the ProductCard component that verify it renders correctly with all props, handles the 'Add to Cart' click event, and displays a loading state when adding to cart."
```

3. **API route generation**: Generate API route handlers

```
Prompt: "Create a Next.js App Router API route handler for fetching products with filtering by category and sorting options. Include proper error handling and TypeScript types."
```

### Testing Setup

1. **Jest configuration**:

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
};

module.exports = createJestConfig(customJestConfig);
```

2. **Testing utilities**:

```typescript
// src/lib/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </AuthProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

3. **Component testing example**:

```typescript
// src/components/ui/Button/Button.test.tsx
import { render, screen, fireEvent } from '@/lib/test-utils';
import Button from './Button';

describe('Button component', () => {
  test('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });
  
  test('applies variant classes correctly', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-secondary');
  });
  
  test('shows loading state when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button', { name: /loading/i });
    expect(button).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });
  
  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button', { name: /click me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

4. **Hook testing example**:

```typescript
// src/hooks/useCart.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { CartProvider } from '@/contexts/CartContext';
import { useCart } from './useCart';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 99.99,
  image: '/test.jpg',
};

describe('useCart hook', () => {
  test('should add item to cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('1');
    expect(result.current.items[0].quantity).toBe(1);
  });
  
  test('should increase quantity of existing item', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct);
      result.current.addToCart(mockProduct);
    });
    
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });
  
  test('should remove item from cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct);
      result.current.removeFromCart('1');
    });
    
    expect(result.current.items).toHaveLength(0);
  });
  
  test('should calculate total correctly', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    
    act(() => {
      result.current.addToCart(mockProduct);
      result.current.addToCart(mockProduct);
    });
    
    expect(result.current.total).toBe(199.98);
  });
});
```

## Sample Reusable Component

### Button Component

```typescript
// src/components/ui/Button/Button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Spinner } from '../Spinner/Spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary',
        secondary: 'bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary',
        outline: 'bg-transparent border border-primary text-primary hover:bg-primary/10 focus:ring-primary',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={buttonVariants({ variant, size, fullWidth, className })}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <Spinner
            className="mr-2"
            size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
            data-testid="spinner"
          />
        )}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
```

### Spinner Component

```typescript
// src/components/ui/Spinner/Spinner.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const spinnerVariants = cva('animate-spin text-gray-300', {
  variants: {
    size: {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export const Spinner = ({ size, className }: SpinnerProps) => {
  return (
    <svg
      className={spinnerVariants({ size, className })}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      data-testid="spinner"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
};
```

### Usage Example

```tsx
// Example usage of the Button component
import Button from '@/components/ui/Button';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function ProductActions({ product }: { product: Product }) {
  const { addToCart, isAddingToCart } = useCart();
  
  const handleAddToCart = () => {
    addToCart(product);
  };
  
  return (
    <div className="mt-6 space-y-4">
      <Button
        onClick={handleAddToCart}
        isLoading={isAddingToCart}
        leftIcon={<ShoppingCartIcon className="w-5 h-5" />}
        fullWidth
      >
        Add to Cart
      </Button>
      
      <Button variant="outline" fullWidth>
        Add to Wishlist
      </Button>
      
      <div className="grid grid-cols-2 gap-4">
        <Button variant="secondary" size="sm">
          Compare
        </Button>
        
        <Button variant="ghost" size="sm">
          Share
        </Button>
      </div>
    </div>
  );
}
```

## Maintenance and Scalability

### Code Organization

1. **Feature-based organization**: Group related files by feature
2. **Consistent naming conventions**: Use PascalCase for components, camelCase for functions
3. **Barrel exports**: Use index.ts files to simplify imports

```typescript
// components/ui/index.ts
export * from './Button';
export * from './Input';
export * from './Modal';
// This allows importing from '@/components/ui' instead of deep imports
```

### Performance Optimization

1. **Code splitting**: Use dynamic imports for large components

```typescript
// Dynamic import example
import dynamic from 'next/dynamic';

const ProductReviews = dynamic(() => import('@/components/product/ProductReviews'), {
  loading: () => <div className="animate-pulse h-40 bg-gray-200 rounded-md"></div>,
});
```

2. **Memoization**: Use React.memo, useMemo, and useCallback

```typescript
// Memoize expensive component
const ProductGrid = React.memo(({ products }: { products: Product[] }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
});

// Memoize expensive calculations
const ProductFilters = ({ products }: { products: Product[] }) => {
  // Memoize category extraction to avoid recalculating on every render
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category)));
  }, [products]);
  
  // Memoize event handlers
  const handleFilterChange = useCallback((category: string) => {
    // Filter logic
  }, []);
  
  // Component implementation
};
```

3. **Image optimization**: Use Next.js Image component

```tsx
import Image from 'next/image';

<div className="relative aspect-square">
  <Image
    src={product.image}
    alt={product.name}
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover"
    priority={isPriority}
  />
</div>
```

### Error Handling

1. **Global error boundary**:

```tsx
// app/error.tsx
'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <p className="text-gray-600 mb-6">
        We apologize for the inconvenience. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

2. **API error handling**:

```typescript
// lib/api-utils.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || 'An error occurred',
        errorData.details
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, 'Network or server error', error);
  }
}
```

### Documentation

1. **Component documentation**:

```typescript
/**
 * Button component that supports different variants, sizes, and states.
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 * 
 * @example With loading state
 * ```tsx
 * <Button isLoading>Processing...</Button>
 * ```
 */
export const Button = ({ ... }: ButtonProps) => {
  // Implementation
};
```

2. **README files for complex features**:

```markdown
# Authentication Module

This module handles user authentication using Supabase Auth.

## Features

- Email/password authentication
- Social login (Google, GitHub)
- Password reset
- Session management

## Usage

```tsx
import { useAuth } from '@/hooks/useAuth';

function LoginForm() {
  const { signIn, isLoading, error } = useAuth();
  
  // Implementation
}
```

## Security Considerations

- Passwords are never stored in the frontend
- Sessions are managed securely via HTTP-only cookies
- CSRF protection is implemented
```

### Versioning and Changelog

1. **Semantic versioning**: Follow semver for releases
2. **Changelog**: Maintain a CHANGELOG.md file

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2023-06-15

### Added
- Product comparison feature
- Wishlist functionality
- Social sharing for products

### Changed
- Improved cart performance
- Enhanced mobile responsiveness

### Fixed
- Checkout form validation issues
- Product image loading on slow connections

## [1.1.0] - 2023-05-20

### Added
- User reviews and ratings
- Related products section
- Advanced filtering options

### Changed
- Redesigned product detail page
- Optimized image loading
```