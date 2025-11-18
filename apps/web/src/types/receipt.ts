export type ReceiptStatus = 'draft' | 'completed' | 'refunded' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'installment';

export type RefundReason =
  | 'customer_request'
  | 'product_defect'
  | 'wrong_item'
  | 'price_error'
  | 'other';

export type CancelReason =
  | 'cashier_error'
  | 'technical_failure'
  | 'customer_request'
  | 'fiscal_error'
  | 'other';

export interface ReceiptPayment {
  id: string;
  method: PaymentMethod;
  amount: number;
  createdAt: Date;
}

export interface ReceiptLineItem {
  id: string;
  productId: string;
  productName: string;
  productVariant?: string;
  productImage?: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  fiscalNumber?: string;
  createdAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  status: ReceiptStatus;
  employeeId: string;
  employeeName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  loyaltyCardNumber?: string;
  terminalId: string;
  terminalName: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  comment?: string;
}

export interface ReceiptDetail extends Receipt {
  items: ReceiptLineItem[];
  payments: ReceiptPayment[];
  cancelReason?: CancelReason;
  cancelComment?: string;
  cancelledBy?: string;
}

export interface ItemRefundData {
  itemId: string;
  quantityToRefund: number;
  reason: RefundReason;
  comment?: string;
}

export interface ReceiptRefundData {
  items: ItemRefundData[];
  reason: RefundReason;
  comment?: string;
}

// Mock data
export const mockReceiptDetails: ReceiptDetail = {
  id: '1',
  receiptNumber: 'R-2025-001234',
  fiscalNumber: 'FD-9876543210',
  createdAt: new Date('2025-11-17T14:30:00'),
  completedAt: new Date('2025-11-17T14:32:15'),
  cancelledAt: null,
  status: 'completed',
  employeeId: '1',
  employeeName: 'Иванова Мария Петровна',
  customerId: '1',
  customerName: 'Петров Иван Сергеевич',
  customerPhone: '+998 90 123 45 67',
  loyaltyCardNumber: 'LC-000012345',
  terminalId: '1',
  terminalName: 'Касса №1',
  subtotal: 450000,
  discountAmount: 45000,
  taxAmount: 40500,
  total: 445500,
  comment: 'Скидка по карте лояльности 10%',
  items: [
    {
      id: '1',
      productId: 'p1',
      productName: 'Coca-Cola',
      productVariant: '1.5л',
      productImage: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=100&h=100&fit=crop',
      barcode: '4607152820148',
      quantity: 2,
      unitPrice: 15000,
      discountPercent: 10,
      discountAmount: 3000,
      subtotal: 30000,
      taxRate: 10,
      taxAmount: 2700,
      total: 29700,
    },
    {
      id: '2',
      productId: 'p2',
      productName: 'Молоко "Чимган"',
      productVariant: '1л, 3.2%',
      productImage: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop',
      barcode: '8690504205012',
      quantity: 3,
      unitPrice: 12000,
      discountPercent: 10,
      discountAmount: 3600,
      subtotal: 36000,
      taxRate: 10,
      taxAmount: 3240,
      total: 35640,
    },
    {
      id: '3',
      productId: 'p3',
      productName: 'Хлеб "Столичный"',
      productVariant: '500г',
      productImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop',
      barcode: '4870009000016',
      quantity: 5,
      unitPrice: 8000,
      discountPercent: 10,
      discountAmount: 4000,
      subtotal: 40000,
      taxRate: 10,
      taxAmount: 3600,
      total: 39600,
    },
    {
      id: '4',
      productId: 'p4',
      productName: 'Яйца куриные',
      productVariant: '10шт, C1',
      productImage: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100&h=100&fit=crop',
      barcode: '4870123456789',
      quantity: 2,
      unitPrice: 25000,
      discountPercent: 10,
      discountAmount: 5000,
      subtotal: 50000,
      taxRate: 10,
      taxAmount: 4500,
      total: 49500,
    },
    {
      id: '5',
      productId: 'p5',
      productName: 'Масло подсолнечное "Семейное"',
      productVariant: '1л',
      productImage: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100&h=100&fit=crop',
      barcode: '4870009876543',
      quantity: 1,
      unitPrice: 35000,
      discountPercent: 10,
      discountAmount: 3500,
      subtotal: 35000,
      taxRate: 10,
      taxAmount: 3150,
      total: 34650,
    },
    {
      id: '6',
      productId: 'p6',
      productName: 'Рис "Лазер"',
      productVariant: '1кг, премиум',
      productImage: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop',
      barcode: '4870123123123',
      quantity: 2,
      unitPrice: 18000,
      discountPercent: 10,
      discountAmount: 3600,
      subtotal: 36000,
      taxRate: 10,
      taxAmount: 3240,
      total: 35640,
    },
    {
      id: '7',
      productId: 'p7',
      productName: 'Сахар',
      productVariant: '1кг',
      productImage: 'https://images.unsplash.com/photo-1514519148915-294ca2e25ca5?w=100&h=100&fit=crop',
      barcode: '4870009111111',
      quantity: 3,
      unitPrice: 12000,
      discountPercent: 10,
      discountAmount: 3600,
      subtotal: 36000,
      taxRate: 10,
      taxAmount: 3240,
      total: 35640,
    },
    {
      id: '8',
      productId: 'p8',
      productName: 'Чай "Ахмад"',
      productVariant: '100г, черный',
      productImage: 'https://images.unsplash.com/photo-1597318112572-00f3ddddde63?w=100&h=100&fit=crop',
      barcode: '5014176501013',
      quantity: 1,
      unitPrice: 28000,
      discountPercent: 10,
      discountAmount: 2800,
      subtotal: 28000,
      taxRate: 10,
      taxAmount: 2520,
      total: 27720,
    },
    {
      id: '9',
      productId: 'p9',
      productName: 'Макароны "Макфа"',
      productVariant: '450г, спагетти',
      productImage: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=100&h=100&fit=crop',
      barcode: '4601686008019',
      quantity: 2,
      unitPrice: 9000,
      discountPercent: 10,
      discountAmount: 1800,
      subtotal: 18000,
      taxRate: 10,
      taxAmount: 1620,
      total: 17820,
    },
    {
      id: '10',
      productId: 'p10',
      productName: 'Кофе "Жокей"',
      productVariant: '100г, молотый',
      productImage: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=100&h=100&fit=crop',
      barcode: '4607001730019',
      quantity: 1,
      unitPrice: 45000,
      discountPercent: 10,
      discountAmount: 4500,
      subtotal: 45000,
      taxRate: 10,
      taxAmount: 4050,
      total: 44550,
    },
  ],
  payments: [
    {
      id: '1',
      method: 'card',
      amount: 300000,
      createdAt: new Date('2025-11-17T14:32:10'),
    },
    {
      id: '2',
      method: 'cash',
      amount: 145500,
      createdAt: new Date('2025-11-17T14:32:15'),
    },
  ],
};

/**
 * BUSINESS LOGIC: Receipt Activity History
 *
 * Rules for logging receipt activities:
 * 1. Draft status:
 *    - First event: Receipt creation with "draft" status
 *    - Editing (adding items, discounts, etc.) is NOT logged
 *    - Draft receipts can be deleted completely from database
 *
 * 2. Completed status:
 *    - Transition from "draft" to "completed" is logged
 *    - ALL subsequent changes are logged:
 *      - Item refunds (partial returns)
 *      - Receipt cancellation
 *    - Completed receipts CANNOT be deleted, only cancelled (soft delete)
 *
 * 3. Events to log:
 *    - Receipt creation (draft)
 *    - Receipt completion (draft → completed)
 *    - Item refunds (after completion)
 *    - Receipt cancellation (after completion)
 */
export const mockReceiptActivities = [
  {
    id: '1',
    type: 'created' as const,
    userId: '1',
    userName: 'Иванова М.П.',
    timestamp: new Date('2025-11-17T14:30:00'),
    description: 'Чек создан',
    oldStatus: '',
    newStatus: 'Черновик',
  },
  {
    id: '2',
    type: 'status_changed' as const,
    userId: '1',
    userName: 'Иванова М.П.',
    timestamp: new Date('2025-11-17T14:32:15'),
    description: 'Чек завершён и фискализирован (FD-9876543210)',
    oldStatus: 'Черновик',
    newStatus: 'Завершен',
  },
];
