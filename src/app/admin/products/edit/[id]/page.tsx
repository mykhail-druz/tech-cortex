'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import * as storageService from '@/lib/supabase/storageService';
import { supabase } from '@/lib/supabaseClient';
import { Product, Category } from '@/lib/supabase/types/types';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import SimpleProductSpecificationForm from '@/components/admin/SimpleProductSpecificationForm';
import { SimpleSpecificationService } from '@/lib/specifications/SimpleSpecificationService';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.id;
  const router = useRouter();
  const { user, isAdmin, isManager } = useAuth();
  const toast = useToast();

  // Product and form state
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableSubcategories, setAvailableSubcategories] = useState<Category[]>([]);

  // Basic product data
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: 0,
    old_price: null as number | null,
    discount_percentage: null as number | null,
    main_image_url: '',
    category_id: '',
    subcategory_id: '',
    brand: '',
    in_stock: true,
    sku: '',
  });

  // Images state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // New specification system state
  const [smartSpecifications, setSmartSpecifications] = useState<
    Array<{ name: string; value: string; display_order: number }>
  >([]);
  const [isSpecificationFormValid, setIsSpecificationFormValid] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!user || (!isAdmin && !isManager)) {
      router.push('/admin/login');
      return;
    }
  }, [user, isAdmin, isManager, router]);

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product
        const productsResponse = await dbService.getProducts();
        const foundProduct = productsResponse.data?.find(p => p.id === productId);

        if (!foundProduct) {
          throw new Error('Product not found');
        }

        setProduct(foundProduct);

        // Initialize form data
        setFormData({
          title: foundProduct.title,
          slug: foundProduct.slug,
          description: foundProduct.description || '',
          price: foundProduct.price,
          old_price: foundProduct.old_price,
          discount_percentage: foundProduct.discount_percentage,
          main_image_url: foundProduct.main_image_url || '',
          category_id: foundProduct.category_id || '',
          subcategory_id: foundProduct.subcategory_id || '',
          brand: foundProduct.brand || '',
          in_stock: foundProduct.in_stock,
          sku: foundProduct.sku || '',
        });

        // Set image preview if exists
        if (foundProduct.main_image_url) {
          setImagePreview(foundProduct.main_image_url);
        }

        // Fetch categories
        const categoriesResponse = await dbService.getCategories();
        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Product not found or error loading data');
        router.push('/admin/products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, router, toast]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (formData.category_id) {
      const selectedCategory = categories.find(c => c.id === formData.category_id);
      setAvailableSubcategories(selectedCategory?.subcategories || []);

      if (!selectedCategory?.subcategories?.some(s => s.id === formData.subcategory_id)) {
        setFormData(prev => ({ ...prev, subcategory_id: '' }));
      }
    } else {
      setAvailableSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
    }
  }, [formData.category_id, formData.subcategory_id, categories]);

  // Form handling functions
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === 'title') {
      setFormData({
        ...formData,
        title: value,
        slug: generateSlug(value),
      });
    } else if (type === 'number') {
      const numValue = value === '' ? 0 : parseFloat(value);
      setFormData({
        ...formData,
        [name]: numValue,
      });
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Image handling functions
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('All images must be less than 5MB');
      return;
    }

    setSelectedImages(files);

    // Generate previews
    const previews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setImagesPreviews(previews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagesPreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagesPreviews(newPreviews);
  };

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.category_id) {
      errors.category_id = 'Category is required';
    }

    if (formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }

    if (!formData.brand.trim()) {
      errors.brand = 'Brand is required';
    }


    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    if (!isSpecificationFormValid) {
      toast.error('Please fix specification errors');
      return;
    }

    setSubmitting(true);

    try {
      let mainImageUrl = formData.main_image_url;

      // Upload main image if selected
      if (selectedImage) {
        setUploadingImage(true);
        try {
          const uploadResult = await storageService.uploadProductImage(selectedImage);
          if (uploadResult.error) {
            throw new Error('Failed to upload main image: ' + uploadResult.error.message);
          }
          mainImageUrl = uploadResult.data?.publicUrl || '';
          console.log('Main image uploaded successfully:', mainImageUrl);
        } catch (error) {
          console.error('Error uploading main image:', error);
          throw new Error('Failed to upload main image');
        } finally {
          setUploadingImage(false);
        }
      }

      // Prepare product data
      const productData = {
        ...formData,
        main_image_url: mainImageUrl,
        old_price: formData.old_price || null,
        discount_percentage: formData.discount_percentage || null,
        subcategory_id: formData.subcategory_id || null,
      };

      // Update product
      const { data: updatedProduct, error: productError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();

      if (productError || !updatedProduct) {
        throw new Error('Error updating product: ' + productError?.message);
      }

      console.log('Product updated successfully:', updatedProduct);

      // Update specifications using a new system
      if (smartSpecifications.length > 0 && formData.category_id) {
        const specValues: Record<string, string> = {};
        smartSpecifications.forEach(spec => {
          if (spec.value && spec.value.trim() !== '') {
            specValues[spec.name] = spec.value;
          }
        });

        if (Object.keys(specValues).length > 0) {
          const result = await SimpleSpecificationService.createProductSpecificationsFromTemplates(
            productId,
            formData.category_id,
            specValues
          );

          if (!result.success) {
            console.error('Error updating specifications:', result.errors);
            toast.error('Product updated but specifications failed: ' + result.errors?.join(', '));
          } else {
            console.log('Specifications updated successfully');
          }
        }
      }

      // Upload additional images
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          console.log(`Starting upload of ${selectedImages.length} additional images...`);

          for (let i = 0; i < selectedImages.length; i++) {
            const image = selectedImages[i];
            console.log(`Uploading image ${i + 1} (${image.name})...`);

            const uploadResult = await storageService.uploadProductImage(image);
            if (uploadResult.error) {
              console.error(`Error uploading image ${i + 1}:`, uploadResult.error);
              continue;
            }

            const imageUrl = uploadResult.data?.publicUrl;
            if (imageUrl) {
              const { error: dbError } = await adminDbService.addProductImage(
                updatedProduct.id,
                imageUrl,
                i + 1
              );

              if (dbError) {
                console.error(`Error saving image ${i + 1} to database:`, dbError);
              } else {
                console.log(`Image ${i + 1} uploaded and saved successfully`);
              }
            }
          }
        } catch (error) {
          console.error('Error uploading additional images:', error);
          toast.error('Product updated but some images failed to upload');
        } finally {
          setUploadingImages(false);
        }
      }

      toast.success('Product updated successfully!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="large" />
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Product not found</p>
          <Link href="/admin/products" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="mt-2 text-gray-600">Update product information and specifications</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Product Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product title"
                required
              />
              {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="product-url-slug"
              />
              <p className="mt-1 text-sm text-gray-500">
                Auto-generated from title. You can customize it if needed.
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product description"
              />
            </div>

            {/* Price and Old Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₴) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                    formErrors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                {formErrors.price && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
                )}
              </div>

              <div>
                <label htmlFor="old_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Old Price (₴)
                </label>
                <input
                  type="number"
                  id="old_price"
                  name="old_price"
                  value={formData.old_price || ''}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label
                  htmlFor="discount_percentage"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Discount (%)
                </label>
                <input
                  type="number"
                  id="discount_percentage"
                  name="discount_percentage"
                  value={formData.discount_percentage || ''}
                  onChange={handleInputChange}
                  step="1"
                  min="0"
                  max="100"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Category and Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                    formErrors.category_id ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.category_id}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="subcategory_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Subcategory
                </label>
                <select
                  id="subcategory_id"
                  name="subcategory_id"
                  value={formData.subcategory_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  disabled={availableSubcategories.length === 0}
                >
                  <option value="">Select a subcategory</option>
                  {availableSubcategories.map(subcategory => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
                {availableSubcategories.length === 0 && formData.category_id && (
                  <p className="mt-1 text-sm text-gray-500">
                    No subcategories available for this category
                  </p>
                )}
              </div>
            </div>

            {/* Brand and SKU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                    formErrors.brand ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter brand name"
                  required
                />
                {formErrors.brand && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.brand}</p>
                )}
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                    formErrors.sku ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter SKU"
                />
                {formErrors.sku && <p className="mt-1 text-sm text-red-600">{formErrors.sku}</p>}
              </div>
            </div>

            {/* In Stock */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="in_stock"
                name="in_stock"
                checked={formData.in_stock}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="in_stock" className="ml-2 block text-sm text-gray-900">
                In Stock
              </label>
            </div>

            {/* SIMPLE SPECIFICATION SYSTEM */}
            {formData.category_id && (
              <SimpleProductSpecificationForm
                categoryId={formData.category_id}
                productId={productId}
                onSpecificationsChange={specifications => {
                  setSmartSpecifications(specifications);
                  console.log('Specifications updated:', specifications);
                }}
                onValidationChange={isValid => {
                  setIsSpecificationFormValid(isValid);
                  console.log('Specification form validation:', isValid);
                }}
              />
            )}

            {/* Main Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Product Image
              </label>
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Select a new main image to replace the current one (max 5MB)
                  </p>
                </div>
                {imagePreview && (
                  <div className="w-24 h-24 border border-gray-300 rounded overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Images Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleImagesChange}
                className="w-full p-2 border border-gray-300 rounded"
              />
              <p className="mt-1 text-sm text-gray-500">
                Add new additional images (max 10 images total, 5MB each)
              </p>

              {/* Image Previews */}
              {imagesPreviews.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagesPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <div className="w-full h-24 border border-gray-300 rounded overflow-hidden">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSelectedImage(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                href="/admin/products"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || uploadingImage || uploadingImages}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <Spinner size="small" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
