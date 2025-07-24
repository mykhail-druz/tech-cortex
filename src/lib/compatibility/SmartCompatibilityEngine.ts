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
import { COMPONENT_POWER_CONSUMPTION, PSU_HEADROOM_PERCENTAGE } from './constants';

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
    console.log('🔍 SmartCompatibilityEngine.validateConfiguration called with products:', Object.keys(products));
    
    try {
      // Initialize smart system
      await this.smartSystem.initialize();

      // Get components with their semantic tags
      const componentsWithTags = await this.getComponentsWithTags(products);
      console.log('📊 Components with tags found:', componentsWithTags.length);

      if (componentsWithTags.length === 0) {
        console.log('⚠️ No semantic tags found, falling back to original compatibility engine');
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
      console.log('⚡ Power calculation result:', powerCalculation);

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
    } catch (error) {
      console.error('❌ Smart compatibility engine failed, falling back to original:', error);
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
          console.warn(`Could not find category for slug: ${categorySlug}`);
          continue;
        }

        const tags = (category.specification_tags as SemanticTag[]) || [];

        if (tags.length === 0) {
          console.warn(`No semantic tags found for category: ${categorySlug}`);
          continue;
        }

        // Extract specifications from product
        const specifications: Record<string, unknown> = {};
        if (product.specifications) {
          product.specifications.forEach(spec => {
            specifications[spec.name] = spec.value;
          });
        }

        componentsWithTags.push({
          product,
          tags,
          specifications,
        });
      } catch (error) {
        console.error(`Error getting tags for category ${categorySlug}:`, error);
      }
    }

    return componentsWithTags;
  }

  /**
   * Calculate power consumption and PSU recommendation according to new requirements:
   * 1. If GPU selected → use GPU's recommended PSU power
   * 2. If no GPU but CPU selected → calculate CPU TDP + other components
   * 3. If no CPU → use only hardcoded values for other components
   * 
   * Returns both actual power consumption and recommended PSU power
   */
  private static calculateSmartPowerConsumption(components: ComponentWithTags[]): {
    actualPowerConsumption: number;
    recommendedPsuPower: number;
  } {
    console.log('🔍 calculateSmartPowerConsumption called with components:', components.length);
    
    // If no components with tags, fallback to category-based calculation
    if (components.length === 0) {
      console.log('⚠️ No components with tags found, using fallback calculation');
      return {
        actualPowerConsumption: 0,
        recommendedPsuPower: 0
      };
    }

    // Calculate actual power consumption for all components
    let actualPowerConsumption = 0;
    
    // Find GPU component (by semantic tag or category slug)
    const gpuComponent = components.find(comp => 
      comp.tags.includes(SemanticTag.GPU) || 
      comp.product.category?.slug === 'graphics-cards'
    );
    
    console.log('🎮 GPU component found:', !!gpuComponent, gpuComponent?.product.title);
    
    // Add GPU power consumption
    if (gpuComponent) {
      const gpuPower = gpuComponent.specifications['power_consumption'] || 
                      gpuComponent.specifications['tdp'] ||
                      gpuComponent.specifications['recommended_psu_power'];
      console.log('⚡ GPU power specs:', { 
        power_consumption: gpuComponent.specifications['power_consumption'],
        tdp: gpuComponent.specifications['tdp'],
        recommended_psu_power: gpuComponent.specifications['recommended_psu_power']
      });
      
      if (gpuPower) {
        const power = typeof gpuPower === 'number' ? gpuPower : parseFloat(String(gpuPower));
        if (!isNaN(power)) {
          actualPowerConsumption += power;
          console.log('✅ Added GPU power:', power);
        }
      }
    }
    
    // Find CPU component (by semantic tag or category slug)
    const cpuComponent = components.find(comp => 
      comp.tags.includes(SemanticTag.CPU) || 
      comp.product.category?.slug === 'processors'
    );
    
    console.log('🖥️ CPU component found:', !!cpuComponent, cpuComponent?.product.title);
    
    // Add CPU TDP if present
    if (cpuComponent) {
      const cpuTdp = cpuComponent.specifications['tdp'];
      console.log('⚡ CPU TDP spec:', cpuTdp);
      
      if (cpuTdp) {
        const power = typeof cpuTdp === 'number' ? cpuTdp : parseFloat(String(cpuTdp));
        if (!isNaN(power)) {
          actualPowerConsumption += power;
          console.log('✅ Added CPU TDP:', power);
        }
      }
    }
    
    // Add hardcoded values for other components
    for (const component of components) {
      const categorySlug = component.product.category?.slug;
      
      if (component.tags.includes(SemanticTag.MOTHERBOARD) || categorySlug === 'motherboards') {
        actualPowerConsumption += COMPONENT_POWER_CONSUMPTION.MOTHERBOARD;
        console.log('✅ Added motherboard power:', COMPONENT_POWER_CONSUMPTION.MOTHERBOARD);
      } else if (component.tags.includes(SemanticTag.MEMORY) || categorySlug === 'memory') {
        // Determine memory type from specifications
        const memoryType = component.specifications['memory_type'] || 'ddr4';
        const isDDR5 = String(memoryType).toLowerCase().includes('ddr5');
        const memoryPower = isDDR5 ? COMPONENT_POWER_CONSUMPTION.MEMORY_DDR5 : COMPONENT_POWER_CONSUMPTION.MEMORY_DDR4;
        actualPowerConsumption += memoryPower;
        console.log('✅ Added memory power:', memoryPower, 'type:', memoryType);
      } else if (component.tags.includes(SemanticTag.STORAGE) || categorySlug === 'storage') {
        // Determine storage type from specifications
        const storageInterface = component.specifications['interface'] || 'sata';
        const isNVMe = String(storageInterface).toLowerCase().includes('nvme');
        const isSSD = String(storageInterface).toLowerCase().includes('ssd') || 
                     String(component.product.title).toLowerCase().includes('ssd');
        
        let storagePower;
        if (isNVMe) {
          storagePower = COMPONENT_POWER_CONSUMPTION.STORAGE_SSD_NVME;
        } else if (isSSD) {
          storagePower = COMPONENT_POWER_CONSUMPTION.STORAGE_SSD_SATA;
        } else {
          storagePower = COMPONENT_POWER_CONSUMPTION.STORAGE_HDD;
        }
        actualPowerConsumption += storagePower;
        console.log('✅ Added storage power:', storagePower, 'interface:', storageInterface);
      } else if (component.tags.includes(SemanticTag.COOLING) || categorySlug === 'cooling') {
        // Determine cooling type
        const isAIO = String(component.product.title).toLowerCase().includes('aio') ||
                     String(component.product.title).toLowerCase().includes('жидкост');
        const coolingPower = isAIO ? COMPONENT_POWER_CONSUMPTION.COOLING_AIO : COMPONENT_POWER_CONSUMPTION.COOLING_AIR;
        actualPowerConsumption += coolingPower;
        console.log('✅ Added cooling power:', coolingPower, 'isAIO:', isAIO);
      } else if (component.tags.includes(SemanticTag.CASE) || categorySlug === 'cases') {
        actualPowerConsumption += COMPONENT_POWER_CONSUMPTION.CASE_FANS;
        console.log('✅ Added case fans power:', COMPONENT_POWER_CONSUMPTION.CASE_FANS);
      }
    }
    
    console.log('⚡ Total actual power consumption:', actualPowerConsumption);
    
    // Calculate recommended PSU power
    let recommendedPsuPower: number;
    
    // If GPU has recommended PSU power, use it as a baseline
    if (gpuComponent) {
      const gpuRecommendedPsu = gpuComponent.specifications['recommended_psu_power'];
      if (gpuRecommendedPsu) {
        const power = typeof gpuRecommendedPsu === 'number' ? gpuRecommendedPsu : parseFloat(String(gpuRecommendedPsu));
        if (!isNaN(power)) {
          recommendedPsuPower = power;
          console.log('✅ Using GPU recommended PSU power:', power);
        } else {
          // Fallback: calculate from actual consumption
          recommendedPsuPower = actualPowerConsumption * (1 + PSU_HEADROOM_PERCENTAGE / 100);
          console.log('✅ Calculated PSU power from consumption (GPU fallback):', recommendedPsuPower);
        }
      } else {
        // Fallback: calculate from actual consumption
        recommendedPsuPower = actualPowerConsumption * (1 + PSU_HEADROOM_PERCENTAGE / 100);
        console.log('✅ Calculated PSU power from consumption (no GPU rec):', recommendedPsuPower);
      }
    } else {
      // No GPU: calculate from actual consumption with headroom
      recommendedPsuPower = actualPowerConsumption * (1 + PSU_HEADROOM_PERCENTAGE / 100);
      console.log('✅ Calculated PSU power from consumption (no GPU):', recommendedPsuPower);
    }
    
    const result = {
      actualPowerConsumption: Math.round(actualPowerConsumption),
      recommendedPsuPower: Math.round(recommendedPsuPower)
    };
    
    console.log('🔋 Final power calculation result:', result);
    return result;
  }

  /**
   * Validate power requirements using semantic tags with advanced PSU analysis
   */
  private static validateSmartPowerRequirements(
    components: ComponentWithTags[]
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    // Find power providers (PSUs)
    const powerProviders = components.filter(comp =>
      comp.tags.includes(SemanticTag.POWER_PROVIDER)
    );

    // Find power consumers
    const powerConsumers = components.filter(comp =>
      comp.tags.includes(SemanticTag.POWER_CONSUMER)
    );

    if (powerConsumers.length === 0) {
      return issues; // No power consumers, no issues
    }

    // Progressive validation: Only show PSU missing error if we have multiple components
    // or high-power components that definitely need a PSU
    const hasMultipleComponents = components.length > 1;
    const hasHighPowerComponent = powerConsumers.some(comp => {
      const power = comp.specifications['power_consumption'] || comp.specifications['tdp'];
      const powerValue = typeof power === 'number' ? power : parseFloat(String(power || '0'));
      return !isNaN(powerValue) && powerValue > 100; // High power components (GPU, high-end CPU)
    });

    if (powerProviders.length === 0) {
      // Only show PSU error if we have multiple components or high-power components
      if (hasMultipleComponents || hasHighPowerComponent) {
        issues.push({
          type: 'error',
          component1: 'Power System',
          component2: 'Configuration',
          message: 'No power supply found',
          details:
            'A power supply unit (PSU) is required to power all components. Consider adding a PSU with at least 500W capacity.',
          severity: 'high',
        });
      }
      return issues;
    }

    // Calculate realistic power consumption using our enhanced method
    const totalConsumption = this.calculateSmartPowerConsumption(components);

    // Check each power provider with advanced analysis
    for (const provider of powerProviders) {
      const wattageSpec =
        provider.specifications['wattage'] || provider.specifications['power_output'];
      const certificationSpec = provider.specifications['certification'] || '';

      if (wattageSpec) {
        const wattage =
          typeof wattageSpec === 'number' ? wattageSpec : parseFloat(String(wattageSpec));

        if (!isNaN(wattage)) {
          // Determine optimal load range (PSUs are most efficient at 50-80% load)
          const optimalMinLoad = wattage * 0.5;
          const optimalMaxLoad = wattage * 0.8;
          const maxSafeLoad = wattage * 0.9; // Never exceed 90% for safety

          // Critical error: PSU cannot handle the load
          if (totalConsumption > maxSafeLoad) {
            const suggestedWattage = Math.ceil(totalConsumption / 0.8 / 50) * 50; // Round up to nearest 50W
            issues.push({
              type: 'error',
              component1: provider.product.title,
              component2: 'Power Requirements',
              message: `PSU capacity insufficient for system load`,
              details: `System requires ${totalConsumption}W but PSU can safely provide only ${Math.round(maxSafeLoad)}W. Recommended: ${suggestedWattage}W+ PSU with 80+ certification.`,
              severity: 'high',
            });
          }
          // Warning: PSU load is too high (above optimal range)
          else if (totalConsumption > optimalMaxLoad) {
            const loadPercentage = Math.round((totalConsumption / wattage) * 100);
            issues.push({
              type: 'warning',
              component1: provider.product.title,
              component2: 'Power Requirements',
              message: `PSU operating above optimal efficiency range`,
              details: `System load is ${totalConsumption}W (${loadPercentage}% of PSU capacity). PSUs are most efficient at 50-80% load. Consider a higher wattage PSU for better efficiency and longevity.`,
              severity: 'medium',
            });
          }
          // Info: PSU load is too low (below optimal range)
          else if (totalConsumption < optimalMinLoad) {
            const loadPercentage = Math.round((totalConsumption / wattage) * 100);
            issues.push({
              type: 'warning',
              component1: provider.product.title,
              component2: 'Power Requirements',
              message: `PSU may be oversized for current system`,
              details: `System load is ${totalConsumption}W (${loadPercentage}% of PSU capacity). While safe, a smaller PSU (${Math.ceil(totalConsumption / 0.7 / 50) * 50}W) might be more cost-effective and efficient.`,
              severity: 'low',
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
          const hasHighEndGPU = components.some(
            comp =>
              comp.tags.includes(SemanticTag.GPU) &&
              ((comp.specifications['power_consumption'] as number) || 0) > 200
          );

          if (hasHighEndGPU && totalConsumption > 400) {
            const isModular = String(provider.specifications['modular'] || '').toLowerCase();
            if (!isModular.includes('modular') && !isModular.includes('yes')) {
              issues.push({
                type: 'warning',
                component1: provider.product.title,
                component2: 'Cable Management',
                message: `Consider modular PSU for high-performance build`,
                details: `For builds with high power consumption (${totalConsumption}W), a modular PSU can improve airflow and cable management.`,
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
    const gpus = components.filter(comp => comp.tags.includes(SemanticTag.GPU));

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
      const gpus = components.filter(comp => comp.tags.includes(SemanticTag.GPU));
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
