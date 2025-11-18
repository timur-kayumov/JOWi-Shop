import { z } from 'zod';

/**
 * Supplier entity type
 */
export type SupplierEntityType = 'individual' | 'legal';

/**
 * Supplier interface
 */
export interface Supplier {
  id: string;
  name: string;
  entityType: SupplierEntityType;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;

  // Legal entity fields (optional, only for legal type)
  legalName?: string;
  bankAccount?: string;
  inn?: string; // ИНН/ПИНФЛ
  mfo?: string; // МФО (bank code)
  bankName?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Zod schema for creating/editing supplier
 */
export const createSupplierSchema = z
  .object({
    name: z
      .string()
      .min(2, 'documents.suppliers.validation.nameMin')
      .max(100, 'documents.suppliers.validation.nameMax'),

    entityType: z.enum(['individual', 'legal']),

    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\+998\d{9}$/.test(val.replace(/[\s-]/g, '')),
        'documents.suppliers.validation.phoneInvalid'
      ),

    email: z
      .string()
      .email('documents.suppliers.validation.emailInvalid')
      .optional()
      .or(z.literal('')),

    address: z.string().optional(),

    startingBalance: z.number().default(0),

    // Legal entity fields
    legalName: z.string().optional(),
    bankAccount: z.string().optional(),
    inn: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{9,14}$/.test(val),
        'documents.suppliers.validation.innInvalid'
      ),
    mfo: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{5}$/.test(val),
        'documents.suppliers.validation.mfoInvalid'
      ),
    bankName: z.string().optional(),
  })
  .refine(
    (data) => {
      // If legal entity, require legal name
      if (data.entityType === 'legal' && !data.legalName) {
        return false;
      }
      return true;
    },
    {
      message: 'Legal name is required for legal entities',
      path: ['legalName'],
    }
  );

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

/**
 * Mock supplier data for development
 */
export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'ООО "Продукты Опт"',
    entityType: 'legal',
    phone: '+998901234567',
    email: 'info@produkty-opt.uz',
    address: 'Ташкент, ул. Узбекистанская, 1',
    balance: -5420000, // We owe them money
    legalName: 'ООО "Продукты Опт"',
    bankAccount: '20208000000000000001',
    inn: '123456789',
    mfo: '00123',
    bankName: 'Асака банк',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-11-10'),
  },
  {
    id: '2',
    name: 'ИП Иванов Петр',
    entityType: 'individual',
    phone: '+998907654321',
    email: 'ivanov@mail.ru',
    address: 'Ташкент, ул. Мустакиллик, 45',
    balance: 0,
    inn: '987654321',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-10-05'),
  },
  {
    id: '3',
    name: 'ООО "Напитки Плюс"',
    entityType: 'legal',
    phone: '+998901122334',
    email: 'sales@napitki-plus.uz',
    address: 'Ташкент, ул. Шота Руставели, 12',
    balance: 1250000, // They owe us money
    legalName: 'ООО "Напитки Плюс"',
    bankAccount: '20208000000000000002',
    inn: '111222333',
    mfo: '00456',
    bankName: 'Узнацбанк',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-11-12'),
  },
  {
    id: '4',
    name: 'ООО "Мясокомбинат"',
    entityType: 'legal',
    phone: '+998905556677',
    email: 'myaso@kombinat.uz',
    address: 'Ташкент, ул. Бабура, 78',
    balance: -2300000,
    legalName: 'ООО "Мясокомбинат Ташкент"',
    bankAccount: '20208000000000000003',
    inn: '444555666',
    mfo: '00789',
    bankName: 'Ипотека банк',
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-11-08'),
  },
  {
    id: '5',
    name: 'ИП Ахмедова Дилафруз',
    entityType: 'individual',
    phone: '+998909998877',
    email: 'ahmeda@gmail.com',
    address: 'Ташкент, ул. Амира Темура, 23',
    balance: 500000,
    inn: '777888999',
    createdAt: new Date('2024-05-12'),
    updatedAt: new Date('2024-10-22'),
  },
  {
    id: '6',
    name: 'ООО "Молочный Мир"',
    entityType: 'legal',
    phone: '+998903334455',
    email: 'info@moloko-mir.uz',
    address: 'Ташкент, ул. Фараби, 56',
    balance: -890000,
    legalName: 'ООО "Молочный Мир"',
    bankAccount: '20208000000000000004',
    inn: '222333444',
    mfo: '01111',
    bankName: 'Хамкорбанк',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-11-15'),
  },
  {
    id: '7',
    name: 'ООО "Свежие Овощи"',
    entityType: 'legal',
    phone: '+998906667788',
    email: 'veggies@fresh.uz',
    address: 'Ташкент, ул. Юнусабад, 9',
    balance: 0,
    legalName: 'ООО "Свежие Овощи и Фрукты"',
    bankAccount: '20208000000000000005',
    inn: '555666777',
    mfo: '01234',
    bankName: 'Туронбанк',
    createdAt: new Date('2024-07-18'),
    updatedAt: new Date('2024-11-01'),
  },
];
