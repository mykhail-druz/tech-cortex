// Filter system types for PC Builder
import { PCBuilderProduct } from './pc-builder';

// Base filter interface
export interface BaseFilter {
  id: string;
  name: string;
  displayName: string;
  type: FilterType;
  isActive: boolean;
  isRequired?: boolean;
}

// Filter types supported by the system
export type FilterType = 
  | 'search'           // Text search
  | 'price_range'      // Price range with modal
  | 'enum'             // Single or multi-select from predefined values
  | 'number_range'     // Number range (cores, threads, etc.)
  | 'boolean'          // Boolean toggle
  | 'brand'            // Brand/manufacturer filter
  | 'availability';    // In stock filter

// Search filter for product names/titles
export interface SearchFilter extends BaseFilter {
  type: 'search';
  value: string;
  placeholder?: string;
}

// Price range filter with modal support
export interface PriceRangeFilter extends BaseFilter {
  type: 'price_range';
  value: {
    min: number | null;
    max: number | null;
  };
  range: {
    min: number;
    max: number;
  };
  currency?: string;
}

// Enum filter for predefined values (socket, manufacturer, etc.)
export interface EnumFilter extends BaseFilter {
  type: 'enum';
  value: string[];
  options: EnumFilterOption[];
  multiSelect: boolean;
}

export interface EnumFilterOption {
  value: string;
  label: string;
  count?: number; // Number of products with this value
}

// Number range filter for specifications like cores, threads
export interface NumberRangeFilter extends BaseFilter {
  type: 'number_range';
  value: {
    min: number | null;
    max: number | null;
  };
  range: {
    min: number;
    max: number;
  };
  unit?: string;
  step?: number;
}

// Boolean filter for yes/no specifications
export interface BooleanFilter extends BaseFilter {
  type: 'boolean';
  value: boolean | null; // null means "any"
}

// Brand filter (special case of enum filter)
export interface BrandFilter extends BaseFilter {
  type: 'brand';
  value: string[];
  options: EnumFilterOption[];
  multiSelect: boolean;
}

// Availability filter
export interface AvailabilityFilter extends BaseFilter {
  type: 'availability';
  value: 'all' | 'in_stock' | 'out_of_stock';
}

// Union type for all filters
export type Filter = 
  | SearchFilter
  | PriceRangeFilter
  | EnumFilter
  | NumberRangeFilter
  | BooleanFilter
  | BrandFilter
  | AvailabilityFilter;

// Filter state for a category
export interface CategoryFilterState {
  filters: Filter[];
  activeFiltersCount: number;
  isFilterPanelOpen: boolean;
}

// Filter application result
export interface FilterResult {
  filteredProducts: PCBuilderProduct[];
  totalCount: number;
  appliedFilters: Filter[];
}

// Filter configuration for a category (based on specifications)
export interface CategoryFilterConfig {
  categorySlug: string;
  availableFilters: FilterConfig[];
}

export interface FilterConfig {
  id: string;
  name: string;
  displayName: string;
  type: FilterType;
  isRequired?: boolean;
  options?: {
    multiSelect?: boolean;
    enumValues?: string[];
    unit?: string;
    step?: number;
    placeholder?: string;
  };
}

// Filter update actions
export type FilterAction = 
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'SET_PRICE_RANGE'; value: { min: number | null; max: number | null } }
  | { type: 'SET_ENUM_VALUES'; filterId: string; values: string[] }
  | { type: 'SET_NUMBER_RANGE'; filterId: string; value: { min: number | null; max: number | null } }
  | { type: 'SET_BOOLEAN'; filterId: string; value: boolean | null }
  | { type: 'SET_AVAILABILITY'; value: 'all' | 'in_stock' | 'out_of_stock' }
  | { type: 'CLEAR_FILTER'; filterId: string }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'TOGGLE_FILTER_PANEL' };

// Filter validation result
export interface FilterValidationResult {
  isValid: boolean;
  errors: string[];
}