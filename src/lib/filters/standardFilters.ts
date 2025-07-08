// lib/filters/standardFilters.ts
export const STANDARD_FILTER_CATEGORIES = {
  // Общие для всех товаров
  general: {
    price: {
      type: 'range',
      displayName: 'Price',
      priority: 1,
      unit: '$',
      groupBy: 'range',
    },
    brand: {
      type: 'checkbox',
      displayName: 'Brand',
      priority: 2,
      maxVisibleOptions: 8,
      showCount: true,
    },
    inStock: {
      type: 'checkbox',
      displayName: 'In stock',
      priority: 3,
      options: [{ value: 'true', label: 'Только в наличии' }],
    },
    rating: {
      type: 'checkbox',
      displayName: 'Rating',
      priority: 4,
      options: [
        { value: '4+', label: '4+ звезды' },
        { value: '3+', label: '3+ звезды' },
      ],
    },
  },

  // Технические характеристики
  technical: {
    // Процессоры
    processors: {
      family: {
        type: 'dropdown',
        displayName: 'Processor family',
        priority: 5,
        groupBy: 'exact',
      },
      cores: {
        type: 'checkbox',
        displayName: 'Cores',
        priority: 6,
        groupBy: 'exact',
      },
      frequency: {
        type: 'range',
        displayName: 'Frequency',
        priority: 7,
        unit: 'GHz',
        groupBy: 'range',
      },
    },

    // Видеокарты
    graphics: {
      memorySize: {
        type: 'checkbox',
        displayName: 'VRAM Size',
        priority: 5,
        unit: 'GB',
        groupBy: 'exact',
      },
      memoryType: {
        type: 'dropdown',
        displayName: 'VRAM Type',
        priority: 6,
      },
    },
  },
};
