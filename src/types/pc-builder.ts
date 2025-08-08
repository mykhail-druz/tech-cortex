import { Product } from '@/lib/supabase/types/types';
import { CategoryFilterState } from './filters';

// PC Builder specific types

// Category information for PC Builder
export interface PCBuilderCategory {
  slug: string;
  name: string;
  displayName: string;
  icon?: string;
  maxComponents: number;
}

// Product card data for PC Builder
export interface PCBuilderProduct
  extends Pick<
    Product,
    'id' | 'title' | 'price' | 'rating' | 'brand' | 'main_image_url' | 'in_stock'
  > {
  categorySlug: string;
  specifications?: Record<string, string>;
}

// Selected component in the builder
export interface SelectedComponent {
  categorySlug: string;
  product: PCBuilderProduct;
  quantity: number;
}

// PC Builder configuration state
export interface PCBuilderConfiguration {
  components: Record<string, SelectedComponent>;
  totalPrice: number;
  estimatedPowerConsumption: number;
  compatibilityStatus: 'valid' | 'warning' | 'error';
  compatibilityIssues: string[];
}

// Category block state
export interface CategoryBlockState {
  isExpanded: boolean;
  selectedProduct: PCBuilderProduct | null;
  availableProducts: PCBuilderProduct[];
  isLoading: boolean;
  filterState: CategoryFilterState;
}

// PC Builder workspace state
export interface PCBuilderWorkspaceState {
  categories: Record<string, CategoryBlockState>;
  configuration: PCBuilderConfiguration;
  isLoading: boolean;
  error: string | null;
}

// Component selection event
export interface ComponentSelectionEvent {
  categorySlug: string;
  product: PCBuilderProduct;
  action: 'select' | 'remove';
}

// Category expansion event
export interface CategoryExpansionEvent {
  categorySlug: string;
  isExpanded: boolean;
}

// Mock data interfaces
export interface MockProductData {
  [categorySlug: string]: PCBuilderProduct[];
}

// Configuration summary data
export interface ConfigurationSummaryData {
  totalComponents: number;
  totalPrice: number;
  estimatedPowerConsumption: number;
  compatibilityStatus: 'valid' | 'warning' | 'error';
  missingCategories: string[];
  selectedComponents: SelectedComponent[];
}
