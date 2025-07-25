/**
 * Smart Compatibility Engine
 *
 * Enhanced compatibility checking system that works with semantic tags
 * and the Smart Tag-Based Specification System. This engine can identify
 * components by their functionality (semantic tags) rather than category names,
 * making it more flexible and accurate.
 */

import { CompatibilityIssue, ValidationResult } from '@/lib/supabase/types/specifications';
import { ProductWithDetails } from '@/lib/supabase/types/types';
import { SmartSpecificationSystem } from '@/lib/specifications/SmartSpecificationSystem';
import { SemanticTag } from '@/lib/supabase/types/semanticTags';
import { CompatibilityEngine } from './engine'; // Fallback to existing engine
import { supabase } from '@/lib/supabaseClient';

interface ComponentWithTags {
  product: ProductWithDetails;
  tags: SemanticTag[];
  specifications: Record<string, unknown>;
}

export class SmartCompatibilityEngine {
  private static smartSystem = SmartSpecificationSystem.getInstance();

  /**
   * Enhanced validation that uses semantic tags
   */
  static async validateConfiguration(
    products: Record<string, ProductWithDetails>
  ): Promise<ValidationResult> {
    try {
      // Initialize smart system
      await this.smartSystem.initialize();

      // Get components with their semantic tags
      const componentsWithTags = await this.getComponentsWithTags(products);

      if (componentsWithTags.length === 0) {
        return CompatibilityEngine.validateConfiguration(products);
      }

      // Use smart tag-based compatibility checking
      const smartResult = await this.smartSystem.checkTagCompatibility(
        componentsWithTags.map(comp => ({
          tags: comp.tags,
          specifications: comp.specifications,
        }))
      );

      // Convert smart system results to ValidationResult format
      const issues: CompatibilityIssue[] = [];
      const warnings: CompatibilityIssue[] = [];

      smartResult.issues.forEach(issue => {
        const compatibilityIssue: CompatibilityIssue = {
          type: issue.severity === 'error' ? 'error' : 'warning',
          component1: 'Smart System',
          component2: 'Compatibility Check',
          message: issue.message,
          details: issue.rule.description,
          severity: issue.severity === 'error' ? 'high' : 'medium',
        };

        if (issue.severity === 'error') {
          issues.push(compatibilityIssue);
        } else {
          warnings.push(compatibilityIssue);
        }
      });

      // Calculate power consumption using smart system
      const powerCalculation = this.calculateSmartPowerConsumption(componentsWithTags);

      // Add power supply validation
      const powerIssues = this.validateSmartPowerRequirements(componentsWithTags);
      issues.push(...powerIssues.filter(i => i.type === 'error'));
      warnings.push(...powerIssues.filter(i => i.type === 'warning'));

      // Add advanced compatibility validation
      const advancedIssues = this.validateAdvancedCompatibility(componentsWithTags);
      issues.push(...advancedIssues.filter(i => i.type === 'error'));
      warnings.push(...advancedIssues.filter(i => i.type === 'warning'));

      // Add enhanced cooling validation
      const coolingIssues = await this.validateEnhancedCooling(componentsWithTags);
      issues.push(...coolingIssues.filter(i => i.type === 'error'));
      warnings.push(...coolingIssues.filter(i => i.type === 'warning'));

      return {
        isValid: issues.length === 0,
        issues,
        warnings,
        powerConsumption: powerCalculation.recommendedPsuPower, // Keep for backward compatibility
        actualPowerConsumption: powerCalculation.actualPowerConsumption,
        recommendedPsuPower: powerCalculation.recommendedPsuPower,
      };
    } catch {
      // Fallback to original engine on any error
      return CompatibilityEngine.validateConfiguration(products);
    }
  }

  /**
   * Get components with their semantic tags from the database
   */
  private static async getComponentsWithTags(
    products: Record<string, ProductWithDetails>
  ): Promise<ComponentWithTags[]> {
    const componentsWithTags: ComponentWithTags[] = [];

    for (const [categorySlug, product] of Object.entries(products)) {
      try {
        // Get category information including semantic tags
        const { data: category, error } = await supabase
          .from('categories')
          .select('specification_tags, auto_generated_specs, custom_specs')
          .eq('slug', categorySlug)
          .single();

        if (error || !category) {
          continue;
        }

        const tags = (category.specification_tags as SemanticTag[]) || [];

        if (tags.length === 0) {
          continue;
        }

        // Extract specifications from product
        const specifications: Record<string, unknown> = {};
        console.log(`🔍 Processing specifications for ${product.title} (category: ${categorySlug})`);
        console.log(`🔍 Raw product.specifications:`, product.specifications);
        
        if (product.specifications) {
          product.specifications.forEach(spec => {
            specifications[spec.name] = spec.value;
            console.log(`📋 Spec: ${spec.name} = ${spec.value} (type: ${typeof spec.value})`);
          });
        } else {
          console.log(`⚠️ No specifications found for ${product.title}`);
        }
        
        console.log(`📋 Final specifications object:`, specifications);

        componentsWithTags.push({
          product,
          tags,
          specifications,
        });
      } catch {
        // Skip categories with errors
      }
    }

    return componentsWithTags;
  }

  /**
   * Calculate PSU recommendation according to new requirements:
   * 1. If GPU selected and has recommended_psu_power → use it
   * 2. If no GPU or GPU without recommended_psu_power → don't show PSU recommendation (return 0)
   * 
   * All other power consumption calculations are removed as per requirements
   */
  private static calculateSmartPowerConsumption(components: ComponentWithTags[]): {
    actualPowerConsumption: number;
    recommendedPsuPower: number;
  } {
    console.log('🔍 calculateSmartPowerConsumption called with components:', components.length);
    console.log('🔍 All components data:', components.map(comp => ({
      title: comp.product.title,
      category: comp.product.category?.slug,
      tags: comp.tags,
      specifications: comp.specifications
    })));
    
    // Find GPU component (by semantic tag or category slug)
    const gpuComponent = components.find(comp => 
      comp.tags.includes(SemanticTag.HAS_GRAPHICS) || 
      comp.tags.includes(SemanticTag.GRAPHICS_ACCELERATED) ||
      comp.product.category?.slug === 'graphics-cards'
    );
    
    console.log('🎮 GPU component found:', !!gpuComponent);
    if (gpuComponent) {
      console.log('🎮 GPU details:', {
        title: gpuComponent.product.title,
        category: gpuComponent.product.category?.slug,
        tags: gpuComponent.tags,
        allSpecifications: gpuComponent.specifications,
        productSpecifications: gpuComponent.product.specifications
      });
    }
    
    // Only use GPU's recommended_psu_power as per requirements
    let recommendedPsuPower = 0;
    
    if (gpuComponent) {
      // Check both specifications object and product.specifications array
      const gpuRecommendedPsu = gpuComponent.specifications['recommended_psu_power'];
      console.log('⚡ GPU recommended_psu_power from specifications object:', gpuRecommendedPsu);
      
      // Also check if it's in the product.specifications array
      if (gpuComponent.product.specifications) {
        const specFromArray = gpuComponent.product.specifications.find(spec => 
          spec.name === 'recommended_psu_power' || 
          spec.name === 'recommended_psu' ||
          spec.name === 'psu_power' ||
          spec.name === 'power_supply'
        );
        console.log('⚡ GPU PSU spec from product.specifications array:', specFromArray);
      }
      
      if (gpuRecommendedPsu) {
        const power = typeof gpuRecommendedPsu === 'number' ? gpuRecommendedPsu : parseFloat(String(gpuRecommendedPsu));
        if (!isNaN(power)) {
          recommendedPsuPower = power;
          console.log('✅ Using GPU recommended PSU power:', power);
        } else {
          console.log('⚠️ GPU recommended_psu_power is not a valid number:', gpuRecommendedPsu, 'type:', typeof gpuRecommendedPsu);
        }
      } else {
        console.log('⚠️ GPU has no recommended_psu_power specification');
        console.log('⚠️ Available GPU specifications keys:', Object.keys(gpuComponent.specifications));
      }
    } else {
      console.log('⚠️ No GPU selected, no PSU recommendation');
    }
    
    const result = {
      actualPowerConsumption: 0, // Not used anymore as per requirements
      recommendedPsuPower: Math.round(recommendedPsuPower)
    };
    
    console.log('🔋 Final power calculation result:', result);
    return result;
  }

  /**
   * Validate power requirements according to new requirements:
   * Only validate PSU when GPU with recommended_psu_power is selected
   */
  private static validateSmartPowerRequirements(
    components: ComponentWithTags[]
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    // Find GPU component
    const gpuComponent = components.find(comp => 
      comp.tags.includes(SemanticTag.HAS_GRAPHICS) || 
      comp.tags.includes(SemanticTag.GRAPHICS_ACCELERATED) ||
      comp.product.category?.slug === 'graphics-cards'
    );

    // Only validate PSU if GPU with recommended_psu_power is present
    if (!gpuComponent || !gpuComponent.specifications['recommended_psu_power']) {
      return issues; // No GPU or no recommended PSU power, no PSU validation needed
    }

    const recommendedPsuPower = gpuComponent.specifications['recommended_psu_power'];
    const requiredWattage = typeof recommendedPsuPower === 'number' ? 
      recommendedPsuPower : parseFloat(String(recommendedPsuPower));

    if (isNaN(requiredWattage)) {
      return issues; // Invalid recommended PSU power value
    }

    // Find power providers (PSUs)
    const powerProviders = components.filter(comp =>
      comp.tags.includes(SemanticTag.POWER_PROVIDER)
    );

    if (powerProviders.length === 0) {
      // Show PSU missing error only when GPU requires specific PSU power
      issues.push({
        type: 'error',
        component1: 'Power System',
        component2: 'Graphics Card',
        message: 'Power supply required for graphics card',
        details: `The selected graphics card requires a ${requiredWattage}W power supply. Please add a compatible PSU.`,
        severity: 'high',
      });
      return issues;
    }

    // Check each power provider against GPU's recommended PSU power
    for (const provider of powerProviders) {
      const wattageSpec =
        provider.specifications['wattage'] || provider.specifications['power_output'];
      const certificationSpec = provider.specifications['certification'] || '';

      if (wattageSpec) {
        const wattage =
          typeof wattageSpec === 'number' ? wattageSpec : parseFloat(String(wattageSpec));

        if (!isNaN(wattage)) {
          // Check if PSU meets GPU's recommended power requirement
          if (wattage < requiredWattage) {
            issues.push({
              type: 'error',
              component1: provider.product.title,
              component2: gpuComponent.product.title,
              message: `PSU capacity insufficient for graphics card`,
              details: `Graphics card requires ${requiredWattage}W PSU but selected PSU provides only ${wattage}W. Please choose a PSU with at least ${requiredWattage}W capacity.`,
              severity: 'high',
            });
          }

          // Check PSU certification and provide recommendations
          const certLower = String(certificationSpec).toLowerCase();
          if (
            !certLower.includes('80+') &&
            !certLower.includes('gold') &&
            !certLower.includes('platinum') &&
            !certLower.includes('titanium')
          ) {
            issues.push({
              type: 'warning',
              component1: provider.product.title,
              component2: 'Power Efficiency',
              message: `PSU lacks efficiency certification`,
              details: `Consider a PSU with 80+ certification (Bronze, Gold, Platinum, or Titanium) for better efficiency, lower heat generation, and reduced electricity costs.`,
              severity: 'low',
            });
          }

          // Check for modular cables recommendation for high-end builds
          if (requiredWattage >= 650) {
            const isModular = String(provider.specifications['modular'] || '').toLowerCase();
            if (!isModular.includes('modular') && !isModular.includes('yes')) {
              issues.push({
                type: 'warning',
                component1: provider.product.title,
                component2: 'Cable Management',
                message: `Consider modular PSU for high-performance build`,
                details: `For high-performance graphics cards requiring ${requiredWattage}W+ PSU, a modular PSU can improve airflow and cable management.`,
                severity: 'low',
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Enhanced socket-chipset-memory compatibility validation
   */
  private static validateAdvancedCompatibility(
    components: ComponentWithTags[]
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    // Find key components
    const cpus = components.filter(comp => comp.tags.includes(SemanticTag.CPU));
    const motherboards = components.filter(comp => comp.tags.includes(SemanticTag.MOTHERBOARD));
    const memories = components.filter(comp => comp.tags.includes(SemanticTag.MEMORY));
    const gpus = components.filter(comp => 
      comp.tags.includes(SemanticTag.HAS_GRAPHICS) || 
      comp.tags.includes(SemanticTag.GRAPHICS_ACCELERATED)
    );

    // Validate CPU-Motherboard socket compatibility
    for (const cpu of cpus) {
      const cpuSocket = cpu.specifications['socket'];
      if (!cpuSocket) continue;

      for (const motherboard of motherboards) {
        const mbSocket = motherboard.specifications['socket'];
        const chipset = motherboard.specifications['chipset'];

        if (mbSocket && cpuSocket !== mbSocket) {
          issues.push({
            type: 'error',
            component1: cpu.product.title,
            component2: motherboard.product.title,
            message: 'CPU and motherboard socket mismatch',
            details: `CPU requires ${cpuSocket} socket but motherboard has ${mbSocket} socket. These components are not compatible.`,
            severity: 'high',
          });
        }

        // Check chipset-CPU generation compatibility
        if (chipset && cpuSocket) {
          const cpuGeneration = this.extractCPUGeneration(cpu.product.title, cpuSocket as string);
          const chipsetCompatibility = this.checkChipsetCPUCompatibility(
            chipset as string,
            cpuGeneration
          );

          if (!chipsetCompatibility.compatible) {
            issues.push({
              type: chipsetCompatibility.severity === 'warning' ? 'warning' : 'error',
              component1: cpu.product.title,
              component2: motherboard.product.title,
              message: 'CPU generation may not be fully supported by chipset',
              details: chipsetCompatibility.message,
              severity: chipsetCompatibility.severity === 'warning' ? 'medium' : 'high',
            });
          }
        }
      }
    }

    // Validate memory compatibility with CPU and motherboard
    for (const memory of memories) {
      const memoryType = memory.specifications['memory_type'] || memory.specifications['type'];
      const memorySpeed = memory.specifications['speed'] || memory.specifications['frequency'];
      const memoryCapacity = memory.specifications['capacity'];

      // Check memory type compatibility with CPU socket
      for (const cpu of cpus) {
        const cpuSocket = cpu.specifications['socket'];
        if (cpuSocket && memoryType) {
          const supportedMemoryTypes = this.getSupportedMemoryTypes(cpuSocket as string);
          if (!supportedMemoryTypes.includes(memoryType as string)) {
            issues.push({
              type: 'error',
              component1: memory.product.title,
              component2: cpu.product.title,
              message: 'Memory type not supported by CPU',
              details: `${memoryType} memory is not supported by ${cpuSocket} CPUs. Supported types: ${supportedMemoryTypes.join(', ')}.`,
              severity: 'high',
            });
          }
        }
      }

      // Check memory speed support
      for (const motherboard of motherboards) {
        const chipset = motherboard.specifications['chipset'];
        if (chipset && memorySpeed && memoryType) {
          const maxSupportedSpeed = this.getMaxMemorySpeed(chipset as string, memoryType as string);
          const speedValue =
            typeof memorySpeed === 'number' ? memorySpeed : parseInt(String(memorySpeed));

          if (!isNaN(speedValue) && maxSupportedSpeed && speedValue > maxSupportedSpeed) {
            issues.push({
              type: 'warning',
              component1: memory.product.title,
              component2: motherboard.product.title,
              message: 'Memory speed may not be fully supported',
              details: `Memory speed ${speedValue}MHz exceeds chipset maximum of ${maxSupportedSpeed}MHz. Memory will run at reduced speed.`,
              severity: 'medium',
            });
          }
        }
      }

      // Check memory capacity limits
      if (memoryCapacity) {
        const capacityGB =
          typeof memoryCapacity === 'number' ? memoryCapacity : parseInt(String(memoryCapacity));
        if (!isNaN(capacityGB) && capacityGB > 32) {
          for (const motherboard of motherboards) {
            const maxMemory = motherboard.specifications['max_memory'];
            const maxMemoryGB =
              typeof maxMemory === 'number' ? maxMemory : parseInt(String(maxMemory || '128'));

            if (!isNaN(maxMemoryGB) && capacityGB > maxMemoryGB) {
              issues.push({
                type: 'warning',
                component1: memory.product.title,
                component2: motherboard.product.title,
                message: 'Memory capacity exceeds motherboard limit',
                details: `Memory capacity ${capacityGB}GB exceeds motherboard maximum of ${maxMemoryGB}GB.`,
                severity: 'medium',
              });
            }
          }
        }
      }
    }

    // Validate GPU compatibility
    for (const gpu of gpus) {
      const gpuPower = gpu.specifications['power_consumption'];

      // Check PCIe slot compatibility
      for (const motherboard of motherboards) {
        const pcieSlots = motherboard.specifications['pcie_slots'] || '1x PCIe x16';
        if (!String(pcieSlots).toLowerCase().includes('x16')) {
          issues.push({
            type: 'warning',
            component1: gpu.product.title,
            component2: motherboard.product.title,
            message: 'GPU may not have optimal PCIe slot',
            details: 'High-performance GPUs require PCIe x16 slots for optimal performance.',
            severity: 'medium',
          });
        }
      }

      // Check GPU power requirements
      if (gpuPower) {
        const powerValue = typeof gpuPower === 'number' ? gpuPower : parseInt(String(gpuPower));
        if (!isNaN(powerValue) && powerValue > 150) {
          const powerProviders = components.filter(comp =>
            comp.tags.includes(SemanticTag.POWER_PROVIDER)
          );
          for (const psu of powerProviders) {
            const pciePower =
              psu.specifications['pcie_connectors'] || psu.specifications['gpu_connectors'];
            if (!pciePower || String(pciePower).toLowerCase().includes('none')) {
              issues.push({
                type: 'error',
                component1: gpu.product.title,
                component2: psu.product.title,
                message: 'GPU requires dedicated power connectors',
                details: `High-performance GPU (${powerValue}W) requires PCIe power connectors from PSU.`,
                severity: 'high',
              });
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Helper methods for advanced compatibility checking
   */
  private static extractCPUGeneration(cpuTitle: string, socket: string): string {
    const title = cpuTitle.toLowerCase();

    // Intel generations
    if (socket.includes('LGA')) {
      if (
        title.includes('13th') ||
        title.includes('13900') ||
        title.includes('13700') ||
        title.includes('13600')
      )
        return '13th';
      if (
        title.includes('12th') ||
        title.includes('12900') ||
        title.includes('12700') ||
        title.includes('12600')
      )
        return '12th';
      if (
        title.includes('11th') ||
        title.includes('11900') ||
        title.includes('11700') ||
        title.includes('11600')
      )
        return '11th';
      if (
        title.includes('10th') ||
        title.includes('10900') ||
        title.includes('10700') ||
        title.includes('10600')
      )
        return '10th';
    }

    // AMD generations
    if (socket.includes('AM')) {
      if (
        title.includes('7000') ||
        title.includes('7950') ||
        title.includes('7900') ||
        title.includes('7700')
      )
        return 'Zen4';
      if (
        title.includes('5000') ||
        title.includes('5950') ||
        title.includes('5900') ||
        title.includes('5800')
      )
        return 'Zen3';
      if (
        title.includes('3000') ||
        title.includes('3950') ||
        title.includes('3900') ||
        title.includes('3700')
      )
        return 'Zen2';
    }

    return 'unknown';
  }

  private static checkChipsetCPUCompatibility(
    chipset: string,
    cpuGeneration: string
  ): {
    compatible: boolean;
    message: string;
    severity: 'error' | 'warning';
  } {
    const chipsetUpper = chipset.toUpperCase();

    // Intel chipset compatibility
    if (chipsetUpper.includes('Z790') || chipsetUpper.includes('B760')) {
      if (cpuGeneration === '12th') {
        return {
          compatible: true,
          message: '12th gen CPU compatible with 700-series chipset',
          severity: 'warning',
        };
      }
      if (cpuGeneration !== '13th') {
        return {
          compatible: false,
          message: '700-series chipsets are optimized for 13th gen CPUs',
          severity: 'warning',
        };
      }
    }

    // AMD chipset compatibility
    if (chipsetUpper.includes('X670') || chipsetUpper.includes('B650')) {
      if (cpuGeneration !== 'Zen4') {
        return {
          compatible: false,
          message: '600-series chipsets require Zen4 (7000-series) CPUs',
          severity: 'error',
        };
      }
    }

    return { compatible: true, message: 'Compatible', severity: 'warning' };
  }

  private static getSupportedMemoryTypes(socket: string): string[] {
    if (socket.includes('AM5')) return ['DDR5'];
    if (socket.includes('AM4')) return ['DDR4'];
    if (socket.includes('LGA1700')) return ['DDR4', 'DDR5'];
    if (socket.includes('LGA1200')) return ['DDR4'];
    return ['DDR4'];
  }

  private static getMaxMemorySpeed(chipset: string, memoryType: string): number | null {
    const chipsetUpper = chipset.toUpperCase();

    if (memoryType === 'DDR5') {
      if (chipsetUpper.includes('Z790')) return 5600;
      if (chipsetUpper.includes('B760')) return 5200;
      if (chipsetUpper.includes('X670')) return 5200;
      if (chipsetUpper.includes('B650')) return 4800;
      return 4800;
    }

    if (memoryType === 'DDR4') {
      if (chipsetUpper.includes('Z590') || chipsetUpper.includes('Z490')) return 3200;
      if (chipsetUpper.includes('B560') || chipsetUpper.includes('B460')) return 2933;
      if (chipsetUpper.includes('X570') || chipsetUpper.includes('B550')) return 3200;
      return 2666;
    }

    return null;
  }

  /**
   * Validate specific component compatibility using semantic tags
   */
  static async validateComponentCompatibility(
    component1: ProductWithDetails,
    component2: ProductWithDetails,
    category1Slug: string,
    category2Slug: string
  ): Promise<CompatibilityIssue[]> {
    try {
      await this.smartSystem.initialize();

      // Get semantic tags for both components
      const [tags1, tags2] = await Promise.all([
        this.getComponentTags(category1Slug),
        this.getComponentTags(category2Slug),
      ]);

      if (tags1.length === 0 || tags2.length === 0) {
        return []; // No tags available, can't check compatibility
      }

      // Extract specifications
      const specs1: Record<string, unknown> = {};
      const specs2: Record<string, unknown> = {};

      if (component1.specifications) {
        component1.specifications.forEach(spec => {
          specs1[spec.name] = spec.value;
        });
      }

      if (component2.specifications) {
        component2.specifications.forEach(spec => {
          specs2[spec.name] = spec.value;
        });
      }

      // Check compatibility using smart system
      const result = await this.smartSystem.checkTagCompatibility([
        { tags: tags1, specifications: specs1 },
        { tags: tags2, specifications: specs2 },
      ]);

      // Convert to CompatibilityIssue format
      return result.issues.map(issue => ({
        type: issue.severity === 'error' ? 'error' : 'warning',
        component1: component1.title,
        component2: component2.title,
        message: issue.message,
        details: issue.rule.description,
        severity: issue.severity === 'error' ? 'high' : 'medium',
      }));
    } catch (error) {
      console.error('Error in smart component compatibility check:', error);
      return [];
    }
  }

  /**
   * Get semantic tags for a category
   */
  private static async getComponentTags(categorySlug: string): Promise<SemanticTag[]> {
    try {
      const { data: category, error } = await supabase
        .from('categories')
        .select('specification_tags')
        .eq('slug', categorySlug)
        .single();

      if (error || !category) {
        return [];
      }

      return (category.specification_tags as SemanticTag[]) || [];
    } catch (error) {
      console.error(`Error getting tags for category ${categorySlug}:`, error);
      return [];
    }
  }

  /**
   * Check if a component has specific semantic tags
   */
  static async componentHasTags(categorySlug: string, tags: SemanticTag[]): Promise<boolean> {
    const componentTags = await this.getComponentTags(categorySlug);
    return tags.every(tag => componentTags.includes(tag));
  }

  /**
   * Get components by semantic tags from a configuration
   */
  static async getComponentsByTags(
    products: Record<string, ProductWithDetails>,
    tags: SemanticTag[]
  ): Promise<ComponentWithTags[]> {
    const componentsWithTags = await this.getComponentsWithTags(products);

    return componentsWithTags.filter(component => tags.some(tag => component.tags.includes(tag)));
  }

  /**
   * Enhanced cooling validation with thermal analysis
   */
  private static async validateEnhancedCooling(
    components: ComponentWithTags[]
  ): Promise<CompatibilityIssue[]> {
    const issues: CompatibilityIssue[] = [];

    try {
      // Find key thermal components
      const cpus = components.filter(comp => comp.tags.includes(SemanticTag.CPU));
      const gpus = components.filter(comp => 
        comp.tags.includes(SemanticTag.HAS_GRAPHICS) || 
        comp.tags.includes(SemanticTag.GRAPHICS_ACCELERATED)
      );
      const coolers = components.filter(comp => comp.tags.includes(SemanticTag.PROVIDES_COOLING));
      const cases = components.filter(comp => comp.tags.includes(SemanticTag.CASE));

      // Validate CPU cooling
      for (const cpu of cpus) {
        const cpuTDP = cpu.specifications['tdp'] || cpu.specifications['power_consumption'];
        const cpuSocket = cpu.specifications['socket'];

        if (cpuTDP) {
          const tdpValue = typeof cpuTDP === 'number' ? cpuTDP : parseFloat(String(cpuTDP));

          if (!isNaN(tdpValue)) {
            // Find compatible CPU coolers
            const compatibleCoolers = coolers.filter(cooler => {
              const supportedSockets =
                cooler.specifications['supported_sockets'] ||
                cooler.specifications['socket_compatibility'];
              return !supportedSockets || String(supportedSockets).includes(String(cpuSocket));
            });

            if (compatibleCoolers.length === 0) {
              issues.push({
                type: 'error',
                component1: cpu.product.title,
                component2: 'Cooling System',
                message: 'No compatible CPU cooler found',
                details: `CPU with ${cpuSocket} socket requires a compatible cooler. Consider adding an air or liquid cooler that supports ${cpuSocket}.`,
                severity: 'high',
              });
            } else {
              // Check cooling capacity
              for (const cooler of compatibleCoolers) {
                const coolingCapacity =
                  cooler.specifications['tdp_rating'] || cooler.specifications['cooling_capacity'];
                const coolerType = cooler.specifications['type'] || 'air';

                if (coolingCapacity) {
                  const capacity =
                    typeof coolingCapacity === 'number'
                      ? coolingCapacity
                      : parseFloat(String(coolingCapacity));

                  if (!isNaN(capacity)) {
                    // Apply thermal safety margins
                    const safetyMargin = String(coolerType).toLowerCase().includes('liquid')
                      ? 0.9
                      : 0.8;
                    const effectiveCapacity = capacity * safetyMargin;

                    if (tdpValue > capacity) {
                      issues.push({
                        type: 'error',
                        component1: cpu.product.title,
                        component2: cooler.product.title,
                        message: 'Cooler capacity insufficient for CPU',
                        details: `CPU TDP (${tdpValue}W) exceeds cooler capacity (${capacity}W). Consider a higher-capacity cooler.`,
                        severity: 'high',
                      });
                    } else if (tdpValue > effectiveCapacity) {
                      const recommendedCapacity = Math.ceil(tdpValue / safetyMargin / 10) * 10;
                      issues.push({
                        type: 'warning',
                        component1: cpu.product.title,
                        component2: cooler.product.title,
                        message: 'Cooler may struggle with CPU thermal load',
                        details: `CPU TDP (${tdpValue}W) is close to cooler limit (${capacity}W). Recommended: ${recommendedCapacity}W+ cooler for optimal performance.`,
                        severity: 'medium',
                      });
                    }

                    // Check for high-end CPU cooling recommendations
                    if (tdpValue > 125 && String(coolerType).toLowerCase().includes('air')) {
                      issues.push({
                        type: 'warning',
                        component1: cpu.product.title,
                        component2: cooler.product.title,
                        message: 'Consider liquid cooling for high-TDP CPU',
                        details: `High-performance CPU (${tdpValue}W TDP) may benefit from liquid cooling for better temperatures and quieter operation.`,
                        severity: 'low',
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Validate GPU thermal considerations
      for (const gpu of gpus) {
        const gpuTDP = gpu.specifications['power_consumption'] || gpu.specifications['tdp'];
        const gpuLength = gpu.specifications['length'];

        if (gpuTDP) {
          const tdpValue = typeof gpuTDP === 'number' ? gpuTDP : parseFloat(String(gpuTDP));

          if (!isNaN(tdpValue) && tdpValue > 200) {
            // Check case airflow for high-TDP GPUs
            for (const pcCase of cases) {
              const caseFans =
                pcCase.specifications['included_fans'] || pcCase.specifications['fan_support'];

              if (!caseFans || String(caseFans).toLowerCase().includes('none')) {
                issues.push({
                  type: 'warning',
                  component1: gpu.product.title,
                  component2: pcCase.product.title,
                  message: 'High-TDP GPU needs adequate case airflow',
                  details: `GPU with ${tdpValue}W TDP requires good case ventilation. Consider adding case fans for optimal cooling.`,
                  severity: 'medium',
                });
              }

              // Check GPU clearance
              if (gpuLength) {
                const lengthValue =
                  typeof gpuLength === 'number' ? gpuLength : parseFloat(String(gpuLength));
                const maxGPULength = pcCase.specifications['max_gpu_length'];

                if (maxGPULength && !isNaN(lengthValue)) {
                  const maxLength =
                    typeof maxGPULength === 'number'
                      ? maxGPULength
                      : parseFloat(String(maxGPULength));

                  if (!isNaN(maxLength) && lengthValue > maxLength) {
                    issues.push({
                      type: 'error',
                      component1: gpu.product.title,
                      component2: pcCase.product.title,
                      message: 'GPU too long for case',
                      details: `GPU length (${lengthValue}mm) exceeds case maximum (${maxLength}mm). GPU will not fit.`,
                      severity: 'high',
                    });
                  } else if (!isNaN(maxLength) && lengthValue > maxLength * 0.9) {
                    issues.push({
                      type: 'warning',
                      component1: gpu.product.title,
                      component2: pcCase.product.title,
                      message: 'GPU fit may be tight',
                      details: `GPU length (${lengthValue}mm) is close to case maximum (${maxLength}mm). Verify clearance with cables and components.`,
                      severity: 'medium',
                    });
                  }
                }
              }
            }
          }
        }
      }

      // Overall thermal analysis
      const totalTDP = this.calculateTotalTDP(components);
      if (totalTDP > 300) {
        const hasLiquidCooling = coolers.some(cooler =>
          String(cooler.specifications['type'] || '')
            .toLowerCase()
            .includes('liquid')
        );

        if (!hasLiquidCooling) {
          issues.push({
            type: 'warning',
            component1: 'System',
            component2: 'Thermal Management',
            message: 'High-performance build may benefit from liquid cooling',
            details: `System TDP (${totalTDP}W) is high. Consider liquid cooling for CPU and ensure adequate case ventilation.`,
            severity: 'medium',
          });
        }
      }
    } catch (error) {
      console.error('Error in enhanced cooling validation:', error);
    }

    return issues;
  }

  /**
   * Calculate total system TDP for thermal analysis
   */
  private static calculateTotalTDP(components: ComponentWithTags[]): number {
    let totalTDP = 0;

    for (const component of components) {
      if (component.tags.includes(SemanticTag.GENERATES_HEAT)) {
        const tdp =
          component.specifications['tdp'] || component.specifications['power_consumption'];

        if (tdp) {
          const tdpValue = typeof tdp === 'number' ? tdp : parseFloat(String(tdp));
          if (!isNaN(tdpValue)) {
            totalTDP += tdpValue;
          }
        }
      }
    }

    return totalTDP;
  }

  /**
   * Validate cooling requirements using semantic tags (legacy method)
   */
  static async validateCoolingRequirements(
    products: Record<string, ProductWithDetails>
  ): Promise<CompatibilityIssue[]> {
    const componentsWithTags = await this.getComponentsWithTags(products);
    return this.validateEnhancedCooling(componentsWithTags);
  }
}
