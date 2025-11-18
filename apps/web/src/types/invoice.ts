import { z } from 'zod';

// ==================== TYPES ====================

export type InvoiceStatus = 'draft' | 'published' | 'canceled';

export type InvoiceDirection = 'outgoing' | 'incoming';

export interface InvoiceItem {
  id: string;
  variantId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface InvoiceLineItem {
  id: string;
  variantId: string;
  productName: string;
  brandAndVolume?: string;
  quantity: number;
  unit: string; // 'шт', 'кг', 'л', 'упак'
  price: number; // Price per unit
  total: number; // Calculated: quantity × price
}

export interface Invoice {
  id: string;
  documentNumber: string;
  direction: InvoiceDirection;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  status: InvoiceStatus;
  notes?: string;
  itemsCount: number;
  totalAmount: number;
  createdAt: Date;
  publishedAt?: Date;
  updatedAt: Date;
  items?: InvoiceItem[];
}

export interface InvoiceDetail extends Omit<Invoice, 'items'> {
  responsibleName: string;
  lineItems: InvoiceLineItem[];
}

// ==================== ZOD SCHEMAS ====================

export const createInvoiceSchema = z.object({
  supplierId: z.string().min(1, 'Поставщик обязателен'),
  warehouseId: z.string().min(1, 'Склад обязателен'),
  notes: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

// ==================== MOCK DATA ====================

export const mockInvoices: Invoice[] = [
  {
    id: '1',
    documentNumber: 'INV-2025-001',
    direction: 'outgoing',
    supplierId: '1',
    supplierName: 'ООО "Продукты Опт"',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Плановая поставка молочной продукции',
    itemsCount: 15,
    totalAmount: 12500000,
    createdAt: new Date('2025-01-15T09:00:00'),
    publishedAt: new Date('2025-01-15T10:30:00'),
    updatedAt: new Date('2025-01-15T10:30:00'),
  },
  {
    id: '2',
    documentNumber: 'INV-2025-002',
    direction: 'outgoing',
    supplierId: '2',
    supplierName: 'ИП Алиев Фарход',
    warehouseId: 'wh2',
    warehouseName: 'Склад №2 (Чиланзар)',
    status: 'draft',
    notes: 'Черновик накладной на овощи',
    itemsCount: 8,
    totalAmount: 3200000,
    createdAt: new Date('2025-01-16T14:20:00'),
    updatedAt: new Date('2025-01-16T15:45:00'),
  },
  {
    id: '3',
    documentNumber: 'INV-2025-003',
    direction: 'incoming',
    supplierId: '3',
    supplierName: 'ТОО "Мясокомбинат"',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Получено через интеграцию JOWi Supplier',
    itemsCount: 22,
    totalAmount: 45600000,
    createdAt: new Date('2025-01-14T08:00:00'),
    publishedAt: new Date('2025-01-14T11:15:00'),
    updatedAt: new Date('2025-01-14T11:15:00'),
  },
  {
    id: '4',
    documentNumber: 'INV-2025-004',
    direction: 'outgoing',
    supplierId: '1',
    supplierName: 'ООО "Продукты Опт"',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Срочная поставка напитков',
    itemsCount: 30,
    totalAmount: 18900000,
    createdAt: new Date('2025-01-13T11:30:00'),
    publishedAt: new Date('2025-01-13T13:00:00'),
    updatedAt: new Date('2025-01-13T13:00:00'),
  },
  {
    id: '5',
    documentNumber: 'INV-2025-005',
    direction: 'outgoing',
    supplierId: '4',
    supplierName: 'ООО "Хлебокомбинат №1"',
    warehouseId: 'wh2',
    warehouseName: 'Склад №2 (Чиланзар)',
    status: 'canceled',
    notes: 'Отменено - поставщик не доставил товар',
    itemsCount: 12,
    totalAmount: 2400000,
    createdAt: new Date('2025-01-12T07:00:00'),
    updatedAt: new Date('2025-01-12T16:30:00'),
  },
  {
    id: '6',
    documentNumber: 'INV-2025-006',
    direction: 'incoming',
    supplierId: '5',
    supplierName: 'ИП Каримов Шахзод',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Импорт через JOWi Supplier API',
    itemsCount: 18,
    totalAmount: 9800000,
    createdAt: new Date('2025-01-11T09:45:00'),
    publishedAt: new Date('2025-01-11T12:00:00'),
    updatedAt: new Date('2025-01-11T12:00:00'),
  },
  {
    id: '7',
    documentNumber: 'INV-2025-007',
    direction: 'outgoing',
    supplierId: '2',
    supplierName: 'ИП Алиев Фарход',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Еженедельная поставка свежих овощей',
    itemsCount: 25,
    totalAmount: 7600000,
    createdAt: new Date('2025-01-10T08:15:00'),
    publishedAt: new Date('2025-01-10T10:30:00'),
    updatedAt: new Date('2025-01-10T10:30:00'),
  },
  {
    id: '8',
    documentNumber: 'INV-2025-008',
    direction: 'outgoing',
    supplierId: '6',
    supplierName: 'ООО "Кондитерская фабрика"',
    warehouseId: 'wh2',
    warehouseName: 'Склад №2 (Чиланзар)',
    status: 'draft',
    notes: 'В процессе согласования номенклатуры',
    itemsCount: 40,
    totalAmount: 15200000,
    createdAt: new Date('2025-01-17T10:00:00'),
    updatedAt: new Date('2025-01-17T11:20:00'),
  },
  {
    id: '9',
    documentNumber: 'INV-2025-009',
    direction: 'incoming',
    supplierId: '7',
    supplierName: 'ТОО "Молочный завод"',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Автоматический импорт от поставщика',
    itemsCount: 32,
    totalAmount: 22400000,
    createdAt: new Date('2025-01-09T07:30:00'),
    publishedAt: new Date('2025-01-09T09:00:00'),
    updatedAt: new Date('2025-01-09T09:00:00'),
  },
  {
    id: '10',
    documentNumber: 'INV-2025-010',
    direction: 'outgoing',
    supplierId: '1',
    supplierName: 'ООО "Продукты Опт"',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Регулярная поставка бакалеи',
    itemsCount: 28,
    totalAmount: 16700000,
    createdAt: new Date('2025-01-08T13:00:00'),
    publishedAt: new Date('2025-01-08T14:45:00'),
    updatedAt: new Date('2025-01-08T14:45:00'),
  },
  {
    id: '11',
    documentNumber: 'INV-2025-011',
    direction: 'outgoing',
    supplierId: '8',
    supplierName: 'ИП Юсупов Азиз',
    warehouseId: 'wh2',
    warehouseName: 'Склад №2 (Чиланзар)',
    status: 'published',
    notes: 'Поставка замороженной продукции',
    itemsCount: 19,
    totalAmount: 11300000,
    createdAt: new Date('2025-01-07T09:00:00'),
    publishedAt: new Date('2025-01-07T11:30:00'),
    updatedAt: new Date('2025-01-07T11:30:00'),
  },
  {
    id: '12',
    documentNumber: 'INV-2025-012',
    direction: 'incoming',
    supplierId: '9',
    supplierName: 'ООО "ТашкентАгро"',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Импорт через JOWi Supplier - сезонные фрукты',
    itemsCount: 35,
    totalAmount: 19500000,
    createdAt: new Date('2025-01-06T08:00:00'),
    publishedAt: new Date('2025-01-06T10:15:00'),
    updatedAt: new Date('2025-01-06T10:15:00'),
  },
  {
    id: '13',
    documentNumber: 'INV-2025-013',
    direction: 'outgoing',
    supplierId: '4',
    supplierName: 'ООО "Хлебокомбинат №1"',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'draft',
    notes: 'Подготовка к приемке хлебобулочной продукции',
    itemsCount: 14,
    totalAmount: 3800000,
    createdAt: new Date('2025-01-17T15:30:00'),
    updatedAt: new Date('2025-01-17T16:00:00'),
  },
  {
    id: '14',
    documentNumber: 'INV-2025-014',
    direction: 'outgoing',
    supplierId: '10',
    supplierName: 'ИП Рахимов Бобур',
    warehouseId: 'wh2',
    warehouseName: 'Склад №2 (Чиланзар)',
    status: 'canceled',
    notes: 'Отменено - изменение условий поставки',
    itemsCount: 11,
    totalAmount: 5600000,
    createdAt: new Date('2025-01-05T10:00:00'),
    updatedAt: new Date('2025-01-05T17:00:00'),
  },
  {
    id: '15',
    documentNumber: 'INV-2025-015',
    direction: 'incoming',
    supplierId: '3',
    supplierName: 'ТОО "Мясокомбинат"',
    warehouseId: 'wh1',
    warehouseName: 'Центральный склад',
    status: 'published',
    notes: 'Плановая поставка мясной продукции через API',
    itemsCount: 27,
    totalAmount: 38900000,
    createdAt: new Date('2025-01-04T07:00:00'),
    publishedAt: new Date('2025-01-04T09:30:00'),
    updatedAt: new Date('2025-01-04T09:30:00'),
  },
];

// ==================== MOCK LINE ITEMS ====================

// Mock line items for Invoice #1 (Published)
export const mockLineItemsInvoice1: InvoiceLineItem[] = [
  {
    id: 'li1-1',
    variantId: 'var1',
    productName: 'Молоко',
    brandAndVolume: 'Uzbekiston Sut • 1 л',
    quantity: 50,
    unit: 'шт',
    price: 12000,
    total: 600000,
  },
  {
    id: 'li1-2',
    variantId: 'var2',
    productName: 'Кефир',
    brandAndVolume: 'Dolina • 900 мл',
    quantity: 30,
    unit: 'шт',
    price: 15000,
    total: 450000,
  },
  {
    id: 'li1-3',
    variantId: 'var3',
    productName: 'Сметана',
    brandAndVolume: 'Dolina • 400 г',
    quantity: 40,
    unit: 'шт',
    price: 18000,
    total: 720000,
  },
  {
    id: 'li1-4',
    variantId: 'var4',
    productName: 'Творог',
    brandAndVolume: 'Ўзбекистон сути • 500 г',
    quantity: 25,
    unit: 'шт',
    price: 22000,
    total: 550000,
  },
  {
    id: 'li1-5',
    variantId: 'var5',
    productName: 'Йогурт питьевой',
    brandAndVolume: 'Fruttis • 300 мл',
    quantity: 60,
    unit: 'шт',
    price: 9000,
    total: 540000,
  },
  {
    id: 'li1-6',
    variantId: 'var6',
    productName: 'Сыр "Российский"',
    brandAndVolume: 'Tashkent Dairy • 1 кг',
    quantity: 15,
    unit: 'кг',
    price: 85000,
    total: 1275000,
  },
  {
    id: 'li1-7',
    variantId: 'var7',
    productName: 'Масло сливочное',
    brandAndVolume: 'Сливочное • 200 г',
    quantity: 35,
    unit: 'шт',
    price: 28000,
    total: 980000,
  },
  {
    id: 'li1-8',
    variantId: 'var8',
    productName: 'Сливки',
    brandAndVolume: '20% • 500 мл',
    quantity: 20,
    unit: 'шт',
    price: 19000,
    total: 380000,
  },
  {
    id: 'li1-9',
    variantId: 'var9',
    productName: 'Ряженка',
    brandAndVolume: 'Uzbekiston Sut • 900 мл',
    quantity: 28,
    unit: 'шт',
    price: 13000,
    total: 364000,
  },
  {
    id: 'li1-10',
    variantId: 'var10',
    productName: 'Йогурт',
    brandAndVolume: 'Активиа • 120 г • 8 шт',
    quantity: 45,
    unit: 'упак',
    price: 42000,
    total: 1890000,
  },
  {
    id: 'li1-11',
    variantId: 'var11',
    productName: 'Молоко топленое',
    brandAndVolume: 'Dolina • 1 л',
    quantity: 22,
    unit: 'шт',
    price: 14000,
    total: 308000,
  },
  {
    id: 'li1-12',
    variantId: 'var12',
    productName: 'Сырок творожный',
    brandAndVolume: 'B.Ju.Alexander • 45 г • 20 шт',
    quantity: 18,
    unit: 'упак',
    price: 95000,
    total: 1710000,
  },
  {
    id: 'li1-13',
    variantId: 'var13',
    productName: 'Сметана',
    brandAndVolume: '25% • 200 г',
    quantity: 32,
    unit: 'шт',
    price: 16000,
    total: 512000,
  },
  {
    id: 'li1-14',
    variantId: 'var14',
    productName: 'Простокваша',
    brandAndVolume: 'Uzbekiston Sut • 500 мл',
    quantity: 25,
    unit: 'шт',
    price: 8000,
    total: 200000,
  },
  {
    id: 'li1-15',
    variantId: 'var15',
    productName: 'Айран',
    brandAndVolume: 'Dolina • 1 л',
    quantity: 55,
    unit: 'шт',
    price: 11000,
    total: 605000,
  },
];

// Mock line items for Invoice #2 (Draft)
export const mockLineItemsInvoice2: InvoiceLineItem[] = [
  {
    id: 'li2-1',
    variantId: 'var20',
    productName: 'Помидоры',
    brandAndVolume: undefined,
    quantity: 120,
    unit: 'кг',
    price: 18000,
    total: 2160000,
  },
  {
    id: 'li2-2',
    variantId: 'var21',
    productName: 'Огурцы',
    brandAndVolume: undefined,
    quantity: 80,
    unit: 'кг',
    price: 15000,
    total: 1200000,
  },
  {
    id: 'li2-3',
    variantId: 'var22',
    productName: 'Картофель',
    brandAndVolume: 'Сетка 10 кг',
    quantity: 25,
    unit: 'упак',
    price: 45000,
    total: 1125000,
  },
  {
    id: 'li2-4',
    variantId: 'var23',
    productName: 'Морковь',
    brandAndVolume: undefined,
    quantity: 60,
    unit: 'кг',
    price: 12000,
    total: 720000,
  },
  {
    id: 'li2-5',
    variantId: 'var24',
    productName: 'Лук репчатый',
    brandAndVolume: undefined,
    quantity: 70,
    unit: 'кг',
    price: 8000,
    total: 560000,
  },
  {
    id: 'li2-6',
    variantId: 'var25',
    productName: 'Перец болгарский',
    brandAndVolume: undefined,
    quantity: 35,
    unit: 'кг',
    price: 28000,
    total: 980000,
  },
  {
    id: 'li2-7',
    variantId: 'var26',
    productName: 'Капуста белокочанная',
    brandAndVolume: undefined,
    quantity: 45,
    unit: 'кг',
    price: 9000,
    total: 405000,
  },
  {
    id: 'li2-8',
    variantId: 'var27',
    productName: 'Зелень (укроп, петрушка)',
    brandAndVolume: 'Пучок',
    quantity: 100,
    unit: 'шт',
    price: 2000,
    total: 200000,
  },
];

// Mock line items for Invoice #3 (Incoming Published)
export const mockLineItemsInvoice3: InvoiceLineItem[] = [
  {
    id: 'li3-1',
    variantId: 'var30',
    productName: 'Говядина',
    brandAndVolume: 'Вырезка',
    quantity: 85,
    unit: 'кг',
    price: 120000,
    total: 10200000,
  },
  {
    id: 'li3-2',
    variantId: 'var31',
    productName: 'Баранина',
    brandAndVolume: 'Лопатка',
    quantity: 65,
    unit: 'кг',
    price: 95000,
    total: 6175000,
  },
  {
    id: 'li3-3',
    variantId: 'var32',
    productName: 'Курица',
    brandAndVolume: 'Тушка охлажденная • 1.5 кг',
    quantity: 120,
    unit: 'шт',
    price: 42000,
    total: 5040000,
  },
  {
    id: 'li3-4',
    variantId: 'var33',
    productName: 'Фарш говяжий',
    brandAndVolume: undefined,
    quantity: 50,
    unit: 'кг',
    price: 85000,
    total: 4250000,
  },
  {
    id: 'li3-5',
    variantId: 'var34',
    productName: 'Колбаса вареная',
    brandAndVolume: 'Докторская • 500 г',
    quantity: 80,
    unit: 'шт',
    price: 35000,
    total: 2800000,
  },
  {
    id: 'li3-6',
    variantId: 'var35',
    productName: 'Сосиски',
    brandAndVolume: 'Молочные • 400 г',
    quantity: 95,
    unit: 'шт',
    price: 28000,
    total: 2660000,
  },
  {
    id: 'li3-7',
    variantId: 'var36',
    productName: 'Пельмени',
    brandAndVolume: 'Домашние • 800 г',
    quantity: 70,
    unit: 'шт',
    price: 32000,
    total: 2240000,
  },
  {
    id: 'li3-8',
    variantId: 'var37',
    productName: 'Шашлык маринованный',
    brandAndVolume: 'Баранина • 1 кг',
    quantity: 45,
    unit: 'упак',
    price: 110000,
    total: 4950000,
  },
];

// ==================== MOCK DETAIL DATA ====================

import type { Comment, Activity } from '@jowi/ui';

export const mockInvoiceDetails: Record<string, InvoiceDetail> = {
  '1': {
    ...mockInvoices[0],
    responsibleName: 'Азиз Юсупов',
    lineItems: mockLineItemsInvoice1,
  },
  '2': {
    ...mockInvoices[1],
    responsibleName: 'Шахноза Каримова',
    lineItems: mockLineItemsInvoice2,
  },
  '3': {
    ...mockInvoices[2],
    responsibleName: 'Бобур Рахимов',
    lineItems: mockLineItemsInvoice3,
  },
};

export const mockInvoiceComments: Record<string, Comment[]> = {
  '1': [
    {
      id: 'c1',
      userId: 'user1',
      userName: 'Азиз Юсупов',
      text: 'Проверил накладную, все позиции соответствуют заказу',
      createdAt: new Date('2025-01-15T10:00:00'),
    },
    {
      id: 'c2',
      userId: 'user2',
      userName: 'Шахноза Каримова',
      text: 'Товар принят на склад, качество отличное',
      createdAt: new Date('2025-01-15T10:20:00'),
    },
  ],
  '2': [
    {
      id: 'c3',
      userId: 'user3',
      userName: 'Бобур Рахимов',
      text: 'Ожидаем подтверждения от поставщика по ценам',
      createdAt: new Date('2025-01-16T15:00:00'),
    },
  ],
  '3': [
    {
      id: 'c4',
      userId: 'user1',
      userName: 'Азиз Юсупов',
      text: 'Накладная получена автоматически через JOWi Supplier API',
      createdAt: new Date('2025-01-14T09:00:00'),
    },
    {
      id: 'c5',
      userId: 'user2',
      userName: 'Шахноза Каримова',
      text: 'Все позиции сверены, расхождений нет',
      createdAt: new Date('2025-01-14T10:30:00'),
      updatedAt: new Date('2025-01-14T10:35:00'),
    },
  ],
};

export const mockInvoiceActivities: Record<string, Activity[]> = {
  '1': [
    {
      id: 'a1',
      type: 'created',
      userId: 'user1',
      userName: 'Азиз Юсупов',
      timestamp: new Date('2025-01-15T09:00:00'),
      description: 'Создана накладная',
    },
    {
      id: 'a2',
      type: 'updated',
      userId: 'user1',
      userName: 'Азиз Юсупов',
      timestamp: new Date('2025-01-15T09:45:00'),
      description: 'Добавлены товары в накладную',
      changes: [
        { field: 'itemsCount', oldValue: '0', newValue: '15' },
        { field: 'totalAmount', oldValue: '0', newValue: '12 500 000' },
      ],
    },
    {
      id: 'a3',
      type: 'status_changed',
      userId: 'user1',
      userName: 'Азиз Юсупов',
      timestamp: new Date('2025-01-15T10:30:00'),
      description: 'Изменен статус накладной',
      oldStatus: 'draft',
      newStatus: 'published',
    },
  ],
  '2': [
    {
      id: 'a4',
      type: 'created',
      userId: 'user2',
      userName: 'Шахноза Каримова',
      timestamp: new Date('2025-01-16T14:20:00'),
      description: 'Создана накладная',
    },
    {
      id: 'a5',
      type: 'updated',
      userId: 'user2',
      userName: 'Шахноза Каримова',
      timestamp: new Date('2025-01-16T15:45:00'),
      description: 'Обновлены позиции в накладной',
      changes: [
        { field: 'itemsCount', oldValue: '5', newValue: '8' },
        { field: 'totalAmount', oldValue: '1 800 000', newValue: '3 200 000' },
      ],
    },
  ],
  '3': [
    {
      id: 'a6',
      type: 'created',
      userId: 'system',
      userName: 'Система (JOWi Supplier API)',
      timestamp: new Date('2025-01-14T08:00:00'),
      description: 'Накладная создана автоматически через интеграцию',
    },
    {
      id: 'a7',
      type: 'status_changed',
      userId: 'system',
      userName: 'Система (JOWi Supplier API)',
      timestamp: new Date('2025-01-14T11:15:00'),
      description: 'Изменен статус накладной',
      oldStatus: 'draft',
      newStatus: 'published',
    },
  ],
};
