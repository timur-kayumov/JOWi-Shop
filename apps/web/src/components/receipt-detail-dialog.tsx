'use client';

import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
} from '@jowi/ui';
import { Store, User, Monitor, ExternalLink } from 'lucide-react';
import Image from 'next/image';

type ReceiptDetailDialogProps = {
  receipt: any; // Will be typed properly
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReceiptDetailDialog({
  receipt,
  open,
  onOpenChange,
}: ReceiptDetailDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (!receipt) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'destructive' | 'warning'> = {
      draft: 'default',
      completed: 'success',
      refunded: 'destructive',
      partially_refunded: 'warning',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {t(`status.${status}`)}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: t('paymentMethods.cash'),
      card: t('paymentMethods.card'),
      transfer: t('paymentMethods.transfer'),
      installment: t('paymentMethods.installment'),
    };
    return labels[method] || method;
  };

  const handleGoToReceipt = () => {
    window.open(`/store/${receipt.storeId}/receipts/${receipt.id}`, '_blank');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {t('pages.customerDetail.receiptNumber')}
              {receipt.receiptNumber}
            </DialogTitle>
            {getStatusBadge(receipt.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('fields.date')}
              </p>
              <p className="font-medium">{formatDateTime(receipt.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.customerDetail.store')}
              </p>
              <div className="flex items-center gap-1">
                <Store className="h-4 w-4" />
                <p className="font-medium">{receipt.store.name}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.customerDetail.cashier')}
              </p>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <p className="font-medium">
                  {receipt.employee.user.firstName}{' '}
                  {receipt.employee.user.lastName}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.customerDetail.terminal')}
              </p>
              <div className="flex items-center gap-1">
                <Monitor className="h-4 w-4" />
                <p className="font-medium">{receipt.terminal.name}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="font-semibold mb-3">
              {t('pages.customerDetail.itemsTable.name')}
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">
                      {t('pages.customerDetail.itemsTable.image')}
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      {t('pages.customerDetail.itemsTable.name')}
                    </th>
                    <th className="text-left p-3 text-sm font-medium">
                      {t('pages.customerDetail.itemsTable.sku')}
                    </th>
                    <th className="text-right p-3 text-sm font-medium">
                      {t('pages.customerDetail.itemsTable.quantity')}
                    </th>
                    <th className="text-right p-3 text-sm font-medium">
                      {t('pages.customerDetail.itemsTable.unitPrice')}
                    </th>
                    <th className="text-right p-3 text-sm font-medium">
                      {t('pages.customerDetail.itemsTable.discount')}
                    </th>
                    <th className="text-right p-3 text-sm font-medium">
                      {t('pages.customerDetail.itemsTable.total')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        {item.variant.product.imageUrl ? (
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-muted">
                            <Image
                              src={item.variant.product.imageUrl}
                              alt={item.variant.product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-medium">
                          {item.variant.product.name}
                        </p>
                        {item.variant.name && (
                          <p className="text-sm text-muted-foreground">
                            {item.variant.name}
                          </p>
                        )}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {item.variant.sku}
                      </td>
                      <td className="p-3 text-right">
                        {Number(item.quantity)} {item.variant.unit || 'шт'}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(Number(item.price))} {t('currency')}
                      </td>
                      <td className="p-3 text-right">
                        {Number(item.discountAmount) > 0
                          ? `${formatCurrency(Number(item.discountAmount))} ${t('currency')}`
                          : '-'}
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatCurrency(Number(item.total))} {t('currency')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t('pages.customerDetail.subtotal')}:
              </span>
              <span className="font-medium">
                {formatCurrency(Number(receipt.subtotal))} {t('currency')}
              </span>
            </div>
            {Number(receipt.discountAmount) > 0 && (
              <div className="flex justify-between text-destructive">
                <span>{t('pages.customerDetail.discount')}:</span>
                <span>
                  -{formatCurrency(Number(receipt.discountAmount))}{' '}
                  {t('currency')}
                </span>
              </div>
            )}
            {Number(receipt.taxAmount) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t('pages.customerDetail.tax')}:
                </span>
                <span>
                  {formatCurrency(Number(receipt.taxAmount))} {t('currency')}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>{t('pages.customerDetail.total')}:</span>
              <span>
                {formatCurrency(Number(receipt.total))} {t('currency')}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h3 className="font-semibold mb-2">
              {t('pages.customerDetail.paymentMethods')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {receipt.payments.map((payment: any, index: number) => (
                <Badge key={index} variant="outline">
                  {getPaymentMethodLabel(payment.method)}:{' '}
                  {formatCurrency(Number(payment.amount))} {t('currency')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Comments */}
          {receipt.comment && (
            <div>
              <h3 className="font-semibold mb-2">
                {t('pages.customerDetail.comments')}
              </h3>
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded">
                {receipt.comment}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleGoToReceipt}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('pages.customerDetail.goToReceipt')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
