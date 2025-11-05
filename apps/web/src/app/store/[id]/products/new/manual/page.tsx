'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, Check, Clock } from 'lucide-react';
import {
  Button,
  Card,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ImageUpload,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CategoryBadge } from '@/components/category-badge';
import { toast } from '@/lib/toast';

// Simplified schema for manual product creation
const manualProductSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  price: z.string().min(1, 'Цена обязательна'),
  cost: z.string().min(1, 'Себестоимость обязательна'),
  sku: z.string().min(1, 'Артикул обязателен'),
  barcode: z.string().optional(),
  unit: z.string().default('шт'),
  imageUrl: z.string().optional(),
  taxRate: z.string().default('0'),
});

type ManualProductSchema = z.infer<typeof manualProductSchema>;

interface ProductDraft extends ManualProductSchema {
  id: string;
  isComplete: boolean;
}

const mockCategories = [
  { id: '1', name: 'Напитки', icon: 'Coffee', color: '#3B82F6' },
  { id: '2', name: 'Молочные продукты', icon: 'Milk', color: '#06B6D4' },
  { id: '3', name: 'Мясо и рыба', icon: 'Beef', color: '#EF4444' },
  { id: '4', name: 'Хлеб и выпечка', icon: 'Cookie', color: '#F97316' },
  { id: '5', name: 'Фрукты и овощи', icon: 'Apple', color: '#10B981' },
  { id: '6', name: 'Крупы', icon: 'Wheat', color: '#F59E0B' },
  { id: '7', name: 'Сладости', icon: 'Candy', color: '#EC4899' },
];

const defaultProduct: Omit<ProductDraft, 'id' | 'isComplete'> = {
  name: '',
  categoryId: '',
  price: '',
  cost: '',
  sku: '',
  barcode: '',
  unit: 'шт',
  imageUrl: '',
  taxRate: '0',
};

export default function ManualProductPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const storeId = params.id as string;

  const [products, setProducts] = useState<ProductDraft[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<ManualProductSchema>({
    resolver: zodResolver(manualProductSchema),
    mode: 'onChange',
    defaultValues: defaultProduct,
  });

  // Check if product is complete (all required fields filled)
  const checkProductComplete = (product: Partial<ManualProductSchema>): boolean => {
    return !!(
      product.name &&
      product.categoryId &&
      product.price &&
      product.cost &&
      product.sku
    );
  };

  // Auto-save current form data to products array
  const autoSaveCurrentProduct = useCallback(() => {
    if (!selectedProductId) return;

    const formData = form.getValues();
    const isComplete = checkProductComplete(formData);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProductId
          ? { ...formData, id: p.id, isComplete }
          : p
      )
    );
  }, [selectedProductId, form]);

  // Add new product to the list (at the top)
  const handleAddProduct = () => {
    // Clear any pending debounced saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Auto-save current product first (synchronously)
    if (selectedProductId) {
      const formData = form.getValues();
      const isComplete = checkProductComplete(formData);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProductId
            ? { ...formData, id: p.id, isComplete }
            : p
        )
      );
    }

    const newProduct: ProductDraft = {
      ...defaultProduct,
      id: crypto.randomUUID(),
      isComplete: false,
    };

    // Add to beginning of array (will appear at top when reversed)
    setProducts((prev) => [newProduct, ...prev]);
    setSelectedProductId(newProduct.id);
    form.reset(defaultProduct);
  };

  // Select a product from the list
  const handleSelectProduct = (productId: string) => {
    if (selectedProductId === productId) return;

    // Clear any pending debounced saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Auto-save current product before switching (synchronously)
    if (selectedProductId) {
      const formData = form.getValues();
      const isComplete = checkProductComplete(formData);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProductId
            ? { ...formData, id: p.id, isComplete }
            : p
        )
      );
    }

    const product = products.find((p) => p.id === productId);
    if (product) {
      const { id, isComplete, ...formData } = product;
      form.reset(formData);
      setSelectedProductId(productId);
    }
  };

  // Delete product from list
  const handleDeleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));

    // If deleted product was selected, select another one
    if (selectedProductId === productId) {
      const remaining = products.filter((p) => p.id !== productId);
      if (remaining.length > 0) {
        const next = remaining[0];
        const { id, isComplete, ...formData } = next;
        setSelectedProductId(next.id);
        form.reset(formData);
      } else {
        setSelectedProductId(null);
        form.reset(defaultProduct);
      }
    }
  };

  // Save all products to database
  const handleSaveAll = async () => {
    // Clear any pending debounced saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Auto-save current product first (synchronously)
    if (selectedProductId) {
      const formData = form.getValues();
      const isComplete = checkProductComplete(formData);

      // Create a temporary variable to hold updated products
      let updatedProducts: ProductDraft[] = [];

      setProducts((prev) => {
        updatedProducts = prev.map((p) =>
          p.id === selectedProductId
            ? { ...formData, id: p.id, isComplete }
            : p
        );
        return updatedProducts;
      });

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // In production, this would call the API
    console.log('Saving products:', products);
    toast.success(`${products.length} товаров сохранено!`, 'Это демо версия');
    router.push(`/store/${storeId}/products`);
  };

  // Handle navigation with confirmation
  const handleNavigate = (path: string) => {
    if (products.length > 0) {
      setPendingNavigation(path);
      setShowExitDialog(true);
    } else {
      router.push(path);
    }
  };

  const handleExitAnyway = () => {
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleSaveAndExit = async () => {
    await handleSaveAll();
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  // Auto-save on form change with debounce
  useEffect(() => {
    const subscription = form.watch(() => {
      // Clear previous timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for debounced save
      saveTimeoutRef.current = setTimeout(() => {
        autoSaveCurrentProduct();
      }, 300); // 300ms debounce
    });

    return () => {
      subscription.unsubscribe();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form, autoSaveCurrentProduct]);

  // Prevent accidental page close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (products.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [products.length]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigate(`/store/${storeId}/products/new`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t('pages.products.addManually')}
            </h1>
            <p className="text-muted-foreground">
              {t('pages.products.manuallyDescription')}
            </p>
          </div>
        </div>

        {/* Two-column Layout */}
        <div className="flex gap-6" style={{ height: 'calc(100vh - 280px)' }}>
          {/* Left Panel - Product List */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-4">
            <Button onClick={handleAddProduct} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t('pages.products.addProduct')}
            </Button>

            <Card className="flex-1 p-4 overflow-hidden flex flex-col">
              {products.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground text-sm">
                  {t('pages.products.noProductsAdded')}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2">
                  {/* Display newest products at top with correct numbering */}
                  {products.map((product, idx) => {
                    const number = products.length - idx;
                    const displayName = product.name || `${t('pages.products.newProduct')} #${number}`;
                    const isSelected = selectedProductId === product.id;

                    return (
                      <div
                        key={product.id}
                        className={cn(
                          'p-3 rounded-lg border cursor-pointer transition-colors',
                          'hover:bg-muted/50',
                          isSelected ? 'bg-muted border-primary' : 'bg-card'
                        )}
                        onClick={() => handleSelectProduct(product.id)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-medium">
                                #{number}
                              </span>
                              <p className="font-medium text-sm truncate">
                                {displayName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Status Icon */}
                            {product.isComplete ? (
                              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Check className="h-3 w-3 text-green-600" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteProduct(product.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Panel - Product Form */}
          <div className="flex-1 overflow-y-auto">
            {selectedProductId ? (
              <Form {...form}>
                <form className="space-y-6">
                  {/* Basic Info */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      {t('pages.products.basicInfo')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t('pages.products.fields.name')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t('pages.products.placeholders.name')}
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => {
                          const selectedCategory = mockCategories.find(
                            (cat) => cat.id === field.value
                          );
                          return (
                            <FormItem>
                              <FormLabel>{t('pages.products.fields.category')}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-muted">
                                    {selectedCategory ? (
                                      <CategoryBadge
                                        name={selectedCategory.name}
                                        icon={selectedCategory.icon}
                                        color={selectedCategory.color}
                                        size="sm"
                                      />
                                    ) : (
                                      <SelectValue
                                        placeholder={t(
                                          'pages.products.placeholders.selectCategory'
                                        )}
                                      />
                                    )}
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {mockCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>
                                      <CategoryBadge
                                        name={cat.name}
                                        icon={cat.icon}
                                        color={cat.color}
                                        size="sm"
                                      />
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name="taxRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('pages.products.fields.taxRate')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0">
                                  {t('pages.products.taxRates.0')}
                                </SelectItem>
                                <SelectItem value="12">
                                  {t('pages.products.taxRates.12')}
                                </SelectItem>
                                <SelectItem value="15">
                                  {t('pages.products.taxRates.15')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>

                  {/* Variant Info */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      {t('pages.products.defaultVariant')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('pages.products.fields.sku')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t('pages.products.placeholders.sku')}
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="barcode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t('pages.products.fields.barcodeOptional')}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder={t('pages.products.placeholders.barcode')}
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('pages.products.fields.price')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder={t('pages.products.placeholders.price')}
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('pages.products.fields.cost')}</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder={t('pages.products.placeholders.cost')}
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('pages.products.fields.unit')}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-muted">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="шт">
                                  {t('pages.products.units.pcs')}
                                </SelectItem>
                                <SelectItem value="кг">
                                  {t('pages.products.units.kg')}
                                </SelectItem>
                                <SelectItem value="л">
                                  {t('pages.products.units.liter')}
                                </SelectItem>
                                <SelectItem value="м">
                                  {t('pages.products.units.meter')}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t('pages.products.fields.image')}</FormLabel>
                            <FormControl>
                              <ImageUpload
                                value={field.value}
                                onChange={field.onChange}
                                onRemove={() => field.onChange('')}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                </form>
              </Form>
            ) : (
              <Card className="p-12 flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p>{t('pages.products.selectOrAddProduct')}</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Fixed Action Bar */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleNavigate(`/store/${storeId}/products`)}
          >
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSaveAll} disabled={products.length === 0}>
            {t('pages.products.saveProducts', { count: products.length })}
          </Button>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pages.products.unsavedProductsWarning')}</DialogTitle>
            <DialogDescription>
              {t('pages.products.unsavedProductsDescription')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleExitAnyway}>
              {t('pages.products.exitAnyway')}
            </Button>
            <Button onClick={handleSaveAndExit}>
              {t('pages.products.saveAndExit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
