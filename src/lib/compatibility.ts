import { supabase } from './supabaseClient';
import {
  CompatibilityRule,
  PCConfiguration,
  CompatibilityCheckResult,
  ProductSpecification,
} from './supabase/types/specifications';
import { ProductWithDetails } from './supabase/types/types';

/**
 * Checks if two components are compatible with each other
 * @param component1Id First component product ID
 * @param component2Id Second component product ID
 * @returns Promise resolving to compatibility result with reason if incompatible
 */
export async function checkComponentCompatibility(
  component1Id: string,
  component2Id: string
): Promise<{ isCompatible: boolean; reason?: string }> {
  try {
    // Fetch both components with their specifications
    const [component1Response, component2Response] = await Promise.all([
      supabase
        .from('products')
        .select(
          `
          id,
          title,
          category_id,
          product_specifications (
            id,
            template_id,
            name,
            value,
            value_text,
            value_number,
            value_enum,
            value_boolean,
            template:category_specification_templates (
              id,
              name,
              data_type,
              is_compatibility_key
            )
          )
        `
        )
        .eq('id', component1Id)
        .single(),
      supabase
        .from('products')
        .select(
          `
          id,
          title,
          category_id,
          product_specifications (
            id,
            template_id,
            name,
            value,
            value_text,
            value_number,
            value_enum,
            value_boolean,
            template:category_specification_templates (
              id,
              name,
              data_type,
              is_compatibility_key
            )
          )
        `
        )
        .eq('id', component2Id)
        .single(),
    ]);

    if (component1Response.error || component2Response.error) {
      throw new Error('Failed to fetch component details');
    }

    const component1 = component1Response.data;
    const component2 = component2Response.data;

    // Fetch compatibility rules between these two categories
    const rulesResponse = await supabase
      .from('compatibility_rules')
      .select('*')
      .or(
        `and(primary_category_id.eq.${component1.category_id},secondary_category_id.eq.${component2.category_id}),and(primary_category_id.eq.${component2.category_id},secondary_category_id.eq.${component1.category_id})`
      );

    if (rulesResponse.error) {
      throw new Error('Failed to fetch compatibility rules');
    }

    const rules = rulesResponse.data as CompatibilityRule[];

    // If no rules exist between these categories, assume they're compatible
    if (rules.length === 0) {
      return { isCompatible: true };
    }

    // Check each rule
    for (const rule of rules) {
      const isPrimaryFirst = rule.primary_category_id === component1.category_id;

      // Get the relevant specifications from each component
      const primarySpec = isPrimaryFirst
        ? component1.product_specifications.find(
            s => s.template?.id === rule.primary_specification_template_id
          )
        : component2.product_specifications.find(
            s => s.template?.id === rule.primary_specification_template_id
          );

      const secondarySpec = isPrimaryFirst
        ? component2.product_specifications.find(
            s => s.template?.id === rule.secondary_specification_template_id
          )
        : component1.product_specifications.find(
            s => s.template?.id === rule.secondary_specification_template_id
          );

      // If either component is missing the required specification, they're incompatible
      if (!primarySpec || !secondarySpec) {
        return {
          isCompatible: false,
          reason: `Missing required specification for compatibility check between ${component1.title} and ${component2.title}`,
        };
      }

      // Check compatibility based on rule type
      switch (rule.rule_type) {
        case 'exact_match':
          // Values must match exactly
          const primaryValue = getTypedValue(primarySpec);
          const secondaryValue = getTypedValue(secondarySpec);

          if (primaryValue !== secondaryValue) {
            return {
              isCompatible: false,
              reason: `${component1.title} and ${component2.title} have incompatible ${primarySpec.name} values: ${primaryValue} vs ${secondaryValue}`,
            };
          }
          break;

        case 'compatible_values':
          // Secondary value must be in the list of compatible values
          if (!rule.compatible_values?.includes(getTypedValue(secondarySpec).toString())) {
            return {
              isCompatible: false,
              reason: `${component2.title}'s ${secondarySpec.name} (${getTypedValue(secondarySpec)}) is not compatible with ${component1.title}'s ${primarySpec.name} (${getTypedValue(primarySpec)})`,
            };
          }
          break;

        case 'range_check':
          // Secondary value must be within the specified range
          const secondaryNumValue = Number(getTypedValue(secondarySpec));
          if (
            isNaN(secondaryNumValue) ||
            (rule.min_value !== null && secondaryNumValue < rule.min_value) ||
            (rule.max_value !== null && secondaryNumValue > rule.max_value)
          ) {
            return {
              isCompatible: false,
              reason: `${component2.title}'s ${secondarySpec.name} (${secondaryNumValue}) is outside the compatible range for ${component1.title}`,
            };
          }
          break;

        case 'custom':
          // Custom rules would be implemented in a separate function
          // This is a placeholder for future custom rule implementations
          console.warn('Custom compatibility rule check not implemented:', rule.name);
          break;
      }
    }

    // If we've checked all rules and found no incompatibilities, the components are compatible
    return { isCompatible: true };
  } catch (error) {
    console.error('Error checking component compatibility:', error);
    return { isCompatible: false, reason: 'Error checking compatibility' };
  }
}

/**
 * Gets compatible components for a given set of selected components
 * @param selectedComponents Object mapping category IDs to selected product IDs
 * @param targetCategoryId Category ID for which to find compatible components
 * @returns Promise resolving to array of compatible product IDs
 */
export async function getCompatibleComponents(
  selectedComponents: Record<string, string>,
  targetCategoryId: string
): Promise<string[]> {
  try {
    // Get all products in the target category
    const productsResponse = await supabase
      .from('products')
      .select('id')
      .eq('category_id', targetCategoryId);

    if (productsResponse.error) {
      throw new Error('Failed to fetch products');
    }

    const allProductIds = productsResponse.data.map(p => p.id);

    // If no components are selected yet, return all products in the category
    if (Object.keys(selectedComponents).length === 0) {
      return allProductIds;
    }

    // Check compatibility with each selected component
    const compatibleProductIds: string[] = [];

    for (const productId of allProductIds) {
      let isCompatible = true;

      // Check compatibility with each selected component
      for (const categoryId in selectedComponents) {
        const selectedComponentId = selectedComponents[categoryId];
        const result = await checkComponentCompatibility(productId, selectedComponentId);

        if (!result.isCompatible) {
          isCompatible = false;
          break;
        }
      }

      if (isCompatible) {
        compatibleProductIds.push(productId);
      }
    }

    return compatibleProductIds;
  } catch (error) {
    console.error('Error getting compatible components:', error);
    return [];
  }
}

/**
 * Validates a complete PC configuration for compatibility
 * @param pcConfig Object mapping category IDs to selected product IDs
 * @returns Promise resolving to compatibility check result
 */
export async function validateConfiguration(
  pcConfig: PCConfiguration
): Promise<CompatibilityCheckResult> {
  try {
    const componentIds = Object.values(pcConfig.components);
    const incompatibleComponents: { component1Id: string; component2Id: string; reason: string }[] =
      [];

    // Check compatibility between each pair of components
    for (let i = 0; i < componentIds.length; i++) {
      for (let j = i + 1; j < componentIds.length; j++) {
        const result = await checkComponentCompatibility(componentIds[i], componentIds[j]);

        if (!result.isCompatible && result.reason) {
          incompatibleComponents.push({
            component1Id: componentIds[i],
            component2Id: componentIds[j],
            reason: result.reason,
          });
        }
      }
    }

    return {
      isCompatible: incompatibleComponents.length === 0,
      incompatibleComponents:
        incompatibleComponents.length > 0 ? incompatibleComponents : undefined,
    };
  } catch (error) {
    console.error('Error validating configuration:', error);
    return {
      isCompatible: false,
      incompatibleComponents: [
        {
          component1Id: '',
          component2Id: '',
          reason: 'Error validating configuration',
        },
      ],
    };
  }
}

/**
 * Helper function to get the typed value from a specification
 */
function getTypedValue(spec: ProductSpecification): string | number | boolean | null {
  if (spec.value_number !== null) return spec.value_number;
  if (spec.value_boolean !== null) return spec.value_boolean;
  if (spec.value_enum !== null) return spec.value_enum;
  if (spec.value_text !== null) return spec.value_text;
  return spec.value; // Fallback to the generic value field
}
