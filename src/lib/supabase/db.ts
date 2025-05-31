import { supabase } from '@/lib/supabaseClient';
import {
  Product,
  ProductWithDetails,
  Category,
  ProductImage,
  ProductSpecification,
  CategorySpecificationTemplate,
  CartItem,
  Order,
  OrderItem,
  Review,
  UserProfile,
  UserRole,
  WishlistItem,
  HomepageContent,
  NavigationLink,
  SelectResponse,
  InsertResponse,
  UpdateResponse,
  DeleteResponse,
  OrderWithItems,
} from './types';

// Products
export const getProducts = async (
  categorySlug?: string,
  subcategorySlug?: string,
  minPrice?: number,
  maxPrice?: number,
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'rating',
  inStockOnly?: boolean
): Promise<SelectResponse<Product>> => {
  let dbQuery = supabase.from('products').select('*');

  // Apply category filter if provided
  if (categorySlug && categorySlug !== 'all') {
    // First, get the category ID
    const categoryResponse = await supabase
      .from('categories')
      .select('*')
      .eq('slug', categorySlug)
      .single();

    if (!categoryResponse.error && categoryResponse.data) {
      const category = categoryResponse.data as Category;

      // If it's a subcategory, filter by subcategory_id
      if (category.is_subcategory) {
        dbQuery = dbQuery.eq('subcategory_id', category.id);
      }
      // If it's a main category, get all subcategories and filter by them
      else {
        // Get all subcategories for this category
        const subcategoriesResponse = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', category.id)
          .eq('is_subcategory', true);

        if (
          !subcategoriesResponse.error &&
          subcategoriesResponse.data &&
          subcategoriesResponse.data.length > 0
        ) {
          // Get subcategory IDs
          const subcategoryIds = subcategoriesResponse.data.map(sub => sub.id);

          // Filter by subcategory_id
          dbQuery = dbQuery.in('subcategory_id', subcategoryIds);
        } else {
          // Fallback to old behavior if no subcategories
          dbQuery = dbQuery.eq('category_id', category.id);
        }
      }
    }
  }

  // Apply subcategory filter if provided
  if (subcategorySlug) {
    const subcategoryResponse = await supabase
      .from('categories')
      .select('*')
      .eq('slug', subcategorySlug)
      .eq('is_subcategory', true)
      .single();

    if (!subcategoryResponse.error && subcategoryResponse.data) {
      dbQuery = dbQuery.eq('subcategory_id', subcategoryResponse.data.id);
    }
  }

  // Apply price range if provided
  if (minPrice !== undefined) {
    dbQuery = dbQuery.gte('price', minPrice);
  }
  if (maxPrice !== undefined) {
    dbQuery = dbQuery.lte('price', maxPrice);
  }

  // Apply in-stock filter if provided
  if (inStockOnly) {
    dbQuery = dbQuery.eq('in_stock', true);
  }

  // Apply sorting
  if (sortBy) {
    switch (sortBy) {
      case 'price-asc':
        dbQuery = dbQuery.order('price', { ascending: true });
        break;
      case 'price-desc':
        dbQuery = dbQuery.order('price', { ascending: false });
        break;
      case 'rating':
        dbQuery = dbQuery.order('rating', { ascending: false });
        break;
      case 'newest':
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
    }
  } else {
    // Default sorting by newest
    dbQuery = dbQuery.order('created_at', { ascending: false });
  }

  const response = await dbQuery;
  return { data: response.data, error: response.error };
};

export const getProductsByCategory = async (
  categorySlug: string
): Promise<SelectResponse<Product>> => {
  const categoryResponse = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .single();

  if (categoryResponse.error) {
    return { data: null, error: categoryResponse.error };
  }

  const category = categoryResponse.data as Category;

  // If it's a subcategory, get products directly
  if (category.is_subcategory) {
    const response = await supabase.from('products').select('*').eq('subcategory_id', category.id);

    return { data: response.data, error: response.error };
  }
  // If it's a main category, get all subcategories and then get products for each
  else {
    // Get all subcategories for this category
    const subcategoriesResponse = await supabase
      .from('categories')
      .select('id')
      .eq('parent_id', category.id)
      .eq('is_subcategory', true);

    if (
      subcategoriesResponse.error ||
      !subcategoriesResponse.data ||
      subcategoriesResponse.data.length === 0
    ) {
      // Fallback to old behavior if no subcategories
      const response = await supabase.from('products').select('*').eq('category_id', category.id);

      return { data: response.data, error: response.error };
    }

    // Get subcategory IDs
    const subcategoryIds = subcategoriesResponse.data.map(sub => sub.id);

    // Get products for all subcategories
    const response = await supabase
      .from('products')
      .select('*')
      .in('subcategory_id', subcategoryIds);

    return { data: response.data, error: response.error };
  }
};

export const getProductBySlug = async (
  slug: string
): Promise<{ data: ProductWithDetails | null; error: Error | null }> => {
  // Get the product
  const productResponse = await supabase.from('products').select('*').eq('slug', slug).single();

  if (productResponse.error) {
    return { data: null, error: productResponse.error };
  }

  const product = productResponse.data as Product;

  // Get the category (if available)
  let category = undefined;
  if (product.category_id) {
    const categoryResponse = await supabase
      .from('categories')
      .select('*')
      .eq('id', product.category_id)
      .single();

    if (!categoryResponse.error) {
      category = categoryResponse.data;
    }
  }

  // Get the subcategory (if available)
  let subcategory = undefined;
  if (product.subcategory_id) {
    const subcategoryResponse = await supabase
      .from('categories')
      .select('*')
      .eq('id', product.subcategory_id)
      .single();

    if (!subcategoryResponse.error) {
      subcategory = subcategoryResponse.data;
    }
  }

  // Get the images
  const imagesResponse = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true });

  // Get the specifications with template information
  const specificationsResponse = await supabase
    .from('product_specifications')
    .select(`
      *,
      template:template_id (*)
    `)
    .eq('product_id', product.id)
    .order('display_order', { ascending: true });

  // Get approved reviews
  const reviewsResponse = await supabase
    .from('reviews')
    .select(
      `
      *,
      user:user_profiles (
        first_name,
        last_name
      )
    `
    )
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  const productWithDetails: ProductWithDetails = {
    ...product,
    category,
    subcategory,
    images: imagesResponse.data || [],
    specifications: specificationsResponse.data || [],
    reviews: reviewsResponse.data || [],
  };

  return { data: productWithDetails, error: null };
};

export const getProductById = async (
  id: string
): Promise<{ data: ProductWithDetails | null; error: Error | null }> => {
  // Get the product
  const productResponse = await supabase.from('products').select('*').eq('id', id).single();

  if (productResponse.error) {
    return { data: null, error: productResponse.error };
  }

  const product = productResponse.data as Product;

  // Get the category (if available)
  let category = undefined;
  if (product.category_id) {
    const categoryResponse = await supabase
      .from('categories')
      .select('*')
      .eq('id', product.category_id)
      .single();

    if (!categoryResponse.error) {
      category = categoryResponse.data;
    }
  }

  // Get the subcategory (if available)
  let subcategory = undefined;
  if (product.subcategory_id) {
    const subcategoryResponse = await supabase
      .from('categories')
      .select('*')
      .eq('id', product.subcategory_id)
      .single();

    if (!subcategoryResponse.error) {
      subcategory = subcategoryResponse.data;
    }
  }

  // Get the images
  const imagesResponse = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true });

  // Get the specifications with template information
  const specificationsResponse = await supabase
    .from('product_specifications')
    .select(`
      *,
      template:template_id (*)
    `)
    .eq('product_id', product.id)
    .order('display_order', { ascending: true });

  // Get approved reviews
  const reviewsResponse = await supabase
    .from('reviews')
    .select(
      `
      *,
      user:user_profiles (
        first_name,
        last_name
      )
    `
    )
    .eq('product_id', product.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  const productWithDetails: ProductWithDetails = {
    ...product,
    category,
    subcategory,
    images: imagesResponse.data || [],
    specifications: specificationsResponse.data || [],
    reviews: reviewsResponse.data || [],
  };

  return { data: productWithDetails, error: null };
};

export const getRelatedProducts = async (
  productId: string,
  categoryId: string,
  limit = 4
): Promise<SelectResponse<Product>> => {
  const response = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .neq('id', productId)
    .limit(limit);

  return { data: response.data, error: response.error };
};

export const searchProducts = async (
  query: string,
  categorySlug?: string,
  subcategorySlug?: string,
  minPrice?: number,
  maxPrice?: number,
  sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'rating',
  inStockOnly?: boolean
): Promise<SelectResponse<Product>> => {
  let dbQuery = supabase
    .from('products')
    .select('*')
    .or(`title.ilike.%${query}%, description.ilike.%${query}%`);

  // Apply category filter if provided
  if (categorySlug && categorySlug !== 'all') {
    // First, get the category ID
    const categoryResponse = await supabase
      .from('categories')
      .select('*')
      .eq('slug', categorySlug)
      .single();

    if (!categoryResponse.error && categoryResponse.data) {
      const category = categoryResponse.data as Category;

      // If it's a subcategory, filter by subcategory_id
      if (category.is_subcategory) {
        dbQuery = dbQuery.eq('subcategory_id', category.id);
      }
      // If it's a main category, get all subcategories and filter by them
      else {
        // Get all subcategories for this category
        const subcategoriesResponse = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', category.id)
          .eq('is_subcategory', true);

        if (
          !subcategoriesResponse.error &&
          subcategoriesResponse.data &&
          subcategoriesResponse.data.length > 0
        ) {
          // Get subcategory IDs
          const subcategoryIds = subcategoriesResponse.data.map(sub => sub.id);

          // Filter by subcategory_id
          dbQuery = dbQuery.in('subcategory_id', subcategoryIds);
        } else {
          // Fallback to old behavior if no subcategories
          dbQuery = dbQuery.eq('category_id', category.id);
        }
      }
    }
  }

  // Apply subcategory filter if provided
  if (subcategorySlug) {
    const subcategoryResponse = await supabase
      .from('categories')
      .select('*')
      .eq('slug', subcategorySlug)
      .eq('is_subcategory', true)
      .single();

    if (!subcategoryResponse.error && subcategoryResponse.data) {
      dbQuery = dbQuery.eq('subcategory_id', subcategoryResponse.data.id);
    }
  }

  // Apply price range if provided
  if (minPrice !== undefined) {
    dbQuery = dbQuery.gte('price', minPrice);
  }
  if (maxPrice !== undefined) {
    dbQuery = dbQuery.lte('price', maxPrice);
  }

  // Apply in-stock filter if provided
  if (inStockOnly) {
    dbQuery = dbQuery.eq('in_stock', true);
  }

  // Apply sorting
  if (sortBy) {
    switch (sortBy) {
      case 'price-asc':
        dbQuery = dbQuery.order('price', { ascending: true });
        break;
      case 'price-desc':
        dbQuery = dbQuery.order('price', { ascending: false });
        break;
      case 'rating':
        dbQuery = dbQuery.order('rating', { ascending: false });
        break;
      case 'newest':
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
    }
  } else {
    // Default sorting by newest
    dbQuery = dbQuery.order('created_at', { ascending: false });
  }

  const response = await dbQuery;
  return { data: response.data, error: response.error };
};

// Categories
export const getCategories = async (): Promise<SelectResponse<Category>> => {
  // Get main categories (not subcategories)
  const response = await supabase
    .from('categories')
    .select('*')
    .eq('is_subcategory', false)
    .order('name');

  if (response.error || !response.data) {
    return { data: null, error: response.error };
  }

  // For each main category, get its subcategories
  const categoriesWithSubcategories = [...response.data];

  for (let i = 0; i < categoriesWithSubcategories.length; i++) {
    const subcategoriesResponse = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', categoriesWithSubcategories[i].id)
      .eq('is_subcategory', true)
      .order('name');

    if (subcategoriesResponse.data && subcategoriesResponse.data.length > 0) {
      categoriesWithSubcategories[i].subcategories = subcategoriesResponse.data;
    }
  }

  return { data: categoriesWithSubcategories, error: null };
};

// Get all categories (both main and subcategories) in a flat list
export const getAllCategories = async (): Promise<SelectResponse<Category>> => {
  const response = await supabase.from('categories').select('*').order('name');

  return { data: response.data, error: response.error };
};

export const getCategoryBySlug = async (
  slug: string
): Promise<{ data: Category | null; error: Error | null }> => {
  const response = await supabase.from('categories').select('*').eq('slug', slug).single();

  return { data: response.data, error: response.error };
};

export const getCategoryById = async (
  id: string
): Promise<{ data: Category | null; error: Error | null }> => {
  const response = await supabase.from('categories').select('*').eq('id', id).single();

  return { data: response.data, error: response.error };
};

export const getCategoryWithGoods = async (
  categorySlug: string
): Promise<{ data: CategoryWithGoods | null; error: Error | null }> => {
  // Get the category
  const categoryResponse = await supabase
    .from('categories')
    .select('*')
    .eq('slug', categorySlug)
    .single();

  if (categoryResponse.error) {
    return { data: null, error: categoryResponse.error };
  }

  const category = categoryResponse.data as Category;

  // If it's a subcategory, get its goods (products)
  if (category.is_subcategory) {
    const productsResponse = await supabase
      .from('products')
      .select('*')
      .eq('subcategory_id', category.id);

    const categoryWithGoods: CategoryWithGoods = {
      ...category,
      goods: productsResponse.data || [],
    };

    return { data: categoryWithGoods, error: null };
  }
  // If it's a main category, get its subcategories
  else {
    const subcategoriesResponse = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', category.id)
      .eq('is_subcategory', true)
      .order('name');

    // For each subcategory, get its goods
    const subcategoriesWithGoods: CategoryWithGoods[] = [];

    if (subcategoriesResponse.data) {
      for (const subcategory of subcategoriesResponse.data) {
        const productsResponse = await supabase
          .from('products')
          .select('*')
          .eq('subcategory_id', subcategory.id);

        subcategoriesWithGoods.push({
          ...subcategory,
          goods: productsResponse.data || [],
        });
      }
    }

    const categoryWithGoods: CategoryWithGoods = {
      ...category,
      subcategories: subcategoriesWithGoods,
    };

    return { data: categoryWithGoods, error: null };
  }
};

// Category Specification Templates
export const createCategorySpecificationTemplate = async (
  template: Omit<CategorySpecificationTemplate, 'id' | 'created_at' | 'updated_at'>
): Promise<InsertResponse<CategorySpecificationTemplate>> => {
  const response = await supabase
    .from('category_specification_templates')
    .insert(template)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const updateCategorySpecificationTemplate = async (
  id: string,
  template: Partial<Omit<CategorySpecificationTemplate, 'id' | 'created_at' | 'updated_at'>>
): Promise<UpdateResponse<CategorySpecificationTemplate>> => {
  const response = await supabase
    .from('category_specification_templates')
    .update({ ...template, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const deleteCategorySpecificationTemplate = async (id: string): Promise<DeleteResponse> => {
  // Check if any product specifications are using this template
  const { data: specs, error: checkError } = await supabase
    .from('product_specifications')
    .select('id')
    .eq('template_id', id);

  if (checkError) {
    return { error: checkError };
  }

  // If specifications are using this template, return an error
  if (specs && specs.length > 0) {
    return {
      error: new Error(
        `Cannot delete template because it is being used by ${specs.length} product specifications`
      ),
    };
  }

  // If no specifications are using this template, delete it
  const response = await supabase.from('category_specification_templates').delete().eq('id', id);
  return { error: response.error };
};

export const getCategorySpecificationTemplates = async (
  categoryId: string
): Promise<SelectResponse<CategorySpecificationTemplate>> => {
  const response = await supabase
    .from('category_specification_templates')
    .select('*')
    .eq('category_id', categoryId)
    .order('display_order', { ascending: true });

  return { data: response.data, error: response.error };
};

export const getCategorySpecificationTemplateById = async (
  id: string
): Promise<{ data: CategorySpecificationTemplate | null; error: Error | null }> => {
  const response = await supabase
    .from('category_specification_templates')
    .select('*')
    .eq('id', id)
    .single();

  return { data: response.data, error: response.error };
};

// Cart
export const getCartItems = async (userId: string): Promise<SelectResponse<CartItem>> => {
  const response = await supabase
    .from('cart_items')
    .select(
      `
      *,
      product:product_id (*)
    `
    )
    .eq('user_id', userId);

  return { data: response.data, error: response.error };
};

export const addToCart = async (
  userId: string,
  productId: string,
  quantity: number
): Promise<InsertResponse<CartItem>> => {
  // Check if the item is already in the cart
  const existingItem = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  if (existingItem.data) {
    // Update the quantity
    const response = await supabase
      .from('cart_items')
      .update({
        quantity: existingItem.data.quantity + quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingItem.data.id)
      .select()
      .single();

    return { data: response.data, error: response.error };
  } else {
    // Add new item
    const response = await supabase
      .from('cart_items')
      .insert({ user_id: userId, product_id: productId, quantity })
      .select()
      .single();

    return { data: response.data, error: response.error };
  }
};

export const updateCartItemQuantity = async (
  cartItemId: string,
  quantity: number
): Promise<UpdateResponse<CartItem>> => {
  const response = await supabase
    .from('cart_items')
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq('id', cartItemId)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const removeFromCart = async (cartItemId: string): Promise<DeleteResponse> => {
  const response = await supabase.from('cart_items').delete().eq('id', cartItemId);

  return { error: response.error };
};

export const clearCart = async (userId: string): Promise<DeleteResponse> => {
  const response = await supabase.from('cart_items').delete().eq('user_id', userId);

  return { error: response.error };
};

// Orders
export const createOrder = async (
  order: Omit<Order, 'id' | 'created_at' | 'updated_at'>,
  orderItems: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]
): Promise<{ data: Order | null; error: Error | null }> => {
  try {
    console.log('Creating order with data:', JSON.stringify(order, null, 2));

    // Validate required fields
    if (!order.user_id) {
      const error = new Error('user_id is required');
      console.error('Order validation error:', error);
      return { data: null, error };
    }

    if (!order.shipping_address) {
      const error = new Error('shipping_address is required');
      console.error('Order validation error:', error);
      return { data: null, error };
    }

    // Log the payment intent ID specifically
    console.log('Order payment_intent_id before insert:', order.payment_intent_id);

    // Insert the order first
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(order)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return { data: null, error: orderError };
    }

    console.log('Order created successfully:', JSON.stringify(orderData, null, 2));
    console.log('Order payment_intent_id after insert:', orderData.payment_intent_id);

    // Then insert the order items with the order_id
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: orderData.id
    }));

    console.log('Creating order items:', JSON.stringify(itemsWithOrderId, null, 2));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // If there's an error with the items, we should delete the order to avoid orphaned orders
      await supabase.from('orders').delete().eq('id', orderData.id);
      return { data: null, error: itemsError };
    }

    console.log('Order items created successfully');
    return { data: orderData, error: null };
  } catch (error) {
    console.error('Unexpected error in createOrder:', error);
    return { data: null, error: error as Error };
  }
};

export const getUserOrders = async (userId: string): Promise<SelectResponse<Order>> => {
  const response = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data: response.data, error: response.error };
};

export const getOrderById = async (
  orderId: string,
  userId: string
): Promise<{ data: OrderWithItems | null; error: Error | null }> => {
  // Get the order
  const orderResponse = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (orderResponse.error) {
    return { data: null, error: orderResponse.error };
  }

  // Get the order items
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
};

export const updateOrderByPaymentIntent = async (
  paymentIntentId: string,
  updates: Partial<Order>
): Promise<{ data: Order | null; error: Error | null }> => {
  try {
    if (!paymentIntentId) {
      const error = new Error('Payment intent ID is required');
      console.error(error.message);
      return { data: null, error };
    }

    console.log('Updating order by payment intent ID:', paymentIntentId);

    // First, check if any orders exist with this payment intent ID
    const { data: checkOrders, error: checkError } = await supabase
      .from('orders')
      .select('id, payment_intent_id')
      .eq('payment_intent_id', paymentIntentId);

    if (checkError) {
      console.error('Error checking orders by payment intent:', checkError);
      return { data: null, error: checkError };
    }

    console.log('Orders with this payment intent ID:', checkOrders);

    // If no orders found, try to find the most recent order for this user
    if (!checkOrders || checkOrders.length === 0) {
      console.log('No orders found with payment intent ID, trying to find most recent order');

      // Get the user ID from the updates if available
      const userId = updates.user_id;
      if (!userId) {
        const error = new Error('No orders found with this payment intent ID and no user ID provided');
        console.error(error.message);
        return { data: null, error };
      }

      // Find the most recent order for this user
      const { data: recentOrder, error: recentError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recentError) {
        console.error('Error finding recent order:', recentError);
        return { data: null, error: recentError };
      }

      if (!recentOrder) {
        const error = new Error(`No orders found for user: ${userId}`);
        console.error(error.message);
        return { data: null, error };
      }

      console.log('Found most recent order:', recentOrder);

      // Update the order with the payment intent ID
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ 
          ...updates, 
          payment_intent_id: paymentIntentId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', recentOrder.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating recent order:', updateError);
        return { data: null, error: updateError };
      }

      return { data: updatedOrder, error: null };
    }

    // Find the order by payment_intent_id
    const { data: existingOrder, error: findError } = await supabase
      .from('orders')
      .select('*')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (findError) {
      console.error('Error finding order by payment intent:', findError);
      return { data: null, error: findError };
    }

    if (!existingOrder) {
      const error = new Error(`No order found with payment intent ID: ${paymentIntentId}`);
      console.error(error.message);
      return { data: null, error };
    }

    // Update the order
    const { data, error: updateError } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', existingOrder.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return { data: null, error: updateError };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error in updateOrderByPaymentIntent:', error);
    return { data: null, error: error as Error };
  }
};

// User Roles
export const getUserRoles = async (): Promise<SelectResponse<UserRole>> => {
  const response = await supabase.from('user_roles').select('*').order('name');

  return { data: response.data, error: response.error };
};

export const getUserRoleById = async (
  roleId: string
): Promise<{ data: UserRole | null; error: Error | null }> => {
  const response = await supabase.from('user_roles').select('*').eq('id', roleId).single();

  return { data: response.data, error: response.error };
};

export const getUserRoleByName = async (
  roleName: string
): Promise<{ data: UserRole | null; error: Error | null }> => {
  const response = await supabase.from('user_roles').select('*').eq('name', roleName).single();

  return { data: response.data, error: response.error };
};

// User Profile
export const getUserProfile = async (
  userId: string
): Promise<{ data: UserProfile | null; error: Error | null }> => {
  const response = await supabase
    .from('user_profiles')
    .select(
      `
      *,
      role:role_id (*)
    `
    )
    .eq('id', userId)
    .single();

  return { data: response.data, error: response.error };
};

export const updateUserProfile = async (
  userId: string,
  profile: Partial<UserProfile>
): Promise<UpdateResponse<UserProfile>> => {
  const response = await supabase
    .from('user_profiles')
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  return { data: response.data, error: response.error };
};

// Reviews
export const addReview = async (
  review: Omit<Review, 'id' | 'created_at' | 'updated_at'>
): Promise<InsertResponse<Review>> => {
  const response = await supabase.from('reviews').insert(review).select().single();

  if (!response.error && review.is_approved) {
    // Update product rating and review count
    await updateProductRating(review.product_id);
  }

  return { data: response.data, error: response.error };
};

export const getUserReviews = async (userId: string): Promise<SelectResponse<Review>> => {
  const response = await supabase
    .from('reviews')
    .select(
      `
      *,
      product:product_id (
        title,
        main_image_url
      )
    `
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data: response.data, error: response.error };
};

export const getProductReviews = async (productId: string): Promise<SelectResponse<Review>> => {
  const response = await supabase
    .from('reviews')
    .select(
      `
      *,
      user:user_profiles (
        first_name,
        last_name
      )
    `
    )
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  return { data: response.data, error: response.error };
};

export const updateReview = async (
  reviewId: string,
  updates: Partial<Omit<Review, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'product_id'>>
): Promise<UpdateResponse<Review>> => {
  // First get the review to know which product to update
  const getResponse = await supabase
    .from('reviews')
    .select('product_id, is_approved')
    .eq('id', reviewId)
    .single();

  if (getResponse.error) {
    return { data: null, error: getResponse.error };
  }

  const productId = getResponse.data.product_id;
  const wasApproved = getResponse.data.is_approved;

  // Update the review
  const response = await supabase
    .from('reviews')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', reviewId)
    .select()
    .single();

  // If the review was updated successfully and is approved (or was approved)
  if (!response.error && (updates.is_approved || wasApproved)) {
    // Update product rating and review count
    await updateProductRating(productId);
  }

  return { data: response.data, error: response.error };
};

export const deleteReview = async (reviewId: string): Promise<DeleteResponse> => {
  // First get the review to know which product to update
  const getResponse = await supabase
    .from('reviews')
    .select('product_id')
    .eq('id', reviewId)
    .single();

  if (getResponse.error) {
    return { error: getResponse.error };
  }

  const productId = getResponse.data.product_id;

  // Delete the review
  const response = await supabase.from('reviews').delete().eq('id', reviewId);

  if (!response.error) {
    // Update product rating and review count
    await updateProductRating(productId);
  }

  return { error: response.error };
};

// Helper function to update product rating and review count
export const updateProductRating = async (productId: string): Promise<void> => {
  try {
    // Get all approved reviews for the product
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true);

    if (error) {
      console.error('Error fetching reviews for rating update:', error);
      return;
    }

    // Calculate new rating
    const reviewCount = reviews.length;
    let rating = 0;

    if (reviewCount > 0) {
      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      rating = sum / reviewCount;
    }

    // Update product
    await supabase
      .from('products')
      .update({
        rating,
        review_count: reviewCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId);
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
};

// Wishlist
export const getWishlistItems = async (userId: string): Promise<SelectResponse<WishlistItem>> => {
  const response = await supabase
    .from('wishlist_items')
    .select(
      `
      *,
      product:product_id (*)
    `
    )
    .eq('user_id', userId);

  return { data: response.data, error: response.error };
};

export const addToWishlist = async (
  userId: string,
  productId: string
): Promise<InsertResponse<WishlistItem>> => {
  const response = await supabase
    .from('wishlist_items')
    .insert({ user_id: userId, product_id: productId })
    .select()
    .single();

  return { data: response.data, error: response.error };
};

export const removeFromWishlist = async (wishlistItemId: string): Promise<DeleteResponse> => {
  const response = await supabase.from('wishlist_items').delete().eq('id', wishlistItemId);

  return { error: response.error };
};

export const isInWishlist = async (userId: string, productId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  return !!data;
};


// Homepage Content
export const getHomepageContent = async (): Promise<SelectResponse<HomepageContent>> => {
  const response = await supabase
    .from('homepage_content')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return { data: response.data, error: response.error };
};

export const getHomepageContentBySection = async (
  section: string
): Promise<SelectResponse<HomepageContent>> => {
  const response = await supabase
    .from('homepage_content')
    .select('*')
    .eq('section', section)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  return { data: response.data, error: response.error };
};

// Navigation Links
export const getNavigationLinks = async (
  groupName?: string
): Promise<SelectResponse<NavigationLink>> => {
  let query = supabase
    .from('navigation_links')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null) // Get only top-level links
    .order('display_order', { ascending: true });

  if (groupName) {
    query = query.eq('group_name', groupName);
  }

  const response = await query;

  // If we have data, get children for each top-level link
  if (response.data && response.data.length > 0) {
    const result = [...response.data];

    for (let i = 0; i < result.length; i++) {
      const childrenResponse = await supabase
        .from('navigation_links')
        .select('*')
        .eq('parent_id', result[i].id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (childrenResponse.data && childrenResponse.data.length > 0) {
        result[i].children = childrenResponse.data;
      }
    }

    return { data: result, error: response.error };
  }

  return { data: response.data, error: response.error };
};
