-- =====================================================
-- ОЧИСТКА СТАРОЙ СИСТЕМЫ СПЕЦИФИКАЦИЙ
-- =====================================================

-- 1. Удаление старых таблиц системы спецификаций
DROP TABLE IF EXISTS category_specification_templates CASCADE;
DROP TABLE IF EXISTS auto_detection_rules CASCADE;
DROP TABLE IF EXISTS specification_compatibility_rules CASCADE;
DROP TABLE IF EXISTS tag_compatibility_rules CASCADE;

-- 2. Очистка полей в таблице categories от старой системы
ALTER TABLE categories 
DROP COLUMN IF EXISTS suggested_profiles,
DROP COLUMN IF EXISTS auto_generated_specs,
DROP COLUMN IF EXISTS specification_tags,
DROP COLUMN IF EXISTS smart_detection_enabled,
DROP COLUMN IF EXISTS last_profile_detection,
DROP COLUMN IF EXISTS custom_specs;

-- 3. Удаление старых функций и триггеров
DROP FUNCTION IF EXISTS detect_category_profiles() CASCADE;
DROP TRIGGER IF EXISTS trigger_detect_category_profiles ON categories;

-- =====================================================
-- СОЗДАНИЕ НОВОЙ ПРОСТОЙ СИСТЕМЫ СПЕЦИФИКАЦИЙ
-- =====================================================

-- 1. Таблица темплейтов спецификаций для категорий
CREATE TABLE category_spec_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('text', 'number', 'boolean', 'enum')),
  is_required BOOLEAN DEFAULT false,
  is_filter BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  enum_values TEXT[],
  unit VARCHAR(20),
  placeholder TEXT,
  help_text TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(category_id, name)
);

-- 2. Таблица спецификаций продуктов
CREATE TABLE product_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  value TEXT,
  data_type VARCHAR(20) NOT NULL CHECK (data_type IN ('text', 'number', 'boolean', 'enum')),
  is_required BOOLEAN DEFAULT false,
  is_filter BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  enum_values TEXT[],
  unit VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(product_id, name)
);

-- 3. Индексы для быстрого поиска и фильтрации
CREATE INDEX idx_category_spec_templates_category_id ON category_spec_templates(category_id);
CREATE INDEX idx_category_spec_templates_display_order ON category_spec_templates(category_id, display_order);
CREATE INDEX idx_category_spec_templates_is_filter ON category_spec_templates(category_id, is_filter);

CREATE INDEX idx_product_specifications_product_id ON product_specifications(product_id);
CREATE INDEX idx_product_specifications_name ON product_specifications(name);
CREATE INDEX idx_product_specifications_value ON product_specifications(value);
CREATE INDEX idx_product_specifications_display_order ON product_specifications(product_id, display_order);
CREATE INDEX idx_product_specifications_is_filter ON product_specifications(is_filter);

-- 4. Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_category_spec_templates_updated_at 
    BEFORE UPDATE ON category_spec_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_specifications_updated_at 
    BEFORE UPDATE ON product_specifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS политики для безопасности
ALTER TABLE category_spec_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

-- Политики для category_spec_templates
CREATE POLICY "category_spec_templates_select_policy" ON category_spec_templates
    FOR SELECT USING (true);

CREATE POLICY "category_spec_templates_insert_policy" ON category_spec_templates
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "category_spec_templates_update_policy" ON category_spec_templates
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "category_spec_templates_delete_policy" ON category_spec_templates
    FOR DELETE USING (auth.role() = 'authenticated');

-- Политики для product_specifications
CREATE POLICY "product_specifications_select_policy" ON product_specifications
    FOR SELECT USING (true);

CREATE POLICY "product_specifications_insert_policy" ON product_specifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "product_specifications_update_policy" ON product_specifications
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "product_specifications_delete_policy" ON product_specifications
    FOR DELETE USING (auth.role() = 'authenticated');

-- =====================================================
-- СОЗДАНИЕ БАЗОВЫХ ТЕМПЛЕЙТОВ ДЛЯ ПРОЦЕССОРОВ
-- =====================================================

-- Получаем ID категории процессоров
DO $$
DECLARE
    cpu_category_id UUID;
BEGIN
    -- Ищем категорию процессоров
    SELECT id INTO cpu_category_id 
    FROM categories 
    WHERE slug = 'cpu' OR name ILIKE '%процессор%' OR name ILIKE '%cpu%'
    LIMIT 1;
    
    IF cpu_category_id IS NOT NULL THEN
        -- Создаем темплейты для процессоров
        INSERT INTO category_spec_templates (category_id, name, display_name, data_type, is_required, is_filter, display_order, enum_values, unit) VALUES
        (cpu_category_id, 'manufacturer', 'Производитель', 'enum', true, true, 1, ARRAY['Intel', 'AMD', 'Apple', 'Qualcomm', 'MediaTek'], NULL),
        (cpu_category_id, 'socket', 'Сокет', 'enum', true, true, 2, ARRAY['AM4', 'AM5', 'LGA1700', 'LGA1200', 'LGA1151', 'LGA2066'], NULL),
        (cpu_category_id, 'cores', 'Ядра', 'number', true, true, 3, NULL, NULL),
        (cpu_category_id, 'threads', 'Потоки', 'number', true, true, 4, NULL, NULL),
        (cpu_category_id, 'base_clock', 'Базовая частота', 'number', true, true, 5, NULL, 'GHz'),
        (cpu_category_id, 'tdp', 'TDP', 'number', true, true, 6, NULL, 'W'),
        (cpu_category_id, 'boost_clock', 'Турбо частота', 'number', false, true, 7, NULL, 'GHz'),
        (cpu_category_id, 'cache_l2', 'Кэш L2', 'number', false, true, 8, NULL, 'MB'),
        (cpu_category_id, 'cache_l3', 'Кэш L3', 'number', false, true, 9, NULL, 'MB'),
        (cpu_category_id, 'process', 'Техпроцесс', 'enum', false, true, 10, ARRAY['3nm', '4nm', '5nm', '7nm', '10nm', '14nm'], NULL),
        (cpu_category_id, 'architecture_64bit', '64-битная архитектура', 'boolean', false, true, 11, NULL, NULL),
        (cpu_category_id, 'instruction_set', 'Набор инструкций', 'enum', false, true, 12, ARRAY['x86', 'x86-64', 'ARM', 'ARM64'], NULL),
        (cpu_category_id, 'integrated_graphics', 'Встроенная графика', 'boolean', false, true, 13, NULL, NULL),
        (cpu_category_id, 'graphics_model', 'Модель графики', 'text', false, true, 14, NULL, NULL),
        (cpu_category_id, 'max_temp', 'Макс. температура', 'number', false, true, 15, NULL, '°C');
        
        RAISE NOTICE 'Созданы темплейты спецификаций для процессоров (category_id: %)', cpu_category_id;
    ELSE
        RAISE NOTICE 'Категория процессоров не найдена';
    END IF;
END $$;

-- =====================================================
-- ПРОВЕРКА РЕЗУЛЬТАТОВ
-- =====================================================

-- Проверяем созданные темплейты
SELECT 
    c.name as category_name,
    cst.name,
    cst.display_name,
    cst.data_type,
    cst.is_required,
    cst.display_order
FROM category_spec_templates cst
JOIN categories c ON c.id = cst.category_id
ORDER BY c.name, cst.display_order;