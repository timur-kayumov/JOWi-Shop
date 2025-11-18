'use client';

import { useTranslation } from 'react-i18next';
import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Checkbox,
  Badge,
} from '@jowi/ui';
import { Search, AlertCircle } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  sku: string;
  categoryId?: string;
  categoryName?: string;
  price: number;
};

type AddProductsDialogProps = {
  currentCategoryId: string;
  currentCategoryName: string;
  products: Product[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttach: (productIds: string[]) => void;
};

export function AddProductsDialog({
  currentCategoryId,
  currentCategoryName,
  products,
  open,
  onOpenChange,
  onAttach,
}: AddProductsDialogProps) {
  const { t } = useTranslation('common');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
    new Set()
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return products;
    }

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleToggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProductIds(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedProductIds.size === filteredProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleAttach = async () => {
    if (selectedProductIds.size === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAttach(Array.from(selectedProductIds));
      setSelectedProductIds(new Set());
      setSearchQuery('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to attach products:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedProductIds(new Set());
    setSearchQuery('');
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const selectedCount = selectedProductIds.size;
  const hasProductsWithOtherCategory = Array.from(selectedProductIds).some(
    (id) => {
      const product = products.find((p) => p.id === id);
      return product && product.categoryId && product.categoryId !== currentCategoryId;
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('pages.categories.addProducts')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('pages.categories.searchProducts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected count */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <span className="text-sm font-medium">
                {t('pages.categories.productsSelected', { count: selectedCount })}
              </span>
              {hasProductsWithOtherCategory && (
                <div className="flex items-center gap-1 text-warning">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {t('pages.categories.categoryWillChange')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Products Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted/50 sticky top-0 z-10">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left w-12">
                      <Checkbox
                        checked={
                          filteredProducts.length > 0 &&
                          selectedProductIds.size === filteredProducts.length
                        }
                        onCheckedChange={handleToggleAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t('fields.name')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t('fields.sku')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      {t('pages.categories.currentCategory')}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      {t('fields.price')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        {searchQuery.trim()
                          ? t('globalSearch.noResults')
                          : t('pages.categories.noProducts')}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const isSelected = selectedProductIds.has(product.id);
                      const hasOtherCategory =
                        product.categoryId &&
                        product.categoryId !== currentCategoryId;

                      return (
                        <tr
                          key={product.id}
                          className="border-b hover:bg-muted/30 cursor-pointer"
                          onClick={() => handleToggleProduct(product.id)}
                        >
                          <td className="px-4 py-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleProduct(product.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{product.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {product.sku}
                          </td>
                          <td className="px-4 py-3">
                            {product.categoryName ? (
                              <Badge
                                variant={hasOtherCategory ? 'warning' : 'secondary'}
                              >
                                {product.categoryName}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t('pages.categories.noCategory')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(product.price)} {t('currency')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="button"
            onClick={handleAttach}
            disabled={isSubmitting || selectedCount === 0}
          >
            {isSubmitting
              ? t('actions.saving')
              : t('pages.categories.attachProducts')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
