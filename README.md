# TechCortex E-commerce Platform

A modern e-commerce platform built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **User Authentication**: Secure login, registration, and profile management
- **Product Catalog**: Browse and search products by category
- **Product Details**: Images, specifications, reviews, and related products
- **Shopping Cart**: Add products to cart and manage quantities
- **Checkout Process**: Streamlined checkout with shipping and payment options
- **Order Management**: Track and manage orders
- **Admin Panel**: Comprehensive admin dashboard for site management
- **Responsive Design**: Optimized for all device sizes
- **Server-side Rendering**: Fast page loads with Next.js App Router
- **Type-safe Development**: Built with TypeScript

## Admin Panel

The admin panel provides a powerful interface for managing the e-commerce platform. It includes:

### Dashboard

- Overview of key metrics (orders, revenue, products, users)
- Recent orders list
- Low stock products list

### Products Management

- View all products with filtering and search
- Add, edit, and delete products
- Manage product details, images, and inventory

### Orders Management

- View all orders with filtering and search
- Update order status
- View order details

### Users Management

- View all users with filtering and search
- Manage user roles (admin, manager, customer)
- View user details

### Settings

- Manage site-wide settings
- Edit configuration values

## Role-Based Access Control

The admin panel implements role-based access control with three user roles:

1. **Admin**: Full access to all features and settings
2. **Manager**: Access to most administrative features
3. **Customer**: Regular user access (cannot access admin panel)

## Technologies Used

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **State Management**: React Context API
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm, yarn, or pnpm
- Supabase account and project

### Environment Setup

1. Clone the repository
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Set up the database schema by running the SQL in `src/lib/supabase/schema.sql` in your Supabase SQL editor
4. Run the seed.sql script to populate the database with initial data

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Accessing the Admin Panel

1. Register a new account or log in with an existing account
2. To access the admin panel, your user account must have the 'admin' or 'manager' role
3. Navigate to `/admin` to access the admin dashboard

## Project Structure

The application follows SOLID principles and is organized into the following structure:

- `src/app`: Next.js app router pages and layouts
- `src/components`: Reusable UI components
- `src/contexts`: React context providers for state management
- `src/lib`: Utility functions and services
  - `src/lib/supabase`: Supabase client and database operations

## Deployment

The easiest way to deploy this application is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
