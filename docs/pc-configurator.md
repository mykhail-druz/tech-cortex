# PC Configurator System Documentation

## Overview

The PC Configurator is a feature that allows users to build custom PC configurations with automatic compatibility checking between components. It ensures that users select components that work together (e.g., CPU socket matches motherboard socket, RAM type is compatible with the motherboard, etc.).

## Key Features

- Typed specification system for PC components
- Compatibility rules between different component types
- Real-time filtering of compatible components
- Validation of complete PC configurations
- User-friendly interface for building PCs

## Technical Implementation

### Database Schema

The system extends the existing product specification system with the following changes:

1. **Enhanced `category_specification_templates` table**:
   - Added `is_compatibility_key` (boolean): Indicates if this specification is used for compatibility checking
   - Added `enum_values` (text[]): Stores possible values for enum type specifications

2. **Enhanced `product_specifications` table**:
   - Added typed value columns:
     - `value_text`: For text values
     - `value_number`: For numeric values
     - `value_enum`: For enum values (including socket, memory_type, power_connector)
     - `value_boolean`: For boolean values
   - Kept original `value` field for backward compatibility

3. **New `compatibility_rules` table**:
   - Defines rules for checking compatibility between components
   - Supports different rule types:
     - `exact_match`: Values must match exactly
     - `compatible_values`: Secondary value must be in a list of compatible values
     - `range_check`: Secondary value must be within a specified range
     - `custom`: Custom compatibility logic

### TypeScript Types

The system includes the following TypeScript types:

1. **Enums**:
   - `SpecificationDataType`: Defines the possible data types for specifications
   - `SocketType`: Standard CPU socket types
   - `MemoryType`: Standard memory types
   - `PowerConnectorType`: Standard power connector types

2. **Interfaces**:
   - `CategorySpecificationTemplate`: Enhanced template with compatibility fields
   - `ProductSpecification`: Enhanced specification with typed values
   - `CompatibilityRule`: Defines rules for compatibility checking
   - `PCConfiguration`: Represents a complete PC configuration
   - `CompatibilityCheckResult`: Result of compatibility validation

### Compatibility Functions

1. **`checkComponentCompatibility`**:
   - Checks if two components are compatible with each other
   - Returns compatibility status and reason if incompatible

2. **`getCompatibleComponents`**:
   - Gets compatible components for a given set of selected components
   - Filters products in a category based on compatibility with already selected components

3. **`validateConfiguration`**:
   - Validates a complete PC configuration for compatibility
   - Checks compatibility between all pairs of components

## Usage Examples

### Setting Up Compatibility Rules

```sql
-- Example: CPU and Motherboard socket compatibility (exact match)
INSERT INTO compatibility_rules
(name, description, primary_category_id, primary_specification_template_id, 
secondary_category_id, secondary_specification_template_id, rule_type)
VALUES
('CPU-Motherboard Socket Compatibility', 'CPU socket must match motherboard socket',
(SELECT id FROM categories WHERE name = 'Processors'),
(SELECT id FROM category_specification_templates WHERE name = 'socket' AND category_id = (SELECT id FROM categories WHERE name = 'Processors')),
(SELECT id FROM categories WHERE name = 'Motherboards'),
(SELECT id FROM category_specification_templates WHERE name = 'socket' AND category_id = (SELECT id FROM categories WHERE name = 'Motherboards')),
'exact_match');
```

### Adding Typed Specifications to Products

```sql
-- Example: Adding socket specification to a CPU
INSERT INTO product_specifications
(product_id, template_id, name, value, value_enum, display_order)
VALUES
('product-uuid', 
(SELECT id FROM category_specification_templates WHERE name = 'socket' AND category_id = (SELECT id FROM categories WHERE name = 'Processors')),
'Socket', 'AM4', 'AM4', 1);
```

### Using the PC Configurator Component

```tsx
// In a Next.js page
import PCConfigurator from '@/components/PCConfigurator/PCConfigurator';

export default function PCBuilderPage() {
  return (
    <main>
      <h1>Build Your PC</h1>
      <PCConfigurator />
    </main>
  );
}
```

### Checking Component Compatibility Programmatically

```typescript
import { checkComponentCompatibility } from '@/lib/compatibility';

// Check if a CPU is compatible with a motherboard
const result = await checkComponentCompatibility(cpuId, motherboardId);

if (result.isCompatible) {
  console.log('Components are compatible!');
} else {
  console.log('Incompatibility reason:', result.reason);
}
```

## Performance Considerations

The system includes database indexes for performance optimization:

1. Index on `category_specification_templates(category_id, is_compatibility_key)` for quickly finding compatibility-related specifications
2. Index on `product_specifications(template_id)` for filtering specifications by template
3. Index on `product_specifications(value_enum)` for filtering by enum values
4. Index on `product_specifications(value_number)` for range-based filtering
5. Indexes on compatibility rules for efficient rule lookup

## Extending the System

### Adding New Specification Types

1. Add the new type to the `SpecificationDataType` enum
2. Update the migration script to handle the new type
3. Add any necessary enum constants for standardization
4. Update the compatibility functions if needed

### Adding New Compatibility Rule Types

1. Add the new rule type to the `rule_type` field in the `compatibility_rules` table
2. Update the `checkComponentCompatibility` function to handle the new rule type
3. Add any necessary fields to the `compatibility_rules` table for the new rule type

## Troubleshooting

### Common Issues

1. **Components not showing as compatible when they should be**:
   - Check that the specification templates have `is_compatibility_key` set to true
   - Verify that the compatibility rules are correctly defined
   - Ensure that product specifications use the correct template IDs

2. **Performance issues with large product catalogs**:
   - Ensure all recommended indexes are in place
   - Consider implementing pagination or lazy loading in the UI
   - Optimize database queries in the compatibility functions

## Migration Guide

To migrate existing data to the new system:

1. Run the migration script to add the new columns to the tables
2. Use the `migrate_product_specifications` function to populate the typed value columns
3. Set up compatibility specification templates for each category
4. Define compatibility rules between categories
5. Update product specifications with the appropriate typed values and templates

See the `20250606_pc_configurator.sql` migration file for details.