import { supabase } from '@/lib/supabaseClient';
import {
  Product,
  ProductWithDetails,
  Category,
  ProductImage,
  ProductSpecification,
  CartItem,
  Order,
  OrderItem,
  Review,
  UserProfile,
  UserRole,
  WishlistItem,
  Setting,
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

        if (!subcategoriesResponse.error && subcategoriesResponse.data && subcategoriesResponse.data.length > 0) {
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
    const response = await supabase
      .from('products')
      .select('*')
      .eq('subcategory_id', category.id);

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

    if (subcategoriesResponse.error || !subcategoriesResponse.data || subcategoriesResponse.data.length === 0) {
      // Fallback to old behavior if no subcategories
      const response = await supabase
        .from('products')
        .select('*')
        .eq('category_id', category.id);

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

  // Get the specifications
  const specificationsResponse = await supabase
    .from('product_specifications')
    .select('*')
    .eq('product_id', product.id)
    .order('display_order', { ascending: true });

  // Get approved reviews
  const reviewsResponse = await supabase
    .from('reviews')
    .select(
      `
      *,
      user:user_id (
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

        if (!subcategoriesResponse.error && subcategoriesResponse.data && subcategoriesResponse.data.length > 0) {
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
  const response = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return { data: response.data, error: response.error };
};

export const getCategoryBySlug = async (
  slug: string
): Promise<{ data: Category | null; error: Error | null }> => {
  const response = await supabase.from('categories').select('*').eq('slug', slug).single();

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
      goods: productsResponse.data || []
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
          goods: productsResponse.data || []
        });
      }
    }

    const categoryWithGoods: CategoryWithGoods = {
      ...category,
      subcategories: subcategoriesWithGoods
    };

    return { data: categoryWithGoods, error: null };
  }
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
  // Start a transaction
  const { data, error } = await supabase.rpc('create_order', {
    order_data: order,
    order_items_data: orderItems,
  });

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
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

// Settings
export const getSetting = async (
  key: string
): Promise<{ data: Setting | null; error: Error | null }> => {
  const response = await supabase.from('settings').select('*').eq('key', key).single();

  return { data: response.data, error: response.error };
};

export const getSettings = async (keys?: string[]): Promise<SelectResponse<Setting>> => {
  let query = supabase.from('settings').select('*');

  if (keys && keys.length > 0) {
    query = query.in('key', keys);
  }

  const response = await query;
  return { data: response.data, error: response.error };
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
