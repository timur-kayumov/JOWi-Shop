'use client';

import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Package, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Badge,
  Card,
  DataTable,
  Column,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
} from '@jowi/ui';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';

// Simplified variant schema
const variantSchema = z.object({
  sku: z.string().min(1, 'Артикул обязателен'),
  name: z.string().min(1, 'Название обязательно'),
  barcode: z.string().optional(),
  price: z.string().min(1, 'Цена обязательна'),
  cost: z.string().min(1, 'Себестоимость обязательна'),
  unit: z.string().default('шт'),
  imageUrl: z.string().optional(),
});

type VariantSchema = z.infer<typeof variantSchema>;

// Mock product data with variants
const mockProductData = {
  '1': {
    id: '1',
    name: 'Coca-Cola',
    description: 'Газированный напиток',
    category: 'Напитки',
    categoryId: '1',
    taxRate: 0,
    isActive: true,
    sourceType: 'manual',
    imageUrl: undefined,
    stats: {
      totalStock: 270,
      soldThisMonth: 450,
      revenueThisMonth: 6750000,
      variantCount: 2,
    },
    variants: [
      {
        id: 'v1',
        sku: 'CC-500',
        name: '0.5л',
        barcode: '4780001234567',
        price: 15000,
        cost: 10000,
        unit: 'шт',
        imageUrl: undefined,
        stock: 150,
        isActive: true,
      },
      {
        id: 'v2',
        sku: 'CC-1000',
        name: '1л',
        barcode: '4780001234568',
        price: 25000,
        cost: 18000,
        unit: 'шт',
        imageUrl: undefined,
        stock: 120,
        isActive: true,
      },
    ],
  },
  '2': {
    id: '2',
    name: 'Молоко',
    description: 'Свежее пастеризованное молоко',
    category: 'Молочные продукты',
    categoryId: '2',
    taxRate: 0,
    isActive: true,
    sourceType: 'manual',
    imageUrl: undefined,
    stats: {
      totalStock: 80,
      soldThisMonth: 200,
      revenueThisMonth: 2400000,
      variantCount: 1,
    },
    variants: [
      {
        id: 'v3',
        sku: 'MLK-1000',
        name: '1л',
        barcode: '4780001234570',
        price: 12000,
        cost: 8000,
        unit: 'шт',
        imageUrl: undefined,
        stock: 80,
        isActive: true,
      },
    ],
  },
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation('common');
  const storeId = params.id as string;
  const productId = params.productId as string;

  const product = mockProductData[productId as keyof typeof mockProductData];
  const [variants, setVariants] = useState(product?.variants || []);
  const [open, setOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<(typeof variants)[0] | null>(null);

  const form = useForm<VariantSchema>({
    resolver: zodResolver(variantSchema),
    defaultValues: {
      sku: '',
      name: '',
      barcode: '',
      price: '',
      cost: '',
      unit: 'шт',
      imageUrl: '',
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const onSubmit = (data: VariantSchema) => {
    if (editingVariant) {
      // Update variant
      setVariants(
        variants.map((v) =>
          v.id === editingVariant.id
            ? {
                ...v,
                ...data,
                price: Number(data.price),
                cost: Number(data.cost),
              }
            : v
        )
      );
      toast.success('Вариант обновлён', 'Изменения успешно сохранены');
    } else {
      // Add new variant
      const newVariant = {
        id: `v${Date.now()}`,
        ...data,
        price: Number(data.price),
        cost: Number(data.cost),
        stock: 0,
        isActive: true,
      };
      setVariants([...variants, newVariant]);
      toast.success('Вариант создан', `${data.name} добавлен в товар`);
    }
    setOpen(false);
    setEditingVariant(null);
    form.reset();
  };

  const handleEdit = (variant: (typeof variants)[0]) => {
    setEditingVariant(variant);
    form.reset({
      sku: variant.sku,
      name: variant.name,
      barcode: variant.barcode,
      price: variant.price.toString(),
      cost: variant.cost.toString(),
      unit: variant.unit,
      imageUrl: variant.imageUrl,
    });
    setOpen(true);
  };

  const handleDelete = (variantId: string) => {
    if (confirm(t('pages.products.deleteConfirm'))) {
      setVariants(variants.filter((v) => v.id !== variantId));
      toast.success('Вариант удалён', 'Данные успешно удалены из системы');
    }
  };

  const variantColumns: Column<(typeof variants)[0]>[] = [
    {
      key: 'name',
      label: t('pages.products.variant'),
      render: (variant) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            {variant.imageUrl ? (
              <img
                src={variant.imageUrl}
                alt={variant.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Package className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="font-medium">{variant.name}</div>
            <div className="text-sm text-muted-foreground">{variant.sku}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'barcode',
      label: t('pages.products.fields.barcode'),
      render: (variant) => (
        <span className="text-sm text-muted-foreground">
          {variant.barcode || '—'}
        </span>
      ),
    },
    {
      key: 'price',
      label: t('pages.products.fields.price'),
      render: (variant) => (
        <span>
          {formatCurrency(variant.price)} {t('currency.uzs')}
        </span>
      ),
    },
    {
      key: 'cost',
      label: t('pages.products.fields.cost'),
      render: (variant) => (
        <span>
          {formatCurrency(variant.cost)} {t('currency.uzs')}
        </span>
      ),
    },
    {
      key: 'stock',
      label: t('pages.products.stock'),
      render: (variant) => (
        <span className={variant.stock < 50 ? 'text-destructive font-medium' : ''}>
          {variant.stock} {variant.unit}
        </span>
      ),
    },
    {
      key: 'status',
      label: t('fields.status'),
      render: (variant) => (
        <Badge variant={variant.isActive ? 'success' : 'secondary'}>
          {variant.isActive ? t('status.active') : t('status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (variant) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(variant)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(variant.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (!product) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push(`/store/${storeId}/products`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('pages.customerDetail.backToList')}
        </Button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('pages.customerDetail.notFound')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/store/${storeId}/products`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              <Badge variant={product.isActive ? 'success' : 'secondary'}>
                {product.isActive ? t('status.active') : t('status.inactive')}
              </Badge>
            </div>
            <p className="text-muted-foreground">{product.description}</p>
          </div>
        </div>
        <Button variant="outline">
          <Pencil className="h-4 w-4 mr-2" />
          {t('pages.products.editProduct')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.products.totalStock')}
              </p>
              <p className="text-2xl font-bold">{product.stats.totalStock}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.products.soldThisMonth')}
              </p>
              <p className="text-2xl font-bold">{product.stats.soldThisMonth}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.products.revenueThisMonth')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(product.stats.revenueThisMonth)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('pages.products.variantsCount')}
              </p>
              <p className="text-2xl font-bold">{product.stats.variantCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Product Info Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          {t('pages.products.productDetails')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages.products.fields.category')}
            </p>
            <p className="font-medium">{product.category}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages.products.fields.taxRate')}
            </p>
            <p className="font-medium">{product.taxRate}%</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {t('pages.products.fields.sourceType')}
            </p>
            <p className="font-medium">
              {product.sourceType === 'manual'
                ? t('pages.products.sourceTypes.manual')
                : t('pages.products.sourceTypes.nomenclature')}
            </p>
          </div>
        </div>
      </Card>

      {/* Variants Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('pages.products.variants')}</h2>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingVariant(null); form.reset(); }}>
                <Plus className="h-4 w-4 mr-2" />
                {t('pages.products.addVariantButton')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingVariant
                    ? t('pages.products.editVariantButton')
                    : t('pages.products.addVariantButton')}
                </DialogTitle>
                <DialogDescription>
                  {editingVariant
                    ? 'Внесите изменения в вариант товара'
                    : 'Заполните информацию о новом варианте'}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.products.fields.sku')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t('pages.products.placeholders.sku')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('pages.products.fields.variantName')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t('pages.products.placeholders.variantName')} />
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
                          <FormLabel>{t('pages.products.fields.barcodeOptional')}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t('pages.products.placeholders.barcode')} />
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
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="шт">{t('pages.products.units.pcs')}</SelectItem>
                              <SelectItem value="кг">{t('pages.products.units.kg')}</SelectItem>
                              <SelectItem value="л">{t('pages.products.units.liter')}</SelectItem>
                              <SelectItem value="м">{t('pages.products.units.meter')}</SelectItem>
                            </SelectContent>
                          </Select>
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
                            <Input {...field} type="number" placeholder={t('pages.products.placeholders.price')} />
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
                            <Input {...field} type="number" placeholder={t('pages.products.placeholders.cost')} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
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

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      {t('actions.cancel')}
                    </Button>
                    <Button type="submit">{t('actions.save')}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          data={variants}
          columns={variantColumns}
          emptyMessage={t('pages.products.validation.atLeastOneVariant')}
        />
      </div>
    </div>
  );
}
