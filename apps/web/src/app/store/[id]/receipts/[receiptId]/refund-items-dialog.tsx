'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Textarea,
  Button,
  Input,
} from '@jowi/ui';
import { Package, AlertCircle } from 'lucide-react';
import type { ReceiptLineItem, RefundReason, ItemRefundData } from '@/types/receipt';

interface RefundItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (refundData: {
    items: ItemRefundData[];
    reason: RefundReason;
    comment?: string;
  }) => void;
  selectedItems: ReceiptLineItem[];
}

const refundReasons: RefundReason[] = [
  'customer_request',
  'product_defect',
  'wrong_item',
  'price_error',
  'other',
];

export function RefundItemsDialog({
  open,
  onOpenChange,
  onConfirm,
  selectedItems,
}: RefundItemsDialogProps) {
  const { t } = useTranslation('common');
  const [reason, setReason] = useState<RefundReason | ''>('');
  const [comment, setComment] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize quantities when dialog opens
  useMemo(() => {
    const initialQuantities: Record<string, number> = {};
    selectedItems.forEach((item) => {
      initialQuantities[item.id] = item.quantity;
    });
    setQuantities(initialQuantities);
  }, [selectedItems]);

  const totalRefundAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const qty = quantities[item.id] || 0;
      const itemTotal = (item.total / item.quantity) * qty;
      return sum + itemTotal;
    }, 0);
  }, [selectedItems, quantities]);

  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    const item = selectedItems.find((i) => i.id === itemId);
    if (!item) return;

    const maxQty = item.quantity;
    const finalValue = Math.min(Math.max(0, numValue), maxQty);
    setQuantities((prev) => ({ ...prev, [itemId]: finalValue }));
  };

  const handleConfirm = async () => {
    if (!reason) return;

    const items: ItemRefundData[] = selectedItems
      .map((item) => ({
        itemId: item.id,
        quantityToRefund: quantities[item.id] || 0,
        reason,
        comment: comment || undefined,
      }))
      .filter((item) => item.quantityToRefund > 0);

    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      await onConfirm({ items, reason, comment: comment || undefined });
      setReason('');
      setComment('');
      setQuantities({});
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to refund items:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validItemsCount = useMemo(() => {
    return Object.values(quantities).filter((q) => q > 0).length;
  }, [quantities]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {t('pages.receipts.refundItems.title')}
          </DialogTitle>
          <DialogDescription>
            {t('pages.receipts.refundItems.message')} ({t('pages.receipts.refundItems.selectedItems')}: {selectedItems.length})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Items list with quantity inputs */}
          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName}</p>
                  {item.productVariant && (
                    <p className="text-xs text-muted-foreground">{item.productVariant}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t('pages.receipts.refundItems.maxQuantity')}: {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`qty-${item.id}`} className="text-xs whitespace-nowrap">
                    {t('pages.receipts.refundItems.quantity')}:
                  </Label>
                  <Input
                    id={`qty-${item.id}`}
                    type="number"
                    min="0"
                    max={item.quantity}
                    value={quantities[item.id] || ''}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    className="w-20"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Reason select */}
          <div className="space-y-2">
            <Label htmlFor="refund-reason">
              {t('pages.receipts.refundItems.reason')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select value={reason} onValueChange={(value) => setReason(value as RefundReason)}>
              <SelectTrigger id="refund-reason">
                <SelectValue placeholder={t('pages.receipts.refundItems.reasonPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {refundReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`pages.receipts.refundReasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comment textarea */}
          <div className="space-y-2">
            <Label htmlFor="refund-comment">{t('pages.receipts.refundItems.comment')}</Label>
            <Textarea
              id="refund-comment"
              placeholder={t('pages.receipts.refundItems.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Total refund amount */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-primary/5">
            <span className="font-medium">{t('pages.receipts.refundItems.totalRefund')}:</span>
            <span className="text-lg font-bold">
              {totalRefundAmount.toLocaleString()} {t('currency')}
            </span>
          </div>

          {validItemsCount === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">
                {t('pages.receipts.refundItems.message')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('pages.receipts.refundItems.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason || validItemsCount === 0 || isSubmitting}
          >
            {isSubmitting ? t('common.loading') : t('pages.receipts.refundItems.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
