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
} from './types';

// Admin-specific database operations

// Products
export const createProduct = async (
  product: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<InsertResponse<Product>> => {
  const response = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const updateProduct = async (
  id: string,
  product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<UpdateResponse<Product>> => {
  const response = await supabase
    .from('products')
    .update({ ...product, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const deleteProduct = async (id: string): Promise<DeleteResponse> => {
  const response = await supabase.from('products').delete().eq('id', id);
  return { error: response.error };
};

// Product Images
export const addProductImage = async (
  image: Omit<ProductImage, 'id' | 'created_at'>
): Promise<InsertResponse<ProductImage>> => {
  const response = await supabase
    .from('product_images')
    .insert(image)
    .select()
    .single();

  return { data: response.data, error: response.error };
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
  const response = await supabase.from('product_images').delete().eq('id', id);
  return { error: response.error };
};

export const getProductImages = async (productId: string): Promise<SelectResponse<ProductImage>> => {
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
  const response = await supabase
    .from('product_specifications')
    .insert(spec)
    .select()
    .single();

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

export const getProductSpecifications = async (productId: string): Promise<SelectResponse<ProductSpecification>> => {
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
  const response = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

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
  const response = await supabase.from('categories').delete().eq('id', id);
  return { error: response.error };
};

// Orders
export const getAllOrders = async (): Promise<SelectResponse<any>> => {
  const response = await supabase
    .from('orders')
    .select(`
      *,
      user:user_id (
        email:email,
        profile:user_profiles (
          first_name,
          last_name
        )
      )
    `)
    .order('created_at', { ascending: false });

  return { data: response.data, error: response.error };
};

export const updateOrderStatus = async (
  id: string,
  status: string
): Promise<UpdateResponse<any>> => {
  const response = await supabase
    .from('orders')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

// Users
export const getAllUsers = async (): Promise<SelectResponse<any>> => {
  const response = await supabase
    .from('user_profiles')
    .select(`
      *,
      role:role_id (*)
    `);

  return { data: response.data, error: response.error };
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
      updated_at: new Date().toISOString() 
    })
    .eq('id', userId)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

// Settings
export const getSettings = async (): Promise<SelectResponse<any>> => {
  const response = await supabase
    .from('settings')
    .select('*')
    .order('key');

  return { data: response.data, error: response.error };
};

export const getSetting = async (
  key: string
): Promise<{ data: any | null; error: Error | null }> => {
  const response = await supabase
    .from('settings')
    .select('*')
    .eq('key', key)
    .single();

  return { data: response.data, error: response.error };
};

export const updateSetting = async (
  id: string,
  value: string
): Promise<UpdateResponse<any>> => {
  const response = await supabase
    .from('settings')
    .update({ 
      value, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const createSetting = async (
  setting: { key: string; value: string; description?: string | null }
): Promise<InsertResponse<any>> => {
  const response = await supabase
    .from('settings')
    .insert({
      key: setting.key,
      value: setting.value,
      description: setting.description || null
    })
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const deleteSetting = async (
  id: string
): Promise<DeleteResponse> => {
  const response = await supabase
    .from('settings')
    .delete()
    .eq('id', id);

  return { error: response.error };
};
