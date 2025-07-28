// PC Configurations Types
// Types for the PC configurations management system

import { Product } from './types';

// Base configuration interface
export interface PCConfiguration {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  total_price?: number;
  power_consumption?: number;
  recommended_psu_power?: number;
  compatibility_status: 'valid' | 'warning' | 'error';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Configuration component interface
export interface PCConfigurationComponent {
  id: string;
  configuration_id: string;
  category_slug: string;
  product_id: string;
  quantity: number;
  created_at: string;
}

// Extended configuration with components and products
export interface PCConfigurationWithComponents extends PCConfiguration {
  components: PCConfigurationComponentWithProduct[];
  component_count: number;
}

// Component with full product details
export interface PCConfigurationComponentWithProduct extends PCConfigurationComponent {
  product: Product;
}

// Configuration summary for list views
export interface PCConfigurationSummary {
  id: string;
  name: string;
  description?: string;
  total_price?: number;
  power_consumption?: number;
  recommended_psu_power?: number;
  compatibility_status: 'valid' | 'warning' | 'error';
  is_public: boolean;
  created_at: string;
  updated_at: string;
  component_count: number;
}

// Request types for API
export interface CreatePCConfigurationRequest {
  name: string;
  description?: string;
  components: Record<string, string | string[]>; // category_slug -> product_id(s)
  total_price?: number;
  power_consumption?: number;
  recommended_psu_power?: number;
  compatibility_status: 'valid' | 'warning' | 'error';
  is_public?: boolean;
}

export interface UpdatePCConfigurationRequest {
  name?: string;
  description?: string;
  components?: Record<string, string | string[]>;
  total_price?: number;
  power_consumption?: number;
  recommended_psu_power?: number;
  compatibility_status?: 'valid' | 'warning' | 'error';
  is_public?: boolean;
}

// Response types for API
export interface PCConfigurationResponse {
  success: boolean;
  data?: PCConfiguration;
  error?: string;
}

export interface PCConfigurationListResponse {
  success: boolean;
  data?: PCConfigurationSummary[];
  error?: string;
}

export interface PCConfigurationWithComponentsResponse {
  success: boolean;
  data?: PCConfigurationWithComponents;
  error?: string;
}

// Utility types for component management
export interface ComponentsByCategory {
  [categorySlug: string]: {
    products: Product[];
    quantity: number;
  };
}

// Configuration validation result
export interface ConfigurationValidationResult {
  isValid: boolean;
  hasRequiredComponents: boolean;
  missingCategories: string[];
  totalPrice: number;
  powerConsumption: number;
  recommendedPsuPower: number;
}

// Configuration export/import types
export interface ConfigurationExport {
  name: string;
  description?: string;
  components: {
    category_slug: string;
    product_sku?: string;
    product_title: string;
    quantity: number;
  }[];
  metadata: {
    total_price: number;
    power_consumption: number;
    recommended_psu_power: number;
    compatibility_status: string;
    created_at: string;
  };
}

// Filter and sort options for configurations list
export interface ConfigurationListFilters {
  search?: string;
  compatibility_status?: 'valid' | 'warning' | 'error';
  price_min?: number;
  price_max?: number;
  is_public?: boolean;
}

export interface ConfigurationListSort {
  field: 'name' | 'created_at' | 'updated_at' | 'total_price' | 'component_count';
  direction: 'asc' | 'desc';
}

export interface ConfigurationListOptions {
  filters?: ConfigurationListFilters;
  sort?: ConfigurationListSort;
  limit?: number;
  offset?: number;
}

// Constants for configuration management
export const CONFIGURATION_LIMITS = {
  MAX_NAME_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_CONFIGURATIONS_PER_USER: 50,
  MAX_COMPONENTS_PER_CONFIGURATION: 20,
} as const;

export const COMPATIBILITY_STATUS_LABELS = {
  valid: 'Compatible',
  warning: 'Has Warnings',
  error: 'Has Errors',
} as const;

export const COMPATIBILITY_STATUS_COLORS = {
  valid: 'green',
  warning: 'yellow',
  error: 'red',
} as const;

// Helper function types
export type ConfigurationComponentsMap = Record<string, string | string[]>;
export type ConfigurationValidator = (components: ConfigurationComponentsMap) => ConfigurationValidationResult;
export type ConfigurationExporter = (config: PCConfigurationWithComponents) => ConfigurationExport;