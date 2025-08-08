import { PCBuilderProduct } from '@/types/pc-builder';
import {
  Filter,
  FilterResult,
  CategoryFilterConfig,
  FilterConfig,
  SearchFilter,
  PriceRangeFilter,
  EnumFilter,
  NumberRangeFilter,
  BooleanFilter,
  BrandFilter,
  AvailabilityFilter,
  EnumFilterOption,
  CategoryFilterState,
} from '@/types/filters';
import { getTemplatesForCategorySlug } from '@/lib/specifications/categoryTemplates';

/**
 * FilterService handles all filter-related operations for the PC Builder
 * Provides methods to generate filters from specifications, apply filters to products,
 * and manage filter state
 */
export class FilterService {
  /**
   * Generate filter configuration for a category based on its specification templates
   */
  static generateFiltersForCategory(categorySlug: string): CategoryFilterConfig {
    const templates = getTemplatesForCategorySlug(categorySlug);
    const availableFilters: FilterConfig[] = [];

    // Always add common filters
    availableFilters.push(
      {
        id: 'search',
        name: 'search',
        displayName: 'Search',
        type: 'search',
        options: { placeholder: 'Search products...' },
      },
      {
        id: 'price_range',
        name: 'price_range',
        displayName: 'Price Range',
        type: 'price_range',
      },
      {
        id: 'brand',
        name: 'brand',
        displayName: 'Brand',
        type: 'brand',
        options: { multiSelect: true },
      },
      {
        id: 'availability',
        name: 'availability',
        displayName: 'Availability',
        type: 'availability',
      }
    );

    // Add specification-based filters
    templates
      .filter(template => template.is_filter)
      .forEach(template => {
        const filterConfig: FilterConfig = {
          id: template.name,
          name: template.name,
          displayName: template.display_name,
          type: this.mapTemplateTypeToFilterType(template.data_type),
          isRequired: template.is_required,
          options: {
            unit: template.unit,
            enumValues: template.enum_values,
            multiSelect: template.data_type === 'enum',
          },
        };

        availableFilters.push(filterConfig);
      });

    return {
      categorySlug,
      availableFilters,
    };
  }

  /**
   * Create initial filter state for a category
   */
  static createInitialFilterState(
    categorySlug: string,
    products: PCBuilderProduct[]
  ): CategoryFilterState {
    const config = this.generateFiltersForCategory(categorySlug, products);
    const filters = this.createFiltersFromConfig(config, products);

    return {
      filters,
      activeFiltersCount: 0,
      isFilterPanelOpen: false,
    };
  }

  /**
   * Create actual filter instances from configuration
   */
  static createFiltersFromConfig(
    config: CategoryFilterConfig,
    products: PCBuilderProduct[]
  ): Filter[] {
    const filters: Filter[] = [];

    config.availableFilters.forEach(filterConfig => {
      switch (filterConfig.type) {
        case 'search':
          filters.push(this.createSearchFilter(filterConfig));
          break;
        case 'price_range':
          filters.push(this.createPriceRangeFilter(filterConfig, products));
          break;
        case 'brand':
          filters.push(this.createBrandFilter(filterConfig, products));
          break;
        case 'availability':
          filters.push(this.createAvailabilityFilter(filterConfig));
          break;
        case 'enum':
          filters.push(this.createEnumFilter(filterConfig, products));
          break;
        case 'number_range':
          filters.push(this.createNumberRangeFilter(filterConfig, products));
          break;
        case 'boolean':
          filters.push(this.createBooleanFilter(filterConfig));
          break;
      }
    });

    return filters;
  }

  /**
   * Apply all active filters to products
   */
  static applyFilters(products: PCBuilderProduct[], filters: Filter[]): FilterResult {
    let filteredProducts = [...products];
    const appliedFilters = filters.filter(filter => filter.isActive);

    appliedFilters.forEach(filter => {
      filteredProducts = this.applyFilter(filteredProducts, filter);
    });

    return {
      filteredProducts,
      totalCount: filteredProducts.length,
      appliedFilters,
    };
  }

  /**
   * Apply a single filter to products
   */
  private static applyFilter(products: PCBuilderProduct[], filter: Filter): PCBuilderProduct[] {
    switch (filter.type) {
      case 'search':
        return this.applySearchFilter(products, filter as SearchFilter);
      case 'price_range':
        return this.applyPriceRangeFilter(products, filter as PriceRangeFilter);
      case 'brand':
        return this.applyBrandFilter(products, filter as BrandFilter);
      case 'availability':
        return this.applyAvailabilityFilter(products, filter as AvailabilityFilter);
      case 'enum':
        return this.applyEnumFilter(products, filter as EnumFilter);
      case 'number_range':
        return this.applyNumberRangeFilter(products, filter as NumberRangeFilter);
      case 'boolean':
        return this.applyBooleanFilter(products, filter as BooleanFilter);
      default:
        return products;
    }
  }

  /**
   * Apply search filter
   */
  private static applySearchFilter(
    products: PCBuilderProduct[],
    filter: SearchFilter
  ): PCBuilderProduct[] {
    if (!filter.value.trim()) return products;

    const searchTerm = filter.value.toLowerCase();
    return products.filter(
      product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Apply price range filter
   */
  private static applyPriceRangeFilter(
    products: PCBuilderProduct[],
    filter: PriceRangeFilter
  ): PCBuilderProduct[] {
    return products.filter(product => {
      if (filter.value.min !== null && product.price < filter.value.min) {
        return false;
      }
      if (filter.value.max !== null && product.price > filter.value.max) {
        return false;
      }
      return true;
    });
  }

  /**
   * Apply brand filter
   */
  private static applyBrandFilter(
    products: PCBuilderProduct[],
    filter: BrandFilter
  ): PCBuilderProduct[] {
    if (filter.value.length === 0) return products;

    return products.filter(product => product.brand && filter.value.includes(product.brand));
  }

  /**
   * Apply availability filter
   */
  private static applyAvailabilityFilter(
    products: PCBuilderProduct[],
    filter: AvailabilityFilter
  ): PCBuilderProduct[] {
    switch (filter.value) {
      case 'in_stock':
        return products.filter(product => product.in_stock);
      case 'out_of_stock':
        return products.filter(product => !product.in_stock);
      default:
        return products;
    }
  }

  /**
   * Apply enum filter (for specifications)
   */
  private static applyEnumFilter(
    products: PCBuilderProduct[],
    filter: EnumFilter
  ): PCBuilderProduct[] {
    if (filter.value.length === 0) return products;

    return products.filter(product => {
      const specValue = product.specifications?.[filter.name];
      return specValue && filter.value.includes(specValue);
    });
  }

  /**
   * Apply number range filter (for specifications)
   */
  private static applyNumberRangeFilter(
    products: PCBuilderProduct[],
    filter: NumberRangeFilter
  ): PCBuilderProduct[] {
    return products.filter(product => {
      const specValue = product.specifications?.[filter.name];
      if (!specValue) return false;

      const numValue = parseFloat(specValue);
      if (isNaN(numValue)) return false;

      if (filter.value.min !== null && numValue < filter.value.min) {
        return false;
      }
      if (filter.value.max !== null && numValue > filter.value.max) {
        return false;
      }
      return true;
    });
  }

  /**
   * Apply boolean filter (for specifications)
   */
  private static applyBooleanFilter(
    products: PCBuilderProduct[],
    filter: BooleanFilter
  ): PCBuilderProduct[] {
    if (filter.value === null) return products;

    return products.filter(product => {
      const specValue = product.specifications?.[filter.name];
      if (!specValue) return false;

      const boolValue = specValue.toLowerCase() === 'true' || specValue === '1';
      return boolValue === filter.value;
    });
  }

  /**
   * Create search filter
   */
  private static createSearchFilter(config: FilterConfig): SearchFilter {
    return {
      id: config.id,
      name: config.name,
      displayName: config.displayName,
      type: 'search',
      isActive: false,
      value: '',
      placeholder: config.options?.placeholder || 'Search...',
    };
  }

  /**
   * Create price range filter
   */
  private static createPriceRangeFilter(
    config: FilterConfig,
    products: PCBuilderProduct[]
  ): PriceRangeFilter {
    const prices = products.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return {
      id: config.id,
      name: config.name,
      displayName: config.displayName,
      type: 'price_range',
      isActive: false,
      value: { min: null, max: null },
      range: { min: minPrice, max: maxPrice },
      currency: 'USD',
    };
  }

  /**
   * Create brand filter
   */
  private static createBrandFilter(
    config: FilterConfig,
    products: PCBuilderProduct[]
  ): BrandFilter {
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const options: EnumFilterOption[] = brands.map(brand => ({
      value: brand!,
      label: brand!,
      count: products.filter(p => p.brand === brand).length,
    }));

    return {
      id: config.id,
      name: config.name,
      displayName: config.displayName,
      type: 'brand',
      isActive: false,
      value: [],
      options,
      multiSelect: true,
    };
  }

  /**
   * Create availability filter
   */
  private static createAvailabilityFilter(config: FilterConfig): AvailabilityFilter {
    return {
      id: config.id,
      name: config.name,
      displayName: config.displayName,
      type: 'availability',
      isActive: false,
      value: 'all',
    };
  }

  /**
   * Create enum filter for specifications
   */
  private static createEnumFilter(config: FilterConfig, products: PCBuilderProduct[]): EnumFilter {
    const specValues = products.map(p => p.specifications?.[config.name]).filter(Boolean);

    const uniqueValues = [...new Set(specValues)];
    const options: EnumFilterOption[] = uniqueValues.map(value => ({
      value: value!,
      label: value!,
      count: products.filter(p => p.specifications?.[config.name] === value).length,
    }));

    return {
      id: config.id,
      name: config.name,
      displayName: config.displayName,
      type: 'enum',
      isActive: false,
      value: [],
      options,
      multiSelect: config.options?.multiSelect ?? true,
    };
  }

  /**
   * Create number range filter for specifications
   */
  private static createNumberRangeFilter(
    config: FilterConfig,
    products: PCBuilderProduct[]
  ): NumberRangeFilter {
    const specValues = products
      .map(p => p.specifications?.[config.name])
      .filter(Boolean)
      .map(v => parseFloat(v!))
      .filter(v => !isNaN(v));

    // Handle empty arrays gracefully
    const minValue = specValues.length > 0 ? Math.min(...specValues) : 0;
    const maxValue = specValues.length > 0 ? Math.max(...specValues) : 100;

    return {
      id: config.id,
      name: config.name,
      displayName: config.displayName,
      type: 'number_range',
      isActive: false,
      value: { min: null, max: null },
      range: { min: minValue, max: maxValue },
      unit: config.options?.unit,
      step: config.options?.step || 1,
    };
  }

  /**
   * Create boolean filter for specifications
   */
  private static createBooleanFilter(config: FilterConfig): BooleanFilter {
    return {
      id: config.id,
      name: config.name,
      displayName: config.displayName,
      type: 'boolean',
      isActive: false,
      value: null,
    };
  }

  /**
   * Map specification template data type to filter type
   */
  private static mapTemplateTypeToFilterType(
    dataType: string
  ): 'enum' | 'number_range' | 'boolean' {
    switch (dataType) {
      case 'enum':
        return 'enum';
      case 'number':
        return 'number_range';
      case 'boolean':
        return 'boolean';
      default:
        return 'enum'; // Default fallback
    }
  }

  /**
   * Update filter value and return new filter state
   */
  static updateFilter(
    filterState: CategoryFilterState,
    filterId: string,
    value:
      | string
      | string[]
      | { min: number | null; max: number | null }
      | boolean
      | null
      | 'all'
      | 'in_stock'
      | 'out_of_stock'
  ): CategoryFilterState {
    const updatedFilters = filterState.filters.map(filter => {
      if (filter.id !== filterId) return filter;

      const updatedFilter = { ...filter };

      // Update the filter value based on type
      switch (filter.type) {
        case 'search':
          (updatedFilter as SearchFilter).value = value;
          break;
        case 'price_range':
          (updatedFilter as PriceRangeFilter).value = value;
          break;
        case 'enum':
        case 'brand':
          (updatedFilter as EnumFilter | BrandFilter).value = value;
          break;
        case 'number_range':
          (updatedFilter as NumberRangeFilter).value = value;
          break;
        case 'boolean':
          (updatedFilter as BooleanFilter).value = value;
          break;
        case 'availability':
          (updatedFilter as AvailabilityFilter).value = value;
          break;
      }

      // Update isActive status
      updatedFilter.isActive = this.isFilterActive(updatedFilter);

      return updatedFilter;
    });

    const activeFiltersCount = updatedFilters.filter(f => f.isActive).length;

    return {
      ...filterState,
      filters: updatedFilters,
      activeFiltersCount,
    };
  }

  /**
   * Check if a filter is active (has a meaningful value)
   */
  private static isFilterActive(filter: Filter): boolean {
    switch (filter.type) {
      case 'search':
        return (filter as SearchFilter).value.trim() !== '';
      case 'price_range':
        const priceFilter = filter as PriceRangeFilter;
        return priceFilter.value.min !== null || priceFilter.value.max !== null;
      case 'enum':
      case 'brand':
        return (filter as EnumFilter | BrandFilter).value.length > 0;
      case 'number_range':
        const numberFilter = filter as NumberRangeFilter;
        return numberFilter.value.min !== null || numberFilter.value.max !== null;
      case 'boolean':
        return (filter as BooleanFilter).value !== null;
      case 'availability':
        return (filter as AvailabilityFilter).value !== 'all';
      default:
        return false;
    }
  }

  /**
   * Clear all filters
   */
  static clearAllFilters(filterState: CategoryFilterState): CategoryFilterState {
    const clearedFilters = filterState.filters.map(filter => {
      const clearedFilter = { ...filter, isActive: false };

      switch (filter.type) {
        case 'search':
          (clearedFilter as SearchFilter).value = '';
          break;
        case 'price_range':
          (clearedFilter as PriceRangeFilter).value = { min: null, max: null };
          break;
        case 'enum':
        case 'brand':
          (clearedFilter as EnumFilter | BrandFilter).value = [];
          break;
        case 'number_range':
          (clearedFilter as NumberRangeFilter).value = { min: null, max: null };
          break;
        case 'boolean':
          (clearedFilter as BooleanFilter).value = null;
          break;
        case 'availability':
          (clearedFilter as AvailabilityFilter).value = 'all';
          break;
      }

      return clearedFilter;
    });

    return {
      ...filterState,
      filters: clearedFilters,
      activeFiltersCount: 0,
    };
  }
}
