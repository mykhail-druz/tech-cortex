-- Migration for PC Configurator Feature
-- Adds typed specifications and compatibility rules

-- 1. Update category_specification_templates table
ALTER TABLE category_specification_templates
ADD COLUMN is_compatibility_key BOOLEAN DEFAULT FALSE,
ADD COLUMN enum_values TEXT[]; -- Array of possible values for enum type

-- Add index for performance optimization
CREATE INDEX idx_category_spec_templates_compatibility_key
ON category_specification_templates(category_id, is_compatibility_key)
WHERE is_compatibility_key = TRUE;

-- 2. Update product_specifications table
ALTER TABLE product_specifications
ADD COLUMN value_text TEXT,
ADD COLUMN value_number DECIMAL,
ADD COLUMN value_enum TEXT,
ADD COLUMN value_boolean BOOLEAN;

-- Add indexes for filtering and compatibility checks
CREATE INDEX idx_product_specs_template_id
ON product_specifications(template_id);

CREATE INDEX idx_product_specs_value_enum
ON product_specifications(value_enum);

CREATE INDEX idx_product_specs_value_number
ON product_specifications(value_number);

-- 3. Create compatibility_rules table
CREATE TABLE compatibility_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  primary_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  primary_specification_template_id UUID REFERENCES category_specification_templates(id) ON DELETE CASCADE,
  secondary_category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  secondary_specification_template_id UUID REFERENCES category_specification_templates(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL, -- 'exact_match', 'compatible_values', 'range_check', 'custom'
  compatible_values TEXT[], -- For 'compatible_values' rule type
  min_value DECIMAL, -- For 'range_check' rule type
  max_value DECIMAL, -- For 'range_check' rule type
  custom_check_function TEXT, -- For 'custom' rule type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for compatibility rules
CREATE INDEX idx_compatibility_rules_primary
ON compatibility_rules(primary_category_id, primary_specification_template_id);

CREATE INDEX idx_compatibility_rules_secondary
ON compatibility_rules(secondary_category_id, secondary_specification_template_id);

-- 4. Enable RLS on the new table
ALTER TABLE compatibility_rules ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for compatibility_rules
CREATE POLICY "Compatibility rules are viewable by everyone" 
ON compatibility_rules FOR SELECT USING (true);

CREATE POLICY "Compatibility rules can be added by admins and managers" 
ON compatibility_rules FOR INSERT WITH CHECK (is_admin_or_manager());

CREATE POLICY "Compatibility rules can be updated by admins and managers" 
ON compatibility_rules FOR UPDATE USING (is_admin_or_manager());

CREATE POLICY "Compatibility rules can be deleted by admins and managers" 
ON compatibility_rules FOR DELETE USING (is_admin_or_manager());

-- 6. Migration function to populate typed values from existing data
CREATE OR REPLACE FUNCTION migrate_product_specifications()
RETURNS void AS $$
DECLARE
  spec RECORD;
  template_data_type TEXT;
BEGIN
  FOR spec IN SELECT ps.*, cst.data_type 
              FROM product_specifications ps
              LEFT JOIN category_specification_templates cst ON ps.template_id = cst.id
  LOOP
    -- Default to 'text' if no template or data_type is null
    template_data_type := COALESCE(spec.data_type, 'text');
    
    -- Update the appropriate typed column based on data_type
    CASE template_data_type
      WHEN 'text' THEN
        UPDATE product_specifications 
        SET value_text = spec.value
        WHERE id = spec.id;
      
      WHEN 'number' THEN
        BEGIN
          UPDATE product_specifications 
          SET value_number = CAST(spec.value AS DECIMAL)
          WHERE id = spec.id;
        EXCEPTION WHEN OTHERS THEN
          -- If conversion fails, store as text
          UPDATE product_specifications 
          SET value_text = spec.value
          WHERE id = spec.id;
        END;
      
      WHEN 'boolean' THEN
        BEGIN
          UPDATE product_specifications 
          SET value_boolean = 
            CASE 
              WHEN spec.value ILIKE 'true' OR spec.value ILIKE 'yes' OR spec.value = '1' THEN TRUE
              WHEN spec.value ILIKE 'false' OR spec.value ILIKE 'no' OR spec.value = '0' THEN FALSE
              ELSE NULL
            END
          WHERE id = spec.id;
        EXCEPTION WHEN OTHERS THEN
          -- If conversion fails, store as text
          UPDATE product_specifications 
          SET value_text = spec.value
          WHERE id = spec.id;
        END;
      
      WHEN 'enum' THEN
        UPDATE product_specifications 
        SET value_enum = spec.value
        WHERE id = spec.id;
      
      WHEN 'socket' THEN
        UPDATE product_specifications 
        SET value_enum = spec.value
        WHERE id = spec.id;
      
      WHEN 'memory_type' THEN
        UPDATE product_specifications 
        SET value_enum = spec.value
        WHERE id = spec.id;
      
      WHEN 'power_connector' THEN
        UPDATE product_specifications 
        SET value_enum = spec.value
        WHERE id = spec.id;
      
      ELSE
        -- For any other data type, store as text
        UPDATE product_specifications 
        SET value_text = spec.value
        WHERE id = spec.id;
    END CASE;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_product_specifications();

-- Drop the migration function after use
DROP FUNCTION migrate_product_specifications();