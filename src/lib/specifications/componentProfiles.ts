/**
 * Component Profiles for Smart Tag-Based Specification System
 * 
 * This file defines ready-made profiles for main PC component types.
 * Each profile contains semantic tags, required/optional specifications,
 * and patterns for automatic category detection.
 */

import { 
  ComponentProfile, 
  SemanticTag, 
  StandardSpecification,
  AutoDetectionRule,
  TagCompatibilityRule
} from '@/lib/supabase/types/semanticTags';
import { SpecificationDataType } from '@/lib/supabase/types/specifications';

// Standard specifications that can be reused across profiles
const STANDARD_SPECS = {
  // Power specifications
  POWER_CONSUMPTION: {
    name: 'power_consumption',
    displayName: 'Power Consumption',
    description: 'Power consumption in watts',
    dataType: SpecificationDataType.POWER_CONSUMPTION,
    validationRule: {
      required: true,
      dataType: SpecificationDataType.POWER_CONSUMPTION,
      minValue: 1,
      maxValue: 2000,
      unit: 'W',
      compatibilityKey: true
    },
    isRequired: true,
    isCompatibilityKey: true,
    displayOrder: 10,
    filterType: 'range' as const
  },

  TDP: {
    name: 'tdp',
    displayName: 'TDP (Thermal Design Power)',
    description: 'Thermal Design Power in watts',
    dataType: SpecificationDataType.POWER_CONSUMPTION,
    validationRule: {
      required: true,
      dataType: SpecificationDataType.POWER_CONSUMPTION,
      minValue: 1,
      maxValue: 1000,
      unit: 'W',
      compatibilityKey: true
    },
    isRequired: true,
    isCompatibilityKey: true,
    displayOrder: 11,
    filterType: 'range' as const
  },

  // Socket specifications
  SOCKET: {
    name: 'socket',
    displayName: 'Socket',
    description: 'CPU socket type',
    dataType: SpecificationDataType.SOCKET,
    validationRule: {
      required: true,
      dataType: SpecificationDataType.SOCKET,
      compatibilityKey: true
    },
    isRequired: true,
    isCompatibilityKey: true,
    displayOrder: 5,
    filterType: 'dropdown' as const
  },

  // Memory specifications
  MEMORY_TYPE: {
    name: 'memory_type',
    displayName: 'Memory Type',
    description: 'Type of memory (DDR4, DDR5, etc.)',
    dataType: SpecificationDataType.MEMORY_TYPE,
    validationRule: {
      required: true,
      dataType: SpecificationDataType.MEMORY_TYPE,
      compatibilityKey: true
    },
    isRequired: true,
    isCompatibilityKey: true,
    displayOrder: 20,
    filterType: 'dropdown' as const
  },

  MEMORY_SIZE: {
    name: 'memory_size',
    displayName: 'Memory Size',
    description: 'Memory capacity',
    dataType: SpecificationDataType.MEMORY_SIZE,
    validationRule: {
      required: true,
      dataType: SpecificationDataType.MEMORY_SIZE,
      minValue: 1,
      unit: 'GB',
      compatibilityKey: false
    },
    isRequired: true,
    isCompatibilityKey: false,
    displayOrder: 21,
    filterType: 'range' as const
  },

  // Frequency specifications
  BASE_CLOCK: {
    name: 'base_clock',
    displayName: 'Base Clock',
    description: 'Base clock frequency',
    dataType: SpecificationDataType.FREQUENCY,
    validationRule: {
      required: true,
      dataType: SpecificationDataType.FREQUENCY,
      minValue: 100,
      unit: 'MHz',
      compatibilityKey: false
    },
    isRequired: true,
    isCompatibilityKey: false,
    displayOrder: 30,
    filterType: 'range' as const
  },

  BOOST_CLOCK: {
    name: 'boost_clock',
    displayName: 'Boost Clock',
    description: 'Maximum boost clock frequency',
    dataType: SpecificationDataType.FREQUENCY,
    validationRule: {
      required: false,
      dataType: SpecificationDataType.FREQUENCY,
      minValue: 100,
      unit: 'MHz',
      compatibilityKey: false
    },
    isRequired: false,
    isCompatibilityKey: false,
    displayOrder: 31,
    filterType: 'range' as const
  },

  // Form factor specifications
  FORM_FACTOR: {
    name: 'form_factor',
    displayName: 'Form Factor',
    description: 'Physical form factor',
    dataType: SpecificationDataType.ENUM,
    validationRule: {
      required: true,
      dataType: SpecificationDataType.ENUM,
      enumValues: ['ATX', 'Micro ATX', 'Mini ITX', 'E-ATX'],
      compatibilityKey: true
    },
    isRequired: true,
    isCompatibilityKey: true,
    displayOrder: 40,
    filterType: 'dropdown' as const
  },

  // Chipset specification
  CHIPSET: {
    name: 'chipset',
    displayName: 'Chipset',
    description: 'Motherboard chipset',
    dataType: SpecificationDataType.CHIPSET,
    validationRule: {
      required: true,
      dataType: SpecificationDataType.CHIPSET,
      compatibilityKey: true
    },
    isRequired: true,
    isCompatibilityKey: true,
    displayOrder: 6,
    filterType: 'dropdown' as const
  }
} satisfies Record<string, StandardSpecification>;

// CPU Profile
export const CPU_PROFILE: ComponentProfile = {
  id: 'cpu',
  name: 'CPU',
  displayName: 'Processor (CPU)',
  description: 'Central Processing Unit - the main processor of the computer',
  tags: [
    SemanticTag.POWER_CONSUMER,
    SemanticTag.REQUIRES_SOCKET,
    SemanticTag.GENERATES_HEAT,
    SemanticTag.REQUIRES_COOLING,
    SemanticTag.HIGH_PERFORMANCE,
    SemanticTag.OVERCLOCKABLE
  ],
  requiredSpecifications: [
    STANDARD_SPECS.SOCKET,
    STANDARD_SPECS.TDP,
    STANDARD_SPECS.BASE_CLOCK,
    {
      name: 'cores',
      displayName: 'Cores',
      description: 'Number of CPU cores',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.NUMBER,
        minValue: 1,
        maxValue: 64,
        compatibilityKey: false
      },
      isRequired: true,
      isCompatibilityKey: false,
      displayOrder: 32,
      filterType: 'range'
    },
    {
      name: 'threads',
      displayName: 'Threads',
      description: 'Number of CPU threads',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.NUMBER,
        minValue: 1,
        maxValue: 128,
        compatibilityKey: false
      },
      isRequired: true,
      isCompatibilityKey: false,
      displayOrder: 33,
      filterType: 'range'
    }
  ],
  optionalSpecifications: [
    STANDARD_SPECS.BOOST_CLOCK,
    {
      name: 'cache_l3',
      displayName: 'L3 Cache',
      description: 'L3 cache size in MB',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.NUMBER,
        minValue: 1,
        unit: 'MB',
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 34,
      filterType: 'range'
    },
    {
      name: 'integrated_graphics',
      displayName: 'Integrated Graphics',
      description: 'Has integrated graphics',
      dataType: SpecificationDataType.BOOLEAN,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.BOOLEAN,
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 35,
      filterType: 'checkbox'
    }
  ],
  categoryPatterns: [
    'процессор.*',
    'cpu.*',
    '.*процессор.*',
    'центральн.*процессор.*',
    'processor.*'
  ],
  priority: 10
};

// GPU Profile
export const GPU_PROFILE: ComponentProfile = {
  id: 'gpu',
  name: 'GPU',
  displayName: 'Graphics Card (GPU)',
  description: 'Graphics Processing Unit - handles graphics and visual processing',
  tags: [
    SemanticTag.POWER_CONSUMER,
    SemanticTag.REQUIRES_SLOT,
    SemanticTag.HAS_GRAPHICS,
    SemanticTag.GRAPHICS_ACCELERATED,
    SemanticTag.GENERATES_HEAT,
    SemanticTag.REQUIRES_COOLING,
    SemanticTag.HIGH_PERFORMANCE,
    SemanticTag.OVERCLOCKABLE
  ],
  requiredSpecifications: [
    STANDARD_SPECS.POWER_CONSUMPTION,
    STANDARD_SPECS.MEMORY_SIZE,
    STANDARD_SPECS.MEMORY_TYPE,
    STANDARD_SPECS.BASE_CLOCK,
    {
      name: 'memory_bus',
      displayName: 'Memory Bus Width',
      description: 'Memory bus width in bits',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.NUMBER,
        minValue: 64,
        maxValue: 1024,
        unit: 'bit',
        compatibilityKey: false
      },
      isRequired: true,
      isCompatibilityKey: false,
      displayOrder: 22,
      filterType: 'range'
    }
  ],
  optionalSpecifications: [
    STANDARD_SPECS.BOOST_CLOCK,
    {
      name: 'ray_tracing',
      displayName: 'Ray Tracing Support',
      description: 'Hardware ray tracing support',
      dataType: SpecificationDataType.BOOLEAN,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.BOOLEAN,
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 36,
      filterType: 'checkbox'
    },
    {
      name: 'dlss_support',
      displayName: 'DLSS Support',
      description: 'NVIDIA DLSS support',
      dataType: SpecificationDataType.BOOLEAN,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.BOOLEAN,
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 37,
      filterType: 'checkbox'
    }
  ],
  categoryPatterns: [
    'видеокарт.*',
    'gpu.*',
    'graphics.*card.*',
    'графическ.*карт.*',
    'видеоадаптер.*'
  ],
  priority: 10
};

// Motherboard Profile
export const MOTHERBOARD_PROFILE: ComponentProfile = {
  id: 'motherboard',
  name: 'MOTHERBOARD',
  displayName: 'Motherboard',
  description: 'Main circuit board that connects all components',
  tags: [
    SemanticTag.POWER_CONSUMER,
    SemanticTag.HAS_SOCKET,
    SemanticTag.HAS_SLOTS,
    SemanticTag.HAS_PORTS,
    SemanticTag.HAS_FORM_FACTOR,
    SemanticTag.REQUIRES_FORM_FACTOR
  ],
  requiredSpecifications: [
    STANDARD_SPECS.SOCKET,
    STANDARD_SPECS.CHIPSET,
    STANDARD_SPECS.FORM_FACTOR,
    STANDARD_SPECS.MEMORY_TYPE,
    {
      name: 'memory_slots',
      displayName: 'Memory Slots',
      description: 'Number of RAM slots',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.NUMBER,
        minValue: 1,
        maxValue: 8,
        compatibilityKey: true
      },
      isRequired: true,
      isCompatibilityKey: true,
      displayOrder: 23,
      filterType: 'range'
    },
    {
      name: 'max_memory',
      displayName: 'Maximum Memory',
      description: 'Maximum supported memory',
      dataType: SpecificationDataType.MEMORY_SIZE,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.MEMORY_SIZE,
        minValue: 8,
        unit: 'GB',
        compatibilityKey: true
      },
      isRequired: true,
      isCompatibilityKey: true,
      displayOrder: 24,
      filterType: 'range'
    }
  ],
  optionalSpecifications: [
    {
      name: 'pcie_slots',
      displayName: 'PCIe Slots',
      description: 'Number of PCIe expansion slots',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.NUMBER,
        minValue: 0,
        maxValue: 8,
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 41,
      filterType: 'range'
    },
    {
      name: 'wifi_support',
      displayName: 'WiFi Support',
      description: 'Built-in WiFi support',
      dataType: SpecificationDataType.BOOLEAN,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.BOOLEAN,
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 42,
      filterType: 'checkbox'
    }
  ],
  categoryPatterns: [
    'материнск.*плат.*',
    'motherboard.*',
    'mainboard.*',
    'мат.*плат.*',
    'системн.*плат.*'
  ],
  priority: 10
};

// RAM Profile
export const RAM_PROFILE: ComponentProfile = {
  id: 'ram',
  name: 'RAM',
  displayName: 'Memory (RAM)',
  description: 'Random Access Memory - system memory for temporary data storage',
  tags: [
    SemanticTag.POWER_CONSUMER,
    SemanticTag.REQUIRES_SLOT,
    SemanticTag.HAS_MEMORY,
    SemanticTag.VOLATILE_MEMORY,
    SemanticTag.OVERCLOCKABLE
  ],
  requiredSpecifications: [
    STANDARD_SPECS.MEMORY_TYPE,
    STANDARD_SPECS.MEMORY_SIZE,
    {
      name: 'memory_speed',
      displayName: 'Memory Speed',
      description: 'Memory frequency speed',
      dataType: SpecificationDataType.FREQUENCY,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.FREQUENCY,
        minValue: 1600,
        maxValue: 8000,
        unit: 'MHz',
        compatibilityKey: true
      },
      isRequired: true,
      isCompatibilityKey: true,
      displayOrder: 25,
      filterType: 'range'
    },
    {
      name: 'modules',
      displayName: 'Number of Modules',
      description: 'Number of memory modules in kit',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.NUMBER,
        minValue: 1,
        maxValue: 8,
        compatibilityKey: false
      },
      isRequired: true,
      isCompatibilityKey: false,
      displayOrder: 26,
      filterType: 'range'
    }
  ],
  optionalSpecifications: [
    {
      name: 'cas_latency',
      displayName: 'CAS Latency',
      description: 'Column Address Strobe latency',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.NUMBER,
        minValue: 10,
        maxValue: 40,
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 27,
      filterType: 'range'
    },
    {
      name: 'rgb_lighting',
      displayName: 'RGB Lighting',
      description: 'Has RGB lighting',
      dataType: SpecificationDataType.BOOLEAN,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.BOOLEAN,
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 43,
      filterType: 'checkbox'
    }
  ],
  categoryPatterns: [
    'оперативн.*памят.*',
    'ram.*',
    'memory.*',
    'озу.*',
    'ddr.*'
  ],
  priority: 10
};

// Storage Profile
export const STORAGE_PROFILE: ComponentProfile = {
  id: 'storage',
  name: 'STORAGE',
  displayName: 'Storage Device',
  description: 'Persistent storage device (SSD, HDD, NVMe)',
  tags: [
    SemanticTag.POWER_CONSUMER,
    SemanticTag.HAS_MEMORY,
    SemanticTag.PERSISTENT_STORAGE,
    SemanticTag.REQUIRES_PORTS
  ],
  requiredSpecifications: [
    STANDARD_SPECS.MEMORY_SIZE,
    {
      name: 'storage_type',
      displayName: 'Storage Type',
      description: 'Type of storage device',
      dataType: SpecificationDataType.ENUM,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.ENUM,
        enumValues: ['SSD', 'HDD', 'NVMe SSD', 'M.2 SSD'],
        compatibilityKey: true
      },
      isRequired: true,
      isCompatibilityKey: true,
      displayOrder: 50,
      filterType: 'dropdown'
    },
    {
      name: 'interface',
      displayName: 'Interface',
      description: 'Storage interface type',
      dataType: SpecificationDataType.ENUM,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.ENUM,
        enumValues: ['SATA III', 'NVMe', 'M.2', 'PCIe'],
        compatibilityKey: true
      },
      isRequired: true,
      isCompatibilityKey: true,
      displayOrder: 51,
      filterType: 'dropdown'
    }
  ],
  optionalSpecifications: [
    {
      name: 'read_speed',
      displayName: 'Read Speed',
      description: 'Sequential read speed in MB/s',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.NUMBER,
        minValue: 50,
        maxValue: 10000,
        unit: 'MB/s',
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 52,
      filterType: 'range'
    },
    {
      name: 'write_speed',
      displayName: 'Write Speed',
      description: 'Sequential write speed in MB/s',
      dataType: SpecificationDataType.NUMBER,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.NUMBER,
        minValue: 50,
        maxValue: 10000,
        unit: 'MB/s',
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 53,
      filterType: 'range'
    }
  ],
  categoryPatterns: [
    'накопител.*',
    'ssd.*',
    'hdd.*',
    'жестк.*диск.*',
    'твердотельн.*накопител.*',
    'storage.*',
    'диск.*'
  ],
  priority: 10
};

// PSU Profile
export const PSU_PROFILE: ComponentProfile = {
  id: 'psu',
  name: 'PSU',
  displayName: 'Power Supply (PSU)',
  description: 'Power Supply Unit - provides power to all components',
  tags: [
    SemanticTag.POWER_PROVIDER,
    SemanticTag.HAS_FORM_FACTOR,
    SemanticTag.MODULAR
  ],
  requiredSpecifications: [
    {
      name: 'wattage',
      displayName: 'Wattage',
      description: 'Power output in watts',
      dataType: SpecificationDataType.POWER_CONSUMPTION,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.POWER_CONSUMPTION,
        minValue: 200,
        maxValue: 2000,
        unit: 'W',
        compatibilityKey: true
      },
      isRequired: true,
      isCompatibilityKey: true,
      displayOrder: 60,
      filterType: 'range'
    },
    {
      name: 'efficiency_rating',
      displayName: 'Efficiency Rating',
      description: '80 PLUS efficiency rating',
      dataType: SpecificationDataType.ENUM,
      validationRule: {
        required: true,
        dataType: SpecificationDataType.ENUM,
        enumValues: ['80 PLUS', '80 PLUS Bronze', '80 PLUS Silver', '80 PLUS Gold', '80 PLUS Platinum', '80 PLUS Titanium'],
        compatibilityKey: false
      },
      isRequired: true,
      isCompatibilityKey: false,
      displayOrder: 61,
      filterType: 'dropdown'
    },
    STANDARD_SPECS.FORM_FACTOR
  ],
  optionalSpecifications: [
    {
      name: 'modular',
      displayName: 'Modular Cables',
      description: 'Has modular cable system',
      dataType: SpecificationDataType.BOOLEAN,
      validationRule: {
        required: false,
        dataType: SpecificationDataType.BOOLEAN,
        compatibilityKey: false
      },
      isRequired: false,
      isCompatibilityKey: false,
      displayOrder: 62,
      filterType: 'checkbox'
    }
  ],
  categoryPatterns: [
    'блок.*питан.*',
    'psu.*',
    'power.*supply.*',
    'бп.*',
    'источник.*питан.*'
  ],
  priority: 10
};

// All component profiles
export const COMPONENT_PROFILES: ComponentProfile[] = [
  CPU_PROFILE,
  GPU_PROFILE,
  MOTHERBOARD_PROFILE,
  RAM_PROFILE,
  STORAGE_PROFILE,
  PSU_PROFILE
];

// Auto-detection rules for profiles
export const AUTO_DETECTION_RULES: AutoDetectionRule[] = [
  {
    id: 'cpu-detection',
    profileId: 'cpu',
    patterns: ['процессор.*', 'cpu.*', '.*процессор.*', 'центральн.*процессор.*', 'processor.*'],
    keywords: ['процессор', 'cpu', 'processor', 'intel', 'amd', 'ryzen', 'core'],
    confidence: 0.9
  },
  {
    id: 'gpu-detection',
    profileId: 'gpu',
    patterns: ['видеокарт.*', 'gpu.*', 'graphics.*card.*', 'графическ.*карт.*', 'видеоадаптер.*'],
    keywords: ['видеокарта', 'gpu', 'graphics', 'nvidia', 'amd', 'radeon', 'geforce'],
    confidence: 0.9
  },
  {
    id: 'motherboard-detection',
    profileId: 'motherboard',
    patterns: ['материнск.*плат.*', 'motherboard.*', 'mainboard.*', 'мат.*плат.*', 'системн.*плат.*'],
    keywords: ['материнская', 'плата', 'motherboard', 'mainboard', 'chipset'],
    confidence: 0.9
  },
  {
    id: 'ram-detection',
    profileId: 'ram',
    patterns: ['оперативн.*памят.*', 'ram.*', 'memory.*', 'озу.*', 'ddr.*'],
    keywords: ['память', 'ram', 'memory', 'ddr4', 'ddr5', 'озу'],
    confidence: 0.9
  },
  {
    id: 'storage-detection',
    profileId: 'storage',
    patterns: ['накопител.*', 'ssd.*', 'hdd.*', 'жестк.*диск.*', 'твердотельн.*накопител.*', 'storage.*', 'диск.*'],
    keywords: ['накопитель', 'ssd', 'hdd', 'диск', 'storage', 'nvme'],
    confidence: 0.9
  },
  {
    id: 'psu-detection',
    profileId: 'psu',
    patterns: ['блок.*питан.*', 'psu.*', 'power.*supply.*', 'бп.*', 'источник.*питан.*'],
    keywords: ['блок', 'питания', 'psu', 'power', 'supply', 'бп'],
    confidence: 0.9
  }
];

// Tag compatibility rules
export const TAG_COMPATIBILITY_RULES: TagCompatibilityRule[] = [
  {
    id: 'cpu-socket-compatibility',
    name: 'CPU Socket Compatibility',
    description: 'CPU requires compatible socket on motherboard',
    requiredTag: SemanticTag.REQUIRES_SOCKET,
    compatibleTags: [SemanticTag.HAS_SOCKET],
    specificationKey: 'socket',
    severity: 'error'
  },
  {
    id: 'power-consumption-compatibility',
    name: 'Power Supply Compatibility',
    description: 'Power consumers need adequate power supply',
    requiredTag: SemanticTag.POWER_CONSUMER,
    compatibleTags: [SemanticTag.POWER_PROVIDER],
    specificationKey: 'power_consumption',
    severity: 'error'
  },
  {
    id: 'cooling-compatibility',
    name: 'Cooling Requirements',
    description: 'Heat generating components need cooling',
    requiredTag: SemanticTag.GENERATES_HEAT,
    compatibleTags: [SemanticTag.PROVIDES_COOLING],
    specificationKey: 'tdp',
    severity: 'warning'
  },
  {
    id: 'memory-slot-compatibility',
    name: 'Memory Slot Compatibility',
    description: 'RAM requires available memory slots',
    requiredTag: SemanticTag.REQUIRES_SLOT,
    compatibleTags: [SemanticTag.HAS_SLOTS],
    specificationKey: 'memory_slots',
    severity: 'error'
  },
  {
    id: 'form-factor-compatibility',
    name: 'Form Factor Compatibility',
    description: 'Components must fit within case form factor',
    requiredTag: SemanticTag.REQUIRES_FORM_FACTOR,
    compatibleTags: [SemanticTag.HAS_FORM_FACTOR],
    specificationKey: 'form_factor',
    severity: 'error'
  }
];