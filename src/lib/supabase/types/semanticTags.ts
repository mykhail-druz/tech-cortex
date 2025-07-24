/**
 * Smart Tag-Based Specification System
 * 
 * This system provides semantic tags that describe component functionality
 * rather than being tied to specific category names. This allows for
 * automatic specification detection and standardization across similar
 * component types.
 */

import { SpecificationDataType, SpecificationValidationRule } from './specifications';

// Semantic tags that describe component functionality
export enum SemanticTag {
  // Power-related tags
  POWER_CONSUMER = 'POWER_CONSUMER',           // Component consumes power
  POWER_PROVIDER = 'POWER_PROVIDER',           // Component provides power (PSU)
  POWER_EFFICIENT = 'POWER_EFFICIENT',         // Low power consumption component
  
  // Socket and connectivity tags
  REQUIRES_SOCKET = 'REQUIRES_SOCKET',         // Needs a socket (CPU)
  HAS_SOCKET = 'HAS_SOCKET',                   // Provides socket (Motherboard)
  REQUIRES_SLOT = 'REQUIRES_SLOT',             // Needs expansion slot (GPU, RAM)
  HAS_SLOTS = 'HAS_SLOTS',                     // Provides slots (Motherboard)
  
  // Graphics and display tags
  HAS_GRAPHICS = 'HAS_GRAPHICS',               // Has graphics capability
  REQUIRES_GRAPHICS = 'REQUIRES_GRAPHICS',     // Needs graphics (Monitor)
  GRAPHICS_ACCELERATED = 'GRAPHICS_ACCELERATED', // High-performance graphics
  
  // Thermal management tags
  GENERATES_HEAT = 'GENERATES_HEAT',           // Produces heat (CPU, GPU)
  PROVIDES_COOLING = 'PROVIDES_COOLING',       // Provides cooling (Cooler, Fan)
  REQUIRES_COOLING = 'REQUIRES_COOLING',       // Needs cooling
  
  // Memory and storage tags
  HAS_MEMORY = 'HAS_MEMORY',                   // Has memory (RAM, Storage)
  REQUIRES_MEMORY = 'REQUIRES_MEMORY',         // Needs memory
  VOLATILE_MEMORY = 'VOLATILE_MEMORY',         // RAM-type memory
  PERSISTENT_STORAGE = 'PERSISTENT_STORAGE',   // Storage devices
  
  // Form factor and physical tags
  HAS_FORM_FACTOR = 'HAS_FORM_FACTOR',         // Has specific form factor
  REQUIRES_FORM_FACTOR = 'REQUIRES_FORM_FACTOR', // Needs specific form factor
  MODULAR = 'MODULAR',                         // Modular component
  
  // Connectivity tags
  HAS_PORTS = 'HAS_PORTS',                     // Provides ports/connectors
  REQUIRES_PORTS = 'REQUIRES_PORTS',           // Needs specific ports
  WIRELESS_CAPABLE = 'WIRELESS_CAPABLE',       // Has wireless connectivity
  WIRED_ONLY = 'WIRED_ONLY',                   // Only wired connectivity
  
  // Performance tags
  HIGH_PERFORMANCE = 'HIGH_PERFORMANCE',       // High-end component
  BUDGET_FRIENDLY = 'BUDGET_FRIENDLY',         // Budget component
  OVERCLOCKABLE = 'OVERCLOCKABLE',             // Can be overclocked
  
  // Special function tags
  RGB_LIGHTING = 'RGB_LIGHTING',               // Has RGB lighting
  SILENT_OPERATION = 'SILENT_OPERATION',       // Quiet operation
  WATER_COOLING = 'WATER_COOLING',             // Water cooling related
  AIR_COOLING = 'AIR_COOLING',                 // Air cooling related
}

// Standard specification definition
export interface StandardSpecification {
  name: string;                                // Internal name (e.g., "power_consumption")
  displayName: string;                         // User-friendly name (e.g., "Power Consumption")
  description?: string;                        // Description for admin
  dataType: SpecificationDataType;             // Data type
  validationRule: SpecificationValidationRule; // Validation rules
  isRequired: boolean;                         // Is this spec required
  isCompatibilityKey: boolean;                 // Used for compatibility checking
  displayOrder: number;                        // Display order
  filterType?: 'checkbox' | 'dropdown' | 'range' | 'search'; // Filter UI type
}

// Component profile that defines specifications for a component type
export interface ComponentProfile {
  id: string;                                  // Unique profile ID
  name: string;                                // Profile name (e.g., "CPU", "GPU")
  displayName: string;                         // User-friendly name
  description: string;                         // Profile description
  tags: SemanticTag[];                         // Associated semantic tags
  requiredSpecifications: StandardSpecification[]; // Always required specs
  optionalSpecifications: StandardSpecification[]; // Optional specs
  categoryPatterns: string[];                  // Patterns to match category names
  priority: number;                            // Priority when multiple profiles match
}

// Smart specification system configuration
export interface SmartSpecificationConfig {
  profiles: ComponentProfile[];                // Available profiles
  tagCompatibilityRules: TagCompatibilityRule[]; // Compatibility rules between tags
  autoDetectionRules: AutoDetectionRule[];    // Rules for automatic profile detection
}

// Compatibility rule between semantic tags
export interface TagCompatibilityRule {
  id: string;
  name: string;
  description: string;
  requiredTag: SemanticTag;                    // Tag that requires something
  compatibleTags: SemanticTag[];               // Tags that satisfy the requirement
  specificationKey: string;                   // Specification to check for compatibility
  severity: 'error' | 'warning' | 'info';     // Issue severity
}

// Rule for automatic profile detection
export interface AutoDetectionRule {
  id: string;
  profileId: string;                           // Profile to suggest
  patterns: string[];                          // Category name patterns (regex)
  keywords: string[];                          // Keywords to look for
  excludePatterns?: string[];                  // Patterns to exclude
  confidence: number;                          // Confidence score (0-1)
}

// Result of smart specification detection
export interface SpecificationDetectionResult {
  suggestedProfiles: {
    profile: ComponentProfile;
    confidence: number;
    matchedPatterns: string[];
    matchedKeywords: string[];
  }[];
  recommendedTags: SemanticTag[];
  autoGeneratedSpecs: StandardSpecification[];
}

// Enhanced category with semantic tags
export interface CategoryWithSemanticTags {
  id: string;
  name: string;
  specification_tags?: SemanticTag[];          // Assigned semantic tags
  suggested_profiles?: string[];               // Suggested profile IDs
  auto_generated_specs?: StandardSpecification[]; // Auto-generated specifications
  custom_specs?: StandardSpecification[];     // Custom specifications added by admin
}