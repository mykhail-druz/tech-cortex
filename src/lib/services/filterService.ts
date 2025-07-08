// lib/services/filterService.ts
import { StandardFilter, FilterOption } from '@/lib/supabase/types/types';
import { getAvailableFilters } from '@/lib/supabase/db';
import { STANDARD_FILTER_CONFIG, mapSpecificationToStandardFilter, groupFilterOptions } from '@/lib/config/standardFilterConfig';
import { SpecificationDataType } from '@/lib/supabase/types/specifications';

export class FilterService {
  static async getStandardFilters(categorySlug: string): Promise<StandardFilter[]> {
    const filters: StandardFilter[] = [];

    // Add primary filters (always shown)
    filters.push(...this.getPrimaryFilters());

    // Add category-specific filters
    const categoryFilters = await this.getCategorySpecificFilters(categorySlug);
    filters.push(...categoryFilters);

    // Sort filters by category priority first, then by filter priority
    return filters.sort((a, b) => {
      // Get category priorities
      const categoryA = this.getCategoryPriority(a.category);
      const categoryB = this.getCategoryPriority(b.category);

      // First sort by category
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }

      // Then by filter priority
      return a.priority - b.priority;
    });
  }

  private static getCategoryPriority(category: string): number {
    const categories = STANDARD_FILTER_CONFIG.CATEGORIES;

    switch(category) {
      case 'primary': return categories.PRIMARY.priority;
      case 'technical': return categories.TECHNICAL.priority;
      case 'physical': return categories.PHYSICAL.priority;
      case 'compatibility': return categories.COMPATIBILITY.priority;
      case 'other': return categories.OTHER.priority;
      default: return 1000; // Default high number for unknown categories
    }
  }

  private static getPrimaryFilters(): StandardFilter[] {
    const filters = STANDARD_FILTER_CONFIG.FILTERS;

    return [
      {
        id: filters.PRICE.id,
        name: filters.PRICE.name,
        displayName: filters.PRICE.displayName,
        type: filters.PRICE.type,
        category: filters.PRICE.category,
        priority: filters.PRICE.priority,
        unit: filters.PRICE.unit,
        showCount: filters.PRICE.showCount,
        defaultExpanded: filters.PRICE.defaultExpanded,
        range: {
          min: 0,
          max: 2000,
          step: 10
        },
      },
      {
        id: filters.BRAND.id,
        name: filters.BRAND.name,
        displayName: filters.BRAND.displayName,
        type: filters.BRAND.type,
        category: filters.BRAND.category,
        priority: filters.BRAND.priority,
        maxVisibleOptions: filters.BRAND.maxVisibleOptions,
        showCount: filters.BRAND.showCount,
        collapsible: true,
        defaultExpanded: filters.BRAND.defaultExpanded,
      },
      {
        id: filters.RATING.id,
        name: filters.RATING.name,
        displayName: filters.RATING.displayName,
        type: filters.RATING.type,
        category: filters.RATING.category,
        priority: filters.RATING.priority,
        options: filters.RATING.options,
        defaultExpanded: filters.RATING.defaultExpanded,
      },
      {
        id: filters.AVAILABILITY.id,
        name: filters.AVAILABILITY.name,
        displayName: filters.AVAILABILITY.displayName,
        type: filters.AVAILABILITY.type,
        category: filters.AVAILABILITY.category,
        priority: filters.AVAILABILITY.priority,
        options: filters.AVAILABILITY.options,
        defaultExpanded: filters.AVAILABILITY.defaultExpanded,
      },
    ];
  }

  private static async getCategorySpecificFilters(categorySlug: string): Promise<StandardFilter[]> {
    // Get available filters from the database
    const specFilters = await getAvailableFilters(categorySlug);

    // Convert to standardized filters
    return specFilters.map(filter => this.convertToStandardFilter(filter));
  }

  private static convertToStandardFilter(specFilter: any): StandardFilter {
    // Determine the data type (default to TEXT if not specified)
    const dataType = specFilter.dataType || SpecificationDataType.TEXT;

    // Map to standard filter using our configuration
    const standardFilter = mapSpecificationToStandardFilter(
      specFilter.templateName,
      dataType,
      specFilter.displayName
    );

    // Create filter options based on values
    let options: FilterOption[] | undefined;
    if (specFilter.values && specFilter.values.length > 0) {
      // Check if we should group the options
      const groupedOptions = groupFilterOptions(specFilter.templateName, specFilter.values);

      if (groupedOptions.some(group => group.values.length > 1)) {
        // Use grouped options
        options = groupedOptions.map(group => ({
          value: group.values.join(','),
          label: group.label,
          count: specFilter.counts?.[group.values[0]] || 0,
        }));
      } else {
        // Use individual options
        options = specFilter.values.map(value => ({
          value,
          label: value,
          count: specFilter.counts?.[value] || 0,
        }));
      }
    }

    // Create range if min/max are defined
    const range = specFilter.min !== undefined && specFilter.max !== undefined
      ? {
          min: specFilter.min,
          max: specFilter.max,
          step: specFilter.step || 1,
        }
      : undefined;

    // Build the final filter
    return {
      id: specFilter.templateId,
      name: specFilter.templateName,
      displayName: standardFilter.displayName,
      type: standardFilter.type,
      category: standardFilter.category,
      priority: standardFilter.priority,
      options,
      range,
      unit: standardFilter.unit || specFilter.unit,
      showCount: specFilter.showCount !== false,
      collapsible: true,
      defaultExpanded: standardFilter.defaultExpanded,
      maxVisibleOptions: STANDARD_FILTER_CONFIG.DISPLAY.MAX_VISIBLE_OPTIONS.TECHNICAL,
    };
  }
}
