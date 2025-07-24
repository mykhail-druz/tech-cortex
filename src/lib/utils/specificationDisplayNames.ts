/**
 * Utility for converting internal specification names to user-friendly display names
 */

export const SPECIFICATION_DISPLAY_NAMES: Record<string, string> = {
  // CPU/Processor specifications
  'base_clock': 'Base Clock Speed',
  'boost_clock': 'Boost Clock Speed',
  'cores': 'Number of Cores',
  'threads': 'Number of Threads',
  'cache_l1': 'L1 Cache',
  'cache_l2': 'L2 Cache',
  'cache_l3': 'L3 Cache',
  'tdp': 'TDP (Thermal Design Power)',
  'socket': 'Socket Type',
  'architecture': 'Architecture',
  'process_node': 'Process Node',
  'integrated_graphics': 'Integrated Graphics',
  
  // GPU/Graphics Card specifications
  'gpu_base_clock': 'GPU Base Clock',
  'gpu_boost_clock': 'GPU Boost Clock',
  'memory_size': 'Memory Size',
  'memory_type': 'Memory Type',
  'memory_bus': 'Memory Bus Width',
  'memory_bandwidth': 'Memory Bandwidth',
  'cuda_cores': 'CUDA Cores',
  'rt_cores': 'RT Cores',
  'tensor_cores': 'Tensor Cores',
  'power_consumption': 'Power Consumption',
  'recommended_psu': 'Recommended PSU',
  'display_outputs': 'Display Outputs',
  'max_resolution': 'Maximum Resolution',
  'directx_support': 'DirectX Support',
  'opengl_support': 'OpenGL Support',
  
  // RAM/Memory specifications
  'capacity': 'Capacity',
  'speed': 'Speed',
  'latency': 'Latency',
  'voltage': 'Voltage',
  'form_factor': 'Form Factor',
  'ecc_support': 'ECC Support',
  
  // Storage specifications
  'storage_capacity': 'Storage Capacity',
  'interface': 'Interface',
  'read_speed': 'Read Speed',
  'write_speed': 'Write Speed',
  'random_read_iops': 'Random Read IOPS',
  'random_write_iops': 'Random Write IOPS',
  'nand_type': 'NAND Type',
  'controller': 'Controller',
  'cache_size': 'Cache Size',
  'endurance': 'Endurance (TBW)',
  
  // Motherboard specifications
  'chipset': 'Chipset',
  'memory_slots': 'Memory Slots',
  'max_memory': 'Maximum Memory',
  'expansion_slots': 'Expansion Slots',
  'usb_ports': 'USB Ports',
  'sata_ports': 'SATA Ports',
  'ethernet': 'Ethernet',
  'wifi': 'Wi-Fi',
  'bluetooth': 'Bluetooth',
  'audio': 'Audio',
  
  // Power Supply specifications
  'wattage': 'Wattage',
  'efficiency': 'Efficiency Rating',
  'modular': 'Modular',
  'pfc': 'Power Factor Correction',
  'rails': 'Rails Configuration',
  'connectors': 'Connectors',
  'fan_size': 'Fan Size',
  'warranty': 'Warranty',
  
  // Case specifications
  'case_type': 'Case Type',
  'motherboard_support': 'Motherboard Support',
  'max_gpu_length': 'Maximum GPU Length',
  'max_cpu_cooler_height': 'Maximum CPU Cooler Height',
  'drive_bays': 'Drive Bays',
  'front_io': 'Front I/O',
  'side_panel': 'Side Panel',
  'dimensions': 'Dimensions',
  'weight': 'Weight',
  
  // Cooling specifications
  'cooler_type': 'Cooler Type',
  'fan_speed': 'Fan Speed',
  'noise_level': 'Noise Level',
  'radiator_size': 'Radiator Size',
  'pump_speed': 'Pump Speed',
  'compatibility': 'Socket Compatibility',
  
  // Monitor specifications
  'screen_size': 'Screen Size',
  'resolution': 'Resolution',
  'refresh_rate': 'Refresh Rate',
  'response_time': 'Response Time',
  'panel_type': 'Panel Type',
  'brightness': 'Brightness',
  'contrast_ratio': 'Contrast Ratio',
  'color_gamut': 'Color Gamut',
  'hdr_support': 'HDR Support',
  'adaptive_sync': 'Adaptive Sync',
  'inputs': 'Inputs',
  
  // General specifications
  'brand': 'Brand',
  'model': 'Model',
  'part_number': 'Part Number',
  'color': 'Color',
  'material': 'Material',
  'release_date': 'Release Date',
  'price': 'Price',
  'availability': 'Availability',
};

/**
 * Get user-friendly display name for a specification
 * @param internalName - The internal specification name
 * @returns User-friendly display name or formatted internal name as fallback
 */
export function getSpecificationDisplayName(internalName: string): string {
  // First check if we have a predefined display name
  if (SPECIFICATION_DISPLAY_NAMES[internalName]) {
    return SPECIFICATION_DISPLAY_NAMES[internalName];
  }
  
  // Fallback: convert snake_case to Title Case
  return internalName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get display name with template fallback
 * @param spec - Product specification object
 * @returns User-friendly display name
 */
export function getSpecDisplayName(spec: { name: string; template?: { display_name?: string } | null }): string {
  // First priority: template display name
  if (spec.template?.display_name) {
    return spec.template.display_name;
  }
  
  // Second priority: our mapping
  return getSpecificationDisplayName(spec.name);
}