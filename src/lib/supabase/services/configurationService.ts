// Configuration Service - Direct database operations for PC configurations
// This service provides functions to save, load, and manage PC configurations
// without using API routes, directly with Supabase client

import { supabase } from '../../supabaseClient';
import { 
  PCConfigurationResponse, 
  PCConfigurationListResponse, 
  PCConfigurationSummary,
  PCConfiguration,
  PCConfigurationWithComponents,
  PCConfigurationWithComponentsResponse
} from '@/lib/supabase/types/pc-configurations';

export interface SaveConfigurationParams {
  name: string;
  description?: string;
  components: Record<string, string | string[]>; // category_slug -> product_id(s)
  total_price?: number;
  power_consumption?: number;
  recommended_psu_power?: number;
  compatibility_status: 'valid' | 'warning' | 'error';
  is_public?: boolean;
}

/**
 * Save a PC configuration directly to the database
 * @param params Configuration parameters
 * @returns Promise with success/error result
 */
export async function saveConfiguration(
  params: SaveConfigurationParams
): Promise<PCConfigurationResponse> {
  try {
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        success: false,
        error: 'You must be logged in to save configurations',
      };
    }

    const user = session.user;
    const {
      name,
      description,
      components,
      total_price,
      power_consumption,
      recommended_psu_power,
      compatibility_status,
      is_public = false,
    } = params;

    // Validate required fields
    if (!name || !name.trim()) {
      return {
        success: false,
        error: 'Configuration name is required',
      };
    }

    if (!components || Object.keys(components).length === 0) {
      return {
        success: false,
        error: 'At least one component is required',
      };
    }

    // Validate name length
    if (name.length > 255) {
      return {
        success: false,
        error: 'Configuration name is too long (max 255 characters)',
      };
    }

    // Check user's configuration limit
    const { count: userConfigCount } = await supabase
      .from('pc_configurations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (userConfigCount && userConfigCount >= 50) {
      return {
        success: false,
        error: 'Maximum number of configurations reached (50)',
      };
    }

    // Create configuration first
    const { data: configuration, error: configError } = await supabase
      .from('pc_configurations')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim(),
        total_price,
        power_consumption,
        recommended_psu_power,
        compatibility_status,
        is_public,
      })
      .select()
      .single();

    if (configError || !configuration) {
      console.error('Error creating configuration:', configError);
      return {
        success: false,
        error: 'Failed to create configuration',
      };
    }

    // Create configuration components
    const componentInserts = [];
    for (const [categorySlug, productIds] of Object.entries(components)) {
      if (Array.isArray(productIds)) {
        // Multiple components (e.g., memory, storage)
        for (const productId of productIds) {
          componentInserts.push({
            configuration_id: configuration.id,
            category_slug: categorySlug,
            product_id: productId,
            quantity: 1,
          });
        }
      } else {
        // Single component
        componentInserts.push({
          configuration_id: configuration.id,
          category_slug: categorySlug,
          product_id: productIds,
          quantity: 1,
        });
      }
    }

    if (componentInserts.length > 0) {
      const { error: componentsError } = await supabase
        .from('pc_configuration_components')
        .insert(componentInserts);

      if (componentsError) {
        console.error('Error creating configuration components:', componentsError);
        // Rollback: delete the configuration
        await supabase.from('pc_configurations').delete().eq('id', configuration.id);

        return {
          success: false,
          error: 'Failed to create configuration components',
        };
      }
    }

    return {
      success: true,
      data: configuration,
    };
  } catch (error) {
    console.error('Error saving configuration:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while saving the configuration',
    };
  }
}

interface ProductInfo {
  id: string;
  title: string;
  [key: string]: unknown;
}

/**
 * Generate a default name for a configuration based on its components
 * @param components Configuration components
 * @param products Product data cache
 * @returns Generated configuration name
 */
export function generateConfigurationName(
  components: Record<string, string | string[]>,
  products: Record<string, ProductInfo>
): string {
  const componentNames = [];

  // Priority order for naming
  const priorityCategories = ['cpu', 'gpu', 'motherboard'];

  for (const category of priorityCategories) {
    const componentId = components[category];
    if (componentId && typeof componentId === 'string') {
      const product = products[componentId];
      if (product) {
        // Extract brand and model from product title
        const title = product.title;
        const words = title.split(' ');
        if (words.length >= 2) {
          componentNames.push(`${words[0]} ${words[1]}`);
        } else {
          componentNames.push(words[0]);
        }
        break; // Use only the first priority component found
      }
    }
  }

  if (componentNames.length === 0) {
    // Fallback to any component
    const firstComponent = Object.values(components)[0];
    if (firstComponent && typeof firstComponent === 'string') {
      const product = products[firstComponent];
      if (product) {
        const words = product.title.split(' ');
        componentNames.push(words[0]);
      }
    }
  }

  const baseName = componentNames.length > 0 ? `${componentNames[0]} Build` : 'My PC Build';

  // Add timestamp to make it unique
  const timestamp = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return `${baseName} - ${timestamp}`;
}

/**
 * Fetch user's configurations directly from the database
 * @returns Promise with configurations list or error
 */
export async function getUserConfigurations(): Promise<PCConfigurationListResponse> {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        success: false,
        error: 'You must be logged in to view configurations',
      };
    }

    const user = session.user;

    // Fetch configurations with component count
    const { data: configurations, error } = await supabase
      .from('pc_configurations')
      .select(`
        id,
        name,
        description,
        total_price,
        power_consumption,
        recommended_psu_power,
        compatibility_status,
        is_public,
        created_at,
        updated_at,
        pc_configuration_components(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching configurations:', error);
      return {
        success: false,
        error: 'Failed to fetch configurations',
      };
    }

    // Transform data to include component count
    const configurationsWithCount: PCConfigurationSummary[] = configurations?.map(config => ({
      ...config,
      component_count: config.pc_configuration_components?.[0]?.count || 0,
      pc_configuration_components: undefined, // Remove the nested object
    })) || [];

    return {
      success: true,
      data: configurationsWithCount,
    };
  } catch (error) {
    console.error('Error fetching configurations:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while fetching configurations',
    };
  }
}

/**
 * Delete a configuration directly from the database
 * @param configId Configuration ID to delete
 * @returns Promise with success/error result
 */
export async function deleteConfiguration(configId: string): Promise<PCConfigurationResponse> {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        success: false,
        error: 'You must be logged in to delete configurations',
      };
    }

    const user = session.user;

    // Verify the configuration belongs to the user
    const { data: config, error: fetchError } = await supabase
      .from('pc_configurations')
      .select('id, user_id')
      .eq('id', configId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !config) {
      return {
        success: false,
        error: 'Configuration not found or access denied',
      };
    }

    // Delete configuration components first (due to foreign key constraint)
    const { error: componentsError } = await supabase
      .from('pc_configuration_components')
      .delete()
      .eq('configuration_id', configId);

    if (componentsError) {
      console.error('Error deleting configuration components:', componentsError);
      return {
        success: false,
        error: 'Failed to delete configuration components',
      };
    }

    // Delete the configuration
    const { error: configError } = await supabase
      .from('pc_configurations')
      .delete()
      .eq('id', configId)
      .eq('user_id', user.id);

    if (configError) {
      console.error('Error deleting configuration:', configError);
      return {
        success: false,
        error: 'Failed to delete configuration',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error deleting configuration:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while deleting the configuration',
    };
  }
}

/**
 * Get a full configuration with components for loading into PC Builder
 * @param configId Configuration ID to fetch
 * @returns Promise with full configuration data or error
 */
export async function getConfigurationForBuilder(configId: string): Promise<{
  success: boolean;
  data?: {
    configuration: PCConfiguration;
    components: Record<string, string | string[]>;
  };
  error?: string;
}> {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        success: false,
        error: 'You must be logged in to load configurations',
      };
    }

    const user = session.user;

    // Fetch configuration with components
    const { data: configuration, error: configError } = await supabase
      .from('pc_configurations')
      .select(`
        *,
        pc_configuration_components (
          category_slug,
          product_id,
          quantity
        )
      `)
      .eq('id', configId)
      .eq('user_id', user.id)
      .single();

    if (configError || !configuration) {
      return {
        success: false,
        error: 'Configuration not found or access denied',
      };
    }

    // Convert components to the format expected by PC Builder
    const components: Record<string, string | string[]> = {};
    configuration.pc_configuration_components.forEach((comp: { category_slug: string; product_id: string }) => {
      if (components[comp.category_slug]) {
        // Multiple components in same category (e.g., RAM, storage)
        if (Array.isArray(components[comp.category_slug])) {
          (components[comp.category_slug] as string[]).push(comp.product_id);
        } else {
          components[comp.category_slug] = [components[comp.category_slug] as string, comp.product_id];
        }
      } else {
        components[comp.category_slug] = comp.product_id;
      }
    });

    return {
      success: true,
      data: {
        configuration,
        components,
      },
    };
  } catch (error) {
    console.error('Error fetching configuration for builder:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while loading the configuration',
    };
  }
}

/**
 * Get a public configuration without authentication requirements
 * @param configId Configuration ID to fetch
 * @returns Promise with full public configuration data or error
 */
export async function getPublicConfiguration(configId: string): Promise<PCConfigurationWithComponentsResponse> {
  try {
    // Fetch public configuration with components (no auth required)
    const { data: configuration, error: configError } = await supabase
      .from('pc_configurations')
      .select(`
        *,
        pc_configuration_components (
          id,
          category_slug,
          product_id,
          quantity,
          created_at,
          products (
            id,
            title,
            price,
            main_image_url,
            in_stock
          )
        )
      `)
      .eq('id', configId)
      .eq('is_public', true)
      .single();

    if (configError || !configuration) {
      return {
        success: false,
        error: 'Public configuration not found or access denied',
      };
    }

    // Transform the data to match PCConfigurationWithComponents type
    const transformedConfig: PCConfigurationWithComponents = {
      ...configuration,
      components: configuration.pc_configuration_components.map((comp: {
        id: string;
        category_slug: string;
        product_id: string;
        quantity: number;
        created_at: string;
        products: {
          id: string;
          title: string;
          price: number;
          main_image_url: string;
          in_stock: boolean;
        };
      }) => ({
        id: comp.id,
        configuration_id: configuration.id,
        category_slug: comp.category_slug,
        product_id: comp.product_id,
        quantity: comp.quantity,
        created_at: comp.created_at,
        product: comp.products,
      })),
      component_count: configuration.pc_configuration_components.length,
    };

    // Remove the nested pc_configuration_components array
    delete (transformedConfig as PCConfiguration & { pc_configuration_components?: unknown }).pc_configuration_components;

    return {
      success: true,
      data: transformedConfig,
    };
  } catch (error) {
    console.error('Error fetching public configuration:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while loading the configuration',
    };
  }
}

/**
 * Get a public configuration for loading into PC Builder (simplified format)
 * @param configId Configuration ID to fetch
 * @returns Promise with configuration data in builder format or error
 */
export async function getPublicConfigurationForBuilder(configId: string): Promise<{
  success: boolean;
  data?: {
    configuration: PCConfiguration;
    components: Record<string, string | string[]>;
  };
  error?: string;
}> {
  try {
    // Fetch public configuration with components (no auth required)
    const { data: configuration, error: configError } = await supabase
      .from('pc_configurations')
      .select(`
        *,
        pc_configuration_components (
          category_slug,
          product_id,
          quantity
        )
      `)
      .eq('id', configId)
      .eq('is_public', true)
      .single();

    if (configError || !configuration) {
      return {
        success: false,
        error: 'Public configuration not found or access denied',
      };
    }

    // Convert components to the format expected by PC Builder
    const components: Record<string, string | string[]> = {};
    configuration.pc_configuration_components.forEach((comp: { category_slug: string; product_id: string }) => {
      if (components[comp.category_slug]) {
        // Multiple components in same category (e.g., RAM, storage)
        if (Array.isArray(components[comp.category_slug])) {
          (components[comp.category_slug] as string[]).push(comp.product_id);
        } else {
          components[comp.category_slug] = [components[comp.category_slug] as string, comp.product_id];
        }
      } else {
        components[comp.category_slug] = comp.product_id;
      }
    });

    return {
      success: true,
      data: {
        configuration,
        components,
      },
    };
  } catch (error) {
    console.error('Error fetching public configuration for builder:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while loading the configuration',
    };
  }
}
