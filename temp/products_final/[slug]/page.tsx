'use client';

import { redirect } from 'next/navigation';

export default function ProductPage({ params }: { params: { slug: string } }) {
  // Redirect to the slug-based route
  redirect(`/products/${params.slug}`);
}