// lib/config/filterConfig.ts
export const FILTER_CONFIG = {
  // Стандартные приоритеты
  PRIORITY: {
    PRICE: 1,
    BRAND: 2,
    AVAILABILITY: 3,
    RATING: 4,
    CATEGORY_SPECIFIC: 10,
  },

  // Максимальное количество видимых опций
  MAX_VISIBLE_OPTIONS: {
    BRANDS: 8,
    COLORS: 12,
    SIZES: 15,
    DEFAULT: 10,
  },

  // Настройки группировки
  GROUPING: {
    PRICE_RANGES: [
      { min: 0, max: 100, label: 'До $100' },
      { min: 100, max: 500, label: '$100 - $500' },
      { min: 500, max: 1000, label: '$500 - $1000' },
      { min: 1000, max: 9999, label: 'Свыше $1000' },
    ],

    MEMORY_SIZES: [
      { values: ['4GB', '8GB'], label: 'До 8GB' },
      { values: ['16GB', '32GB'], label: '16GB - 32GB' },
      { values: ['64GB', '128GB'], label: '64GB+' },
    ],
  },
};
