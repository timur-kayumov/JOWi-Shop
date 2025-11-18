'use client';

import { useState } from 'react';
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
} from '@jowi/ui';
import { AlertCircle } from 'lucide-react';
import type { CancelReason } from '@/types/receipt';

interface CancelReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: CancelReason, comment?: string) => void;
  receiptNumber: string;
}

const cancelReasons: CancelReason[] = [
  'cashier_error',
  'technical_failure',
  'customer_request',
  'fiscal_error',
  'other',
];

export function CancelReceiptDialog({
  open,
  onOpenChange,
  onConfirm,
  receiptNumber,
}: CancelReceiptDialogProps) {
  const { t } = useTranslation('common');
  const [reason, setReason] = useState<CancelReason | ''>('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason) return;

    setIsSubmitting(true);
    try {
      await onConfirm(reason, comment || undefined);
      setReason('');
      setComment('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to cancel receipt:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {t('pages.receipts.cancel.title')}
          </DialogTitle>
          <DialogDescription>
            {t('pages.receipts.cancel.message')} ({receiptNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">
              {t('pages.receipts.cancel.reason')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select value={reason} onValueChange={(value) => setReason(value as CancelReason)}>
              <SelectTrigger id="cancel-reason">
                <SelectValue placeholder={t('pages.receipts.cancel.reasonPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {cancelReasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`pages.receipts.cancelReasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-comment">{t('pages.receipts.cancel.comment')}</Label>
            <Textarea
              id="cancel-comment"
              placeholder={t('pages.receipts.cancel.commentPlaceholder')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('pages.receipts.cancel.cancelButton')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason || isSubmitting}
          >
            {isSubmitting ? t('common.loading') : t('pages.receipts.cancel.confirmButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
