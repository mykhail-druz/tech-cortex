'use client';

import { redirect } from 'next/navigation';

export default function ProductPage({ params }: { params: { id_new: string } }) {
  // Redirect to the slug-based route
  redirect(`/products/${params.id_new}`);
}