// lib/config/standardFilterConfig.ts
import { SpecificationDataType } from '@/lib/supabase/types/specifications';

/**
 * Standardized filter configuration for e-commerce best practices
 * 
 * This configuration defines how product specifications should be mapped to user-friendly filters
 * following e-commerce best practices:
 * 1. Consistent organization (primary filters, technical specs, etc.)
 * 2. Intuitive grouping (price ranges, memory sizes, etc.)
 * 3. Prioritization of most important filters
 * 4. Standardized display formats
 */
export const STANDARD_FILTER_CONFIG = {
  // Filter categories with display order
  CATEGORIES: {
    PRIMARY: {
      id: 'primary',
      displayName: 'Primary Filters',
      priority: 1,
      alwaysExpanded: true,
    },
    TECHNICAL: {
      id: 'technical',
      displayName: 'Technical Specifications',
      priority: 2,
      alwaysExpanded: false,
    },
    PHYSICAL: {
      id: 'physical',
      displayName: 'Physical Characteristics',
      priority: 3,
      alwaysExpanded: false,
    },
    COMPATIBILITY: {
      id: 'compatibility',
      displayName: 'Compatibility',
      priority: 4,
      alwaysExpanded: false,
    },
    OTHER: {
      id: 'other',
      displayName: 'Other Specifications',
      priority: 5,
      alwaysExpanded: false,
    },
  },

  // Standard filter definitions with consistent display properties
  FILTERS: {
    // Primary filters (always shown)
    PRICE: {
      id: 'price',
      name: 'price',
      displayName: 'Price',
      category: 'primary',
      type: 'range',
      priority: 10,
      unit: '$',
      showCount: false,
      defaultExpanded: true,
      ranges: [
        { min: 0, max: 100, label: 'Under $100' },
        { min: 100, max: 250, label: '$100 - $250' },
        { min: 250, max: 500, label: '$250 - $500' },
        { min: 500, max: 1000, label: '$500 - $1000' },
        { min: 1000, max: 2000, label: '$1000 - $2000' },
        { min: 2000, max: 999999, label: 'Over $2000' },
      ],
    },
    BRAND: {
      id: 'brand',
      name: 'brand',
      displayName: 'Brand',
      category: 'primary',
      type: 'checkbox',
      priority: 20,
      maxVisibleOptions: 8,
      showCount: true,
      defaultExpanded: true,
    },
    RATING: {
      id: 'rating',
      name: 'rating',
      displayName: 'Rating',
      category: 'primary',
      type: 'checkbox',
      priority: 30,
      options: [
        { value: '4+', label: '4★ & up' },
        { value: '3+', label: '3★ & up' },
      ],
      defaultExpanded: true,
    },
    AVAILABILITY: {
      id: 'inStock',
      name: 'inStock',
      displayName: 'Availability',
      category: 'primary',
      type: 'checkbox',
      priority: 40,
      options: [{ value: 'true', label: 'In Stock' }],
      defaultExpanded: true,
    },

    // Technical specifications mapping
    // CPU related
    CPU_SOCKET: {
      specName: 'socket',
      displayName: 'Socket',
      category: 'technical',
      type: 'dropdown',
      priority: 100,
      dataType: SpecificationDataType.SOCKET,
      defaultExpanded: false,
    },
    CPU_CORES: {
      specName: 'cores',
      displayName: 'CPU Cores',
      category: 'technical',
      type: 'checkbox',
      priority: 110,
      dataType: SpecificationDataType.NUMBER,
      defaultExpanded: false,
    },
    CPU_FREQUENCY: {
      specName: 'frequency',
      displayName: 'CPU Frequency',
      category: 'technical',
      type: 'range',
      priority: 120,
      dataType: SpecificationDataType.FREQUENCY,
      unit: 'GHz',
      defaultExpanded: false,
    },

    // Memory related
    MEMORY_TYPE: {
      specName: 'memory_type',
      displayName: 'Memory Type',
      category: 'technical',
      type: 'dropdown',
      priority: 200,
      dataType: SpecificationDataType.MEMORY_TYPE,
      defaultExpanded: false,
    },
    MEMORY_SIZE: {
      specName: 'memory_size',
      displayName: 'Memory Size',
      category: 'technical',
      type: 'checkbox',
      priority: 210,
      dataType: SpecificationDataType.MEMORY_SIZE,
      unit: 'GB',
      defaultExpanded: false,
      standardValues: ['4GB', '8GB', '16GB', '32GB', '64GB'],
    },
    MEMORY_SPEED: {
      specName: 'memory_speed',
      displayName: 'Memory Speed',
      category: 'technical',
      type: 'checkbox',
      priority: 220,
      dataType: SpecificationDataType.FREQUENCY,
      unit: 'MHz',
      defaultExpanded: false,
    },

    // GPU related
    GPU_MEMORY: {
      specName: 'gpu_memory',
      displayName: 'GPU Memory',
      category: 'technical',
      type: 'checkbox',
      priority: 300,
      dataType: SpecificationDataType.MEMORY_SIZE,
      unit: 'GB',
      defaultExpanded: false,
      standardValues: ['2GB', '4GB', '6GB', '8GB', '10GB', '12GB', '16GB', '24GB'],
    },
    GPU_TYPE: {
      specName: 'gpu_type',
      displayName: 'GPU Type',
      category: 'technical',
      type: 'dropdown',
      priority: 310,
      dataType: SpecificationDataType.TEXT,
      defaultExpanded: false,
    },

    // Storage related
    STORAGE_TYPE: {
      specName: 'storage_type',
      displayName: 'Storage Type',
      category: 'technical',
      type: 'checkbox',
      priority: 400,
      dataType: SpecificationDataType.TEXT,
      defaultExpanded: false,
      standardValues: ['SSD', 'HDD', 'NVMe'],
    },
    STORAGE_CAPACITY: {
      specName: 'storage_capacity',
      displayName: 'Storage Capacity',
      category: 'technical',
      type: 'checkbox',
      priority: 410,
      dataType: SpecificationDataType.MEMORY_SIZE,
      unit: 'GB',
      defaultExpanded: false,
      standardValues: ['128GB', '256GB', '512GB', '1TB', '2TB', '4TB'],
    },

    // Motherboard related
    CHIPSET: {
      specName: 'chipset',
      displayName: 'Chipset',
      category: 'technical',
      type: 'dropdown',
      priority: 500,
      dataType: SpecificationDataType.CHIPSET,
      defaultExpanded: false,
    },
    FORM_FACTOR: {
      specName: 'form_factor',
      displayName: 'Form Factor',
      category: 'physical',
      type: 'checkbox',
      priority: 600,
      dataType: SpecificationDataType.TEXT,
      defaultExpanded: false,
    },
  },

  // Mapping from specification data types to filter types
  DATA_TYPE_TO_FILTER_TYPE: {
    [SpecificationDataType.TEXT]: 'dropdown',
    [SpecificationDataType.NUMBER]: 'range',
    [SpecificationDataType.ENUM]: 'checkbox',
    [SpecificationDataType.BOOLEAN]: 'checkbox',
    [SpecificationDataType.SOCKET]: 'dropdown',
    [SpecificationDataType.MEMORY_TYPE]: 'dropdown',
    [SpecificationDataType.POWER_CONNECTOR]: 'checkbox',
    [SpecificationDataType.FREQUENCY]: 'range',
    [SpecificationDataType.MEMORY_SIZE]: 'checkbox',
    [SpecificationDataType.POWER_CONSUMPTION]: 'range',
    [SpecificationDataType.CHIPSET]: 'dropdown',
  },

  // Standard grouping for range values
  GROUPING: {
    PRICE_RANGES: [
      { min: 0, max: 100, label: 'Under $100' },
      { min: 100, max: 250, label: '$100 - $250' },
      { min: 250, max: 500, label: '$250 - $500' },
      { min: 500, max: 1000, label: '$500 - $1000' },
      { min: 1000, max: 2000, label: '$1000 - $2000' },
      { min: 2000, max: 999999, label: 'Over $2000' },
    ],
    MEMORY_SIZES: [
      { values: ['2GB', '4GB'], label: 'Up to 4GB' },
      { values: ['8GB'], label: '8GB' },
      { values: ['16GB'], label: '16GB' },
      { values: ['32GB'], label: '32GB' },
      { values: ['64GB', '128GB'], label: '64GB & above' },
    ],
    STORAGE_SIZES: [
      { values: ['128GB', '256GB'], label: 'Up to 256GB' },
      { values: ['512GB'], label: '512GB' },
      { values: ['1TB'], label: '1TB' },
      { values: ['2TB', '4TB', '8TB'], label: '2TB & above' },
    ],
    CPU_CORES: [
      { values: ['2', '4'], label: '2-4 cores' },
      { values: ['6'], label: '6 cores' },
      { values: ['8'], label: '8 cores' },
      { values: ['10', '12', '16', '24', '32'], label: '10+ cores' },
    ],
    FREQUENCIES: [
      { min: 0, max: 2, label: 'Up to 2 GHz' },
      { min: 2, max: 3, label: '2 - 3 GHz' },
      { min: 3, max: 4, label: '3 - 4 GHz' },
      { min: 4, max: 5, label: '4 - 5 GHz' },
      { min: 5, max: 999, label: 'Over 5 GHz' },
    ],
  },

  // Display settings
  DISPLAY: {
    MAX_VISIBLE_OPTIONS: {
      BRANDS: 8,
      GENERAL: 6,
      TECHNICAL: 5,
    },
    COLLAPSIBLE_THRESHOLD: 5, // If more than this many options, make collapsible
  },
};

/**
 * Maps a specification to a standardized filter based on its name and data type
 */
export function mapSpecificationToStandardFilter(specName: string, dataType: SpecificationDataType, displayName: string) {
  // Check if we have a predefined mapping for this specification
  const predefinedFilters = Object.values(STANDARD_FILTER_CONFIG.FILTERS);
  const matchingFilter = predefinedFilters.find(
    filter => filter.specName === specName || filter.specName === specName.toLowerCase()
  );

  if (matchingFilter) {
    return {
      ...matchingFilter,
      displayName: displayName || matchingFilter.displayName,
    };
  }

  // If no predefined mapping, create a default one based on data type
  const filterType = STANDARD_FILTER_CONFIG.DATA_TYPE_TO_FILTER_TYPE[dataType] || 'checkbox';
  
  return {
    specName,
    displayName,
    category: 'other',
    type: filterType,
    priority: 1000, // Lower priority for unmapped specifications
    dataType,
    defaultExpanded: false,
  };
}

/**
 * Groups filter options into standardized ranges where appropriate
 */
export function groupFilterOptions(filterName: string, options: string[]) {
  // Check if we have predefined grouping for this filter
  if (filterName.includes('memory') && filterName.includes('size')) {
    return STANDARD_FILTER_CONFIG.GROUPING.MEMORY_SIZES;
  }
  
  if (filterName.includes('storage') && (filterName.includes('capacity') || filterName.includes('size'))) {
    return STANDARD_FILTER_CONFIG.GROUPING.STORAGE_SIZES;
  }
  
  if (filterName.includes('core')) {
    return STANDARD_FILTER_CONFIG.GROUPING.CPU_CORES;
  }
  
  // Default: return individual options
  return options.map(option => ({
    values: [option],
    label: option,
  }));
}