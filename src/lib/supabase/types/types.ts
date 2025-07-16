import {
  SpecificationDataType,
  SpecificationValidationRule,
  SPECIFICATION_ENUMS,
} from './specifications';

// TypeScript types for Supabase database tables

// Homepage Content type
export interface HomepageContent {
  id: string;
  section: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  cta_text: string | null;
  cta_link: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Navigation Link type
export interface NavigationLink {
  id: string;
  title: string;
  url: string;
  parent_id: string | null;
  group_name: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  children?: NavigationLink[];
}

// Category type
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon_url: string | null;
  parent_id: string | null;
  is_subcategory: boolean;
  created_at: string;
  updated_at: string;

  // New fields for PC configurator
  pc_component_type?: string | null;
  pc_icon?: string | null; // Deprecated: Use icon_url instead
  pc_required?: boolean | null;
  pc_supports_multiple?: boolean | null;
  pc_display_order?: number | null;

  subcategories?: Category[];
}

// Subcategory with goods
export interface CategoryWithGoods extends Category {
  goods?: Product[];
}

// Product type
export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  old_price: number | null;
  discount_percentage: number | null;
  main_image_url: string | null;
  category_id: string | null; // For backward compatibility
  subcategory_id: string | null;
  brand: string | null;
  rating: number;
  review_count: number;
  in_stock: boolean;
  sku: string | null;
  tax_code: string | null; // Stripe Tax code for product tax calculation
  created_at: string;
  updated_at: string;
}

// Product with related data
export interface ProductWithDetails extends Product {
  category?: Category;
  subcategory?: Category;
  images?: ProductImage[];
  specifications?: (ProductSpecification & {
    template?: CategorySpecificationTemplate;
  })[];
  reviews?: Review[];
}

// Product Image type
export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  is_main: boolean;
  display_order: number;
  created_at: string;
}

// Category Specification Template type
export interface CategorySpecificationTemplate {
  id: string;
  category_id: string;
  name: string;
  display_name: string;
  description?: string;
  data_type: SpecificationDataType;

  // КРИТИЧЕСКИ ВАЖНО - строгая типизация!
  enum_values: string[];
  enum_source?: keyof typeof SPECIFICATION_ENUMS; // Указывает источник enum'а

  validation_rules: SpecificationValidationRule;
  is_required: boolean;
  is_filterable: boolean;
  is_compatibility_key: boolean; // Влияет на совместимость!

  display_order?: number;
  filter_order?: number;
  filter_type?: 'checkbox' | 'dropdown' | 'range' | 'search';
}

// Product Specification type
export interface ProductSpecification {
  id: string;
  product_id: string;
  template_id: string | null;
  name: string;
  value: string;
  display_order: number;
}

// User Role type
export interface UserRole {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// User Profile type
export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  role_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  role?: UserRole;
}

// Order type
export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  tax_amount: number | null; // Tax amount calculated for the order
  shipping_address: string;
  billing_address: string | null;
  payment_method: string | null;
  payment_status: PaymentStatus;
  payment_intent_id: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Order with items
export interface OrderWithItems extends Order {
  items: OrderItem[];
}

// Order Item type
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  created_at: string;
  product?: Product;
}

// Cart Item type
export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

// Review type
export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
  };
}

// Wishlist Item type
export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

// Enums
export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Database response types
export type InsertResponse<T> = {
  data: T | null;
  error: Error | null;
};

export type UpdateResponse<T> = {
  data: T | null;
  error: Error | null;
};

export type DeleteResponse = {
  error: Error | null;
};

export type SelectResponse<T> = {
  data: T[] | null;
  error: Error | null;
};

export interface StandardFilter {
  id: string;
  name: string;
  displayName: string;
  type: 'checkbox' | 'dropdown' | 'range' | 'search' | 'color' | 'size';
  category: 'general' | 'technical' | 'physical' | 'visual';
  priority: number; // Порядок отображения

  // Для разных типов данных
  options?: FilterOption[];
  range?: { min: number; max: number; step?: number };
  unit?: string; // GB, MHz, mm и т.д.

  // Логика группировки
  groupBy?: 'range' | 'exact' | 'contains';

  // Настройки отображения
  showCount?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  maxVisibleOptions?: number;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  color?: string; // Для цветовых фильтров
  image?: string; // Для брендов
}
