'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, Check, Clock, Search, CheckCircle2 } from 'lucide-react';
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
  ImageUpload,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  cn,
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';

// Mock nomenclature data (государственная номенклатура)
interface NomenclatureItem {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  isInStore: boolean; // already added to this store
}

const mockNomenclature: NomenclatureItem[] = [
  { id: '1', name: 'Coca-Cola 0.5л', sku: 'NOM-001', categoryId: '1', categoryName: 'Напитки', isInStore: true },
  { id: '2', name: 'Pepsi 0.5л', sku: 'NOM-002', categoryId: '1', categoryName: 'Напитки', isInStore: false },
  { id: '3', name: 'Fanta 0.5л', sku: 'NOM-003', categoryId: '1', categoryName: 'Напитки', isInStore: false },
  { id: '4', name: 'Sprite 0.5л', sku: 'NOM-004', categoryId: '1', categoryName: 'Напитки', isInStore: false },
  { id: '5', name: 'Молоко 1л', sku: 'NOM-005', categoryId: '2', categoryName: 'Молочные продукты', isInStore: false },
  { id: '6', name: 'Кефир 1л', sku: 'NOM-006', categoryId: '2', categoryName: 'Молочные продукты', isInStore: false },
  { id: '7', name: 'Йогурт 500мл', sku: 'NOM-007', categoryId: '2', categoryName: 'Молочные продукты', isInStore: true },
  { id: '8', name: 'Сметана 200г', sku: 'NOM-008', categoryId: '2', categoryName: 'Молочные продукты', isInStore: false },
  { id: '9', name: 'Хлеб белый', sku: 'NOM-009', categoryId: '3', categoryName: 'Хлеб и выпечка', isInStore: false },
  { id: '10', name: 'Хлеб черный', sku: 'NOM-010', categoryId: '3', categoryName: 'Хлеб и выпечка', isInStore: false },
  { id: '11', name: 'Батон', sku: 'NOM-011', categoryId: '3', categoryName: 'Хлеб и выпечка', isInStore: false },
  { id: '12', name: 'Булочка', sku: 'NOM-012', categoryId: '3', categoryName: 'Хлеб и выпечка', isInStore: true },
  { id: '13', name: 'Рис 1кг', sku: 'NOM-013', categoryId: '4', categoryName: 'Крупы', isInStore: false },
  { id: '14', name: 'Гречка 1кг', sku: 'NOM-014', categoryId: '4', categoryName: 'Крупы', isInStore: false },
  { id: '15', name: 'Макароны 500г', sku: 'NOM-015', categoryId: '4', categoryName: 'Крупы', isInStore: false },
  { id: '16', name: 'Овсяные хлопья 500г', sku: 'NOM-016', categoryId: '4', categoryName: 'Крупы', isInStore: false },
  { id: '17', name: 'Сахар 1кг', sku: 'NOM-017', categoryId: '5', categoryName: 'Бакалея', isInStore: false },
  { id: '18', name: 'Соль 1кг', sku: 'NOM-018', categoryId: '5', categoryName: 'Бакалея', isInStore: false },
  { id: '19', name: 'Растительное масло 1л', sku: 'NOM-019', categoryId: '5', categoryName: 'Бакалея', isInStore: false },
  { id: '20', name: 'Мука 1кг', sku: 'NOM-020', categoryId: '5', categoryName: 'Бакалея', isInStore: false },
];

// Schema for nomenclature-based product
const nomenclatureProductSchema = z.object({
  nomenclatureId: z.string(),
  name: z.string(),
  sku: z.string(),
  categoryId: z.string(),
  categoryName: z.string(),
  price: z.string().min(1, 'Цена обязательна'),
  cost: z.string().min(1, 'Себестоимость обязательна'),
  imageUrl: z.string().optional(),
});

type NomenclatureProductSchema = z.infer<typeof nomenclatureProductSchema>;

interface ProductDraft extends NomenclatureProductSchema {
  id: string;
  isComplete: boolean;
}

export default function NomenclatureProductPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const storeId = params.id as string;

  const [activeTab, setActiveTab] = useState<'nomenclature' | 'selected'>('nomenclature');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductDraft[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<NomenclatureProductSchema>({
    resolver: zodResolver(nomenclatureProductSchema),
    mode: 'onChange',
    defaultValues: {
      nomenclatureId: '',
      name: '',
      sku: '',
      categoryId: '',
      categoryName: '',
      price: '',
      cost: '',
      imageUrl: '',
    },
  });

  // Filter nomenclature by search query
  const filteredNomenclature = mockNomenclature.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if product is complete (price and cost filled)
  const checkProductComplete = (product: Partial<NomenclatureProductSchema>): boolean => {
    return !!(product.price && product.cost);
  };

  // Auto-save current form data to products array
  const autoSaveCurrentProduct = useCallback(() => {
    if (!selectedProductId) return;

    const formData = form.getValues();
    const isComplete = checkProductComplete(formData);

    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProductId ? { ...formData, id: p.id, isComplete } : p
      )
    );
  }, [selectedProductId, form]);

  // Add product from nomenclature
  const handleAddFromNomenclature = (nomenclatureItem: NomenclatureItem) => {
    // Check if already in store
    if (nomenclatureItem.isInStore) {
      toast.error('Товар уже в каталоге', 'Этот товар уже есть в каталоге магазина');
      return;
    }

    // Check if already added to selection
    const alreadyAdded = selectedProducts.some(
      (p) => p.nomenclatureId === nomenclatureItem.id
    );

    if (alreadyAdded) {
      toast.warning('Товар уже добавлен', 'Этот товар уже добавлен в список');
      return;
    }

    // Clear any pending debounced saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Auto-save current product first (synchronously)
    if (selectedProductId) {
      const formData = form.getValues();
      const isComplete = checkProductComplete(formData);
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProductId ? { ...formData, id: p.id, isComplete } : p
        )
      );
    }

    const newProduct: ProductDraft = {
      id: crypto.randomUUID(),
      nomenclatureId: nomenclatureItem.id,
      name: nomenclatureItem.name,
      sku: nomenclatureItem.sku,
      categoryId: nomenclatureItem.categoryId,
      categoryName: nomenclatureItem.categoryName,
      price: '',
      cost: '',
      imageUrl: '',
      isComplete: false,
    };

    // Add to beginning of array
    setSelectedProducts((prev) => [newProduct, ...prev]);

    // Only set as selected if we're already on the 'selected' tab
    if (activeTab === 'selected') {
      setSelectedProductId(newProduct.id);
      form.reset({
        nomenclatureId: newProduct.nomenclatureId,
        name: newProduct.name,
        sku: newProduct.sku,
        categoryId: newProduct.categoryId,
        categoryName: newProduct.categoryName,
        price: '',
        cost: '',
        imageUrl: '',
      });
    }
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
      setSelectedProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProductId ? { ...formData, id: p.id, isComplete } : p
        )
      );
    }

    const product = selectedProducts.find((p) => p.id === productId);
    if (product) {
      const { id, isComplete, ...formData } = product;
      form.reset(formData);
      setSelectedProductId(productId);
    }
  };

  // Delete product from list
  const handleDeleteProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));

    // If deleted product was selected, select another one
    if (selectedProductId === productId) {
      const remaining = selectedProducts.filter((p) => p.id !== productId);
      if (remaining.length > 0) {
        const next = remaining[0];
        const { id, isComplete, ...formData } = next;
        setSelectedProductId(next.id);
        form.reset(formData);
      } else {
        setSelectedProductId(null);
        form.reset({
          nomenclatureId: '',
          name: '',
          sku: '',
          categoryId: '',
          categoryName: '',
          price: '',
          cost: '',
          imageUrl: '',
        });
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

      let updatedProducts: ProductDraft[] = [];

      setSelectedProducts((prev) => {
        updatedProducts = prev.map((p) =>
          p.id === selectedProductId ? { ...formData, id: p.id, isComplete } : p
        );
        return updatedProducts;
      });

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // In production, this would call the API
    console.log('Saving products:', selectedProducts);
    toast.success(`${selectedProducts.length} товаров сохранено!`, 'Это демо версия');
    router.push(`/store/${storeId}/products`);
  };

  // Handle navigation with confirmation
  const handleNavigate = (path: string) => {
    if (selectedProducts.length > 0) {
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
      if (selectedProducts.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedProducts.length]);

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
              {t('pages.products.addFromNomenclature')}
            </h1>
            <p className="text-muted-foreground">
              {t('pages.products.fromNomenclatureDescription')}
            </p>
          </div>
        </div>

        {/* Two-column Layout */}
        <div className="flex gap-6" style={{ height: 'calc(100vh - 280px)' }}>
          {/* Left Panel - Tabs with Nomenclature and Selected Products */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="nomenclature" className="flex-1">
                  {t('pages.products.nomenclature')}
                </TabsTrigger>
                <TabsTrigger value="selected" className="flex-1">
                  {t('pages.products.selectedProducts')}
                  {selectedProducts.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {selectedProducts.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="nomenclature" className="flex-1 flex flex-col gap-4 mt-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('pages.products.searchNomenclature')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Nomenclature List */}
                <Card className="flex-1 p-4 overflow-hidden flex flex-col">
                  {filteredNomenclature.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center text-muted-foreground text-sm">
                      {t('pages.products.notFound')}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {filteredNomenclature.map((item) => {
                        const isAdded = selectedProducts.some(
                          (p) => p.nomenclatureId === item.id
                        );

                        return (
                          <div
                            key={item.id}
                            className={cn(
                              'p-3 rounded-lg border transition-colors',
                              item.isInStore
                                ? 'bg-muted/30 cursor-not-allowed opacity-60'
                                : isAdded
                                ? 'bg-muted/50 cursor-pointer'
                                : 'bg-card cursor-pointer hover:bg-muted/50'
                            )}
                            onClick={() => !isAdded && !item.isInStore && handleAddFromNomenclature(item)}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  SKU: {item.sku}
                                </p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {item.categoryName}
                                </p>
                              </div>

                              <div className="flex-shrink-0">
                                {item.isInStore ? (
                                  <div
                                    className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/10 text-green-600"
                                    title={t('pages.products.alreadyInStore')}
                                  >
                                    <CheckCircle2 className="h-3 w-3" />
                                  </div>
                                ) : isAdded ? (
                                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-600">
                                    <Check className="h-3 w-3" />
                                  </div>
                                ) : (
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="selected" className="flex-1 flex flex-col gap-4 mt-4">
                <Card className="flex-1 p-4 overflow-hidden flex flex-col">
                  {selectedProducts.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-center text-muted-foreground text-sm">
                      {t('pages.products.noProductsSelected')}
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {/* Display products with newest at top */}
                      {selectedProducts.map((product, idx) => {
                        const number = idx + 1;
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
                                  <p className="font-medium text-sm truncate">{product.name}</p>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  SKU: {product.sku}
                                </p>
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
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Product Form */}
          <div className="flex-1 overflow-y-auto">
            {selectedProductId ? (
              <Form {...form}>
                <form className="space-y-6">
                  {/* Nomenclature Info (readonly) */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      {t('pages.products.nomenclatureInfo')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>{t('pages.products.fields.name')}</FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-muted" />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              {t('pages.products.readonlyField')}
                            </p>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('pages.products.fields.sku')}</FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-muted" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categoryName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('pages.products.fields.category')}</FormLabel>
                            <FormControl>
                              <Input {...field} disabled className="bg-muted" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>

                  {/* Editable Fields */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      {t('pages.products.editableFields')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className="bg-background"
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
                                className="bg-background"
                              />
                            </FormControl>
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
                  <p>{t('pages.products.selectFromNomenclature')}</p>
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
          <Button onClick={handleSaveAll} disabled={selectedProducts.length === 0}>
            {t('pages.products.saveProducts', { count: selectedProducts.length })}
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
