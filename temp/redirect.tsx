'use client';

import { redirect } from 'next/navigation';

export default function ProductPage({ params }: { params: { id: string } }) {
  // Redirect to the slug-based route
  redirect(`/products/${params.id}`);
}