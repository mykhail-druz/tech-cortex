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
   * Get specification value from product
   */
  private static getSpecValue(
    product: ProductWithDetails,
    specName: string
  ): string | number | boolean | null {
    // 🔥 SAFE CHECK for specifications
    if (!product.specifications || product.specifications.length === 0) {
      console.warn(`🔍 No specifications found for product: ${product.title}`);
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
      console.warn(`🔍 Specification '${specName}' not found in product: ${product.title}`);
      console.log(
        'Available specs:',
        product.specifications.map(s => s.name)
      );
      return null;
    }

    // Use the standard value field from ProductSpecification
    const value = spec.value;
    console.log(`✅ Found ${specName} = ${value} for ${product.title}`);
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

    console.log('🔍 Validating configuration:', {
      cpu: cpu?.title,
      motherboard: motherboard?.title,
      memory: memory?.title,
    });

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
    };

    console.log('✅ Validation result:', result);
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
      console.log('🔍 Starting CPU-Motherboard compatibility check...');

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
        console.error('❌ Database error fetching compatibility rules:', error);
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
        console.warn('⚠️ No compatibility rules found in database');
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

      console.log(`📋 Found ${rules.length} total compatibility rules`);

      // 🎯 ФИЛЬТРУЕМ ПРАВИЛА ДЛЯ CPU-MOTHERBOARD
      const cpuMbRules = rules.filter(
        rule =>
          rule.primary_category?.slug === 'processors' &&
          rule.secondary_category?.slug === 'motherboards'
      );

      console.log(`🎯 Found ${cpuMbRules.length} CPU-Motherboard rules`);

      if (cpuMbRules.length === 0) {
        return [
          {
            type: 'warning',
            component1: 'Процессор',
            component2: 'Материнская плата',
            message: 'Отсутствуют правила CPU-Motherboard',
            details: 'Создайте правило для processors → motherboards в админке',
            severity: 'medium',
          },
        ];
      }

      // 🎯 ПРОВЕРЯЕМ КАЖДОЕ ПРАВИЛО
      for (const rule of cpuMbRules) {
        const primarySpecName = rule.primary_template?.name;
        const secondarySpecName = rule.secondary_template?.name;

        if (!primarySpecName || !secondarySpecName) {
          console.warn('⚠️ Invalid rule template names:', rule);
          continue;
        }

        console.log(
          `🔌 Checking rule: "${rule.name}" (${primarySpecName} vs ${secondarySpecName})`
        );

        const cpuValue = this.getSpecValue(cpu, primarySpecName);
        const mbValue = this.getSpecValue(motherboard, secondarySpecName);

        console.log(`📊 Values comparison:`, {
          rule: rule.name,
          primarySpec: primarySpecName,
          cpuValue,
          secondarySpec: secondarySpecName,
          mbValue,
          compatible: cpuValue === mbValue,
        });

        if (!cpuValue || !mbValue) {
          issues.push({
            type: 'warning',
            component1: 'Процессор',
            component2: 'Материнская плата',
            message: `Отсутствует информация о ${primarySpecName}`,
            details: `CPU ${primarySpecName}: ${cpuValue || 'не найден'}, MB ${secondarySpecName}: ${mbValue || 'не найден'}`,
            severity: 'medium',
          });
          continue;
        }

        if (rule.rule_type === 'exact_match' && cpuValue !== mbValue) {
          issues.push({
            type: 'error',
            component1: 'Процессор',
            component2: 'Материнская плата',
            message: `Несовместимые ${primarySpecName}`,
            details: `Процессор: ${cpuValue}, Материнская плата: ${mbValue}`,
            severity: 'critical',
          });
        } else if (cpuValue === mbValue) {
          console.log(`✅ Compatible: ${primarySpecName} match (${cpuValue})`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking CPU-MB compatibility:', error);
      issues.push({
        type: 'warning',
        component1: 'Процессор',
        component2: 'Материнская плата',
        message: 'Ошибка проверки совместимости',
        details: 'Внутренняя ошибка системы',
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
        component1: 'Память',
        component2: 'Материнская плата',
        message: 'Отсутствует информация о типе памяти',
        details: 'Не удается проверить совместимость типов памяти',
        severity: 'medium',
      });
      return issues;
    }

    if (memoryType !== mbMemoryType) {
      issues.push({
        type: 'error',
        component1: 'Память',
        component2: 'Материнская плата',
        message: 'Несовместимые типы памяти',
        details: `Память: ${memoryType}, Материнская плата: ${mbMemoryType}`,
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
        component1: 'Блок питания',
        component2: 'Система',
        message: 'Отсутствует информация о мощности БП',
        details: 'Не удается проверить достаточность мощности',
        severity: 'medium',
      });
      return issues;
    }

    const totalPowerConsumption = this.calculatePowerConsumption(products);
    const recommendedPower = totalPowerConsumption * (1 + PSU_HEADROOM_PERCENTAGE / 100);

    if (psuWattage < recommendedPower) {
      issues.push({
        type: 'error',
        component1: 'Блок питания',
        component2: 'Система',
        message: 'Недостаточная мощность блока питания',
        details: `Требуется: ${Math.ceil(recommendedPower)}W, Доступно: ${psuWattage}W`,
        severity: 'critical',
      });
    } else if (psuWattage < totalPowerConsumption * 1.1) {
      issues.push({
        type: 'warning',
        component1: 'Блок питания',
        component2: 'Система',
        message: 'Малый запас мощности БП',
        details: `Рекомендуется БП мощностью от ${Math.ceil(recommendedPower)}W`,
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
          component1: 'Корпус',
          component2: 'Материнская плата',
          message: 'Несовместимый форм-фактор',
          details: `Корпус не поддерживает ${mbFormFactor}`,
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

    // Базовое потребление системы
    totalConsumption += COMPONENT_POWER_CONSUMPTION.MOTHERBOARD;

    // CPU
    if (products['processors']) {
      const cpuTdp = this.getSpecValue(products['processors'], 'tdp') as number;
      totalConsumption += cpuTdp || COMPONENT_POWER_CONSUMPTION.CPU.MEDIUM;
    }

    // GPU
    if (products['graphics-cards']) {
      const gpuPower = this.getSpecValue(products['graphics-cards'], 'power_consumption') as number;
      totalConsumption += gpuPower || COMPONENT_POWER_CONSUMPTION.GPU.MEDIUM;
    }

    // Memory
    if (products['memory']) {
      const memoryModules = (this.getSpecValue(products['memory'], 'modules') as number) || 1;
      totalConsumption += COMPONENT_POWER_CONSUMPTION.MEMORY * memoryModules;
    }

    // Storage
    if (products['storage']) {
      totalConsumption += COMPONENT_POWER_CONSUMPTION.STORAGE;
    }

    // Cooling
    if (products['cooling']) {
      totalConsumption += COMPONENT_POWER_CONSUMPTION.COOLING;
    }

    return totalConsumption;
  }
}
