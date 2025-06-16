// src/lib/supabase/scripts/initSpecificationSystem.ts
import { CategoryTemplateService } from '../services/categoryTemplateService';
import { ProductService } from '../services/productService';

/**
 * Полная инициализация системы спецификаций
 */
export async function initializeSpecificationSystem() {
  console.log('🚀 Starting specification system initialization...');

  try {
    // 1. Создаем шаблоны категорий
    await CategoryTemplateService.initializeCategoryTemplates();

    // 2. Создаем примеры продуктов
    await ProductService.createExampleProducts();

    console.log('✅ Specification system initialized successfully!');

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to initialize specification system:', error);
    return { success: false, error };
  }
}

// Запуск инициализации
if (typeof window === 'undefined') {
  // Только на сервере
  initializeSpecificationSystem();
}
