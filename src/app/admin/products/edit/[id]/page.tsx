'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import * as storageService from '@/lib/supabase/storageService';
import {
  Product,
  Category,
  ProductSpecification,
  CategorySpecificationTemplate,
  ProductImage,
} from '@/lib/supabase/types/types';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.id;
  const router = useRouter();
  // const { user, isAdmin, isManager } = useAuth(); // Commented out as these variables are not being used
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: 0,
    old_price: null,
    discount_percentage: 0,
    main_image_url: '',
    category_id: '',
    subcategory_id: '',
    brand: '',
    in_stock: true,
    sku: '',
  });

  // Add state to track available subcategories
  const [availableSubcategories, setAvailableSubcategories] = useState<Category[]>([]);

  // Add state for product specifications
  const [specifications, setSpecifications] = useState<ProductSpecification[]>([]);
  const [newSpecification, setNewSpecification] = useState({
    name: '',
    value: '',
    template_id: '',
  });
  const [editingSpecIndex, setEditingSpecIndex] = useState<number | null>(null);

  // Add state for specification templates
  const [specTemplates, setSpecTemplates] = useState<CategorySpecificationTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Add state for product images
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Fetch product and categories
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

        // Fetch categories
        const categoriesResponse = await dbService.getCategories();
        if (categoriesResponse.data) {
          setCategories(categoriesResponse.data);
        }

        // Fetch product specifications with template information
        const specificationsResponse =
          await adminDbService.getProductSpecificationsWithTemplates(productId);
        if (specificationsResponse.data) {
          setSpecifications(specificationsResponse.data);
        }

        // Fetch product images
        const imagesResponse = await adminDbService.getProductImages(productId);
        if (imagesResponse.data) {
          setExistingImages(imagesResponse.data);
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

      // Reset subcategory if category changes and current subcategory doesn't belong to the new category
      if (!selectedCategory?.subcategories?.some(s => s.id === formData.subcategory_id)) {
        setFormData(prev => ({ ...prev, subcategory_id: '' }));
      }

      // Fetch specification templates for the selected category
      const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
          const { data, error } = await adminDbService.getCategorySpecificationTemplates(
            formData.category_id
          );

          if (error) {
            throw error;
          }

          if (data) {
            setSpecTemplates(data);
          } else {
            setSpecTemplates([]);
          }
        } catch (error) {
          console.error('Error fetching specification templates:', error);
          toast.error('Failed to load specification templates');
          setSpecTemplates([]);
        } finally {
          setLoadingTemplates(false);
        }
      };

      fetchTemplates();
    } else {
      setAvailableSubcategories([]);
      setFormData(prev => ({ ...prev, subcategory_id: '' }));
      setSpecTemplates([]);
    }
  }, [formData.category_id, categories, toast]);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === 'title') {
      // Auto-generate slug when title changes (only if slug hasn't been manually edited)
      if (formData.slug === generateSlug(formData.title)) {
        setFormData({
          ...formData,
          title: value,
          slug: generateSlug(value),
        });
      } else {
        setFormData({
          ...formData,
          title: value,
        });
      }
    } else if (type === 'number') {
      if (
        (name === 'old_price' || name === 'discount_percentage' || name === 'price') &&
        value === ''
      ) {
        // Allow empty value for old_price, discount_percentage, and price to be set as null
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

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';
    if (formData.price === null || formData.price === undefined) errors.price = 'Price is required';
    else if (formData.price <= 0) errors.price = 'Price must be greater than 0';
    if (!formData.category_id) errors.category_id = 'Category is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle specification input changes
  const handleSpecificationChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // If template_id changes, update the name field with the template name
    if (name === 'template_id' && value) {
      const selectedTemplate = specTemplates.find(t => t.id === value);
      if (selectedTemplate) {
        setNewSpecification(prev => ({
          ...prev,
          [name]: value,
          name: selectedTemplate.name,
        }));
      } else {
        setNewSpecification(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setNewSpecification(prev => ({ ...prev, [name]: value }));
    }
  };

  // Add a new specification
  const addSpecification = async () => {
    if (!newSpecification.value.trim() || !product) return;

    // Either template_id or name must be provided
    if (!newSpecification.template_id && !newSpecification.name.trim()) {
      toast.error('Either select a template or provide a specification name');
      return;
    }

    try {
      const { data, error } = await adminDbService.addProductSpecification({
        product_id: product.id,
        template_id: newSpecification.template_id || null,
        name: newSpecification.name,
        value: newSpecification.value,
        display_order: specifications.length,
      });

      if (error) {
        throw error;
      }

      if (data) {
        setSpecifications([...specifications, data]);
        setNewSpecification({ name: '', value: '', template_id: '' });
        toast.success('Specification added successfully');
      }
    } catch (error) {
      console.error('Error adding specification:', error);
      toast.error('Failed to add specification');
    }
  };

  // Start editing a specification
  const startEditingSpec = (index: number) => {
    setEditingSpecIndex(index);
    setNewSpecification({
      name: specifications[index].name,
      value: specifications[index].value,
      template_id: specifications[index].template_id || '',
    });
  };

  // Cancel editing a specification
  const cancelEditingSpec = () => {
    setEditingSpecIndex(null);
    setNewSpecification({ name: '', value: '', template_id: '' });
  };

  // Update a specification
  const updateSpecification = async () => {
    if (editingSpecIndex === null || !newSpecification.value.trim()) return;

    // Either template_id or name must be provided
    if (!newSpecification.template_id && !newSpecification.name.trim()) {
      toast.error('Either select a template or provide a specification name');
      return;
    }

    const specToUpdate = specifications[editingSpecIndex];

    try {
      const { data, error } = await adminDbService.updateProductSpecification(specToUpdate.id, {
        template_id: newSpecification.template_id || null,
        name: newSpecification.name,
        value: newSpecification.value,
      });

      if (error) {
        throw error;
      }

      if (data) {
        const updatedSpecs = [...specifications];
        updatedSpecs[editingSpecIndex] = data;
        setSpecifications(updatedSpecs);
        setEditingSpecIndex(null);
        setNewSpecification({ name: '', value: '', template_id: '' });
        toast.success('Specification updated successfully');
      }
    } catch (error) {
      console.error('Error updating specification:', error);
      toast.error('Failed to update specification');
    }
  };

  // Delete a specification
  const deleteSpecification = async (id: string) => {
    try {
      const { error } = await adminDbService.deleteProductSpecification(id);

      if (error) {
        throw error;
      }

      setSpecifications(specifications.filter(spec => spec.id !== id));
      toast.success('Specification deleted successfully');
    } catch (error) {
      console.error('Error deleting specification:', error);
      toast.error('Failed to delete specification');
    }
  };

  // Handle multiple image file selection
  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);

      // Limit to 10 images total (including existing ones)
      if (existingImages.length + selectedImages.length + files.length > 10) {
        toast.warning(
          `You can have a maximum of 10 images per product. You already have ${existingImages.length} existing images and ${selectedImages.length} new images selected.`
        );
        return;
      }

      // Validate each file
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      files.forEach(file => {
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
          invalidFiles.push(`${file.name} is not an image file`);
          return;
        }

        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          invalidFiles.push(`${file.name} exceeds the 5MB size limit`);
          return;
        }

        validFiles.push(file);
      });

      // Show warnings for invalid files
      if (invalidFiles.length > 0) {
        toast.warning(`Some files were not added: ${invalidFiles.join(', ')}`);
      }

      if (validFiles.length === 0) return;

      // Add valid files to selected images
      setSelectedImages(prev => [...prev, ...validFiles]);

      // Create preview URLs for the selected images
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = event => {
          setImagesPreviews(prev => [...prev, event.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove a new image from the selected images
  const removeSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagesPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Remove an existing image
  const removeExistingImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to remove this image?')) return;

    try {
      const { error } = await adminDbService.deleteProductImage(imageId);

      if (error) {
        throw error;
      }

      // Update the state to remove the deleted image
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !product) return;

    setSubmitting(true);

    try {
      // Update product basic information
      const { data, error } = await adminDbService.updateProduct(product.id, formData);

      if (error) {
        throw error;
      }

      // Upload new images if any are selected
      if (selectedImages.length > 0) {
        setUploadingImages(true);

        let successCount = 0;
        let errorCount = 0;

        // Upload each image and create a product_images record
        for (let i = 0; i < selectedImages.length; i++) {
          try {
            // Upload to Supabase storage
            const { url, error } = await storageService.uploadFile(
              selectedImages[i],
              'products', // bucket name
              'images' // folder path
            );

            if (error) {
              console.error(`Error uploading additional image ${i + 1}:`, error);
              errorCount++;
              continue;
            }

            if (!url) {
              console.error(`No URL returned for additional image ${i + 1}`);
              errorCount++;
              continue;
            }

            // Create product_images record
            const imageData: Omit<ProductImage, 'id' | 'created_at'> = {
              product_id: product.id,
              image_url: url,
              alt_text: `${formData.title} - Image ${existingImages.length + i + 1}`,
              is_main: false,
              display_order: existingImages.length + i,
            };

            const { error: addImageError } = await adminDbService.addProductImage(imageData);

            if (addImageError) {
              console.error(`Error adding additional image ${i + 1} to database:`, addImageError);
              errorCount++;
              continue;
            }

            successCount++;
          } catch (imageError) {
            console.error(`Error processing additional image ${i + 1}:`, imageError);
            errorCount++;
          }
        }

        setUploadingImages(false);

        if (errorCount > 0) {
          toast.warning(`Product updated but ${errorCount} additional images could not be added.`);
        }

        if (successCount > 0) {
          toast.success(`Successfully added ${successCount} additional images.`);
        }
      }

      // Redirect to products page
      router.push('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Product Not Found</h2>
        <p className="mt-2 text-gray-600">
          The product you&apos;re trying to edit doesn&apos;t exist.
        </p>
        <Link
          href="/admin/products"
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Product: {product.title}</h1>
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.title && <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>}
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Slug*
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.slug ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.slug && <p className="mt-1 text-sm text-red-500">{formErrors.slug}</p>}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price*
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price === null ? '' : formData.price}
                onChange={handleInputChange}
                step="0.01"
                className={`w-full p-2 border rounded-md ${
                  formErrors.price ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.price && <p className="mt-1 text-sm text-red-500">{formErrors.price}</p>}
            </div>

            {/* Old Price */}
            <div>
              <label htmlFor="old_price" className="block text-sm font-medium text-gray-700 mb-1">
                Old Price
              </label>
              <input
                type="number"
                id="old_price"
                name="old_price"
                value={formData.old_price === null ? '' : formData.old_price}
                onChange={handleInputChange}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Discount Percentage */}
            <div>
              <label
                htmlFor="discount_percentage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Discount Percentage
              </label>
              <input
                type="number"
                id="discount_percentage"
                name="discount_percentage"
                value={formData.discount_percentage === null ? '' : formData.discount_percentage}
                onChange={handleInputChange}
                max="100"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Category*
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className={`w-full p-2 border rounded-md ${
                  formErrors.category_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {categories
                  .filter(c => !c.is_subcategory)
                  .map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
              {formErrors.category_id && (
                <p className="mt-1 text-sm text-red-500">{formErrors.category_id}</p>
              )}
            </div>

            {/* Subcategory - only show when a category is selected */}
            {formData.category_id && (
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
                  className="w-full p-2 border border-gray-300 rounded-md"
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

            {/* Brand */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* SKU */}
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
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Main Image URL */}
            <div>
              <label
                htmlFor="main_image_url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Main Image URL
              </label>
              <input
                type="text"
                id="main_image_url"
                name="main_image_url"
                value={formData.main_image_url}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* Product Images Management */}
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Product Images</h3>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Existing Images ({existingImages.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {existingImages.map(image => (
                        <div key={image.id} className="relative">
                          <div className="w-full h-24 border border-gray-300 rounded-md overflow-hidden">
                            <img
                              src={image.image_url}
                              alt={image.alt_text || 'Product image'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                          {image.is_main && (
                            <span className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs text-center py-1">
                              Main Image
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Images */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Add New Images</h4>
                  <div className="flex flex-col space-y-4">
                    <input
                      type="file"
                      id="additional_images"
                      name="additional_images"
                      accept="image/*"
                      multiple
                      onChange={handleMultipleImagesChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />

                    {/* New Images Preview */}
                    {imagesPreviews.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-2">
                          New Images Preview ({imagesPreviews.length})
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {imagesPreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <div className="w-full h-24 border border-gray-300 rounded-md overflow-hidden">
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSelectedImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      You can have up to 10 images per product. Currently: {existingImages.length}{' '}
                      existing + {selectedImages.length} new ={' '}
                      {existingImages.length + selectedImages.length} total.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* In Stock */}
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
          </div>

          {/* Description */}
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            ></textarea>
          </div>

          {/* Product Specifications */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Product Specifications</h3>

            {/* Specifications List */}
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              {specifications.length > 0 ? (
                <div className="overflow-x-auto overflow-y-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">
                          Name
                        </th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">
                          Value
                        </th>
                        <th className="py-2 px-4 text-left text-sm font-medium text-gray-700">
                          Template
                        </th>
                        <th className="py-2 px-4 text-right text-sm font-medium text-gray-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {specifications.map((spec, index) => (
                        <tr key={spec.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {spec.template ? (
                              <span title={spec.name}>{spec.template.display_name}</span>
                            ) : (
                              spec.name
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">{spec.value}</td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {spec.template ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Templated
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Custom
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => startEditingSpec(index)}
                              className="text-blue-600 hover:text-blue-800 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSpecification(spec.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No specifications added yet.</p>
              )}
            </div>

            {/* Add/Edit Specification Form */}
            <div className="bg-white p-4 border border-gray-200 rounded-md">
              <h4 className="font-medium text-gray-900 mb-3">
                {editingSpecIndex !== null ? 'Edit Specification' : 'Add New Specification'}
              </h4>

              {/* Template Selector */}
              {formData.category_id && (
                <div className="mb-4">
                  <label
                    htmlFor="template_id"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Specification Template
                  </label>
                  <div className="flex items-center">
                    <select
                      id="template_id"
                      name="template_id"
                      value={newSpecification.template_id}
                      onChange={handleSpecificationChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select a template (optional)</option>
                      {specTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.display_name}
                        </option>
                      ))}
                    </select>
                    {loadingTemplates && (
                      <div className="ml-2">
                        <div className="w-5 h-5 border-2 border-t-blue-500 border-b-blue-500 rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {specTemplates.length === 0 && !loadingTemplates
                      ? 'No templates available for this category. You can still add custom specifications.'
                      : 'Select a template or enter a custom specification name below.'}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="spec-name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name {!newSpecification.template_id && '*'}
                  </label>
                  <input
                    type="text"
                    id="spec-name"
                    name="name"
                    value={newSpecification.name}
                    onChange={handleSpecificationChange}
                    placeholder="e.g., Processor, RAM, Storage"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    disabled={!!newSpecification.template_id}
                  />
                  {newSpecification.template_id && (
                    <p className="mt-1 text-xs text-gray-500">
                      Name is automatically set from the selected template
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="spec-value"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Value*
                  </label>
                  <input
                    type="text"
                    id="spec-value"
                    name="value"
                    value={newSpecification.value}
                    onChange={handleSpecificationChange}
                    placeholder="e.g., Intel Core i7, 16GB, 512GB SSD"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                {editingSpecIndex !== null ? (
                  <>
                    <button
                      type="button"
                      onClick={cancelEditingSpec}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={updateSpecification}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Update Specification
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={addSpecification}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Specification
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {submitting ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
