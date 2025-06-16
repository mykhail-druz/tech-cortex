// src/lib/supabase/services/productService.ts
import { supabase } from '../../supabaseClient';
import { Product, ProductSpecification } from '../types/types';
import { CategoryTemplateService } from './categoryTemplateService';

export class ProductService {
  /**
   * Добавление продукта со спецификациями
   */
  static async createProductWithSpecifications(
    productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
    specifications: { [templateName: string]: any }
  ): Promise<{ success: boolean; productId?: string; errors?: string[] }> {
    const errors: string[] = [];

    try {
      // 1. Получаем шаблоны для категории
      const { data: category } = await supabase
        .from('categories')
        .select('slug')
        .eq('id', productData.category_id)
        .single();

      if (!category) {
        return { success: false, errors: ['Категория не найдена'] };
      }

      const templates = await CategoryTemplateService.getTemplatesForCategory(category.slug);

      // 2. Валидируем все спецификации
      for (const template of templates) {
        const value = specifications[template.name];
        const validation = CategoryTemplateService.validateSpecification(template, value);

        if (!validation.isValid) {
          errors.push(validation.error!);
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Ensure main_image_url is properly included
      console.log('Creating product with main_image_url:', productData.main_image_url);

      // Make sure main_image_url is not an empty string
      const sanitizedProductData = {
        ...productData,
        main_image_url: productData.main_image_url && productData.main_image_url.trim() !== '' 
          ? productData.main_image_url 
          : null
      };

      // 3. Создаем продукт
      console.log('Creating product with data:', JSON.stringify(sanitizedProductData, null, 2));

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(sanitizedProductData)
        .select()
        .single();

      console.log('Product creation result:', { data: product, error: productError });

      if (productError || !product) {
        return { success: false, errors: ['Ошибка создания продукта: ' + productError?.message] };
      }

      // 4. Добавляем спецификации
      const specInserts = [];
      for (const template of templates) {
        const value = specifications[template.name];
        if (value !== undefined && value !== null) {
          let typedSpec: any = {
            product_id: product.id,
            template_id: template.id,
            name: template.name,
            value: String(value), // Для совместимости
            display_order: template.display_order,
          };

          // Добавляем типизированные значения
          switch (template.data_type) {
            case 'number':
              typedSpec.value_number = Number(value);
              break;
            case 'boolean':
              typedSpec.value_boolean = Boolean(value);
              break;
            case 'enum':
            case 'socket':
            case 'memory_type':
            case 'power_connector':
              typedSpec.value_enum = String(value);
              break;
            default:
              typedSpec.value_text = String(value);
          }

          specInserts.push(typedSpec);
        }
      }

      if (specInserts.length > 0) {
        const { error: specsError } = await supabase
          .from('product_specifications')
          .insert(specInserts);

        if (specsError) {
          // Откатываем создание продукта
          await supabase.from('products').delete().eq('id', product.id);
          return {
            success: false,
            errors: ['Ошибка добавления спецификаций: ' + specsError.message],
          };
        }
      }

      return { success: true, productId: product.id };
    } catch (error) {
      console.error('❌ Error creating product:', error);
      return { success: false, errors: ['Внутренняя ошибка сервера'] };
    }
  }

  /**
   * Пример создания процессора AMD Ryzen 7 5800X
   */
  static async createExampleProducts() {
    // AMD Ryzen 7 5800X
    const ryzenResult = await this.createProductWithSpecifications(
      {
        title: 'AMD Ryzen 7 5800X',
        slug: 'amd-ryzen-7-5800x',
        description: 'Высокопроизводительный 8-ядерный процессор для геймеров',
        price: 299.99,
        category_id: 'processors-category-id', // Нужно получить из базы
        brand: 'AMD',
        in_stock: true,
        sku: 'AMD-R7-5800X',
      },
      {
        socket: 'AM4',
        cores: 8,
        threads: 16,
        base_clock: 3.8,
        boost_clock: 4.7,
        tdp: 105,
        integrated_graphics: false,
      }
    );

    console.log('Ryzen creation result:', ryzenResult);

    // Intel Core i7-12700K
    const intelResult = await this.createProductWithSpecifications(
      {
        title: 'Intel Core i7-12700K',
        slug: 'intel-core-i7-12700k',
        description: 'Гибридный процессор Intel 12 поколения',
        price: 349.99,
        category_id: 'processors-category-id',
        brand: 'Intel',
        in_stock: true,
        sku: 'INTEL-I7-12700K',
      },
      {
        socket: 'LGA1700',
        cores: 12,
        threads: 20,
        base_clock: 3.6,
        boost_clock: 5.0,
        tdp: 125,
        integrated_graphics: true,
      }
    );

    console.log('Intel creation result:', intelResult);
  }
}
