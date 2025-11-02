'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jowi/ui';
import {
  ArrowLeft,
  DollarSign,
  Tag,
  Receipt as ReceiptIcon,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

// Mock data types
interface MockReceiptItem {
  id: string;
  product: {
    name: string;
    variant?: string;
  };
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

interface MockPayment {
  id: string;
  method: 'cash' | 'card' | 'transfer' | 'installment';
  amount: number;
}

interface MockReceipt {
  id: string;
  receiptNumber: string;
  createdAt: Date;
  completedAt: Date | null;
  status: 'draft' | 'completed' | 'refunded';
  employee: {
    id: string;
    firstName: string;
    lastName: string;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  } | null;
  terminal: {
    id: string;
    name: string;
  };
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  comment?: string;
  items: MockReceiptItem[];
  payments: MockPayment[];
}

// Mock data
const mockReceipt: MockReceipt = {
  id: '1',
  receiptNumber: 'R-10001',
  createdAt: new Date('2025-11-03T10:30:00'),
  completedAt: new Date('2025-11-03T10:35:00'),
  status: 'completed',
  employee: {
    id: '1',
    firstName: 'Азиз',
    lastName: 'Каримов',
  },
  customer: {
    id: '1',
    firstName: 'Алишер',
    lastName: 'Усманов',
    phone: '+998 90 123 45 67',
    email: 'alisher@example.com',
  },
  terminal: {
    id: '1',
    name: 'Касса №1',
  },
  subtotal: 500000,
  discountAmount: 50000,
  taxAmount: 54000,
  total: 450000,
  comment: 'Клиент попросил упаковать отдельно',
  items: [
    {
      id: '1',
      product: { name: 'Coca-Cola', variant: '0.5л' },
      quantity: 10,
      price: 15000,
      discount: 10000,
      total: 140000,
    },
    {
      id: '2',
      product: { name: 'Хлеб', variant: 'Белый' },
      quantity: 5,
      price: 8000,
      discount: 5000,
      total: 35000,
    },
    {
      id: '3',
      product: { name: 'Молоко', variant: '1л' },
      quantity: 8,
      price: 12000,
      discount: 10000,
      total: 86000,
    },
    {
      id: '4',
      product: { name: 'Сыр', variant: 'Голландский' },
      quantity: 2,
      price: 95000,
      discount: 25000,
      total: 165000,
    },
  ],
  payments: [
    { id: '1', method: 'cash', amount: 200000 },
    { id: '2', method: 'card', amount: 250000 },
  ],
};

// Format date
function formatDate(date: Date | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function ReceiptDetailPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const storeId = params?.id as string;
  const orderId = params?.orderId as string;

  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [receipt, setReceipt] = useState<MockReceipt>(mockReceipt);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' ' + t('currency');
  };

  // Handle refund
  const handleRefund = async () => {
    setIsRefunding(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setReceipt({ ...receipt, status: 'refunded' });
    setIsRefunding(false);
    setRefundDialogOpen(false);
  };

  // Items table columns
  const itemColumns = [
    {
      key: 'product',
      label: t('pages.receipts.items.product'),
      render: (item: MockReceiptItem) => (
        <div>
          <div className="font-medium">{item.product.name}</div>
          {item.product.variant && (
            <div className="text-sm text-muted-foreground">
              {item.product.variant}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      label: t('pages.receipts.items.quantity'),
      render: (item: MockReceiptItem) => <span>{item.quantity}</span>,
    },
    {
      key: 'price',
      label: t('pages.receipts.items.price'),
      render: (item: MockReceiptItem) => (
        <span>{formatCurrency(item.price)}</span>
      ),
    },
    {
      key: 'discount',
      label: t('pages.receipts.items.discount'),
      render: (item: MockReceiptItem) => (
        <span>{formatCurrency(item.discount)}</span>
      ),
    },
    {
      key: 'total',
      label: t('pages.receipts.items.total'),
      render: (item: MockReceiptItem) => (
        <span className="font-semibold">{formatCurrency(item.total)}</span>
      ),
    },
  ];

  // Payment method translations
  const paymentMethodMap = {
    cash: t('paymentMethods.cash'),
    card: t('paymentMethods.card'),
    transfer: t('paymentMethods.transfer'),
    installment: t('paymentMethods.installment'),
  };

  // Status badge variant
  const statusVariantMap = {
    draft: 'warning' as const,
    completed: 'success' as const,
    refunded: 'destructive' as const,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/store/${storeId}/orders`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('pages.receipts.backToList')}
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('pages.receipts.receiptNumber')}
              {receipt.receiptNumber}
            </h1>
          </div>
          <Badge variant={statusVariantMap[receipt.status]}>
            {t(`pages.receipts.statuses.${receipt.status}`)}
          </Badge>
        </div>
        {receipt.status !== 'refunded' && (
          <Button
            variant="destructive"
            onClick={() => setRefundDialogOpen(true)}
          >
            {t('pages.receipts.refund.button')}
          </Button>
        )}
      </div>

      {/* Financial Data - Statistics Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.fields.subtotal')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(receipt.subtotal)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ReceiptIcon className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.fields.discount')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(receipt.discountAmount)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Tag className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.fields.tax')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(receipt.taxAmount)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.fields.total')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(receipt.total)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* About Receipt */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('pages.receipts.details.aboutReceipt')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages.receipts.fields.receiptNumber')}
            </p>
            <p className="font-medium">{receipt.receiptNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages.receipts.fields.status')}
            </p>
            <Badge variant={statusVariantMap[receipt.status]}>
              {t(`pages.receipts.statuses.${receipt.status}`)}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages.receipts.fields.createdAt')}
            </p>
            <p className="font-medium">{formatDate(receipt.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages.receipts.fields.completedAt')}
            </p>
            <p className="font-medium">{formatDate(receipt.completedAt)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages.receipts.fields.employee')}
            </p>
            <p className="font-medium">
              {receipt.employee.firstName} {receipt.employee.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages.receipts.fields.terminal')}
            </p>
            <p className="font-medium">{receipt.terminal.name}</p>
          </div>
          {receipt.comment && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.fields.comment')}
              </p>
              <p className="font-medium">{receipt.comment}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Customer Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('pages.receipts.details.customerInfo')}
        </h2>
        {receipt.customer ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('pages.receipts.fields.customer')}
                </p>
                <p className="font-medium">
                  {receipt.customer.firstName} {receipt.customer.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('fields.phone')}
                </p>
                <p className="font-medium">{receipt.customer.phone}</p>
              </div>
              {receipt.customer.email && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('fields.email')}
                  </p>
                  <p className="font-medium">{receipt.customer.email}</p>
                </div>
              )}
            </div>
            <div>
              <Link
                href={`/intranet/customers/${receipt.customer.id}`}
                target="_blank"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                {t('pages.receipts.details.viewCustomer')}
                <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            {t('pages.receipts.fields.noCustomer')}
          </p>
        )}
      </Card>

      {/* Receipt Content */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('pages.receipts.details.receiptContent')}
        </h2>
        <DataTable
          columns={itemColumns}
          data={receipt.items}
          emptyMessage={t('pages.receipts.items.noItems')}
        />
      </Card>

      {/* Payment Info */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t('pages.receipts.details.paymentInfo')}
        </h2>
        <div className="space-y-3">
          {receipt.payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline">
                  {paymentMethodMap[payment.method]}
                </Badge>
              </div>
              <span className="font-semibold">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.receipts.refund.title')}</DialogTitle>
            <DialogDescription>
              {t('pages.receipts.refund.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialogOpen(false)}
              disabled={isRefunding}
            >
              {t('pages.receipts.refund.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={isRefunding}
            >
              {isRefunding ? '...' : t('pages.receipts.refund.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
