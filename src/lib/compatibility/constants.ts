import {
  SocketType,
  MemoryType,
  ChipsetType,
  MemorySpeedDDR4,
  MemorySpeedDDR5,
} from '@/lib/supabase/types/specifications';

// Матрица совместимости сокетов и типов памяти
export const SOCKET_MEMORY_COMPATIBILITY: Record<SocketType, MemoryType[]> = {
  [SocketType.AM4]: [MemoryType.DDR4],
  [SocketType.AM5]: [MemoryType.DDR5],
  [SocketType.LGA1700]: [MemoryType.DDR4, MemoryType.DDR5], // Intel 12th gen поддерживает оба
  [SocketType.LGA1200]: [MemoryType.DDR4],
  [SocketType.LGA1151]: [MemoryType.DDR4],
  [SocketType.LGA2066]: [MemoryType.DDR4],
};

// Совместимость чипсетов с сокетами
export const CHIPSET_SOCKET_COMPATIBILITY: Record<ChipsetType, SocketType[]> = {
  // AMD Chipsets
  [ChipsetType.B450]: [SocketType.AM4],
  [ChipsetType.B550]: [SocketType.AM4],
  [ChipsetType.X570]: [SocketType.AM4],
  [ChipsetType.X670E]: [SocketType.AM5],
  [ChipsetType.B650]: [SocketType.AM5],
  [ChipsetType.B650E]: [SocketType.AM5],
  [ChipsetType.X670]: [SocketType.AM5],

  // Intel Chipsets
  [ChipsetType.B560]: [SocketType.LGA1200],
  [ChipsetType.Z490]: [SocketType.LGA1200],
  [ChipsetType.Z590]: [SocketType.LGA1200],
  [ChipsetType.B660]: [SocketType.LGA1700],
  [ChipsetType.B760]: [SocketType.LGA1700],
  [ChipsetType.H610]: [SocketType.LGA1700],
  [ChipsetType.H670]: [SocketType.LGA1700],
  [ChipsetType.H770]: [SocketType.LGA1700],
  [ChipsetType.Z690]: [SocketType.LGA1700],
  [ChipsetType.Z790]: [SocketType.LGA1700],
};

// Поддерживаемые скорости памяти для каждого сокета
export const SOCKET_MEMORY_SPEED_COMPATIBILITY = {
  [SocketType.AM4]: [
    MemorySpeedDDR4.DDR4_2133,
    MemorySpeedDDR4.DDR4_2400,
    MemorySpeedDDR4.DDR4_2666,
    MemorySpeedDDR4.DDR4_2933,
    MemorySpeedDDR4.DDR4_3200,
    MemorySpeedDDR4.DDR4_3600,
  ],
  [SocketType.AM5]: [
    MemorySpeedDDR5.DDR5_4800,
    MemorySpeedDDR5.DDR5_5200,
    MemorySpeedDDR5.DDR5_5600,
    MemorySpeedDDR5.DDR5_6000,
    MemorySpeedDDR5.DDR5_6400,
  ],
  [SocketType.LGA1700]: [
    // Поддерживает и DDR4 и DDR5
    MemorySpeedDDR4.DDR4_2133,
    MemorySpeedDDR4.DDR4_2400,
    MemorySpeedDDR4.DDR4_2666,
    MemorySpeedDDR4.DDR4_2933,
    MemorySpeedDDR4.DDR4_3200,
    MemorySpeedDDR5.DDR5_4800,
    MemorySpeedDDR5.DDR5_5200,
    MemorySpeedDDR5.DDR5_5600,
  ],
  [SocketType.LGA1200]: [
    MemorySpeedDDR4.DDR4_2133,
    MemorySpeedDDR4.DDR4_2400,
    MemorySpeedDDR4.DDR4_2666,
    MemorySpeedDDR4.DDR4_2933,
    MemorySpeedDDR4.DDR4_3200,
  ],
};

// Типичное энергопотребление компонентов (в ваттах)
export const COMPONENT_POWER_CONSUMPTION = {
  CPU: {
    LOW: 65, // Энергоэффективные процессоры
    MEDIUM: 125, // Обычные процессоры
    HIGH: 200, // Мощные процессоры
  },
  GPU: {
    LOW: 75, // Встроенная/бюджетная
    MEDIUM: 150, // Средний класс
    HIGH: 250, // Высокий класс
    EXTREME: 400, // Топовые карты
  },
  MEMORY: 5, // За модуль
  STORAGE: 10, // SSD/HDD
  MOTHERBOARD: 30, // Базовое потребление
  COOLING: 25, // Кулеры
};

// Рекомендуемый запас мощности БП (в процентах)
export const PSU_HEADROOM_PERCENTAGE = 20;

// Минимальные требования совместимости
export const COMPATIBILITY_REQUIREMENTS = {
  // Минимальная мощность БП относительно потребления системы
  MIN_PSU_EFFICIENCY: 0.8,

  // Максимальное количество модулей памяти
  MAX_MEMORY_MODULES: {
    MINI_ITX: 2,
    MICRO_ATX: 4,
    ATX: 4,
    E_ATX: 8,
  },

  // Максимальная длина видеокарты для форм-факторов корпуса
  MAX_GPU_LENGTH: {
    MINI_ITX: 280, // мм
    MICRO_ATX: 320,
    ATX: 400,
    E_ATX: 450,
  },
};
