'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Receipt, User, CreditCard, Calendar, Monitor, FileText, Ban, Phone, Info } from 'lucide-react';
import { Button, Card, StatusBadge, DataTable, ActivityHistory, Checkbox, Badge, Avatar, type Column } from '@jowi/ui';
import { mockReceiptDetails, mockReceiptActivities } from '@/types/receipt';
import type { ReceiptLineItem } from '@/types/receipt';
import { CancelReceiptDialog } from './cancel-receipt-dialog';
import { RefundItemsDialog } from './refund-items-dialog';

export default function ReceiptDetailPage() {
  const params = useParams();
  const { t } = useTranslation('common');
  const storeId = params.id as string;
  const receiptId = params.receiptId as string;

  // In real app, fetch receipt data based on receiptId
  const receipt = mockReceiptDetails;
  const activities = mockReceiptActivities;

  const [selectedItems, setSelectedItems] = useState<ReceiptLineItem[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const handleCancelReceipt = async (reason: string, comment?: string) => {
    console.log('Cancelling receipt:', { reason, comment });
    // Implement cancel logic
  };

  const handleRefundItems = async (refundData: any) => {
    console.log('Refunding items:', refundData);
    // Implement refund logic
  };

  const handleSelectItem = (item: ReceiptLineItem, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter((i) => i.id !== item.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(receipt.items);
    } else {
      setSelectedItems([]);
    }
  };

  // Format date as "17 ноября 2025, 14:30:00"
  const formatDateTime = (date: Date | string) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
    return d.toLocaleString('ru-RU', options);
  };

  const columns: Column<ReceiptLineItem & { _selectCheckbox?: boolean; _image?: boolean }>[] = [
    {
      key: '_selectCheckbox',
      label: '',
      render: (item) => (
        <Checkbox
          checked={selectedItems.some((i) => i.id === item.id)}
          onCheckedChange={(value) => handleSelectItem(item, !!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      key: '_image',
      label: '',
      render: (item) => (
        <Avatar
          src={item.productImage}
          alt={item.productName}
          fallback={item.productName.substring(0, 2).toUpperCase()}
          className="h-10 w-10 rounded-md"
        />
      ),
    },
    {
      key: 'productName',
      label: t('pages.receipts.items.product'),
      render: (item) => (
        <div>
          <p className="font-medium">{item.productName}</p>
          {item.productVariant && (
            <p className="text-sm text-muted-foreground">{item.productVariant}</p>
          )}
          {item.barcode && (
            <p className="text-xs text-muted-foreground font-mono">{item.barcode}</p>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'quantity',
      label: t('pages.receipts.items.quantity'),
      render: (item) => <span className="font-medium">{item.quantity}</span>,
      sortable: true,
    },
    {
      key: 'unitPrice',
      label: t('pages.receipts.items.price'),
      render: (item) => (
        <div>
          <p className="font-medium">{item.unitPrice.toLocaleString()} {t('currency')}</p>
          <p className="text-sm text-muted-foreground">
            {item.discountAmount ? (
              <>
                -{item.discountAmount.toLocaleString()} {t('currency')}
                {item.discountPercent > 0 && (
                  <span className="ml-1">({item.discountPercent}%)</span>
                )}
              </>
            ) : (
              '—'
            )}
          </p>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'total',
      label: t('pages.receipts.items.total'),
      render: (item) => (
        <span className="font-bold">
          {item.total.toLocaleString()} {t('currency')}
        </span>
      ),
      sortable: true,
    },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'refunded':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    return t(`paymentMethods.${method}`);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'transfer':
        return '🏦';
      case 'installment':
        return '📊';
      default:
        return '💰';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Link href={`/store/${storeId}/receipts`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Receipt Information Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{receipt.receiptNumber}</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {t('pages.receipts.fields.status')}:
                    </span>
                  </div>
                  <StatusBadge variant={getStatusVariant(receipt.status)}>
                    {t(`pages.receipts.statuses.${receipt.status}`)}
                  </StatusBadge>
                </div>

                {receipt.fiscalNumber && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {t('pages.receipts.fields.fiscalNumber')}:
                      </span>
                    </div>
                    <span className="font-medium font-mono text-sm">{receipt.fiscalNumber}</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {t('pages.receipts.fields.createdAt')}:
                    </span>
                  </div>
                  <span className="font-medium text-right">
                    {formatDateTime(receipt.createdAt)}
                  </span>
                </div>

                {receipt.completedAt && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {t('pages.receipts.fields.completedAt')}:
                      </span>
                    </div>
                    <span className="font-medium text-right">
                      {formatDateTime(receipt.completedAt)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {t('pages.receipts.fields.employee')}:
                    </span>
                  </div>
                  <span className="font-medium text-right">{receipt.employeeName}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {t('pages.receipts.fields.terminal')}:
                    </span>
                  </div>
                  <span className="font-medium text-right">{receipt.terminalName}</span>
                </div>

                {receipt.comment && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t('pages.receipts.fields.comment')}:
                    </p>
                    <p className="text-sm">{receipt.comment}</p>
                  </div>
                )}
              </div>

              {receipt.status === 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  {t('pages.receipts.cancel.button')}
                </Button>
              )}
            </div>
          </Card>

          {/* Customer Information Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t('pages.receipts.details.customerInfo')}
            </h3>
            {receipt.customerId ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {t('pages.receipts.fields.customer')}:
                    </span>
                  </div>
                  <span className="font-medium text-right">{receipt.customerName}</span>
                </div>

                {receipt.customerPhone && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {t('pages.receipts.fields.customerPhone')}:
                      </span>
                    </div>
                    <span className="font-medium font-mono text-right">{receipt.customerPhone}</span>
                  </div>
                )}

                {receipt.loyaltyCardNumber && (
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground">
                        {t('pages.receipts.fields.loyaltyCard')}:
                      </span>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {receipt.loyaltyCardNumber}
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('pages.receipts.fields.noCustomer')}
              </p>
            )}
          </Card>

          {/* Payment Details Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('pages.receipts.details.paymentInfo')}</h3>
            <div className="space-y-2">
              {receipt.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{getPaymentMethodIcon(payment.method)}</span>
                    <span>{getPaymentMethodLabel(payment.method)}</span>
                  </div>
                  <span className="font-medium">
                    {payment.amount.toLocaleString()} {t('currency')}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* History */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t('pages.receipts.history.title')}
            </h3>
            <ActivityHistory activities={activities} />
          </Card>
        </div>

        {/* Right Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('pages.receipts.fields.subtotal')}</p>
                <p className="text-lg font-bold">
                  {receipt.subtotal.toLocaleString()} {t('currency')}
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('pages.receipts.fields.discount')}</p>
                <p className="text-lg font-bold text-destructive">
                  -{receipt.discountAmount.toLocaleString()} {t('currency')}
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('pages.receipts.fields.tax')}</p>
                <p className="text-lg font-bold">
                  {receipt.taxAmount.toLocaleString()} {t('currency')}
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t('pages.receipts.fields.total')}</p>
                <p className="text-lg font-bold text-primary">
                  {receipt.total.toLocaleString()} {t('currency')}
                </p>
              </div>
            </Card>
          </div>

          {/* Items Table Card */}
          <Card>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {t('pages.receipts.details.receiptContent')}
                </h3>
                {selectedItems.length > 0 && (
                  <Button onClick={() => setRefundDialogOpen(true)}>
                    {t('pages.receipts.refundItems.button')} ({selectedItems.length})
                  </Button>
                )}
              </div>
            </div>
            <div className="p-0">
              <DataTable
                columns={columns}
                data={receipt.items}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <CancelReceiptDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancelReceipt}
        receiptNumber={receipt.receiptNumber}
      />

      <RefundItemsDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        onConfirm={handleRefundItems}
        selectedItems={selectedItems}
      />
    </div>
  );
}
