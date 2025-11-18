'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from '@jowi/ui';
import { AlertTriangle } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  isSystem: boolean;
  productCount?: number;
};

type DeleteCategoryDialogProps = {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const { t } = useTranslation('common');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Prevent deletion of system categories
  const canDelete = !category.isSystem;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-full p-2 bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>{t('pages.categories.deleteCategory')}</DialogTitle>
          </div>
          <DialogDescription>
            {canDelete ? (
              <>
                <p className="mb-2">{t('pages.categories.confirmDelete')}</p>
                <p className="font-semibold text-foreground">{category.name}</p>
                {category.productCount && category.productCount > 0 && (
                  <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm text-warning-foreground">
                      {t('pages.categories.categoryHasProducts', {
                        count: category.productCount,
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Товары будут перемещены в категорию "Без категории"
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-4">
                <Badge variant="secondary" className="mb-2">
                  {t('pages.categories.systemCategory')}
                </Badge>
                <p className="text-foreground">
                  {t('pages.categories.cannotDeleteSystem')}
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('actions.cancel')}
          </Button>
          {canDelete && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? t('actions.deleting') : t('actions.delete')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
