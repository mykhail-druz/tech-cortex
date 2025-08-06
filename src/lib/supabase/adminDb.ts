import { supabase } from '@/lib/supabaseClient';
import {
  Product,
  Category,
  ProductImage,
  ProductSpecification,
  InsertResponse,
  UpdateResponse,
  DeleteResponse,
  SelectResponse,
  Order,
  OrderStatus,
  OrderWithItems,
  PaymentStatus,
} from './types/types';

// Admin-specific database operations





// Products
export const createProduct = async (
  product: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<InsertResponse<Product>> => {
  // Create a copy of the product data to avoid modifying the original
  const productData = { ...product };

  // Remove subcategory_id if it's an empty string to avoid issues if the column doesn't exist
  if (productData.subcategory_id === '') {
    delete productData.subcategory_id;
    console.log('Removed empty subcategory_id from product data');
  }

  // Make sure main_image_url is not an empty string
  if (productData.main_image_url !== undefined) {
    productData.main_image_url = productData.main_image_url && productData.main_image_url.trim() !== '' 
      ? productData.main_image_url 
      : null;
    console.log('Sanitized main_image_url:', productData.main_image_url);
  }

  console.log('Creating product with data:', JSON.stringify(productData, null, 2));

  try {
    const response = await supabase.from('products').insert(productData).select().single();

    if (response.error) {
      console.error('Supabase error creating product:', response.error);
      console.error('Error details:', JSON.stringify(response.error, null, 2));
    } else {
      console.log('Product created successfully:', response.data?.id);
    }

    return { data: response.data, error: response.error };
  } catch (error) {
    console.error('Exception in createProduct:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in createProduct'),
    };
  }
};

export const updateProduct = async (
  id: string,
  product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<UpdateResponse<Product>> => {
  // Create a copy of the product data to avoid modifying the original
  const productData = { ...product, updated_at: new Date().toISOString() };

  // Remove subcategory_id if it's an empty string to avoid issues if the column doesn't exist
  if (productData.subcategory_id === '') {
    delete productData.subcategory_id;
    console.log('Removed empty subcategory_id from product data');
  }

  // Make sure main_image_url is not an empty string
  if (productData.main_image_url !== undefined) {
    productData.main_image_url = productData.main_image_url && productData.main_image_url.trim() !== '' 
      ? productData.main_image_url 
      : null;
    console.log('Sanitized main_image_url:', productData.main_image_url);
  }

  console.log('Updating product with data:', JSON.stringify(productData, null, 2));

  try {
    const response = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single();

    if (response.error) {
      console.error('Supabase error updating product:', response.error);
      console.error('Error details:', JSON.stringify(response.error, null, 2));
    } else {
      console.log('Product updated successfully:', response.data?.id);
    }

    return { data: response.data, error: response.error };
  } catch (error) {
    console.error('Exception in updateProduct:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in updateProduct'),
    };
  }
};

export const deleteProduct = async (id: string): Promise<DeleteResponse> => {
  try {
    // First, check if the product is referenced in order_items
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', id)
      .limit(1);

    if (orderItemsError) {
      console.error('Error checking order items for product deletion:', orderItemsError);
      return { error: orderItemsError };
    }

    // If the product is referenced in order_items, prevent deletion
    if (orderItems && orderItems.length > 0) {
      const error = new Error('Cannot delete product that has been ordered. This product exists in order history and must be preserved for record keeping.');
      return { error };
    }

    // Get the product to get its main_image_url
    const { data: product, error: fetchProductError } = await supabase
      .from('products')
      .select('main_image_url')
      .eq('id', id)
      .single();

    if (fetchProductError) {
      console.error('Error fetching product for deletion:', fetchProductError);
      return { error: fetchProductError };
    }

    // Get all product images from the product_images table
    const { data: productImages, error: fetchImagesError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', id);

    if (fetchImagesError) {
      console.error('Error fetching product images for deletion:', fetchImagesError);
      return { error: fetchImagesError };
    }

    // Import the deleteFile function
    const { deleteFile } = await import('./storageService');

    // If the product has a main image, delete it from storage
    if (product?.main_image_url) {
      await deleteFile(product.main_image_url, 'products');
    }

    // Delete all additional product images from storage
    if (productImages && productImages.length > 0) {
      for (const image of productImages) {
        if (image.image_url) {
          await deleteFile(image.image_url, 'products');
        }
      }
    }

    // Now delete the product from the database
    // This will cascade delete the product_images, cart_items, reviews, and wishlist_items records
    const response = await supabase.from('products').delete().eq('id', id);
    return { error: response.error };
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return { error: error instanceof Error ? error : new Error('Unknown error in deleteProduct') };
  }
};

// Product Images
export const addProductImage = async (
  image: Omit<ProductImage, 'id' | 'created_at'>
): Promise<InsertResponse<ProductImage>> => {
  console.log('Adding product image to database:', JSON.stringify(image, null, 2));

  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    console.log('User session for image upload:', session ? 'Authenticated' : 'Not authenticated');

    // Check if the product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, title')
      .eq('id', image.product_id)
      .single();

    if (productError) {
      console.error('Error finding product for image:', productError);
      return { 
        data: null, 
        error: new Error(`Product not found: ${productError.message}`) 
      };
    }

    console.log('Found product for image:', product);

    // Make sure image_url is not an empty string
    const sanitizedImage = {
      ...image,
      image_url: image.image_url && image.image_url.trim() !== '' 
        ? image.image_url 
        : null
    };

    console.log('Sanitized image data:', JSON.stringify(sanitizedImage, null, 2));

    // Insert the image
    console.log('Inserting image into product_images table...');
    const response = await supabase.from('product_images').insert(sanitizedImage).select().single();

    if (response.error) {
      console.error('Error adding product image:', response.error);
      console.error('Error details:', JSON.stringify(response.error, null, 2));
    } else {
      console.log('Successfully added product image:', response.data);
    }

    return { data: response.data, error: response.error };
  } catch (error) {
    console.error('Exception in addProductImage:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error in addProductImage') 
    };
  }
};

export const updateProductImage = async (
  id: string,
  image: Partial<Omit<ProductImage, 'id' | 'created_at'>>
): Promise<UpdateResponse<ProductImage>> => {
  const response = await supabase
    .from('product_images')
    .update(image)
    .eq('id', id)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const deleteProductImage = async (id: string): Promise<DeleteResponse> => {
  try {
    // First, get the product image to get its image_url
    const { data: productImage, error: fetchError } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching product image for deletion:', fetchError);
      return { error: fetchError };
    }

    // If the product image has an image_url, delete it from storage
    if (productImage?.image_url) {
      const { deleteFile } = await import('./storageService');
      await deleteFile(productImage.image_url, 'products');
    }

    // Now delete the product image from the database
    const response = await supabase.from('product_images').delete().eq('id', id);
    return { error: response.error };
  } catch (error) {
    console.error('Error in deleteProductImage:', error);
    return {
      error: error instanceof Error ? error : new Error('Unknown error in deleteProductImage'),
    };
  }
};

export const getProductImages = async (
  productId: string
): Promise<SelectResponse<ProductImage>> => {
  const response = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true });

  return { data: response.data, error: response.error };
};

// Product Specifications
export const addProductSpecification = async (
  spec: Omit<ProductSpecification, 'id'>
): Promise<InsertResponse<ProductSpecification>> => {
  const response = await supabase.from('product_specifications').insert(spec).select().single();

  return { data: response.data, error: response.error };
};

export const updateProductSpecification = async (
  id: string,
  spec: Partial<Omit<ProductSpecification, 'id'>>
): Promise<UpdateResponse<ProductSpecification>> => {
  const response = await supabase
    .from('product_specifications')
    .update(spec)
    .eq('id', id)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const deleteProductSpecification = async (id: string): Promise<DeleteResponse> => {
  const response = await supabase.from('product_specifications').delete().eq('id', id);
  return { error: response.error };
};

export const getProductSpecifications = async (
  productId: string
): Promise<SelectResponse<ProductSpecification>> => {
  const response = await supabase
    .from('product_specifications')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true });

  return { data: response.data, error: response.error };
};


// Categories
export const createCategory = async (
  category: Omit<Category, 'id' | 'created_at' | 'updated_at'>
): Promise<InsertResponse<Category>> => {
  const response = await supabase.from('categories').insert(category).select().single();

  return { data: response.data, error: response.error };
};

export const updateCategory = async (
  id: string,
  category: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
): Promise<UpdateResponse<Category>> => {
  const response = await supabase
    .from('categories')
    .update({ ...category, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const deleteCategory = async (id: string): Promise<DeleteResponse> => {
  try {
    // First, get the category to get its image_url, icon_url and check if it's a subcategory
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('image_url, icon_url, is_subcategory')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching category for deletion:', fetchError);
      return { error: fetchError };
    }

    // If it's a subcategory, check if any products are using it
    if (category?.is_subcategory) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('subcategory_id', id);

      if (productsError) {
        console.error('Error checking products for subcategory:', productsError);
        return { error: productsError };
      }

      // If products are using this subcategory, return a custom error
      if (products && products.length > 0) {
        const customError = new Error(
          `Cannot delete subcategory because it is still being used by ${products.length} product(s). Please reassign or delete these products first.`
        );
        return { error: customError };
      }
    } else {
      // If it's a main category, check if any subcategories are using it as a parent
      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', id);

      if (subcategoriesError) {
        console.error('Error checking subcategories:', subcategoriesError);
        return { error: subcategoriesError };
      }

      // If subcategories are using this category as a parent, return a custom error
      if (subcategories && subcategories.length > 0) {
        const customError = new Error(
          `Cannot delete category because it has ${subcategories.length} subcategory/subcategories. Please delete these subcategories first.`
        );
        return { error: customError };
      }

      // Check if any products are using this main category
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('category_id', id);

      if (productsError) {
        console.error('Error checking products for category:', productsError);
        return { error: productsError };
      }

      // If products are using this category, return a custom error
      if (products && products.length > 0) {
        const customError = new Error(
          `Cannot delete category because it is still being used by ${products.length} product(s). Please reassign or delete these products first.`
        );
        return { error: customError };
      }
    }

    // Import the deleteFile function
    const { deleteFile } = await import('./storageService');

    // If the category has an image, delete it from storage
    if (category?.image_url) {
      await deleteFile(category.image_url, 'categories');
    }

    // If the category has an icon, delete it from storage
    if (category?.icon_url) {
      await deleteFile(category.icon_url, 'categories');
    }

    // Now delete the category from the database
    const response = await supabase.from('categories').delete().eq('id', id);
    return { error: response.error };
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return { error: error instanceof Error ? error : new Error('Unknown error in deleteCategory') };
  }
};


// Orders
export const getAllOrders = async (): Promise<SelectResponse<Order>> => {
  try {
    const response = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    return { data: response.data, error: response.error };
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in getAllOrders'),
    };
  }
};

export const updateOrderStatus = async (
  id: string,
  status: OrderStatus
): Promise<UpdateResponse<Order>> => {
  try {
    const response = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data: response.data, error: response.error };
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in updateOrderStatus'),
    };
  }
};

export const getOrderDetails = async (
  orderId: string
): Promise<{ data: OrderWithItems | null; error: Error | null }> => {
  try {
    // Get the order
    const orderResponse = await supabase.from('orders').select('*').eq('id', orderId).single();

    if (orderResponse.error) {
      return { data: null, error: orderResponse.error };
    }

    // Get the order items with product details
    const itemsResponse = await supabase
      .from('order_items')
      .select(
        `
        *,
        product:product_id (*)
      `
      )
      .eq('order_id', orderId);

    const orderWithItems: OrderWithItems = {
      ...orderResponse.data,
      items: itemsResponse.data || [],
    };

    return { data: orderWithItems, error: null };
  } catch (error) {
    console.error('Error in getOrderDetails:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in getOrderDetails'),
    };
  }
};

export const updateOrderPaymentStatus = async (
  id: string,
  paymentStatus: PaymentStatus
): Promise<UpdateResponse<Order>> => {
  try {
    const response = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data: response.data, error: response.error };
  } catch (error) {
    console.error('Error in updateOrderPaymentStatus:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Unknown error in updateOrderPaymentStatus'),
    };
  }
};

export const updateOrderTrackingNumber = async (
  id: string,
  trackingNumber: string
): Promise<UpdateResponse<Order>> => {
  try {
    const response = await supabase
      .from('orders')
      .update({
        tracking_number: trackingNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    return { data: response.data, error: response.error };
  } catch (error) {
    console.error('Error in updateOrderTrackingNumber:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error : new Error('Unknown error in updateOrderTrackingNumber'),
    };
  }
};

// Users
export const getAllUsers = async (): Promise<SelectResponse<any>> => {
  try {
    // First, run the function to create missing user profiles
    try {
      const { error } = await supabase.rpc('create_missing_user_profiles');
      if (error) {
        console.error('[getAllUsers] Error creating missing profiles:', error);
      }
    } catch (rpcError) {
      console.error('[getAllUsers] Exception in RPC call:', rpcError);
    }

    // Then fetch all user profiles
    const response = await supabase
      .from('user_profiles')
      .select(
        `
        *,
        role:role_id (*)
      `
      )
      .order('created_at', { ascending: false });

    // Log the number of users and their details
    console.log(`[getAllUsers] Found ${response.data?.length || 0} users in user_profiles table`);
    if (response.data) {
      response.data.forEach((user, index) => {
        console.log(`[getAllUsers] User ${index + 1}:`, {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          created_at: user.created_at,
        });
      });
    }

    if (response.error) {
      console.error('[getAllUsers] Error fetching users:', response.error);
    }

    return { data: response.data, error: response.error };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error in getAllUsers'),
    };
  }
};

export const createUserProfile = async (
  userId: string,
  profile: { first_name?: string; last_name?: string }
): Promise<InsertResponse<any>> => {
  // Get the customer role ID
  const roleResponse = await supabase
    .from('user_roles')
    .select('id')
    .eq('name', 'customer')
    .single();

  const customerRoleId = roleResponse.data?.id;

  const response = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      first_name: profile.first_name || null,
      last_name: profile.last_name || null,
      role_id: customerRoleId, // Set default role to customer
    })
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const updateUserRole = async (
  userId: string,
  roleId: string
): Promise<UpdateResponse<any>> => {
  const response = await supabase
    .from('user_profiles')
    .update({
      role_id: roleId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

