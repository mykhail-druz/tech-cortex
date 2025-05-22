-- Seed data for TechCortex E-commerce Database

-- Settings
INSERT INTO settings (key, value, description)
VALUES
  ('company_name', 'TechCortex', 'Company name used throughout the site'),
  ('company_description', 'Your trusted provider of high-quality computer hardware. We offer a wide range of products at competitive prices.', 'Short company description for footer'),
  ('contact_email', 'support@techcortex.com', 'Support email address'),
  ('contact_phone', '+1 (555) 123-4567', 'Support phone number'),
  ('contact_address', 'Silicon Valley, CA, USA', 'Company physical address');

-- Homepage Content
INSERT INTO homepage_content (section, title, subtitle, content, cta_text, cta_link, display_order, is_active)
VALUES
  ('hero', 'TechCortex - Computer Hardware Store', 'Your trusted provider of high-quality computer hardware', NULL, 'Browse Catalog', '/products', 1, true),
  ('featured_category', 'Laptops', 'Powerful and modern solutions for work and play', NULL, NULL, '/products/laptops', 1, true),
  ('featured_category', 'Graphics Cards', 'High-performance GPUs for any task', NULL, NULL, '/products/components', 2, true),
  ('featured_category', 'Processors', 'Intel and AMD solutions for all needs', NULL, NULL, '/products/components', 3, true);

-- Navigation Links
INSERT INTO navigation_links (title, url, group_name, display_order, is_active)
VALUES
  ('Home', '/', 'main_nav', 1, true),
  ('Products', '/products', 'main_nav', 2, true),
  ('About Us', '/about', 'main_nav', 3, true),
  ('Contact', '/contact', 'main_nav', 4, true),
  ('Blog', '/blog', 'main_nav', 5, true),
  ('Laptops', '/products/laptops', 'footer_categories', 1, true),
  ('Desktops', '/products/desktops', 'footer_categories', 2, true),
  ('Components', '/products/components', 'footer_categories', 3, true),
  ('Peripherals', '/products/peripherals', 'footer_categories', 4, true),
  ('Networking', '/products/networking', 'footer_categories', 5, true);

-- Categories
INSERT INTO categories (name, slug, description, image_url)
VALUES
  ('Laptops', 'laptops', 'Portable computers for work and play', NULL),
  ('Desktops', 'desktops', 'Powerful desktop computers for any task', NULL),
  ('Components', 'components', 'Computer parts and components', NULL),
  ('Peripherals', 'peripherals', 'Keyboards, mice, monitors, and other accessories', NULL),
  ('Networking', 'networking', 'Routers, switches, and other networking equipment', NULL);

-- Sample Products
INSERT INTO products (title, slug, description, price, old_price, discount_percentage, main_image_url, category_id, brand, in_stock, sku)
VALUES
  ('Ultra Performance Laptop Pro', 'ultra-performance-laptop-pro', 'Experience ultimate performance with this premium laptop featuring the latest processor, ample memory, and lightning-fast storage. Perfect for professionals, gamers, and content creators who demand the best.', 1299.99, 1499.99, 13, '/api/placeholder/500/400', (SELECT id FROM categories WHERE slug = 'laptops'), 'TechCortex', true, 'LAPTOP-001'),
  ('Slim Ultrabook Pro', 'slim-ultrabook-pro', 'Ultra-thin and lightweight laptop perfect for professionals on the go.', 999.99, NULL, NULL, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'laptops'), 'TechCortex', true, 'LAPTOP-002'),
  ('Gaming Laptop Elite', 'gaming-laptop-elite', 'Powerful gaming laptop with high-end graphics and fast refresh rate display.', 1499.99, 1699.99, 12, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'laptops'), 'TechCortex', true, 'LAPTOP-003'),
  ('Business Laptop Pro', 'business-laptop-pro', 'Reliable business laptop with enhanced security features and long battery life.', 1099.99, NULL, NULL, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'laptops'), 'TechCortex', false, 'LAPTOP-004'),
  ('Advanced Gaming Graphics Card', 'advanced-gaming-graphics-card', 'High-performance graphics card for gaming and content creation.', 799.99, NULL, NULL, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'components'), 'TechCortex', true, 'GPU-001'),
  ('Multi-Core Processor Elite', 'multi-core-processor-elite', 'High-performance processor with multiple cores for demanding tasks.', 399.99, 449.99, 11, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'components'), 'TechCortex', true, 'CPU-001'),
  ('Premium Gaming Motherboard', 'premium-gaming-motherboard', 'Feature-rich motherboard designed for gaming and overclocking.', 299.99, NULL, NULL, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'components'), 'TechCortex', true, 'MB-001'),
  ('High Speed Memory 32GB Kit', 'high-speed-memory-32gb-kit', 'Fast and reliable memory kit for system upgrades.', 159.99, NULL, NULL, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'components'), 'TechCortex', true, 'RAM-001'),
  ('NVMe SSD 2TB', 'nvme-ssd-2tb', 'Ultra-fast solid state drive for storage and quick boot times.', 249.99, 299.99, 17, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'components'), 'TechCortex', true, 'SSD-001'),
  ('Ultra-Wide Gaming Monitor', 'ultra-wide-gaming-monitor', 'Immersive ultra-wide monitor for gaming and productivity.', 499.99, NULL, NULL, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'peripherals'), 'TechCortex', false, 'MON-001'),
  ('Mechanical Gaming Keyboard', 'mechanical-gaming-keyboard', 'Responsive mechanical keyboard with customizable RGB lighting.', 129.99, NULL, NULL, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'peripherals'), 'TechCortex', true, 'KB-001'),
  ('Premium Laptop Backpack', 'premium-laptop-backpack', 'Durable and stylish backpack for laptops up to 17 inches.', 79.99, NULL, NULL, '/api/placeholder/300/300', (SELECT id FROM categories WHERE slug = 'peripherals'), 'TechCortex', true, 'ACC-001');

-- Product Specifications for the main laptop
INSERT INTO product_specifications (product_id, name, value, display_order)
VALUES
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), 'Processor', 'Intel Core i9-12900H', 1),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), 'RAM', '32GB DDR5', 2),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), 'Storage', '1TB NVMe SSD', 3),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), 'Display', '15.6" 4K OLED', 4),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), 'Graphics', 'NVIDIA RTX 4080 8GB', 5),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), 'Battery', '90Wh, up to 10 hours', 6),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), 'Operating System', 'Windows 11 Pro', 7),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), 'Weight', '2.1 kg', 8);

-- Product Images for the main laptop
INSERT INTO product_images (product_id, image_url, alt_text, is_main, display_order)
VALUES
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), '/api/placeholder/500/400', 'Ultra Performance Laptop Pro - Front View', true, 1),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), '/api/placeholder/500/400', 'Ultra Performance Laptop Pro - Side View', false, 2),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), '/api/placeholder/500/400', 'Ultra Performance Laptop Pro - Back View', false, 3),
  ((SELECT id FROM products WHERE slug = 'ultra-performance-laptop-pro'), '/api/placeholder/500/400', 'Ultra Performance Laptop Pro - Open View', false, 4);