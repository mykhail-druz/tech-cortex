'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import * as storageService from '@/lib/supabase/storageService';
import { supabase } from '@/lib/supabaseClient';
import { Category } from '@/lib/supabase/types/types';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import SimpleProductSpecificationForm from '@/components/admin/SimpleProductSpecificationForm';
import { SimpleSpecificationService } from '@/lib/specifications/SimpleSpecificationService';

export default function AddProductPage() {
  const router = useRouter();
  const { user, isAdmin, isManager } = useAuth();
  const toast = useToast();

  // Existing state
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
    old_price: null,
    discount_percentage: null,
    main_image_url: '',
    category_id: '',
    subcategory_id: '',
    brand: '',
    in_stock: true,
    sku: '',
  });

  // Images (existing functionality)
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Smart specification form state
  const [smartSpecifications, setSmartSpecifications] = useState<
    Array<{ name: string; value: string; display_order: number }>
  >([]);
  const [isSpecificationFormValid, setIsSpecificationFormValid] = useState(true);

  // Existing useEffect for categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await dbService.getCategories();
        if (data) {
          setCategories(data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // useEffect for loading subcategories
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

  // Existing functions (do not modify)
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
      if (
        (name === 'old_price' || name === 'discount_percentage' || name === 'price') &&
        value === ''
      ) {
        setFormData({
          ...formData,
          [name]: null,
        });
      } else {
        setFormData({
          ...formData,
          [name]: parseFloat(value) || 0,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  // Keep existing functions for images (do not modify)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.startsWith('image/')) {
        toast.warning('Please select an image file (JPEG, PNG, etc.)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.warning('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);

      const reader = new FileReader();
      reader.onload = event => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      if (selectedImages.length + files.length > 10) {
        toast.warning('You can upload a maximum of 10 images per product');
        return;
      }

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      files.forEach(file => {
        if (!file.type.startsWith('image/')) {
          invalidFiles.push(`${file.name} is not an image file`);
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          invalidFiles.push(`${file.name} exceeds the 5MB size limit`);
          return;
        }

        validFiles.push(file);
      });

      if (invalidFiles.length > 0) {
        toast.warning(`Some files were not added: ${invalidFiles.join(', ')}`);
      }

      if (validFiles.length === 0) return;

      setSelectedImages(prev => [...prev, ...validFiles]);

      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
          setImagesPreviews(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagesPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ИСПРАВЛЕННАЯ функция отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});

    try {
      // Validation
      if (!formData.title.trim()) {
        setFormErrors(prev => ({ ...prev, title: 'Title is required' }));
        setSubmitting(false);
        return;
      }

      if (!formData.category_id) {
        setFormErrors(prev => ({ ...prev, category_id: 'Category is required' }));
        setSubmitting(false);
        return;
      }

      // Upload main image if selected
      let mainImageUrl = formData.main_image_url;
      console.log('Initial main_image_url:', mainImageUrl);

      if (selectedImage) {
        setUploadingImage(true);
        console.log(`Uploading main image: ${selectedImage.name}, ${selectedImage.size} bytes...`);

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          console.log(
            'User session for main image upload:',
            session ? 'Authenticated' : 'Not authenticated'
          );

          const {
            url: uploadedUrl,
            error: uploadError,
            fileName,
          } = await storageService.uploadFile(selectedImage, 'products', 'images');

          if (uploadError) {
            console.error('Error uploading main image:', uploadError);
            throw uploadError;
          }

          if (uploadedUrl) {
            mainImageUrl = uploadedUrl;
            console.log('Successfully uploaded main image, URL:', mainImageUrl);
          } else {
            console.error('No URL returned for uploaded main image');
            // Используем правильное имя файла в фоллбэке
            if (fileName) {
              const fallbackUrl = `https://qaugzgfnfndwilolhjdi.supabase.co/storage/v1/object/public/products/images/${fileName}`;
              console.log('Using fallback URL with correct filename for main image:', fallbackUrl);
              mainImageUrl = fallbackUrl;
            } else {
              throw new Error('Failed to get image URL and filename');
            }
            toast.warning(
              'Image URL generation had issues. Images might need to be re-uploaded later.'
            );
          }
        } catch (error) {
          console.error('Error uploading main image:', error);
          toast.error('Failed to upload main image');
          setSubmitting(false);
          setUploadingImage(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      } else {
        console.log('No main image selected for upload');
      }

      // Подготавливаем данные продукта
      const productData = {
        ...formData,
        category_id: formData.category_id,
        subcategory_id: formData.subcategory_id || undefined,
        main_image_url: mainImageUrl,
        price: Number(formData.price),
        old_price: formData.old_price ? Number(formData.old_price) : null,
        discount_percentage: formData.discount_percentage
          ? Number(formData.discount_percentage)
          : null,
      };

      console.log('Prepared product data:', {
        title: productData.title,
        slug: productData.slug,
        category_id: productData.category_id,
        subcategory_id: productData.subcategory_id,
        brand: productData.brand,
        price: productData.price,
        main_image_url: productData.main_image_url,
      });

      console.log('main_image_url in product data:', productData.main_image_url);

      let createdProduct;

      // Using the Smart Tag-Based specification system
      console.log('🔧 Creating product with Smart Tag-Based specification system');
      console.log('Smart specifications:', smartSpecifications);

      // Проверяем валидность спецификаций
      if (!isSpecificationFormValid) {
        toast.error('Пожалуйста, исправьте ошибки в спецификациях товара');
        setSubmitting(false);
        return;
      }

      // Создаем товар напрямую, минуя валидацию по старым шаблонам
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError || !product) {
        throw new Error('Ошибка создания товара: ' + productError?.message);
      }

      console.log('Product created successfully:', product);

      // Добавляем спецификации из новой простой системы
      if (smartSpecifications.length > 0 && formData.category_id) {
        const specValues: Record<string, string> = {};
        smartSpecifications.forEach(spec => {
          if (spec.value && spec.value.trim() !== '') {
            specValues[spec.name] = spec.value;
          }
        });

        if (Object.keys(specValues).length > 0) {
          const result = await SimpleSpecificationService.createProductSpecificationsFromTemplates(
            product.id,
            formData.category_id,
            specValues
          );

          if (!result.success) {
            // Откатываем создание продукта
            await supabase.from('products').delete().eq('id', product.id);
            throw new Error('Ошибка добавления спецификаций: ' + result.errors?.join(', '));
          }
          console.log('Specifications added successfully');
        }
      }

      const result = { data: product, error: null };

      if (result.error) {
        throw result.error;
      }

      createdProduct = result.data;

      console.log('Created product:', createdProduct);

      if (!createdProduct) {
        throw new Error('Failed to create product');
      }

      // Verify that main_image_url was saved correctly
      console.log('Verifying main_image_url was saved correctly:');
      console.log('Expected main_image_url:', mainImageUrl);
      console.log('Actual main_image_url in created product:', createdProduct.main_image_url);

      if (
        mainImageUrl &&
        (!createdProduct.main_image_url || createdProduct.main_image_url !== mainImageUrl)
      ) {
        console.warn('⚠️ main_image_url mismatch or missing in created product!');

        // Try to fetch the product directly from the database to double-check
        try {
          const { data: fetchedProduct, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .eq('id', createdProduct.id)
            .single();

          if (fetchError) {
            console.error('Error fetching product to verify main_image_url:', fetchError);
          } else {
            console.log('Fetched product directly from database:', fetchedProduct);
            console.log('main_image_url in fetched product:', fetchedProduct.main_image_url);

            // If the main_image_url is still missing, try to update it
            if (
              mainImageUrl &&
              (!fetchedProduct.main_image_url || fetchedProduct.main_image_url !== mainImageUrl)
            ) {
              console.log('Attempting to update main_image_url...');
              const { data: updatedProduct, error: updateError } =
                await adminDbService.updateProduct(createdProduct.id, {
                  main_image_url: mainImageUrl,
                });

              if (updateError) {
                console.error('Error updating main_image_url:', updateError);
              } else {
                console.log('Successfully updated main_image_url:', updatedProduct);
                createdProduct = updatedProduct;
              }
            }
          }
        } catch (verifyError) {
          console.error('Error verifying main_image_url:', verifyError);
        }
      }

      // Upload additional images (ИСПРАВЛЕННАЯ логика)
      if (selectedImages.length > 0) {
        setUploadingImages(true);
        try {
          console.log(
            `Starting upload of ${selectedImages.length} additional images for product:`,
            createdProduct.id
          );

          // Verify the product was created correctly
          console.log('Verifying product was created correctly:', {
            id: createdProduct.id,
            title: createdProduct.title,
            main_image_url: createdProduct.main_image_url,
          });

          // Check if user is authenticated
          const {
            data: { session },
          } = await supabase.auth.getSession();
          console.log(
            'User session for additional images:',
            session ? 'Authenticated' : 'Not authenticated'
          );

          for (let i = 0; i < selectedImages.length; i++) {
            const image = selectedImages[i];
            console.log(`Uploading image ${i + 1} (${image.name}, ${image.size} bytes)...`);

            const {
              url: uploadedUrl,
              error: uploadError,
              fileName,
            } = await storageService.uploadFile(image, 'products', 'images');

            if (uploadError) {
              console.error(`Error uploading image ${i + 1}:`, uploadError);
              continue;
            }

            let imageUrl = uploadedUrl;
            if (!imageUrl && fileName) {
              // Используем правильное имя файла в фоллбэке
              const fallbackUrl = `https://qaugzgfnfndwilolhjdi.supabase.co/storage/v1/object/public/products/images/${fileName}`;
              console.log(
                `Using fallback URL with correct filename for image ${i + 1}:`,
                fallbackUrl
              );
              imageUrl = fallbackUrl;
              toast.warning('Some image URLs had generation issues.');
            }

            if (imageUrl) {
              console.log(`Successfully uploaded image ${i + 1} to storage:`, imageUrl);

              console.log(`Adding image ${i + 1} to product_images table:`, {
                product_id: createdProduct.id,
                image_url: imageUrl, // ИСПРАВЛЕНО: используем imageUrl вместо uploadData.url
                alt_text: `${createdProduct.title} - Image ${i + 1}`,
                display_order: i,
              });

              try {
                const { data: imageData, error: imageError } = await adminDbService.addProductImage(
                  {
                    product_id: createdProduct.id,
                    image_url: imageUrl, // ИСПРАВЛЕНО: используем imageUrl вместо uploadData.url
                    alt_text: `${createdProduct.title} - Image ${i + 1}`,
                    display_order: i,
                  }
                );

                if (imageError) {
                  console.error(`Error adding image ${i + 1} to product_images table:`, imageError);
                  console.error('Image error details:', JSON.stringify(imageError, null, 2));
                } else {
                  console.log(
                    `Successfully added image ${i + 1} to product_images table:`,
                    imageData
                  );
                }
              } catch (imageAddError) {
                console.error(
                  `Exception adding image ${i + 1} to product_images table:`,
                  imageAddError
                );
              }
            } else {
              console.error(
                `No URL returned for uploaded image ${i + 1} and no fileName available`
              );
              console.warn(`Skipping image ${i + 1} due to upload failure`);
            }
          }

          // Verify images were added to the database
          try {
            const { data: productImages, error: getImagesError } =
              await adminDbService.getProductImages(createdProduct.id);
            if (getImagesError) {
              console.error('Error retrieving product images:', getImagesError);
            } else {
              console.log(
                `Retrieved ${productImages?.length || 0} images for product:`,
                productImages
              );
            }
          } catch (verifyError) {
            console.error('Error verifying product images:', verifyError);
          }
        } catch (error) {
          console.error('Error uploading additional images:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          toast.warning('Product created but some images failed to upload');
        } finally {
          setUploadingImages(false);
        }
      }

      toast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Failed to create product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Authorization check
  if (!user || (!isAdmin && !isManager)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to access this page.</p>
          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
              <Link
                href="/admin/products"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to Products
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Product Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product title"
                />
                {formErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
                )}
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="auto-generated-from-title"
                />
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                  Brand *
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter brand name"
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter SKU (optional)"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price * ($)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price || ''}
                  onChange={handleInputChange}
                  required
                  step="0.01"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label htmlFor="old_price" className="block text-sm font-medium text-gray-700 mb-1">
                  Old Price ($)
                </label>
                <input
                  type="number"
                  id="old_price"
                  name="old_price"
                  value={formData.old_price || ''}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00 (optional)"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>

            {/* Category Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="category_id"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category *
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories
                    .filter(category => !category.is_subcategory)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
                {formErrors.category_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.category_id}</p>
                )}
              </div>

              {availableSubcategories.length > 0 && (
                <div>
                  <label
                    htmlFor="subcategory_id"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Subcategory
                  </label>
                  <select
                    id="subcategory_id"
                    name="subcategory_id"
                    value={formData.subcategory_id}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a subcategory (optional)</option>
                    {availableSubcategories.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="in_stock"
                name="in_stock"
                checked={formData.in_stock}
                onChange={handleCheckboxChange}
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
                    Select a main image for the product (max 5MB)
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
                Select additional images for the product (max 10 images total, 5MB each)
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
                    Creating...
                  </>
                ) : (
                  'Create Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
