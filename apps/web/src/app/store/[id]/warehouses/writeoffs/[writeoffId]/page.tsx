'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Check, XCircle, Plus, Trash, Search, Calendar, Warehouse, User, FileText, Package, AlertCircle, DollarSign, Hash } from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  StatusBadge,
  formatDate,
  Comments,
  ActivityHistory,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  DataTable,
  Checkbox,
  type Comment,
  type Activity,
  type Column,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';

// ==================== TYPES ====================

type WriteoffStatus = 'draft' | 'published' | 'canceled';
type WriteoffReason = 'expired' | 'damaged' | 'lost' | 'shortage' | 'other';

interface WriteoffItem {
  id: string;
  variantId: string;
  productName: string;
  brandAndVolume?: string;
  availableQuantity: number; // Доступное количество на складе
  writeoffQuantity: number; // Количество списания
  costPrice: number; // Себестоимость за единицу
  unit: string; // Единица измерения
}

interface WriteoffDetail {
  id: string;
  number: string;
  createdAt: Date;
  publishedAt: Date | null;
  status: WriteoffStatus;
  reason: WriteoffReason;
  warehouseId: string;
  warehouseName: string;
  responsibleId: string;
  responsibleName: string;
  notes: string | null;
  itemsCount: number;
  totalAmount: number;
}

interface ProductVariant {
  id: string;
  productName: string;
  brandAndVolume?: string;
  sku: string;
  category: string;
  currentStock: number;
  costPrice: number;
  unit: string;
}

// ==================== MOCK DATA ====================

const mockWriteoff: WriteoffDetail = {
  id: '1',
  number: 'WO-2025-001',
  createdAt: new Date('2025-11-10T10:30:00'),
  publishedAt: null,
  status: 'draft',
  reason: 'expired',
  warehouseId: '1',
  warehouseName: 'Основной склад',
  responsibleId: '1',
  responsibleName: 'Алишер Каримов',
  notes: 'Истёк срок годности молочной продукции',
  itemsCount: 5,
  totalAmount: 125000,
};

const mockItems: WriteoffItem[] = [
  {
    id: '1',
    variantId: 'v1',
    productName: 'Молоко',
    brandAndVolume: 'Простоквашино · 1 л',
    availableQuantity: 50,
    writeoffQuantity: 15,
    costPrice: 12000,
    unit: 'шт'
  },
  {
    id: '2',
    variantId: 'v2',
    productName: 'Йогурт',
    brandAndVolume: 'Активиа · 125 г',
    availableQuantity: 100,
    writeoffQuantity: 20,
    costPrice: 5000,
    unit: 'шт'
  },
  {
    id: '3',
    variantId: 'v3',
    productName: 'Сыр твёрдый',
    brandAndVolume: 'Российский · 200 г',
    availableQuantity: 30,
    writeoffQuantity: 10,
    costPrice: 22000,
    unit: 'шт'
  },
  {
    id: '4',
    variantId: 'v4',
    productName: 'Масло сливочное',
    brandAndVolume: 'Простоквашино · 180 г',
    availableQuantity: 25,
    writeoffQuantity: 8,
    costPrice: 18000,
    unit: 'шт'
  },
  {
    id: '5',
    variantId: 'v5',
    productName: 'Сметана',
    brandAndVolume: 'Домик в деревне · 300 г',
    availableQuantity: 40,
    writeoffQuantity: 12,
    costPrice: 15000,
    unit: 'шт'
  },
];

const mockComments: Comment[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Алишер Каримов',
    text: 'Проверил сроки годности всей молочной продукции, часть товара необходимо списать',
    createdAt: new Date('2025-11-10T11:00:00'),
  },
  {
    id: '2',
    userId: '2',
    userName: 'Нигора Усманова',
    text: 'Согласовано, можно приступать к списанию',
    createdAt: new Date('2025-11-10T11:15:00'),
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'created',
    userId: '1',
    userName: 'Алишер Каримов',
    userAvatar: undefined,
    timestamp: new Date('2025-11-10T10:30:00'),
    description: 'Создано со статусом Черновик',
  },
  {
    id: '2',
    type: 'updated',
    userId: '1',
    userName: 'Алишер Каримов',
    userAvatar: undefined,
    timestamp: new Date('2025-11-10T11:00:00'),
    description: 'Добавлены товары для списания',
  },
];

const mockAvailableProducts: ProductVariant[] = [
  {
    id: 'v6',
    productName: 'Кефир',
    brandAndVolume: 'Простоквашино · 1 л',
    sku: 'KEF-001',
    category: 'Молочные',
    currentStock: 35,
    costPrice: 10000,
    unit: 'шт',
  },
  {
    id: 'v7',
    productName: 'Творог',
    brandAndVolume: 'Домик в деревне · 200 г',
    sku: 'TVR-001',
    category: 'Молочные',
    currentStock: 28,
    costPrice: 13000,
    unit: 'шт',
  },
  {
    id: 'v8',
    productName: 'Ряженка',
    brandAndVolume: 'Простоквашино · 500 мл',
    sku: 'RYA-001',
    category: 'Молочные',
    currentStock: 42,
    costPrice: 8000,
    unit: 'шт',
  },
];

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' сум';
};

// ==================== MAIN COMPONENT ====================

export default function WriteoffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const writeoffId = params.writeoffId as string;
  const { t } = useTranslation('common');

  // State
  const [writeoff, setWriteoff] = useState<WriteoffDetail>(mockWriteoff);
  const [items, setItems] = useState<WriteoffItem[]>(mockItems);
  const [originalItems, setOriginalItems] = useState<WriteoffItem[]>(mockItems);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const currentUserId = '1'; // Mock current user

  // Dialog states
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addItemsDialogOpen, setAddItemsDialogOpen] = useState(false);

  // Tab states
  const [leftTab, setLeftTab] = useState<'comments' | 'history'>('comments');

  // Table controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Product selection controls
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());

  // Calculate totals
  const { totalAmount, totalItems } = useMemo(() => {
    let amount = 0;
    let count = 0;

    items.forEach(item => {
      amount += item.writeoffQuantity * item.costPrice;
      count += 1;
    });

    return { totalAmount: amount, totalItems: count };
  }, [items]);

  // Filtered items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    const search = searchQuery.toLowerCase();
    return items.filter(item =>
      item.productName.toLowerCase().includes(search) ||
      item.brandAndVolume?.toLowerCase().includes(search)
    );
  }, [items, searchQuery]);

  // Filter available products (exclude already added ones)
  const availableProducts = useMemo(() => {
    const existingVariantIds = new Set(items.map(item => item.variantId));
    return mockAvailableProducts.filter(p => !existingVariantIds.has(p.id));
  }, [items]);

  // Filter available products by search query
  const filteredAvailableProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return availableProducts;
    const search = productSearchQuery.toLowerCase();
    return availableProducts.filter(p =>
      p.productName.toLowerCase().includes(search) ||
      p.sku.toLowerCase().includes(search) ||
      p.brandAndVolume?.toLowerCase().includes(search)
    );
  }, [availableProducts, productSearchQuery]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = () => {
    setItems(items.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
    toast.success(t('components.toast.success'), t('warehouses.writeoffs.detail.removeProducts'));
  };

  // Product selection handlers
  const handleSelectAllProducts = () => {
    if (selectedVariantIds.size === filteredAvailableProducts.length && filteredAvailableProducts.length > 0) {
      setSelectedVariantIds(new Set());
    } else {
      setSelectedVariantIds(new Set(filteredAvailableProducts.map(p => p.id)));
    }
  };

  const handleToggleProduct = (variantId: string) => {
    const newSet = new Set(selectedVariantIds);
    if (newSet.has(variantId)) {
      newSet.delete(variantId);
    } else {
      newSet.add(variantId);
    }
    setSelectedVariantIds(newSet);
  };

  const handleAddSelectedProducts = () => {
    const selectedProducts = availableProducts.filter(p =>
      selectedVariantIds.has(p.id)
    );

    const newItems: WriteoffItem[] = selectedProducts.map(p => ({
      id: crypto.randomUUID(),
      variantId: p.id,
      productName: p.productName,
      brandAndVolume: p.brandAndVolume,
      availableQuantity: p.currentStock,
      writeoffQuantity: 0,
      costPrice: p.costPrice,
      unit: p.unit,
    }));

    setItems([...items, ...newItems]);
    setSelectedVariantIds(new Set());
    setAddItemsDialogOpen(false);
    setProductSearchQuery('');

    toast.success(
      t('components.toast.success'),
      t('warehouses.writeoffs.detail.productAdded')
    );
  };

  // Comment handlers
  const handleAddComment = (text: string) => {
    const newComment: Comment = {
      id: String(comments.length + 1),
      userId: currentUserId,
      userName: 'UserName',
      text,
      createdAt: new Date(),
    };
    setComments([newComment, ...comments]);
    toast.success(t('components.toast.success'), t('warehouses.writeoffs.detail.commentAdded'));
  };

  const handleEditComment = (commentId: string, text: string) => {
    setComments(
      comments.map((c) =>
        c.id === commentId ? { ...c, text, updatedAt: new Date() } : c
      )
    );
    toast.success(t('components.toast.success'), 'Комментарий изменён');
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
    toast.success(t('components.toast.success'), 'Комментарий удалён');
  };

  // Writeoff actions
  const handleEdit = () => {
    toast.info('В разработке', 'Редактирование списания');
    // TODO: Integrate with backend API
    // Open edit dialog or navigate to edit page
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    // TODO: Integrate with backend API
    // DELETE /api/writeoffs/{id}
    toast.success(t('components.toast.success'), t('warehouses.writeoffs.detail.deleteSuccess'));
    router.push(`/store/${storeId}/warehouses/writeoffs`);
  };

  const handlePublish = () => {
    setPublishDialogOpen(true);
  };

  const confirmPublish = () => {
    // TODO: Integrate with backend API
    // POST /api/writeoffs/{id}/publish
    setWriteoff({
      ...writeoff,
      status: 'published',
      publishedAt: new Date(),
      itemsCount: totalItems,
      totalAmount: totalAmount
    });
    // Save original items snapshot when publishing
    setOriginalItems(JSON.parse(JSON.stringify(items)));
    setHasUnsavedChanges(false);
    toast.success(t('components.toast.success'), t('warehouses.writeoffs.detail.publishSuccess'));
    setPublishDialogOpen(false);
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    // TODO: Integrate with backend API
    // POST /api/writeoffs/{id}/cancel
    setWriteoff({ ...writeoff, status: 'canceled' });
    toast.success(t('components.toast.success'), t('warehouses.writeoffs.detail.cancelSuccess'));
    setCancelDialogOpen(false);
  };

  const handleSaveChanges = () => {
    // TODO: Integrate with backend API
    // PATCH /api/writeoffs/{id}/update-quantities
    setOriginalItems(JSON.parse(JSON.stringify(items)));
    setWriteoff({
      ...writeoff,
      itemsCount: totalItems,
      totalAmount: totalAmount
    });
    setHasUnsavedChanges(false);
    toast.success(t('components.toast.success'), t('warehouses.writeoffs.detail.saveSuccess'));
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/warehouses/writeoffs`);
  };

  const handleWriteoffQuantityChange = (itemId: string, value: string) => {
    const numValue = value === '' ? 0 : Number(value);

    // Validate: quantity cannot exceed available quantity
    const item = items.find(i => i.id === itemId);
    if (item && numValue > item.availableQuantity) {
      toast.error(
        t('components.toast.error'),
        t('warehouses.writeoffs.detail.validation.exceedsAvailable')
      );
      return;
    }

    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, writeoffQuantity: numValue } : item
    );
    setItems(updatedItems);

    // Check if there are changes compared to original (only for published writeoffs)
    if (writeoff.status === 'published') {
      const hasChanges = updatedItems.some((item, index) => {
        const originalItem = originalItems[index];
        return originalItem && item.writeoffQuantity !== originalItem.writeoffQuantity;
      });
      setHasUnsavedChanges(hasChanges);
    }
  };

  // Determine which buttons to show based on status
  const canEdit = writeoff.status !== 'canceled';
  const canPublish = writeoff.status === 'draft';
  const canCancelWriteoff = writeoff.status === 'published';
  const canDelete = writeoff.status === 'draft';
  const canAddRemoveItems = writeoff.status === 'draft';

  // Get reason label
  const getReasonLabel = (reason: WriteoffReason) => {
    return t(`warehouses.writeoffs.detail.reasons.${reason}`);
  };

  // Table columns
  const writeoffColumns: Column<WriteoffItem>[] = [];

  // Add checkbox column for draft status
  if (writeoff.status === 'draft') {
    writeoffColumns.push({
      key: 'checkbox',
      label: (
        <Checkbox
          checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
          onCheckedChange={handleSelectAll}
        />
      ),
      render: (item) => (
        <Checkbox
          checked={selectedItems.has(item.id)}
          onCheckedChange={() => handleSelectItem(item.id)}
        />
      ),
    });
  }

  // Product column
  writeoffColumns.push({
    key: 'productName',
    label: t('warehouses.writeoffs.detail.table.product'),
    render: (item) => (
      <div>
        <p className="font-medium">{item.productName}</p>
        {item.brandAndVolume && (
          <p className="text-sm text-muted-foreground">{item.brandAndVolume}</p>
        )}
      </div>
    ),
  });

  // Available quantity column
  writeoffColumns.push({
    key: 'availableQuantity',
    label: t('warehouses.writeoffs.detail.table.available'),
    render: (item) => (
      <span>{item.availableQuantity} {item.unit}</span>
    ),
  });

  // Writeoff quantity column
  writeoffColumns.push({
    key: 'writeoffQuantity',
    label: t('warehouses.writeoffs.detail.table.writeoffQty'),
    render: (item) => (
      <Input
        type="number"
        value={item.writeoffQuantity}
        onChange={(e) => handleWriteoffQuantityChange(item.id, e.target.value)}
        className="w-32"
        disabled={writeoff.status === 'canceled'}
        min={0}
        max={item.availableQuantity}
      />
    ),
  });

  // Cost price column
  writeoffColumns.push({
    key: 'costPrice',
    label: t('warehouses.writeoffs.detail.table.costPrice'),
    render: (item) => (
      <span className="text-sm">{formatCurrency(item.costPrice)}</span>
    ),
  });

  // Total amount column
  writeoffColumns.push({
    key: 'totalAmount',
    label: t('warehouses.writeoffs.detail.table.totalAmount'),
    render: (item) => (
      <span className="font-medium">{formatCurrency(item.writeoffQuantity * item.costPrice)}</span>
    ),
  });

  // Product selection columns for the dialog
  const productColumns: Column<ProductVariant>[] = [
    {
      key: 'checkbox',
      label: (
        <Checkbox
          checked={selectedVariantIds.size === filteredAvailableProducts.length && filteredAvailableProducts.length > 0}
          onCheckedChange={handleSelectAllProducts}
        />
      ),
      render: (product) => (
        <Checkbox
          checked={selectedVariantIds.has(product.id)}
          onCheckedChange={() => handleToggleProduct(product.id)}
        />
      ),
    },
    {
      key: 'productName',
      label: t('warehouses.writeoffs.detail.table.product'),
      render: (product) => (
        <div>
          <p className="font-medium">{product.productName}</p>
          {product.brandAndVolume && (
            <p className="text-sm text-muted-foreground">{product.brandAndVolume}</p>
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      label: t('warehouses.writeoffs.detail.table.sku'),
      render: (product) => <span className="text-sm">{product.sku}</span>,
    },
    {
      key: 'category',
      label: t('warehouses.writeoffs.detail.table.category'),
      render: (product) => <span className="text-sm">{product.category}</span>,
    },
    {
      key: 'currentStock',
      label: t('warehouses.writeoffs.detail.table.currentStock'),
      render: (product) => <span className="text-sm">{product.currentStock} {product.unit}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('warehouses.writeoffs.detail.backToList')}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (~33%): Info + Comments/History tabs */}
        <div className="space-y-6">
          {/* Information Card */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Title (without label) */}
              <h2 className="text-2xl font-bold">{writeoff.number}</h2>

              {/* Information with icons */}
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.writeoffs.detail.status')}
                  </span>
                  <div className="text-right">
                    <StatusBadge type="transaction" status={writeoff.status} t={t} />
                  </div>
                </div>

                {/* Reason */}
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.writeoffs.detail.reason')}
                  </span>
                  <div className="text-right">
                    <Badge variant="outline">
                      {getReasonLabel(writeoff.reason)}
                    </Badge>
                  </div>
                </div>

                {/* Creation Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.writeoffs.detail.createdDate')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {formatDate(writeoff.createdAt)}
                  </span>
                </div>

                {writeoff.publishedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground flex-1">
                      {t('warehouses.writeoffs.detail.publishDate')}
                    </span>
                    <span className="text-sm font-medium text-right">
                      {formatDate(writeoff.publishedAt)}
                    </span>
                  </div>
                )}

                {/* Warehouse */}
                <div className="flex items-start gap-3">
                  <Warehouse className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.writeoffs.detail.warehouse')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {writeoff.warehouseName}
                  </span>
                </div>

                {/* Responsible */}
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.writeoffs.detail.responsible')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {writeoff.responsibleName}
                  </span>
                </div>

                {/* Items Count */}
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.writeoffs.detail.itemsCount')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {totalItems}
                  </span>
                </div>

                {/* Total Amount */}
                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.writeoffs.detail.totalAmount')}
                  </span>
                  <span className="text-sm font-bold text-right text-destructive">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              {/* Notes section with separator */}
              {writeoff.notes && (
                <>
                  <div className="border-t" />
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('warehouses.writeoffs.detail.notes')}
                      </p>
                      <p className="text-sm">{writeoff.notes}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Action buttons */}
              <TooltipProvider delayDuration={0}>
                <div className="flex items-center gap-2 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    {canDelete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleDelete}
                            className="h-10 w-10 bg-muted hover:bg-muted/80"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('warehouses.writeoffs.detail.actions.delete')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleEdit}
                            className="h-10 w-10 bg-muted hover:bg-muted/80"
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('warehouses.writeoffs.detail.actions.edit')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {canPublish && (
                    <Button onClick={handlePublish} size="sm" className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white">
                      <Check className="mr-2 h-4 w-4" />
                      {t('warehouses.writeoffs.detail.actions.publish')}
                    </Button>
                  )}
                  {canCancelWriteoff && (
                    <Button variant="outline" onClick={handleCancel} size="sm">
                      <XCircle className="mr-2 h-4 w-4" />
                      {t('warehouses.writeoffs.detail.actions.cancel')}
                    </Button>
                  )}
                </div>
              </TooltipProvider>
            </div>
          </Card>

          {/* Comments/History Tabs Card */}
          <Card className="p-6">
            <Tabs value={leftTab} onValueChange={(val) => setLeftTab(val as 'comments' | 'history')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="comments">{t('warehouses.writeoffs.detail.comments')}</TabsTrigger>
                <TabsTrigger value="history">{t('warehouses.writeoffs.detail.history')}</TabsTrigger>
              </TabsList>
              <TabsContent value="comments">
                <Comments
                  comments={comments}
                  currentUserId={currentUserId}
                  onAdd={handleAddComment}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              </TabsContent>
              <TabsContent value="history">
                <ActivityHistory activities={mockActivities} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right column (~67%): Table only (no tabs, no KPI cards) */}
        <div className="lg:col-span-2 space-y-0">
          {/* Search and buttons with padding */}
          <Card className="p-6 rounded-b-none">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('warehouses.writeoffs.detail.searchProducts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {canAddRemoveItems && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBulkDelete}
                    disabled={selectedItems.size === 0}
                    className="h-10 w-10 disabled:bg-muted enabled:bg-red-50 enabled:hover:bg-red-100 enabled:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setAddItemsDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('warehouses.writeoffs.detail.addProduct')}
                  </Button>
                </>
              )}
              {writeoff.status === 'published' && hasUnsavedChanges && (
                <Button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white">
                  <Check className="mr-2 h-4 w-4" />
                  {t('warehouses.writeoffs.detail.saveChanges')}
                </Button>
              )}
            </div>
          </Card>

          {/* Table without padding */}
          <Card className="rounded-t-none border-t-0">
            <DataTable
              data={filteredItems}
              columns={writeoffColumns}
              pagination={{ enabled: false }}
            />
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('warehouses.writeoffs.detail.confirmDialogs.publish.title')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.writeoffs.detail.confirmDialogs.publish.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={confirmPublish} className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white">
              {t('warehouses.writeoffs.detail.actions.publish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('warehouses.writeoffs.detail.confirmDialogs.cancel.title')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.writeoffs.detail.confirmDialogs.cancel.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              {t('warehouses.writeoffs.detail.actions.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('warehouses.writeoffs.detail.confirmDialogs.delete.title')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.writeoffs.detail.confirmDialogs.delete.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('warehouses.writeoffs.detail.actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Items Dialog */}
      <Dialog open={addItemsDialogOpen} onOpenChange={setAddItemsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('warehouses.writeoffs.detail.selectProducts')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.writeoffs.detail.selectProductsDescription')}
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('warehouses.writeoffs.detail.searchProducts')}
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Products Table */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {filteredAvailableProducts.length > 0 ? (
              <DataTable
                columns={productColumns}
                data={filteredAvailableProducts}
                enablePagination={false}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {productSearchQuery
                    ? t('warehouses.writeoffs.detail.noProductsFound')
                    : t('warehouses.writeoffs.detail.noProductsAvailable')}
                </p>
              </div>
            )}
          </div>

          {/* Footer with selection counter and actions */}
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedVariantIds.size > 0 && (
                <>
                  {t('warehouses.writeoffs.detail.selectedProducts')}: <span className="font-medium">{selectedVariantIds.size}</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setAddItemsDialogOpen(false);
                setProductSearchQuery('');
                setSelectedVariantIds(new Set());
              }}>
                {t('actions.cancel')}
              </Button>
              <Button
                onClick={handleAddSelectedProducts}
                disabled={selectedVariantIds.size === 0}
              >
                {t('warehouses.writeoffs.detail.addSelectedProducts')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
