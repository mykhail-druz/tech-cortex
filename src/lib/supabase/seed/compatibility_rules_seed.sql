-- Sample compatibility rules for PC Configurator
-- This file contains example compatibility rules for testing and demonstration purposes

-- First, let's set up some example specification templates for PC components
-- These would typically be created through the admin interface

-- CPU Socket specification for processors
INSERT INTO category_specification_templates 
(category_id, name, display_name, description, is_required, data_type, is_compatibility_key, enum_values)
VALUES 
((SELECT id FROM categories WHERE slug = 'cpu'),
'socket', 'Socket', 'CPU socket type', true, 'socket', true, 
ARRAY['AM4', 'AM5', 'LGA1700', 'LGA1200']);

-- Socket specification for motherboards
INSERT INTO category_specification_templates 
(category_id, name, display_name, description, is_required, data_type, is_compatibility_key, enum_values)
VALUES 
((SELECT id FROM categories WHERE slug = 'motherboard'),
'socket', 'Socket', 'Motherboard socket type', true, 'socket', true, 
ARRAY['AM4', 'AM5', 'LGA1700', 'LGA1200']);

-- Memory type specification for motherboards
INSERT INTO category_specification_templates 
(category_id, name, display_name, description, is_required, data_type, is_compatibility_key, enum_values)
VALUES 
((SELECT id FROM categories WHERE slug = 'motherboard'),
'memory_type', 'Memory Type', 'Supported memory type', true, 'memory_type', true, 
ARRAY['DDR4', 'DDR5']);

-- Memory type specification for RAM
INSERT INTO category_specification_templates 
(category_id, name, display_name, description, is_required, data_type, is_compatibility_key, enum_values)
VALUES 
((SELECT id FROM categories WHERE slug = 'ram'),
'memory_type', 'Memory Type', 'RAM type', true, 'memory_type', true, 
ARRAY['DDR4', 'DDR5']);

-- Power requirement for GPUs
INSERT INTO category_specification_templates 
(category_id, name, display_name, description, is_required, data_type, is_compatibility_key, enum_values)
VALUES 
((SELECT id FROM categories WHERE slug = 'gpu'),
'power_requirement', 'Power Requirement', 'Minimum power supply wattage', true, 'number', true, NULL);

-- Power output for PSUs
INSERT INTO category_specification_templates 
(category_id, name, display_name, description, is_required, data_type, is_compatibility_key, enum_values)
VALUES 
((SELECT id FROM categories WHERE slug = 'psu'),
'wattage', 'Wattage', 'Power supply wattage', true, 'number', true, NULL);

-- Power connector type for GPUs
INSERT INTO category_specification_templates 
(category_id, name, display_name, description, is_required, data_type, is_compatibility_key, enum_values)
VALUES 
((SELECT id FROM categories WHERE slug = 'gpu'),
'power_connector', 'Power Connector', 'Power connector type', true, 'power_connector', true, 
ARRAY['6-pin', '8-pin', '24-pin']);

-- Power connector type for PSUs
INSERT INTO category_specification_templates 
(category_id, name, display_name, description, is_required, data_type, is_compatibility_key, enum_values)
VALUES 
((SELECT id FROM categories WHERE slug = 'psu'),
'available_connectors', 'Available Connectors', 'Available power connectors', true, 'text', true, NULL);

-- Now let's create some compatibility rules

-- Rule 1: CPU and Motherboard socket compatibility (exact match)
INSERT INTO compatibility_rules
(name, description, primary_category_id, primary_specification_template_id, 
secondary_category_id, secondary_specification_template_id, rule_type)
VALUES
('CPU-Motherboard Socket Compatibility', 'CPU socket must match motherboard socket',
(SELECT id FROM categories WHERE slug = 'cpu'),
(SELECT id FROM category_specification_templates WHERE name = 'socket' AND category_id = (SELECT id FROM categories WHERE slug = 'cpu')),
(SELECT id FROM categories WHERE slug = 'motherboard'),
(SELECT id FROM category_specification_templates WHERE name = 'socket' AND category_id = (SELECT id FROM categories WHERE slug = 'motherboard')),
'exact_match');

-- Rule 2: RAM and Motherboard memory type compatibility (exact match)
INSERT INTO compatibility_rules
(name, description, primary_category_id, primary_specification_template_id, 
secondary_category_id, secondary_specification_template_id, rule_type)
VALUES
('RAM-Motherboard Memory Type Compatibility', 'RAM type must match motherboard supported memory type',
(SELECT id FROM categories WHERE slug = 'motherboard'),
(SELECT id FROM category_specification_templates WHERE name = 'memory_type' AND category_id = (SELECT id FROM categories WHERE slug = 'motherboard')),
(SELECT id FROM categories WHERE slug = 'ram'),
(SELECT id FROM category_specification_templates WHERE name = 'memory_type' AND category_id = (SELECT id FROM categories WHERE slug = 'ram')),
'exact_match');

-- Rule 3: GPU power requirement and PSU wattage compatibility (range check)
INSERT INTO compatibility_rules
(name, description, primary_category_id, primary_specification_template_id, 
secondary_category_id, secondary_specification_template_id, rule_type, min_value)
VALUES
('GPU-PSU Power Compatibility', 'PSU wattage must be sufficient for GPU power requirement',
(SELECT id FROM categories WHERE slug = 'gpu'),
(SELECT id FROM category_specification_templates WHERE name = 'power_requirement' AND category_id = (SELECT id FROM categories WHERE slug = 'gpu')),
(SELECT id FROM categories WHERE slug = 'psu'),
(SELECT id FROM category_specification_templates WHERE name = 'wattage' AND category_id = (SELECT id FROM categories WHERE slug = 'psu')),
'range_check', 0);

-- Example of how to add sample product specifications for testing
-- These would typically be added when creating or updating products

-- Example: AMD Ryzen 7 5800X (AM4 socket)
INSERT INTO product_specifications
(product_id, template_id, name, value, value_enum, display_order)
VALUES
('00000000-0000-0000-0000-000000000001', -- Replace with actual product ID
(SELECT id FROM category_specification_templates WHERE name = 'socket' AND category_id = (SELECT id FROM categories WHERE slug = 'cpu')),
'Socket', 'AM4', 'AM4', 1);

-- Example: ASUS ROG Strix B550-F Gaming (AM4 socket, DDR4 memory)
INSERT INTO product_specifications
(product_id, template_id, name, value, value_enum, display_order)
VALUES
('00000000-0000-0000-0000-000000000002', -- Replace with actual product ID
(SELECT id FROM category_specification_templates WHERE name = 'socket' AND category_id = (SELECT id FROM categories WHERE slug = 'motherboard')),
'Socket', 'AM4', 'AM4', 1);

INSERT INTO product_specifications
(product_id, template_id, name, value, value_enum, display_order)
VALUES
('00000000-0000-0000-0000-000000000002', -- Replace with actual product ID
(SELECT id FROM category_specification_templates WHERE name = 'memory_type' AND category_id = (SELECT id FROM categories WHERE slug = 'motherboard')),
'Memory Type', 'DDR4', 'DDR4', 2);

-- Example: Corsair Vengeance LPX 16GB (DDR4)
INSERT INTO product_specifications
(product_id, template_id, name, value, value_enum, display_order)
VALUES
('00000000-0000-0000-0000-000000000003', -- Replace with actual product ID
(SELECT id FROM category_specification_templates WHERE name = 'memory_type' AND category_id = (SELECT id FROM categories WHERE slug = 'ram')),
'Memory Type', 'DDR4', 'DDR4', 1);

-- Example: NVIDIA GeForce RTX 3080 (350W power requirement, 8-pin connector)
INSERT INTO product_specifications
(product_id, template_id, name, value, value_number, display_order)
VALUES
('00000000-0000-0000-0000-000000000004', -- Replace with actual product ID
(SELECT id FROM category_specification_templates WHERE name = 'power_requirement' AND category_id = (SELECT id FROM categories WHERE slug = 'gpu')),
'Power Requirement', '350', 350, 1);

INSERT INTO product_specifications
(product_id, template_id, name, value, value_enum, display_order)
VALUES
('00000000-0000-0000-0000-000000000004', -- Replace with actual product ID
(SELECT id FROM category_specification_templates WHERE name = 'power_connector' AND category_id = (SELECT id FROM categories WHERE slug = 'gpu')),
'Power Connector', '8-pin', '8-pin', 2);

-- Example: Corsair RM750x (750W, has 8-pin connectors)
INSERT INTO product_specifications
(product_id, template_id, name, value, value_number, display_order)
VALUES
('00000000-0000-0000-0000-000000000005', -- Replace with actual product ID
(SELECT id FROM category_specification_templates WHERE name = 'wattage' AND category_id = (SELECT id FROM categories WHERE slug = 'psu')),
'Wattage', '750', 750, 1);

INSERT INTO product_specifications
(product_id, template_id, name, value, value_text, display_order)
VALUES
('00000000-0000-0000-0000-000000000005', -- Replace with actual product ID
(SELECT id FROM category_specification_templates WHERE name = 'available_connectors' AND category_id = (SELECT id FROM categories WHERE slug = 'psu')),
'Available Connectors', '24-pin ATX, 8-pin CPU, 6+2-pin PCIe', '24-pin ATX, 8-pin CPU, 6+2-pin PCIe', 2);

-- Note: In a real implementation, you would replace the placeholder UUIDs with actual product IDs
-- and ensure that the categories and specification templates exist in the database.