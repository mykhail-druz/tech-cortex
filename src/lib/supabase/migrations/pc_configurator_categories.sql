-- Добавляем поля к существующей таблице categories для PC конфигуратора
ALTER TABLE categories ADD COLUMN IF NOT EXISTS pc_component_type VARCHAR(50);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS pc_icon VARCHAR(10) DEFAULT '🔧';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS pc_required BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS pc_supports_multiple BOOLEAN DEFAULT false;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS pc_display_order INTEGER DEFAULT 0;

-- Создаем индекс для PC компонентов
CREATE INDEX IF NOT EXISTS idx_categories_pc_component 
ON categories(pc_component_type) 
WHERE pc_component_type IS NOT NULL;

-- Заполняем данные для существующих PC категорий
UPDATE categories SET 
  pc_component_type = 'processor',
  pc_icon = '🔥',
  pc_required = true,
  pc_supports_multiple = false,
  pc_display_order = 1
WHERE slug = 'processors';

UPDATE categories SET 
  pc_component_type = 'motherboard',
  pc_icon = '🔧', 
  pc_required = true,
  pc_supports_multiple = false,
  pc_display_order = 2
WHERE slug = 'motherboards';

UPDATE categories SET 
  pc_component_type = 'memory',
  pc_icon = '💾',
  pc_required = true,
  pc_supports_multiple = true,
  pc_display_order = 3
WHERE slug = 'ram';

UPDATE categories SET 
  pc_component_type = 'graphics-card',
  pc_icon = '🎮',
  pc_required = false,
  pc_supports_multiple = false,
  pc_display_order = 4
WHERE slug = 'graphic-cards';

UPDATE categories SET 
  pc_component_type = 'storage',
  pc_icon = '💿',
  pc_required = true,
  pc_supports_multiple = true,
  pc_display_order = 5
WHERE slug = 'storage';

UPDATE categories SET 
  pc_component_type = 'power-supply',
  pc_icon = '⚡',
  pc_required = true,
  pc_supports_multiple = false,
  pc_display_order = 6
WHERE slug = 'power-supplies';

UPDATE categories SET 
  pc_component_type = 'case',
  pc_icon = '📦',
  pc_required = true,
  pc_supports_multiple = false,
  pc_display_order = 7
WHERE slug = 'cases';

UPDATE categories SET 
  pc_component_type = 'cooling',
  pc_icon = '❄️',
  pc_required = false,
  pc_supports_multiple = false,
  pc_display_order = 8
WHERE slug = 'cooling';
