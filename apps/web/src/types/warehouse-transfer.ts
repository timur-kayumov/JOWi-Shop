import { z } from 'zod';

// ==================== TYPES ====================

export type WarehouseTransferStatus = 'draft' | 'published' | 'canceled';

export interface WarehouseTransfer {
  id: string;
  documentNumber: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  status: WarehouseTransferStatus;
  notes?: string;
  itemsCount: number;
  totalAmount: number;
  createdAt: Date;
  publishedAt?: Date;
  updatedAt: Date;
}

export interface WarehouseTransferLineItem {
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

export interface WarehouseTransferDetail extends Omit<WarehouseTransfer, 'updatedAt'> {
  responsibleName: string;
  lineItems: WarehouseTransferLineItem[];
}

// ==================== ZOD SCHEMAS ====================

export const createWarehouseTransferSchema = z.object({
  sourceWarehouseId: z.string().min(1, 'Склад отправитель обязателен'),
  destinationWarehouseId: z.string().min(1, 'Склад получатель обязателен'),
  notes: z.string().optional(),
}).refine((data) => data.sourceWarehouseId !== data.destinationWarehouseId, {
  message: 'Склад отправитель и получатель не могут быть одинаковыми',
  path: ['destinationWarehouseId'],
});

export type CreateWarehouseTransferInput = z.infer<typeof createWarehouseTransferSchema>;

// ==================== MOCK DATA ====================

export const mockWarehouses = [
  { id: 'wh1', name: 'Центральный склад' },
  { id: 'wh2', name: 'Склад №2 (Чиланзар)' },
  { id: 'wh3', name: 'Склад №3 (Юнусабад)' },
  { id: 'wh4', name: 'Склад №4 (Сергели)' },
];

export const mockWarehouseTransfers: WarehouseTransfer[] = [
  {
    id: '1',
    documentNumber: 'WT-2025-001',
    sourceWarehouseId: 'wh1',
    sourceWarehouseName: 'Центральный склад',
    destinationWarehouseId: 'wh2',
    destinationWarehouseName: 'Склад №2 (Чиланзар)',
    status: 'published',
    notes: 'Плановое перемещение молочной продукции',
    itemsCount: 12,
    totalAmount: 8500000,
    createdAt: new Date('2025-01-15T10:00:00'),
    publishedAt: new Date('2025-01-15T11:30:00'),
    updatedAt: new Date('2025-01-15T11:30:00'),
  },
  {
    id: '2',
    documentNumber: 'WT-2025-002',
    sourceWarehouseId: 'wh2',
    sourceWarehouseName: 'Склад №2 (Чиланзар)',
    destinationWarehouseId: 'wh3',
    destinationWarehouseName: 'Склад №3 (Юнусабад)',
    status: 'draft',
    notes: 'Черновик перемещения бакалеи',
    itemsCount: 8,
    totalAmount: 3200000,
    createdAt: new Date('2025-01-16T14:20:00'),
    updatedAt: new Date('2025-01-16T15:45:00'),
  },
  {
    id: '3',
    documentNumber: 'WT-2025-003',
    sourceWarehouseId: 'wh1',
    sourceWarehouseName: 'Центральный склад',
    destinationWarehouseId: 'wh3',
    destinationWarehouseName: 'Склад №3 (Юнусабад)',
    status: 'published',
    notes: 'Срочное перемещение напитков для пополнения',
    itemsCount: 18,
    totalAmount: 12600000,
    createdAt: new Date('2025-01-14T08:00:00'),
    publishedAt: new Date('2025-01-14T10:15:00'),
    updatedAt: new Date('2025-01-14T10:15:00'),
  },
  {
    id: '4',
    documentNumber: 'WT-2025-004',
    sourceWarehouseId: 'wh3',
    sourceWarehouseName: 'Склад №3 (Юнусабад)',
    destinationWarehouseId: 'wh1',
    destinationWarehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Возврат излишков на центральный склад',
    itemsCount: 15,
    totalAmount: 6700000,
    createdAt: new Date('2025-01-13T11:30:00'),
    publishedAt: new Date('2025-01-13T13:00:00'),
    updatedAt: new Date('2025-01-13T13:00:00'),
  },
  {
    id: '5',
    documentNumber: 'WT-2025-005',
    sourceWarehouseId: 'wh1',
    sourceWarehouseName: 'Центральный склад',
    destinationWarehouseId: 'wh4',
    destinationWarehouseName: 'Склад №4 (Сергели)',
    status: 'canceled',
    notes: 'Отменено - изменение плана распределения',
    itemsCount: 10,
    totalAmount: 4200000,
    createdAt: new Date('2025-01-12T07:00:00'),
    updatedAt: new Date('2025-01-12T16:30:00'),
  },
  {
    id: '6',
    documentNumber: 'WT-2025-006',
    sourceWarehouseId: 'wh2',
    sourceWarehouseName: 'Склад №2 (Чиланзар)',
    destinationWarehouseId: 'wh1',
    destinationWarehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Перемещение замороженной продукции',
    itemsCount: 22,
    totalAmount: 15800000,
    createdAt: new Date('2025-01-11T09:45:00'),
    publishedAt: new Date('2025-01-11T12:00:00'),
    updatedAt: new Date('2025-01-11T12:00:00'),
  },
  {
    id: '7',
    documentNumber: 'WT-2025-007',
    sourceWarehouseId: 'wh4',
    sourceWarehouseName: 'Склад №4 (Сергели)',
    destinationWarehouseId: 'wh2',
    destinationWarehouseName: 'Склад №2 (Чиланзар)',
    status: 'published',
    notes: 'Пополнение склада свежими овощами',
    itemsCount: 25,
    totalAmount: 9300000,
    createdAt: new Date('2025-01-10T08:15:00'),
    publishedAt: new Date('2025-01-10T10:30:00'),
    updatedAt: new Date('2025-01-10T10:30:00'),
  },
  {
    id: '8',
    documentNumber: 'WT-2025-008',
    sourceWarehouseId: 'wh1',
    sourceWarehouseName: 'Центральный склад',
    destinationWarehouseId: 'wh2',
    destinationWarehouseName: 'Склад №2 (Чиланзар)',
    status: 'draft',
    notes: 'В процессе подготовки перемещения кондитерских изделий',
    itemsCount: 30,
    totalAmount: 11200000,
    createdAt: new Date('2025-01-17T10:00:00'),
    updatedAt: new Date('2025-01-17T11:20:00'),
  },
  {
    id: '9',
    documentNumber: 'WT-2025-009',
    sourceWarehouseId: 'wh3',
    sourceWarehouseName: 'Склад №3 (Юнусабад)',
    destinationWarehouseId: 'wh4',
    destinationWarehouseName: 'Склад №4 (Сергели)',
    status: 'published',
    notes: 'Балансировка запасов между филиалами',
    itemsCount: 19,
    totalAmount: 7800000,
    createdAt: new Date('2025-01-09T07:30:00'),
    publishedAt: new Date('2025-01-09T09:00:00'),
    updatedAt: new Date('2025-01-09T09:00:00'),
  },
  {
    id: '10',
    documentNumber: 'WT-2025-010',
    sourceWarehouseId: 'wh2',
    sourceWarehouseName: 'Склад №2 (Чиланзар)',
    destinationWarehouseId: 'wh4',
    destinationWarehouseName: 'Склад №4 (Сергели)',
    status: 'published',
    notes: 'Регулярное перемещение хлебобулочной продукции',
    itemsCount: 16,
    totalAmount: 5400000,
    createdAt: new Date('2025-01-08T13:00:00'),
    publishedAt: new Date('2025-01-08T14:45:00'),
    updatedAt: new Date('2025-01-08T14:45:00'),
  },
];

// ==================== DETAIL PAGE MOCK DATA ====================

export const mockWarehouseTransferDetails: Record<string, WarehouseTransferDetail> = {
  '1': {
    id: '1',
    documentNumber: 'WT-2025-001',
    sourceWarehouseId: 'wh1',
    sourceWarehouseName: 'Центральный склад',
    destinationWarehouseId: 'wh2',
    destinationWarehouseName: 'Склад №2 (Чиланзар)',
    status: 'published',
    notes: 'Плановое перемещение молочной продукции',
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
    documentNumber: 'WT-2025-002',
    sourceWarehouseId: 'wh2',
    sourceWarehouseName: 'Склад №2 (Чиланзар)',
    destinationWarehouseId: 'wh3',
    destinationWarehouseName: 'Склад №3 (Юнусабад)',
    status: 'draft',
    notes: 'Черновик перемещения бакалеи',
    itemsCount: 8,
    totalAmount: 3200000,
    createdAt: new Date('2025-01-16T14:20:00'),
    responsibleName: 'Нодира Каримова',
    lineItems: [
      {
        id: 'li2-1',
        variantId: 'var5',
        productName: 'Рис',
        brandAndVolume: 'Девзира • 1 кг',
        quantity: 100,
        unit: 'кг',
        costPrice: 18000,
        sellingPrice: 25000,
        total: 2500000,
        availableQuantity: 250,
      },
      {
        id: 'li2-2',
        variantId: 'var6',
        productName: 'Гречка',
        brandAndVolume: 'Ядрица • 1 кг',
        quantity: 50,
        unit: 'кг',
        costPrice: 14000,
        sellingPrice: 20000,
        total: 1000000,
        availableQuantity: 180,
      },
    ],
  },
  '3': {
    id: '3',
    documentNumber: 'WT-2025-003',
    sourceWarehouseId: 'wh1',
    sourceWarehouseName: 'Центральный склад',
    destinationWarehouseId: 'wh3',
    destinationWarehouseName: 'Склад №3 (Юнусабад)',
    status: 'published',
    notes: 'Срочное перемещение напитков для пополнения',
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
  text: string; // Changed from 'content' to match @jowi/ui Comments component
  createdAt: Date;
  updatedAt?: Date;
  isEdited?: boolean;
}

export type ActivityType = 'created' | 'updated' | 'status_changed' | 'comment_added';

export interface Activity {
  id: string;
  type: ActivityType; // Changed from 'action: string' to match @jowi/ui ActivityHistory component
  userId: string;
  userName: string;
  timestamp: Date;
  description?: string;
  // For status changes
  oldStatus?: string;
  newStatus?: string;
}

export const mockWarehouseTransferComments: Record<string, Comment[]> = {
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

export const mockWarehouseTransferActivities: Record<string, Activity[]> = {
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
