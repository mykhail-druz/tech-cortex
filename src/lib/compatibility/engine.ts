import {
  CompatibilityIssue,
  ValidationResult,
  MemoryType,
} from '@/lib/supabase/types/specifications';
import { ProductWithDetails } from '@/lib/supabase/types/types';
import { supabase } from '@/lib/supabaseClient';
import { COMPONENT_POWER_CONSUMPTION, PSU_HEADROOM_PERCENTAGE } from './constants';

/**
 * Main PC component compatibility checking engine
 */
export class CompatibilityEngine {
  /**
   * Get specification value from the product
   */
  private static getSpecValue(
    product: ProductWithDetails,
    specName: string
  ): string | number | boolean | null {
    // 🔥 SAFE CHECK for specifications
    if (!product.specifications || product.specifications.length === 0) {
      return null;
    }

    // Search by exact name
    let spec = product.specifications.find(s => s.name === specName);

    // If not found, search by case-insensitive name
    if (!spec) {
      spec = product.specifications.find(s => s.name.toLowerCase() === specName.toLowerCase());
    }

    // If still not found and we're looking for a socket, check alternatives
    if (!spec && specName.toLowerCase() === 'socket') {
      const socketAliases = ['connector_type', 'Connector Type', 'connector', 'Socket Type'];
      for (const alias of socketAliases) {
        spec = product.specifications.find(s => s.name.toLowerCase() === alias.toLowerCase());
        if (spec) break;
      }
    }

    if (!spec) {
      return null;
    }

    // Use the standard value field from ProductSpecification
    const value = spec.value;
    return value;
  }

  /**
   * MAIN METHOD: Validate the entire configuration
   */
  static async validateConfiguration(
    products: Record<string, ProductWithDetails>
  ): Promise<ValidationResult> {
    const issues: CompatibilityIssue[] = [];
    const warnings: CompatibilityIssue[] = [];

    // Extract components
    const cpu = products['processors'];
    const motherboard = products['motherboards'];
    const memory = products['memory'];
    const gpu = products['graphics-cards'];
    const psu = products['power-supplies'];
    const pcCase = products['cases'];


    // 1. Check CPU + Motherboard compatibility
    if (cpu && motherboard) {
      const cpuMbIssues = await this.validateCpuMotherboard(cpu, motherboard);
      issues.push(...cpuMbIssues.filter(i => i.type === 'error'));
      warnings.push(...cpuMbIssues.filter(i => i.type === 'warning'));
    }

    // 2. Check Memory + Motherboard compatibility
    if (memory && motherboard) {
      const memoryMbIssues = this.validateMemoryMotherboard(memory, motherboard);
      issues.push(...memoryMbIssues.filter(i => i.type === 'error'));
      warnings.push(...memoryMbIssues.filter(i => i.type === 'warning'));
    }

    // 3. Check power requirements
    if (psu) {
      const powerIssues = this.validatePowerRequirements(products, psu);
      issues.push(...powerIssues.filter(i => i.type === 'error'));
      warnings.push(...powerIssues.filter(i => i.type === 'warning'));
    }

    // 4. Check case dimensions and compatibility
    if (pcCase && motherboard) {
      const caseIssues = this.validateCaseCompatibility(pcCase, motherboard, gpu);
      issues.push(...caseIssues.filter(i => i.type === 'error'));
      warnings.push(...caseIssues.filter(i => i.type === 'warning'));
    }

    // Calculate total power consumption
    const powerConsumption = this.calculatePowerConsumption(products);

    const result: ValidationResult = {
      isValid: issues.length === 0,
      issues,
      warnings,
      powerConsumption,
      actualPowerConsumption: powerConsumption,
      recommendedPsuPower: powerConsumption,
    };

    return result;
  }

  /**
   * Check compatibility between CPU and motherboard
   */
  static async validateCpuMotherboard(
    cpu: ProductWithDetails,
    motherboard: ProductWithDetails
  ): Promise<CompatibilityIssue[]> {
    const issues: CompatibilityIssue[] = [];

    try {
      // 🔥 GET RULES FROM DATABASE
      const { data: rules, error } = await supabase
        .from('compatibility_rules')
        .select(
          `
          *,
          primary_category:categories!primary_category_id(name, slug),
          secondary_category:categories!secondary_category_id(name, slug),
          primary_template:category_specification_templates!primary_specification_template_id(name),
          secondary_template:category_specification_templates!secondary_specification_template_id(name)
        `
        )
        .eq('rule_type', 'exact_match');

      if (error) {
        return [
          {
            type: 'warning',
            component1: 'Processor',
            component2: 'Motherboard',
            message: 'Error loading compatibility rules',
            details: `Database error: ${error.message}`,
            severity: 'medium',
          },
        ];
      }

      if (!rules || rules.length === 0) {
        return [
          {
            type: 'warning',
            component1: 'Processor',
            component2: 'Motherboard',
            message: 'Compatibility rules not configured',
            details: 'Create rules in /admin/pc-configurator/rules',
            severity: 'medium',
          },
        ];
      }

      // 🎯 ФИЛЬТРУЕМ ПРАВИЛА ДЛЯ CPU-MOTHERBOARD
      const cpuMbRules = rules.filter(
        rule =>
          rule.primary_category?.slug === 'processors' &&
          rule.secondary_category?.slug === 'motherboards'
      );

      if (cpuMbRules.length === 0) {
        return [
          {
            type: 'warning',
            component1: 'CPU',
            component2: 'Motherboard',
            message: 'No CPU-Motherboard rules',
            details: 'Create a rule for processors → motherboards in the admin panel.',
            severity: 'medium',
          },
        ];
      }

      // 🎯 ПРОВЕРЯЕМ КАЖДОЕ ПРАВИЛО
      for (const rule of cpuMbRules) {
        const primarySpecName = rule.primary_template?.name;
        const secondarySpecName = rule.secondary_template?.name;

        if (!primarySpecName || !secondarySpecName) {
          continue;
        }

        const cpuValue = this.getSpecValue(cpu, primarySpecName);
        const mbValue = this.getSpecValue(motherboard, secondarySpecName);


        if (!cpuValue || !mbValue) {
          issues.push({
            type: 'warning',
            component1: 'CPU',
            component2: 'Motherboard',
            message: `No information available about ${primarySpecName}`,
            details: `CPU ${primarySpecName}: ${cpuValue || 'Not found'}, MB ${secondarySpecName}: ${mbValue || 'не найден'}`,
            severity: 'medium',
          });
          continue;
        }

        if (rule.rule_type === 'exact_match' && cpuValue !== mbValue) {
          issues.push({
            type: 'error',
            component1: 'CPU',
            component2: 'Motherboard',
            message: `Incompatible ${primarySpecName}`,
            details: `CPU: ${cpuValue}, Motherboard: ${mbValue}`,
            severity: 'critical',
          });
        }
      }
    } catch {
      issues.push({
        type: 'warning',
        component1: 'CPU',
        component2: 'Motherboard',
        message: 'Compatibility check error',
        details: 'Internal system error',
        severity: 'medium',
      });
    }

    return issues;
  }

  /**
   * Проверка совместимости памяти с материнской платой
   */
  static validateMemoryMotherboard(
    memory: ProductWithDetails,
    motherboard: ProductWithDetails
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    const memoryType = this.getSpecValue(memory, 'memory_type') as MemoryType;
    const mbMemoryType = this.getSpecValue(motherboard, 'memory_type') as MemoryType;

    if (!memoryType || !mbMemoryType) {
      issues.push({
        type: 'warning',
        component1: 'RAM',
        component2: 'Motherboard',
        message: 'No information about memory type',
        details: 'Unable to verify memory type compatibility',
        severity: 'medium',
      });
      return issues;
    }

    if (memoryType !== mbMemoryType) {
      issues.push({
        type: 'error',
        component1: 'RAM',
        component2: 'Motherboard',
        message: 'Incompatible memory types',
        details: `RAM: ${memoryType}, Motherboard: ${mbMemoryType}`,
        severity: 'critical',
      });
    }

    return issues;
  }

  /**
   * Проверка требований по питанию
   */
  static validatePowerRequirements(
    products: Record<string, ProductWithDetails>,
    psu: ProductWithDetails
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    const psuWattage = this.getSpecValue(psu, 'wattage') as number;
    if (!psuWattage) {
      issues.push({
        type: 'warning',
        component1: 'Power Supply Unity',
        component2: 'System',
        message: 'No information about the power supply capacity',
        details: 'Unable to verify sufficient power',
        severity: 'medium',
      });
      return issues;
    }

    const totalPowerConsumption = this.calculatePowerConsumption(products);
    const recommendedPower = totalPowerConsumption * (1 + PSU_HEADROOM_PERCENTAGE / 100);

    if (psuWattage < recommendedPower) {
      issues.push({
        type: 'error',
        component1: 'Power supply unit',
        component2: 'System',
        message: 'Insufficient power supply unit capacity',
        details: `Требуется: ${Math.ceil(recommendedPower)}W, Available: ${psuWattage}W`,
        severity: 'critical',
      });
    } else if (psuWattage < totalPowerConsumption * 1.1) {
      issues.push({
        type: 'warning',
        component1: 'Power supply unit',
        component2: 'System',
        message: 'Low power reserve of the power supply unit',
        details: `A power supply with a capacity of ${Math.ceil(recommendedPower)}W`,
        severity: 'medium',
      });
    }

    return issues;
  }

  /**
   * Проверка совместимости корпуса
   */
  static validateCaseCompatibility(
    pcCase: ProductWithDetails,
    motherboard: ProductWithDetails,
    gpu?: ProductWithDetails
  ): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    // Проверка форм-фактора материнской платы
    const mbFormFactor = this.getSpecValue(motherboard, 'form_factor') as string;
    const caseFormFactors = this.getSpecValue(pcCase, 'supported_form_factors') as string;

    if (mbFormFactor && caseFormFactors) {
      if (!caseFormFactors.includes(mbFormFactor)) {
        issues.push({
          type: 'error',
          component1: 'Case',
          component2: 'Motherboard',
          message: 'Incompatible form factor',
          details: `The case does not support ${mbFormFactor}`,
          severity: 'critical',
        });
      }
    }

    // Проверка размеров видеокарты
    if (gpu) {
      const gpuLength = this.getSpecValue(gpu, 'length') as number;
      const maxGpuLength = this.getSpecValue(pcCase, 'max_gpu_length') as number;

      if (gpuLength && maxGpuLength && gpuLength > maxGpuLength) {
        issues.push({
          type: 'error',
          component1: 'Корпус',
          component2: 'Видеокарта',
          message: 'Видеокарта не помещается в корпус',
          details: `Длина карты: ${gpuLength}мм, Максимум в корпусе: ${maxGpuLength}мм`,
          severity: 'critical',
        });
      }
    }

    return issues;
  }

  /**
   * Подсчет общего энергопотребления
   */
  static calculatePowerConsumption(products: Record<string, ProductWithDetails>): number {
    let totalConsumption = 0;

    // Базовое потребление системы (материнская плата)
    totalConsumption += COMPONENT_POWER_CONSUMPTION.MOTHERBOARD;

    // CPU - используем TDP из спецификаций
    if (products['processors']) {
      const cpuTdp = this.getSpecValue(products['processors'], 'tdp') as number;
      if (cpuTdp) {
        totalConsumption += cpuTdp;
      }
    }

    // GPU - используем power_consumption из спецификаций
    if (products['graphics-cards']) {
      const gpuPower = this.getSpecValue(products['graphics-cards'], 'power_consumption') as number;
      if (gpuPower) {
        totalConsumption += gpuPower;
      }
    }

    // Memory - определяем тип памяти
    if (products['memory']) {
      const memoryType = this.getSpecValue(products['memory'], 'memory_type') as string;
      const isDDR5 = memoryType && memoryType.toLowerCase().includes('ddr5');
      const memoryModules = (this.getSpecValue(products['memory'], 'modules') as number) || 1;
      const memoryPowerPerModule = isDDR5 ? COMPONENT_POWER_CONSUMPTION.MEMORY_DDR5 : COMPONENT_POWER_CONSUMPTION.MEMORY_DDR4;
      totalConsumption += memoryPowerPerModule * memoryModules;
    }

    // Storage - определяем тип накопителя
    if (products['storage']) {
      const storageInterface = this.getSpecValue(products['storage'], 'interface') as string;
      const isNVMe = storageInterface && storageInterface.toLowerCase().includes('nvme');
      const isSSD = storageInterface && (storageInterface.toLowerCase().includes('ssd') || storageInterface.toLowerCase().includes('sata'));
      
      if (isNVMe) {
        totalConsumption += COMPONENT_POWER_CONSUMPTION.STORAGE_SSD_NVME;
      } else if (isSSD) {
        totalConsumption += COMPONENT_POWER_CONSUMPTION.STORAGE_SSD_SATA;
      } else {
        totalConsumption += COMPONENT_POWER_CONSUMPTION.STORAGE_HDD;
      }
    }

    // Cooling - определяем тип охлаждения
    if (products['cooling']) {
      const coolingTitle = products['cooling'].title.toLowerCase();
      const isAIO = coolingTitle.includes('aio') || coolingTitle.includes('жидкост');
      totalConsumption += isAIO ? COMPONENT_POWER_CONSUMPTION.COOLING_AIO : COMPONENT_POWER_CONSUMPTION.COOLING_AIR;
    }

    // Добавляем потребление корпусных вентиляторов
    if (products['cases']) {
      totalConsumption += COMPONENT_POWER_CONSUMPTION.CASE_FANS;
    }

    return totalConsumption;
  }
}
