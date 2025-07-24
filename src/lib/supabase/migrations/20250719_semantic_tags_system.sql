-- Migration to add Smart Tag-Based Specification System
-- This migration adds semantic tags and profile support to categories
-- while maintaining backward compatibility with existing CategorySpecificationTemplate system

-- Add new columns to categories table for semantic tag system
ALTER TABLE categories ADD COLUMN IF NOT EXISTS specification_tags TEXT[] DEFAULT '{}';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS suggested_profiles TEXT[] DEFAULT '{}';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS auto_generated_specs JSONB DEFAULT '[]';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS custom_specs JSONB DEFAULT '[]';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS smart_detection_enabled BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS last_profile_detection TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_specification_tags 
ON categories USING GIN(specification_tags);

CREATE INDEX IF NOT EXISTS idx_categories_suggested_profiles 
ON categories USING GIN(suggested_profiles);

CREATE INDEX IF NOT EXISTS idx_categories_smart_detection_enabled 
ON categories(smart_detection_enabled) 
WHERE smart_detection_enabled = true;

-- Add comments for documentation
COMMENT ON COLUMN categories.specification_tags IS 'Array of semantic tags that describe component functionality (e.g., POWER_CONSUMER, REQUIRES_SOCKET)';
COMMENT ON COLUMN categories.suggested_profiles IS 'Array of suggested component profile IDs based on automatic detection';
COMMENT ON COLUMN categories.auto_generated_specs IS 'JSON array of automatically generated specifications based on semantic tags';
COMMENT ON COLUMN categories.custom_specs IS 'JSON array of custom specifications added by admin';
COMMENT ON COLUMN categories.smart_detection_enabled IS 'Whether smart specification detection is enabled for this category';
COMMENT ON COLUMN categories.last_profile_detection IS 'Timestamp of last automatic profile detection run';

-- Create a new table for storing component profiles configuration
CREATE TABLE IF NOT EXISTS component_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    required_specifications JSONB NOT NULL DEFAULT '[]',
    optional_specifications JSONB NOT NULL DEFAULT '[]',
    category_patterns TEXT[] NOT NULL DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for component_profiles table
CREATE INDEX IF NOT EXISTS idx_component_profiles_tags 
ON component_profiles USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_component_profiles_active 
ON component_profiles(is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_component_profiles_priority 
ON component_profiles(priority DESC);

-- Add comments for component_profiles table
COMMENT ON TABLE component_profiles IS 'Stores component profile definitions for smart specification system';
COMMENT ON COLUMN component_profiles.tags IS 'Array of semantic tags associated with this profile';
COMMENT ON COLUMN component_profiles.required_specifications IS 'JSON array of required specifications for this component type';
COMMENT ON COLUMN component_profiles.optional_specifications IS 'JSON array of optional specifications for this component type';
COMMENT ON COLUMN component_profiles.category_patterns IS 'Array of regex patterns to match category names for auto-detection';
COMMENT ON COLUMN component_profiles.priority IS 'Priority when multiple profiles match (higher = more priority)';

-- Create a table for auto-detection rules
CREATE TABLE IF NOT EXISTS auto_detection_rules (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES component_profiles(id) ON DELETE CASCADE,
    patterns TEXT[] NOT NULL DEFAULT '{}',
    keywords TEXT[] NOT NULL DEFAULT '{}',
    exclude_patterns TEXT[] DEFAULT '{}',
    confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for auto_detection_rules table
CREATE INDEX IF NOT EXISTS idx_auto_detection_rules_profile_id 
ON auto_detection_rules(profile_id);

CREATE INDEX IF NOT EXISTS idx_auto_detection_rules_active 
ON auto_detection_rules(is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_auto_detection_rules_confidence 
ON auto_detection_rules(confidence DESC);

-- Add comments for auto_detection_rules table
COMMENT ON TABLE auto_detection_rules IS 'Rules for automatically detecting component profiles based on category names';
COMMENT ON COLUMN auto_detection_rules.patterns IS 'Array of regex patterns to match category names';
COMMENT ON COLUMN auto_detection_rules.keywords IS 'Array of keywords to look for in category names and descriptions';
COMMENT ON COLUMN auto_detection_rules.exclude_patterns IS 'Array of patterns that exclude this rule from matching';
COMMENT ON COLUMN auto_detection_rules.confidence IS 'Confidence score for this detection rule (0.0 to 1.0)';

-- Create a table for tag compatibility rules
CREATE TABLE IF NOT EXISTS tag_compatibility_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    required_tag TEXT NOT NULL,
    compatible_tags TEXT[] NOT NULL DEFAULT '{}',
    specification_key TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'error' CHECK (severity IN ('error', 'warning', 'info')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tag_compatibility_rules table
CREATE INDEX IF NOT EXISTS idx_tag_compatibility_rules_required_tag 
ON tag_compatibility_rules(required_tag);

CREATE INDEX IF NOT EXISTS idx_tag_compatibility_rules_compatible_tags 
ON tag_compatibility_rules USING GIN(compatible_tags);

CREATE INDEX IF NOT EXISTS idx_tag_compatibility_rules_active 
ON tag_compatibility_rules(is_active) 
WHERE is_active = true;

-- Add comments for tag_compatibility_rules table
COMMENT ON TABLE tag_compatibility_rules IS 'Rules for checking compatibility between components based on semantic tags';
COMMENT ON COLUMN tag_compatibility_rules.required_tag IS 'The semantic tag that requires compatibility';
COMMENT ON COLUMN tag_compatibility_rules.compatible_tags IS 'Array of tags that satisfy the compatibility requirement';
COMMENT ON COLUMN tag_compatibility_rules.specification_key IS 'The specification field to check for compatibility';
COMMENT ON COLUMN tag_compatibility_rules.severity IS 'Severity level of compatibility issues (error, warning, info)';

-- Insert default component profiles
INSERT INTO component_profiles (id, name, display_name, description, tags, required_specifications, optional_specifications, category_patterns, priority) VALUES
('cpu', 'CPU', 'Processor (CPU)', 'Central Processing Unit - the main processor of the computer', 
 ARRAY['POWER_CONSUMER', 'REQUIRES_SOCKET', 'GENERATES_HEAT', 'REQUIRES_COOLING', 'HIGH_PERFORMANCE', 'OVERCLOCKABLE'],
 '[
   {"name": "socket", "displayName": "Socket", "dataType": "SOCKET", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 5},
   {"name": "tdp", "displayName": "TDP (Thermal Design Power)", "dataType": "POWER_CONSUMPTION", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 11},
   {"name": "base_clock", "displayName": "Base Clock", "dataType": "FREQUENCY", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 30},
   {"name": "cores", "displayName": "Cores", "dataType": "NUMBER", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 32},
   {"name": "threads", "displayName": "Threads", "dataType": "NUMBER", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 33}
 ]'::jsonb,
 '[
   {"name": "boost_clock", "displayName": "Boost Clock", "dataType": "FREQUENCY", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 31},
   {"name": "cache_l3", "displayName": "L3 Cache", "dataType": "NUMBER", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 34},
   {"name": "integrated_graphics", "displayName": "Integrated Graphics", "dataType": "BOOLEAN", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 35}
 ]'::jsonb,
 ARRAY['процессор.*', 'cpu.*', '.*процессор.*', 'центральн.*процессор.*', 'processor.*'],
 10),

('gpu', 'GPU', 'Graphics Card (GPU)', 'Graphics Processing Unit - handles graphics and visual processing',
 ARRAY['POWER_CONSUMER', 'REQUIRES_SLOT', 'HAS_GRAPHICS', 'GRAPHICS_ACCELERATED', 'GENERATES_HEAT', 'REQUIRES_COOLING', 'HIGH_PERFORMANCE', 'OVERCLOCKABLE'],
 '[
   {"name": "power_consumption", "displayName": "Power Consumption", "dataType": "POWER_CONSUMPTION", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 10},
   {"name": "memory_size", "displayName": "Memory Size", "dataType": "MEMORY_SIZE", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 21},
   {"name": "memory_type", "displayName": "Memory Type", "dataType": "MEMORY_TYPE", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 20},
   {"name": "base_clock", "displayName": "Base Clock", "dataType": "FREQUENCY", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 30},
   {"name": "memory_bus", "displayName": "Memory Bus Width", "dataType": "NUMBER", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 22}
 ]'::jsonb,
 '[
   {"name": "boost_clock", "displayName": "Boost Clock", "dataType": "FREQUENCY", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 31},
   {"name": "ray_tracing", "displayName": "Ray Tracing Support", "dataType": "BOOLEAN", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 36},
   {"name": "dlss_support", "displayName": "DLSS Support", "dataType": "BOOLEAN", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 37}
 ]'::jsonb,
 ARRAY['видеокарт.*', 'gpu.*', 'graphics.*card.*', 'графическ.*карт.*', 'видеоадаптер.*'],
 10),

('motherboard', 'MOTHERBOARD', 'Motherboard', 'Main circuit board that connects all components',
 ARRAY['POWER_CONSUMER', 'HAS_SOCKET', 'HAS_SLOTS', 'HAS_PORTS', 'HAS_FORM_FACTOR', 'REQUIRES_FORM_FACTOR'],
 '[
   {"name": "socket", "displayName": "Socket", "dataType": "SOCKET", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 5},
   {"name": "chipset", "displayName": "Chipset", "dataType": "CHIPSET", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 6},
   {"name": "form_factor", "displayName": "Form Factor", "dataType": "ENUM", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 40},
   {"name": "memory_type", "displayName": "Memory Type", "dataType": "MEMORY_TYPE", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 20},
   {"name": "memory_slots", "displayName": "Memory Slots", "dataType": "NUMBER", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 23},
   {"name": "max_memory", "displayName": "Maximum Memory", "dataType": "MEMORY_SIZE", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 24}
 ]'::jsonb,
 '[
   {"name": "pcie_slots", "displayName": "PCIe Slots", "dataType": "NUMBER", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 41},
   {"name": "wifi_support", "displayName": "WiFi Support", "dataType": "BOOLEAN", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 42}
 ]'::jsonb,
 ARRAY['материнск.*плат.*', 'motherboard.*', 'mainboard.*', 'мат.*плат.*', 'системн.*плат.*'],
 10),

('ram', 'RAM', 'Memory (RAM)', 'Random Access Memory - system memory for temporary data storage',
 ARRAY['POWER_CONSUMER', 'REQUIRES_SLOT', 'HAS_MEMORY', 'VOLATILE_MEMORY', 'OVERCLOCKABLE'],
 '[
   {"name": "memory_type", "displayName": "Memory Type", "dataType": "MEMORY_TYPE", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 20},
   {"name": "memory_size", "displayName": "Memory Size", "dataType": "MEMORY_SIZE", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 21},
   {"name": "memory_speed", "displayName": "Memory Speed", "dataType": "FREQUENCY", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 25},
   {"name": "modules", "displayName": "Number of Modules", "dataType": "NUMBER", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 26}
 ]'::jsonb,
 '[
   {"name": "cas_latency", "displayName": "CAS Latency", "dataType": "NUMBER", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 27},
   {"name": "rgb_lighting", "displayName": "RGB Lighting", "dataType": "BOOLEAN", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 43}
 ]'::jsonb,
 ARRAY['оперативн.*памят.*', 'ram.*', 'memory.*', 'озу.*', 'ddr.*'],
 10),

('storage', 'STORAGE', 'Storage Device', 'Persistent storage device (SSD, HDD, NVMe)',
 ARRAY['POWER_CONSUMER', 'HAS_MEMORY', 'PERSISTENT_STORAGE', 'REQUIRES_PORTS'],
 '[
   {"name": "memory_size", "displayName": "Memory Size", "dataType": "MEMORY_SIZE", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 21},
   {"name": "storage_type", "displayName": "Storage Type", "dataType": "ENUM", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 50},
   {"name": "interface", "displayName": "Interface", "dataType": "ENUM", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 51}
 ]'::jsonb,
 '[
   {"name": "read_speed", "displayName": "Read Speed", "dataType": "NUMBER", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 52},
   {"name": "write_speed", "displayName": "Write Speed", "dataType": "NUMBER", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 53}
 ]'::jsonb,
 ARRAY['накопител.*', 'ssd.*', 'hdd.*', 'жестк.*диск.*', 'твердотельн.*накопител.*', 'storage.*', 'диск.*'],
 10),

('psu', 'PSU', 'Power Supply (PSU)', 'Power Supply Unit - provides power to all components',
 ARRAY['POWER_PROVIDER', 'HAS_FORM_FACTOR', 'MODULAR'],
 '[
   {"name": "wattage", "displayName": "Wattage", "dataType": "POWER_CONSUMPTION", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 60},
   {"name": "efficiency_rating", "displayName": "Efficiency Rating", "dataType": "ENUM", "isRequired": true, "isCompatibilityKey": false, "displayOrder": 61},
   {"name": "form_factor", "displayName": "Form Factor", "dataType": "ENUM", "isRequired": true, "isCompatibilityKey": true, "displayOrder": 40}
 ]'::jsonb,
 '[
   {"name": "modular", "displayName": "Modular Cables", "dataType": "BOOLEAN", "isRequired": false, "isCompatibilityKey": false, "displayOrder": 62}
 ]'::jsonb,
 ARRAY['блок.*питан.*', 'psu.*', 'power.*supply.*', 'бп.*', 'источник.*питан.*'],
 10)

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    tags = EXCLUDED.tags,
    required_specifications = EXCLUDED.required_specifications,
    optional_specifications = EXCLUDED.optional_specifications,
    category_patterns = EXCLUDED.category_patterns,
    priority = EXCLUDED.priority,
    updated_at = NOW();

-- Insert default auto-detection rules
INSERT INTO auto_detection_rules (id, profile_id, patterns, keywords, confidence) VALUES
('cpu-detection', 'cpu', ARRAY['процессор.*', 'cpu.*', '.*процессор.*', 'центральн.*процессор.*', 'processor.*'], ARRAY['процессор', 'cpu', 'processor', 'intel', 'amd', 'ryzen', 'core'], 0.9),
('gpu-detection', 'gpu', ARRAY['видеокарт.*', 'gpu.*', 'graphics.*card.*', 'графическ.*карт.*', 'видеоадаптер.*'], ARRAY['видеокарта', 'gpu', 'graphics', 'nvidia', 'amd', 'radeon', 'geforce'], 0.9),
('motherboard-detection', 'motherboard', ARRAY['материнск.*плат.*', 'motherboard.*', 'mainboard.*', 'мат.*плат.*', 'системн.*плат.*'], ARRAY['материнская', 'плата', 'motherboard', 'mainboard', 'chipset'], 0.9),
('ram-detection', 'ram', ARRAY['оперативн.*памят.*', 'ram.*', 'memory.*', 'озу.*', 'ddr.*'], ARRAY['память', 'ram', 'memory', 'ddr4', 'ddr5', 'озу'], 0.9),
('storage-detection', 'storage', ARRAY['накопител.*', 'ssd.*', 'hdd.*', 'жестк.*диск.*', 'твердотельн.*накопител.*', 'storage.*', 'диск.*'], ARRAY['накопитель', 'ssd', 'hdd', 'диск', 'storage', 'nvme'], 0.9),
('psu-detection', 'psu', ARRAY['блок.*питан.*', 'psu.*', 'power.*supply.*', 'бп.*', 'источник.*питан.*'], ARRAY['блок', 'питания', 'psu', 'power', 'supply', 'бп'], 0.9)

ON CONFLICT (id) DO UPDATE SET
    patterns = EXCLUDED.patterns,
    keywords = EXCLUDED.keywords,
    confidence = EXCLUDED.confidence,
    updated_at = NOW();

-- Insert default tag compatibility rules
INSERT INTO tag_compatibility_rules (id, name, description, required_tag, compatible_tags, specification_key, severity) VALUES
('cpu-socket-compatibility', 'CPU Socket Compatibility', 'CPU requires compatible socket on motherboard', 'REQUIRES_SOCKET', ARRAY['HAS_SOCKET'], 'socket', 'error'),
('power-consumption-compatibility', 'Power Supply Compatibility', 'Power consumers need adequate power supply', 'POWER_CONSUMER', ARRAY['POWER_PROVIDER'], 'power_consumption', 'error'),
('cooling-compatibility', 'Cooling Requirements', 'Heat generating components need cooling', 'GENERATES_HEAT', ARRAY['PROVIDES_COOLING'], 'tdp', 'warning'),
('memory-slot-compatibility', 'Memory Slot Compatibility', 'RAM requires available memory slots', 'REQUIRES_SLOT', ARRAY['HAS_SLOTS'], 'memory_slots', 'error'),
('form-factor-compatibility', 'Form Factor Compatibility', 'Components must fit within case form factor', 'REQUIRES_FORM_FACTOR', ARRAY['HAS_FORM_FACTOR'], 'form_factor', 'error')

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    required_tag = EXCLUDED.required_tag,
    compatible_tags = EXCLUDED.compatible_tags,
    specification_key = EXCLUDED.specification_key,
    severity = EXCLUDED.severity,
    updated_at = NOW();

-- Create a function to automatically detect and suggest profiles for categories
CREATE OR REPLACE FUNCTION detect_category_profiles()
RETURNS TRIGGER AS $$
DECLARE
    rule RECORD;
    profile_matches TEXT[] := '{}';
    pattern TEXT;
    keyword TEXT;
    category_text TEXT;
BEGIN
    -- Only run detection for PC component categories
    IF NEW.is_pc_component = true AND (NEW.smart_detection_enabled = true OR NEW.smart_detection_enabled IS NULL) THEN
        -- Combine category name and description for matching
        category_text := LOWER(COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.description, ''));
        
        -- Check each auto-detection rule
        FOR rule IN SELECT * FROM auto_detection_rules WHERE is_active = true ORDER BY confidence DESC LOOP
            -- Check patterns
            FOREACH pattern IN ARRAY rule.patterns LOOP
                IF category_text ~ pattern THEN
                    profile_matches := array_append(profile_matches, rule.profile_id);
                    EXIT; -- Found a match, no need to check more patterns for this rule
                END IF;
            END LOOP;
            
            -- If no pattern matched, check keywords
            IF NOT (rule.profile_id = ANY(profile_matches)) THEN
                FOREACH keyword IN ARRAY rule.keywords LOOP
                    IF category_text LIKE '%' || keyword || '%' THEN
                        profile_matches := array_append(profile_matches, rule.profile_id);
                        EXIT; -- Found a match, no need to check more keywords for this rule
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
        
        -- Update suggested profiles if any matches found
        IF array_length(profile_matches, 1) > 0 THEN
            NEW.suggested_profiles := profile_matches;
            NEW.last_profile_detection := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic profile detection
DROP TRIGGER IF EXISTS trigger_detect_category_profiles ON categories;
CREATE TRIGGER trigger_detect_category_profiles
    BEFORE INSERT OR UPDATE OF name, description, is_pc_component, smart_detection_enabled
    ON categories
    FOR EACH ROW
    EXECUTE FUNCTION detect_category_profiles();

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER trigger_component_profiles_updated_at
    BEFORE UPDATE ON component_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_auto_detection_rules_updated_at
    BEFORE UPDATE ON auto_detection_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tag_compatibility_rules_updated_at
    BEFORE UPDATE ON tag_compatibility_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();