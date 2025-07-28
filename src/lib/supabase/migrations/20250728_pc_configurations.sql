-- PC Configurations System Migration
-- Created: 2025-07-28

-- Table for saved PC configurations
CREATE TABLE pc_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Configuration metadata
  total_price DECIMAL(10, 2),
  power_consumption INTEGER,
  recommended_psu_power INTEGER,
  compatibility_status VARCHAR(20) DEFAULT 'valid' CHECK (compatibility_status IN ('valid', 'warning', 'error')),
  
  -- System fields
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for components in each configuration
CREATE TABLE pc_configuration_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  configuration_id UUID REFERENCES pc_configurations(id) ON DELETE CASCADE,
  category_slug VARCHAR(100) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_pc_configurations_user_id ON pc_configurations(user_id);
CREATE INDEX idx_pc_configurations_created_at ON pc_configurations(created_at DESC);
CREATE INDEX idx_pc_configuration_components_config_id ON pc_configuration_components(configuration_id);
CREATE INDEX idx_pc_configuration_components_category ON pc_configuration_components(category_slug);

-- Enable Row Level Security
ALTER TABLE pc_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pc_configuration_components ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pc_configurations
CREATE POLICY "Users can view their own configurations" 
ON pc_configurations FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can insert their own configurations" 
ON pc_configurations FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own configurations" 
ON pc_configurations FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own configurations" 
ON pc_configurations FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for pc_configuration_components
CREATE POLICY "Users can view components of their configurations" 
ON pc_configuration_components FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM pc_configurations 
    WHERE id = configuration_id 
    AND (user_id = auth.uid() OR is_public = true)
  )
);

CREATE POLICY "Users can insert components to their configurations" 
ON pc_configuration_components FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM pc_configurations 
    WHERE id = configuration_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update components of their configurations" 
ON pc_configuration_components FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM pc_configurations 
    WHERE id = configuration_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete components from their configurations" 
ON pc_configuration_components FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM pc_configurations 
    WHERE id = configuration_id 
    AND user_id = auth.uid()
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pc_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_pc_configurations_updated_at
  BEFORE UPDATE ON pc_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_pc_configuration_updated_at();

-- Sample query to get user's configurations with component count
-- SELECT 
--   pc.id,
--   pc.name,
--   pc.description,
--   pc.total_price,
--   pc.power_consumption,
--   pc.recommended_psu_power,
--   pc.compatibility_status,
--   pc.is_public,
--   pc.created_at,
--   pc.updated_at,
--   COUNT(pcc.id) as component_count
-- FROM pc_configurations pc
-- LEFT JOIN pc_configuration_components pcc ON pc.id = pcc.configuration_id
-- WHERE pc.user_id = auth.uid()
-- GROUP BY pc.id, pc.name, pc.description, pc.total_price, pc.power_consumption, 
--          pc.recommended_psu_power, pc.compatibility_status, pc.is_public, 
--          pc.created_at, pc.updated_at
-- ORDER BY pc.created_at DESC;

-- Sample query to get full configuration with products
-- SELECT 
--   pc.*,
--   pcc.category_slug,
--   pcc.quantity,
--   p.id as product_id,
--   p.title as product_title,
--   p.price as product_price,
--   p.main_image_url as product_image,
--   p.in_stock as product_in_stock
-- FROM pc_configurations pc
-- JOIN pc_configuration_components pcc ON pc.id = pcc.configuration_id
-- JOIN products p ON pcc.product_id = p.id
-- WHERE pc.id = $1 AND pc.user_id = auth.uid()
-- ORDER BY pcc.category_slug;