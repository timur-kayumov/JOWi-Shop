import { z } from 'zod';

// ==================== TYPES ====================

export type StoreTransferStatus = 'draft' | 'published' | 'canceled';

export interface StoreTransfer {
  id: string;
  documentNumber: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationStoreId: string;
  destinationStoreName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: StoreTransferStatus;
  notes?: string;
  itemsCount: number;
  totalAmount: number;
  createdAt: Date;
  publishedAt?: Date;
  updatedAt: Date;
}

export interface StoreTransferLineItem {
  id: string;
  variantId: string;
  productName: string;
  brandAndVolume?: string;
  quantity: number;
  unit: string; // 'шт', 'кг', 'л', 'упак'
  costPrice: number; // Себестоимость за единицу
  sellingPrice: number; // Цена продажи за единицу
  total: number; // sellingPrice × quantity
  availableQuantity?: number; // Доступное количество на складе отправителе
}

export interface StoreTransferDetail extends Omit<StoreTransfer, 'updatedAt'> {
  responsibleName: string;
  lineItems: StoreTransferLineItem[];
}

// ==================== ZOD SCHEMAS ====================

export const createStoreTransferSchema = z.object({
  sourceWarehouseId: z.string().min(1, 'Склад отправитель обязателен'),
  destinationStoreId: z.string().min(1, 'Магазин получатель обязателен'),
  destinationWarehouseId: z.string().min(1, 'Склад получатель обязателен'),
  notes: z.string().optional(),
});

export type CreateStoreTransferInput = z.infer<typeof createStoreTransferSchema>;

// ==================== MOCK DATA ====================

export const mockStores = [
  { id: 'store1', name: 'Магазин №1 (Чиланзар)' },
  { id: 'store2', name: 'Магазин №2 (Юнусабад)' },
  { id: 'store3', name: 'Магазин №3 (Сергели)' },
  { id: 'store4', name: 'Магазин №4 (Мирзо-Улугбек)' },
  { id: 'store5', name: 'Магазин №5 (Яккасарай)' },
];

// Warehouses belonging to stores
export interface WarehouseWithStore {
  id: string;
  storeId: string;
  name: string;
}

export const mockWarehousesForStores: WarehouseWithStore[] = [
  // Store 1 warehouses
  { id: 'wh1-1', storeId: 'store1', name: 'Основной склад' },
  { id: 'wh1-2', storeId: 'store1', name: 'Холодильный склад' },

  // Store 2 warehouses
  { id: 'wh2-1', storeId: 'store2', name: 'Основной склад' },
  { id: 'wh2-2', storeId: 'store2', name: 'Холодильный склад' },
  { id: 'wh2-3', storeId: 'store2', name: 'Склад напитков' },

  // Store 3 warehouses
  { id: 'wh3-1', storeId: 'store3', name: 'Основной склад' },

  // Store 4 warehouses
  { id: 'wh4-1', storeId: 'store4', name: 'Основной склад' },
  { id: 'wh4-2', storeId: 'store4', name: 'Холодильный склад' },

  // Store 5 warehouses
  { id: 'wh5-1', storeId: 'store5', name: 'Основной склад' },
  { id: 'wh5-2', storeId: 'store5', name: 'Склад замороженной продукции' },
];

export const mockStoreTransfers: StoreTransfer[] = [
  {
    id: '1',
    documentNumber: 'ST-2025-001',
    sourceWarehouseId: 'wh1-1',
    sourceWarehouseName: 'Основной склад',
    destinationStoreId: 'store2',
    destinationStoreName: 'Магазин №2 (Юнусабад)',
    destinationWarehouseId: 'wh2-1',
    destinationWarehouseName: 'Основной склад',
    status: 'published',
    notes: 'Плановое пополнение магазина молочной продукцией',
    itemsCount: 12,
    totalAmount: 8500000,
    createdAt: new Date('2025-01-15T10:00:00'),
    publishedAt: new Date('2025-01-15T11:30:00'),
    updatedAt: new Date('2025-01-15T11:30:00'),
  },
  {
    id: '2',
    documentNumber: 'ST-2025-002',
    sourceWarehouseId: 'wh1-2',
    sourceWarehouseName: 'Холодильный склад',
    destinationStoreId: 'store3',
    destinationStoreName: 'Магазин №3 (Сергели)',
    destinationWarehouseId: 'wh3-1',
    destinationWarehouseName: 'Основной склад',
    status: 'draft',
    notes: 'Черновик перемещения замороженной продукции',
    itemsCount: 8,
    totalAmount: 3200000,
    createdAt: new Date('2025-01-16T14:20:00'),
    updatedAt: new Date('2025-01-16T15:45:00'),
  },
  {
    id: '3',
    documentNumber: 'ST-2025-003',
    sourceWarehouseId: 'wh1-1',
    sourceWarehouseName: 'Основной склад',
    destinationStoreId: 'store4',
    destinationStoreName: 'Магазин №4 (Мирзо-Улугбек)',
    destinationWarehouseId: 'wh4-1',
    destinationWarehouseName: 'Основной склад',
    status: 'published',
    notes: 'Срочное пополнение напитками для акции',
    itemsCount: 18,
    totalAmount: 12600000,
    createdAt: new Date('2025-01-14T08:00:00'),
    publishedAt: new Date('2025-01-14T10:15:00'),
    updatedAt: new Date('2025-01-14T10:15:00'),
  },
  {
    id: '4',
    documentNumber: 'ST-2025-004',
    sourceWarehouseId: 'wh1-1',
    sourceWarehouseName: 'Основной склад',
    destinationStoreId: 'store5',
    destinationStoreName: 'Магазин №5 (Яккасарай)',
    destinationWarehouseId: 'wh5-1',
    destinationWarehouseName: 'Основной склад',
    status: 'published',
    notes: 'Пополнение бакалеей и крупами',
    itemsCount: 15,
    totalAmount: 6700000,
    createdAt: new Date('2025-01-13T11:30:00'),
    publishedAt: new Date('2025-01-13T13:00:00'),
    updatedAt: new Date('2025-01-13T13:00:00'),
  },
  {
    id: '5',
    documentNumber: 'ST-2025-005',
    sourceWarehouseId: 'wh1-2',
    sourceWarehouseName: 'Холодильный склад',
    destinationStoreId: 'store2',
    destinationStoreName: 'Магазин №2 (Юнусабад)',
    destinationWarehouseId: 'wh2-2',
    destinationWarehouseName: 'Холодильный склад',
    status: 'canceled',
    notes: 'Отменено - изменение плана распределения',
    itemsCount: 10,
    totalAmount: 4200000,
    createdAt: new Date('2025-01-12T07:00:00'),
    updatedAt: new Date('2025-01-12T16:30:00'),
  },
  {
    id: '6',
    documentNumber: 'ST-2025-006',
    sourceWarehouseId: 'wh1-1',
    sourceWarehouseName: 'Основной склад',
    destinationStoreId: 'store3',
    destinationStoreName: 'Магазин №3 (Сергели)',
    destinationWarehouseId: 'wh3-1',
    destinationWarehouseName: 'Основной склад',
    status: 'published',
    notes: 'Перемещение кондитерских изделий',
    itemsCount: 22,
    totalAmount: 15800000,
    createdAt: new Date('2025-01-11T09:45:00'),
    publishedAt: new Date('2025-01-11T12:00:00'),
    updatedAt: new Date('2025-01-11T12:00:00'),
  },
  {
    id: '7',
    documentNumber: 'ST-2025-007',
    sourceWarehouseId: 'wh1-2',
    sourceWarehouseName: 'Холодильный склад',
    destinationStoreId: 'store4',
    destinationStoreName: 'Магазин №4 (Мирзо-Улугбек)',
    destinationWarehouseId: 'wh4-2',
    destinationWarehouseName: 'Холодильный склад',
    status: 'published',
    notes: 'Пополнение молочной продукцией',
    itemsCount: 25,
    totalAmount: 9300000,
    createdAt: new Date('2025-01-10T08:15:00'),
    publishedAt: new Date('2025-01-10T10:30:00'),
    updatedAt: new Date('2025-01-10T10:30:00'),
  },
  {
    id: '8',
    documentNumber: 'ST-2025-008',
    sourceWarehouseId: 'wh1-1',
    sourceWarehouseName: 'Основной склад',
    destinationStoreId: 'store5',
    destinationStoreName: 'Магазин №5 (Яккасарай)',
    destinationWarehouseId: 'wh5-2',
    destinationWarehouseName: 'Склад замороженной продукции',
    status: 'draft',
    notes: 'В процессе подготовки перемещения мясной продукции',
    itemsCount: 30,
    totalAmount: 11200000,
    createdAt: new Date('2025-01-17T10:00:00'),
    updatedAt: new Date('2025-01-17T11:20:00'),
  },
  {
    id: '9',
    documentNumber: 'ST-2025-009',
    sourceWarehouseId: 'wh1-1',
    sourceWarehouseName: 'Основной склад',
    destinationStoreId: 'store2',
    destinationStoreName: 'Магазин №2 (Юнусабад)',
    destinationWarehouseId: 'wh2-3',
    destinationWarehouseName: 'Склад напитков',
    status: 'published',
    notes: 'Сезонное пополнение безалкогольными напитками',
    itemsCount: 19,
    totalAmount: 7800000,
    createdAt: new Date('2025-01-09T07:30:00'),
    publishedAt: new Date('2025-01-09T09:00:00'),
    updatedAt: new Date('2025-01-09T09:00:00'),
  },
  {
    id: '10',
    documentNumber: 'ST-2025-010',
    sourceWarehouseId: 'wh1-2',
    sourceWarehouseName: 'Холодильный склад',
    destinationStoreId: 'store3',
    destinationStoreName: 'Магазин №3 (Сергели)',
    destinationWarehouseId: 'wh3-1',
    destinationWarehouseName: 'Основной склад',
    status: 'published',
    notes: 'Регулярное пополнение свежими овощами и фруктами',
    itemsCount: 16,
    totalAmount: 5400000,
    createdAt: new Date('2025-01-08T13:00:00'),
    publishedAt: new Date('2025-01-08T14:45:00'),
    updatedAt: new Date('2025-01-08T14:45:00'),
  },
];

// ==================== DETAIL PAGE MOCK DATA ====================

export const mockStoreTransferDetails: Record<string, StoreTransferDetail> = {
  '1': {
    id: '1',
    documentNumber: 'ST-2025-001',
    sourceWarehouseId: 'wh1-1',
    sourceWarehouseName: 'Основной склад',
    destinationStoreId: 'store2',
    destinationStoreName: 'Магазин №2 (Юнусабад)',
    destinationWarehouseId: 'wh2-1',
    destinationWarehouseName: 'Основной склад',
    status: 'published',
    notes: 'Плановое пополнение магазина молочной продукцией',
    itemsCount: 12,
    totalAmount: 8500000,
    createdAt: new Date('2025-01-15T10:00:00'),
    publishedAt: new Date('2025-01-15T11:30:00'),
    responsibleName: 'Азиз Умаров',
    lineItems: [
      {
        id: 'li1-1',
        variantId: 'var1',
        productName: 'Молоко',
        brandAndVolume: 'Uzbekiston Sut • 1 л',
        quantity: 50,
        unit: 'шт',
        costPrice: 8000,
        sellingPrice: 12000,
        total: 600000,
        availableQuantity: 120,
      },
      {
        id: 'li1-2',
        variantId: 'var2',
        productName: 'Кефир',
        brandAndVolume: 'Lactel • 0.5 л',
        quantity: 30,
        unit: 'шт',
        costPrice: 9500,
        sellingPrice: 14000,
        total: 420000,
        availableQuantity: 85,
      },
      {
        id: 'li1-3',
        variantId: 'var3',
        productName: 'Сметана',
        brandAndVolume: 'Прелесть • 400 г',
        quantity: 25,
        unit: 'шт',
        costPrice: 15000,
        sellingPrice: 22000,
        total: 550000,
        availableQuantity: 60,
      },
      {
        id: 'li1-4',
        variantId: 'var4',
        productName: 'Творог',
        brandAndVolume: 'Совет • 250 г',
        quantity: 40,
        unit: 'шт',
        costPrice: 12000,
        sellingPrice: 18000,
        total: 720000,
        availableQuantity: 95,
      },
    ],
  },
  '2': {
    id: '2',
    documentNumber: 'ST-2025-002',
    sourceWarehouseId: 'wh1-2',
    sourceWarehouseName: 'Холодильный склад',
    destinationStoreId: 'store3',
    destinationStoreName: 'Магазин №3 (Сергели)',
    destinationWarehouseId: 'wh3-1',
    destinationWarehouseName: 'Основной склад',
    status: 'draft',
    notes: 'Черновик перемещения замороженной продукции',
    itemsCount: 8,
    totalAmount: 3200000,
    createdAt: new Date('2025-01-16T14:20:00'),
    responsibleName: 'Нодира Каримова',
    lineItems: [
      {
        id: 'li2-1',
        variantId: 'var5',
        productName: 'Пельмени',
        brandAndVolume: 'Сибирские • 1 кг',
        quantity: 100,
        unit: 'шт',
        costPrice: 18000,
        sellingPrice: 25000,
        total: 2500000,
        availableQuantity: 250,
      },
      {
        id: 'li2-2',
        variantId: 'var6',
        productName: 'Вареники',
        brandAndVolume: 'Хозяюшка • 800 г',
        quantity: 50,
        unit: 'шт',
        costPrice: 14000,
        sellingPrice: 20000,
        total: 1000000,
        availableQuantity: 180,
      },
    ],
  },
  '3': {
    id: '3',
    documentNumber: 'ST-2025-003',
    sourceWarehouseId: 'wh1-1',
    sourceWarehouseName: 'Основной склад',
    destinationStoreId: 'store4',
    destinationStoreName: 'Магазин №4 (Мирзо-Улугбек)',
    destinationWarehouseId: 'wh4-1',
    destinationWarehouseName: 'Основной склад',
    status: 'published',
    notes: 'Срочное пополнение напитками для акции',
    itemsCount: 18,
    totalAmount: 12600000,
    createdAt: new Date('2025-01-14T08:00:00'),
    publishedAt: new Date('2025-01-14T10:15:00'),
    responsibleName: 'Рустам Алиев',
    lineItems: [
      {
        id: 'li3-1',
        variantId: 'var7',
        productName: 'Coca-Cola',
        brandAndVolume: 'Coca-Cola • 1 л',
        quantity: 200,
        unit: 'шт',
        costPrice: 8500,
        sellingPrice: 13000,
        total: 2600000,
        availableQuantity: 500,
      },
      {
        id: 'li3-2',
        variantId: 'var8',
        productName: 'Pepsi',
        brandAndVolume: 'Pepsi • 1 л',
        quantity: 150,
        unit: 'шт',
        costPrice: 8000,
        sellingPrice: 12500,
        total: 1875000,
        availableQuantity: 420,
      },
      {
        id: 'li3-3',
        variantId: 'var9',
        productName: 'Сок',
        brandAndVolume: 'Rich • 1 л',
        quantity: 100,
        unit: 'шт',
        costPrice: 12000,
        sellingPrice: 18000,
        total: 1800000,
        availableQuantity: 300,
      },
    ],
  },
};

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
}

export type ActivityType = 'created' | 'updated' | 'status_changed' | 'comment_added';

export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  timestamp: Date;
  description?: string;
  // For status changes
  oldStatus?: string;
  newStatus?: string;
}

export const mockStoreTransferComments: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c1',
      userId: 'user1',
      userName: 'Азиз Умаров',
      text: 'Перемещение выполнено вовремя, товар принят без замечаний.',
      createdAt: new Date('2025-01-15T12:00:00'),
    },
  ],
  '2': [
    {
      id: 'c2',
      userId: 'user2',
      userName: 'Нодира Каримова',
      text: 'Необходимо проверить наличие на складе перед публикацией.',
      createdAt: new Date('2025-01-16T15:00:00'),
    },
  ],
};

export const mockStoreTransferActivities: Record<string, Activity[]> = {
  '1': [
    {
      id: 'a1',
      type: 'created',
      userId: 'user1',
      userName: 'Азиз Умаров',
      description: 'Документ создан',
      timestamp: new Date('2025-01-15T10:00:00'),
    },
    {
      id: 'a2',
      type: 'status_changed',
      userId: 'user1',
      userName: 'Азиз Умаров',
      description: 'Документ опубликован',
      newStatus: 'Опубликовано',
      timestamp: new Date('2025-01-15T11:30:00'),
    },
  ],
  '2': [
    {
      id: 'a3',
      type: 'created',
      userId: 'user2',
      userName: 'Нодира Каримова',
      description: 'Документ создан',
      timestamp: new Date('2025-01-16T14:20:00'),
    },
  ],
};
