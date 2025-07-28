import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  CreatePCConfigurationRequest,
  PCConfigurationListResponse,
  PCConfigurationResponse,
} from '@/lib/supabase/types/pc-configurations';

// GET /api/configurations - Get user's configurations
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = session.user;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const compatibility_status = searchParams.get('compatibility_status') as 'valid' | 'warning' | 'error' | null;
    const price_min = searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : undefined;
    const price_max = searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : undefined;
    const is_public = searchParams.get('is_public') === 'true' ? true : searchParams.get('is_public') === 'false' ? false : undefined;
    const sort_field = searchParams.get('sort_field') || 'created_at';
    const sort_direction = searchParams.get('sort_direction') || 'desc';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    // Build query
    let query = supabase
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
      .eq('user_id', user.id);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (compatibility_status) {
      query = query.eq('compatibility_status', compatibility_status);
    }
    if (price_min !== undefined) {
      query = query.gte('total_price', price_min);
    }
    if (price_max !== undefined) {
      query = query.lte('total_price', price_max);
    }
    if (is_public !== undefined) {
      query = query.eq('is_public', is_public);
    }

    // Apply sorting
    const validSortFields = ['name', 'created_at', 'updated_at', 'total_price'] as const;
    type ValidSortField = typeof validSortFields[number];
    const sortField: ValidSortField = validSortFields.includes(sort_field as ValidSortField) 
      ? sort_field as ValidSortField 
      : 'created_at';
    query = query.order(sortField, { ascending: sort_direction === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: configurations, error } = await query;

    if (error) {
      console.error('Error fetching configurations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch configurations' },
        { status: 500 }
      );
    }

    // Transform data to include component count
    const configurationsWithCount = configurations?.map(config => ({
      ...config,
      component_count: config.pc_configuration_components?.[0]?.count || 0,
      pc_configuration_components: undefined, // Remove the nested object
    })) || [];

    const response: PCConfigurationListResponse = {
      success: true,
      data: configurationsWithCount,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/configurations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/configurations - Create new configuration
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = session.user;

    // Parse request body
    const body: CreatePCConfigurationRequest = await request.json();
    const {
      name,
      description,
      components,
      total_price,
      power_consumption,
      recommended_psu_power,
      compatibility_status,
      is_public = false,
    } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Configuration name is required' },
        { status: 400 }
      );
    }

    if (!components || Object.keys(components).length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one component is required' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length > 255) {
      return NextResponse.json(
        { success: false, error: 'Configuration name is too long (max 255 characters)' },
        { status: 400 }
      );
    }

    // Check user's configuration limit
    const { count: userConfigCount } = await supabase
      .from('pc_configurations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (userConfigCount && userConfigCount >= 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum number of configurations reached (50)' },
        { status: 400 }
      );
    }

    // Start transaction by creating configuration first
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
      return NextResponse.json(
        { success: false, error: 'Failed to create configuration' },
        { status: 500 }
      );
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
        await supabase
          .from('pc_configurations')
          .delete()
          .eq('id', configuration.id);

        return NextResponse.json(
          { success: false, error: 'Failed to create configuration components' },
          { status: 500 }
        );
      }
    }

    const response: PCConfigurationResponse = {
      success: true,
      data: configuration,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/configurations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
