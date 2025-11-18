'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Check, XCircle, Plus, Trash, Search, Calendar, Warehouse, User, FileText, Package, Hash } from 'lucide-react';
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
import { DiscrepancyBar } from './components/discrepancy-bar';
import { InputWithAddon } from './components/input-with-addon';

// ==================== TYPES ====================

type InventoryStatus = 'draft' | 'published' | 'canceled';
type InventoryType = 'full' | 'partial';

interface InventoryItem {
  id: string;
  variantId: string;
  productName: string;
  brandAndVolume?: string;
  expectedQuantity: number;
  actualQuantity: number | null;
  costPrice: number;
  unit: string;
}

interface InventoryCount {
  id: string;
  number: string;
  date: Date;
  publishDate: Date | null;
  type: InventoryType;
  status: InventoryStatus;
  warehouseId: string;
  warehouseName: string;
  responsibleId: string;
  responsibleName: string;
  notes: string | null;
}

interface MovementDocument {
  id: string;
  number: string;
  type: 'receipt' | 'writeoff';
  date: Date;
  itemsCount: number;
  totalAmount: number;
  status: string;
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

const mockInventory: InventoryCount = {
  id: '1',
  number: 'INV-001',
  date: new Date('2025-11-14T10:30:00'),
  publishDate: null,
  type: 'partial',
  status: 'draft',
  warehouseId: '1',
  warehouseName: 'Основной склад',
  responsibleId: '1',
  responsibleName: 'Алишер Каримов',
  notes: 'Проверка остатков после годовой инвентаризации'
};

const mockItems: InventoryItem[] = [
  {
    id: '1',
    variantId: 'v1',
    productName: 'Антисептик күл үчүн',
    brandAndVolume: 'ARN Antiseptic · ПЭТ флакон 50 мл',
    expectedQuantity: 6,
    actualQuantity: 3,
    costPrice: 400000,
    unit: 'кг'
  },
  {
    id: '2',
    variantId: 'v2',
    productName: 'Coca-Cola',
    brandAndVolume: 'The Coca-Cola Company · 0.5 л',
    expectedQuantity: 100,
    actualQuantity: 93,
    costPrice: 8000,
    unit: 'шт'
  },
  {
    id: '3',
    variantId: 'v3',
    productName: 'Молоко',
    brandAndVolume: 'Простоквашино · 1 л',
    expectedQuantity: 50,
    actualQuantity: 55,
    costPrice: 12000,
    unit: 'шт'
  },
  {
    id: '4',
    variantId: 'v4',
    productName: 'Хлеб белый',
    brandAndVolume: 'Самарканд хлеб · 400 г',
    expectedQuantity: 30,
    actualQuantity: null,
    costPrice: 3500,
    unit: 'шт'
  },
  {
    id: '5',
    variantId: 'v5',
    productName: 'Масло подсолнечное',
    brandAndVolume: 'Золотая капля · 1 л',
    expectedQuantity: 20,
    actualQuantity: 20,
    costPrice: 25000,
    unit: 'шт'
  },
];

const mockComments: Comment[] = [
  {
    id: '1',
    userId: '1',
    userName: 'Алишер Каримов',
    text: 'Начал проверку остатков, обнаружены значительные расхождения по антисептику',
    createdAt: new Date('2025-11-14T11:00:00'),
  },
  {
    id: '2',
    userId: '2',
    userName: 'Нигора Усманова',
    text: 'Подтверждаю, несколько единиц были списаны вчера по браку',
    createdAt: new Date('2025-11-14T11:15:00'),
  },
];

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'created',
    userId: '1',
    userName: 'Алишер Каримов',
    userAvatar: undefined,
    timestamp: new Date('2025-11-14T10:30:00'),
    description: 'Создано со статусом Черновик',
  },
  {
    id: '2',
    type: 'updated',
    userId: '1',
    userName: 'Алишер Каримов',
    userAvatar: undefined,
    timestamp: new Date('2025-11-14T11:00:00'),
    description: 'Добавлены фактические количества',
  },
];

const mockAvailableProducts: ProductVariant[] = [
  {
    id: 'v6',
    productName: 'Чай чёрный',
    brandAndVolume: 'Ahmad Tea · Пакетики 25 шт',
    sku: 'TEA-BLK-001',
    category: 'Напитки',
    currentStock: 45,
    costPrice: 18000,
    unit: 'шт',
  },
  {
    id: 'v7',
    productName: 'Кофе растворимый',
    brandAndVolume: 'Nescafe Classic · Банка 100 г',
    sku: 'COF-INS-001',
    category: 'Напитки',
    currentStock: 30,
    costPrice: 35000,
    unit: 'шт',
  },
  {
    id: 'v8',
    productName: 'Сахар',
    brandAndVolume: 'Сахарный завод · 1 кг',
    sku: 'SUG-WHT-001',
    category: 'Бакалея',
    currentStock: 100,
    costPrice: 9000,
    unit: 'кг',
  },
  {
    id: 'v9',
    productName: 'Рис',
    brandAndVolume: 'Девзира · 1 кг',
    sku: 'RIC-DEV-001',
    category: 'Бакалея',
    currentStock: 60,
    costPrice: 15000,
    unit: 'кг',
  },
  {
    id: 'v10',
    productName: 'Макароны',
    brandAndVolume: 'Barilla · Спагетти 500 г',
    sku: 'PAS-SPA-001',
    category: 'Бакалея',
    currentStock: 40,
    costPrice: 12000,
    unit: 'шт',
  },
  {
    id: 'v11',
    productName: 'Сок апельсиновый',
    brandAndVolume: 'Rich · 1 л',
    sku: 'JUI-ORA-001',
    category: 'Напитки',
    currentStock: 25,
    costPrice: 14000,
    unit: 'шт',
  },
  {
    id: 'v12',
    productName: 'Йогурт',
    brandAndVolume: 'Активиа · 125 г',
    sku: 'YOG-ACT-001',
    category: 'Молочные',
    currentStock: 50,
    costPrice: 5000,
    unit: 'шт',
  },
  {
    id: 'v13',
    productName: 'Сыр твёрдый',
    brandAndVolume: 'Российский · 200 г',
    sku: 'CHE-RUS-001',
    category: 'Молочные',
    currentStock: 15,
    costPrice: 22000,
    unit: 'шт',
  },
  {
    id: 'v14',
    productName: 'Мука пшеничная',
    brandAndVolume: 'Макфа · 1 кг',
    sku: 'FLO-WHE-001',
    category: 'Бакалея',
    currentStock: 80,
    costPrice: 7000,
    unit: 'кг',
  },
  {
    id: 'v15',
    productName: 'Яйца куриные',
    brandAndVolume: 'Ферма · 10 шт',
    sku: 'EGG-CHI-001',
    category: 'Молочные',
    currentStock: 35,
    costPrice: 16000,
    unit: 'уп',
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

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const inventoryId = params.inventoryId as string;
  const { t } = useTranslation('common');

  // State
  const [inventory, setInventory] = useState<InventoryCount>(mockInventory);
  const [items, setItems] = useState<InventoryItem[]>(mockItems);
  const [originalItems, setOriginalItems] = useState<InventoryItem[]>(mockItems);
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
  const [rightTab, setRightTab] = useState<'inventory' | 'documents'>('inventory');

  // Table controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Product selection controls
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());

  // Calculate totals
  const {totalShortage, totalSurplus, maxDiscrepancy} = useMemo(() => {
    let shortage = 0;
    let surplus = 0;
    let max = 0;

    items.forEach(item => {
      if (item.actualQuantity !== null) {
        const discrepancy = item.actualQuantity - item.expectedQuantity;
        const discrepancyAmount = Math.abs(discrepancy) * item.costPrice;

        if (discrepancy < 0) {
          shortage += discrepancyAmount;
        } else if (discrepancy > 0) {
          surplus += discrepancyAmount;
        }

        max = Math.max(max, discrepancyAmount);
      }
    });

    return { totalShortage: shortage, totalSurplus: surplus, maxDiscrepancy: max };
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
    toast.success(t('components.toast.success'), t('warehouses.inventory.detail.removeProducts'));
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

    const newItems: InventoryItem[] = selectedProducts.map(p => ({
      id: crypto.randomUUID(),
      variantId: p.id,
      productName: p.productName,
      brandAndVolume: p.brandAndVolume,
      expectedQuantity: p.currentStock,
      actualQuantity: null,
      costPrice: p.costPrice,
      unit: p.unit,
    }));

    setItems([...items, ...newItems]);
    setSelectedVariantIds(new Set());
    setAddItemsDialogOpen(false);
    setProductSearchQuery('');

    toast.success(
      t('components.toast.success'),
      t('warehouses.inventory.detail.productAdded')
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
    toast.success(t('components.toast.success'), t('warehouses.inventory.detail.comments'));
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

  // Inventory actions
  const handleEdit = () => {
    toast.info('В разработке', 'Редактирование инвентаризации');
    // TODO: Integrate with backend API
    // Open edit dialog or navigate to edit page
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    // TODO: Integrate with backend API
    // DELETE /api/inventory-counts/{id}
    toast.success(t('components.toast.success'), t('warehouses.inventory.deleteSuccess'));
    router.push(`/store/${storeId}/warehouses/inventory`);
  };

  const handlePublish = () => {
    setPublishDialogOpen(true);
  };

  const confirmPublish = () => {
    // TODO: Integrate with backend API
    // POST /api/inventory-counts/{id}/publish
    setInventory({ ...inventory, status: 'published', publishDate: new Date() });
    // Save original items snapshot when publishing
    setOriginalItems(JSON.parse(JSON.stringify(items)));
    setHasUnsavedChanges(false);
    toast.success(t('components.toast.success'), t('warehouses.inventory.detail.publishSuccess'));
    setPublishDialogOpen(false);
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    // TODO: Integrate with backend API
    // POST /api/inventory-counts/{id}/cancel
    setInventory({ ...inventory, status: 'canceled' });
    toast.success(t('components.toast.success'), t('warehouses.inventory.detail.cancelSuccess'));
    setCancelDialogOpen(false);
  };

  const handleSaveChanges = () => {
    // TODO: Integrate with backend API
    // PATCH /api/inventory-counts/{id}/update-quantities
    setOriginalItems(JSON.parse(JSON.stringify(items)));
    setHasUnsavedChanges(false);
    toast.success(t('components.toast.success'), t('warehouses.inventory.detail.saveSuccess'));
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/warehouses/inventory`);
  };

  const handleActualQuantityChange = (itemId: string, value: string) => {
    const numValue = value === '' ? null : Number(value);
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, actualQuantity: numValue } : item
    );
    setItems(updatedItems);

    // Check if there are changes compared to original (only for published inventories)
    if (inventory.status === 'published') {
      const hasChanges = updatedItems.some((item, index) => {
        const originalItem = originalItems[index];
        return originalItem && item.actualQuantity !== originalItem.actualQuantity;
      });
      setHasUnsavedChanges(hasChanges);
    }
  };

  // Determine which buttons to show based on status
  const canEdit = inventory.status !== 'canceled';
  const canPublish = inventory.status === 'draft';
  const canCancelInventory = inventory.status === 'published';
  const canDelete = inventory.status === 'draft';

  // Mock documents (only shown after publishing)
  const mockDocuments: MovementDocument[] = inventory.status === 'published' ? [
    {
      id: 'rec-1',
      number: 'REC-001',
      type: 'receipt',
      date: inventory.publishDate || new Date(),
      itemsCount: items.filter(i => i.actualQuantity && i.actualQuantity > i.expectedQuantity).length,
      totalAmount: totalSurplus,
      status: 'published'
    },
    {
      id: 'wo-1',
      number: 'WO-001',
      type: 'writeoff',
      date: inventory.publishDate || new Date(),
      itemsCount: items.filter(i => i.actualQuantity && i.actualQuantity < i.expectedQuantity).length,
      totalAmount: totalShortage,
      status: 'published'
    }
  ] : [];

  // Table columns
  const inventoryColumns: Column<InventoryItem>[] = [];

  // Add checkbox column for partial inventory in draft
  if (inventory.type === 'partial' && inventory.status === 'draft') {
    inventoryColumns.push({
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
  inventoryColumns.push({
    key: 'productName',
    label: t('warehouses.inventory.detail.table.product'),
    render: (item) => (
      <div>
        <p className="font-medium">{item.productName}</p>
        {item.brandAndVolume && (
          <p className="text-sm text-muted-foreground">{item.brandAndVolume}</p>
        )}
      </div>
    ),
  });

  // Expected quantity column
  inventoryColumns.push({
    key: 'expectedQuantity',
    label: t('warehouses.inventory.detail.table.expected'),
    render: (item) => (
      <span>{item.expectedQuantity} {item.unit}</span>
    ),
  });

  // Actual quantity column
  inventoryColumns.push({
    key: 'actualQuantity',
    label: t('warehouses.inventory.detail.table.actual'),
    render: (item) => (
      <Input
        type="number"
        value={item.actualQuantity ?? ''}
        onChange={(e) => handleActualQuantityChange(item.id, e.target.value)}
        className="w-32"
        disabled={inventory.status === 'canceled'}
      />
    ),
  });

  // Discrepancy column
  inventoryColumns.push({
    key: 'discrepancy',
    label: t('warehouses.inventory.detail.table.discrepancy'),
    render: (item) => {
      if (item.actualQuantity === null) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      const discrepancy = item.actualQuantity - item.expectedQuantity;
      if (discrepancy === 0) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      const sign = discrepancy > 0 ? '+' : '−';
      const colorClass = discrepancy > 0 ? 'text-green-600' : 'text-destructive';
      return (
        <span className={`font-medium ${colorClass}`}>
          {sign}{Math.abs(discrepancy)} {item.unit}
        </span>
      );
    },
  });

  // Add discrepancy amount column if published
  if (inventory.status === 'published') {
    inventoryColumns.push({
      key: 'discrepancyAmount',
      label: t('warehouses.inventory.detail.table.discrepancyAmount'),
      render: (item) => {
        if (item.actualQuantity === null) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        const discrepancy = (item.actualQuantity - item.expectedQuantity) * item.costPrice;
        return (
          <DiscrepancyBar
            discrepancy={discrepancy}
            maxDiscrepancy={maxDiscrepancy}
            formatCurrency={formatCurrency}
          />
        );
      },
    });
  }

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
      label: t('warehouses.inventory.detail.table.product'),
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
      label: t('warehouses.inventory.detail.table.sku'),
      render: (product) => <span className="text-sm">{product.sku}</span>,
    },
    {
      key: 'category',
      label: t('warehouses.inventory.detail.table.category'),
      render: (product) => <span className="text-sm">{product.category}</span>,
    },
    {
      key: 'currentStock',
      label: t('warehouses.inventory.detail.table.currentStock'),
      render: (product) => <span className="text-sm">{product.currentStock} {product.unit}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('warehouses.inventory.detail.backToList')}
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
              <h2 className="text-2xl font-bold">{inventory.number}</h2>

              {/* Information with icons */}
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.inventory.detail.status')}
                  </span>
                  <div className="text-right">
                    <StatusBadge type="transaction" status={inventory.status} t={t} />
                  </div>
                </div>

                {/* Type */}
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.inventory.detail.type')}
                  </span>
                  <div className="text-right">
                    <Badge variant="outline">
                      {t(`warehouses.inventory.types.${inventory.type}`)}
                    </Badge>
                  </div>
                </div>

                {/* Creation Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.inventory.detail.createdDate')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {formatDate(inventory.date)}
                  </span>
                </div>

                {inventory.publishDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground flex-1">
                      {t('warehouses.inventory.detail.publishDate')}
                    </span>
                    <span className="text-sm font-medium text-right">
                      {formatDate(inventory.publishDate)}
                    </span>
                  </div>
                )}

                {/* Warehouse */}
                <div className="flex items-start gap-3">
                  <Warehouse className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.inventory.detail.warehouse')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {inventory.warehouseName}
                  </span>
                </div>

                {/* Responsible */}
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('warehouses.inventory.detail.responsible')}
                  </span>
                  <span className="text-sm font-medium text-right">
                    {inventory.responsibleName}
                  </span>
                </div>
              </div>

              {/* Notes section with separator */}
              {inventory.notes && (
                <>
                  <div className="border-t" />
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('warehouses.inventory.detail.notes')}
                      </p>
                      <p className="text-sm">{inventory.notes}</p>
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
                          <p>{t('warehouses.inventory.detail.actions.delete')}</p>
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
                          <p>{t('warehouses.inventory.detail.actions.edit')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {canPublish && (
                    <Button onClick={handlePublish} size="sm" className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white">
                      <Check className="mr-2 h-4 w-4" />
                      {t('warehouses.inventory.detail.actions.publish')}
                    </Button>
                  )}
                  {canCancelInventory && (
                    <Button variant="outline" onClick={handleCancel} size="sm">
                      <XCircle className="mr-2 h-4 w-4" />
                      {t('warehouses.inventory.detail.actions.cancel')}
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
                <TabsTrigger value="comments">{t('warehouses.inventory.detail.comments')}</TabsTrigger>
                <TabsTrigger value="history">{t('warehouses.inventory.detail.history')}</TabsTrigger>
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

        {/* Right column (~67%): Tabs + Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Segment Control Card */}
          <Card className="p-6">
            <Tabs value={rightTab} onValueChange={(val) => setRightTab(val as 'inventory' | 'documents')}>
              <TabsList>
                <TabsTrigger value="inventory">{t('warehouses.inventory.detail.inventory')}</TabsTrigger>
                <TabsTrigger value="documents">{t('warehouses.inventory.detail.documents')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>

          {/* Content based on active tab */}
          {rightTab === 'inventory' ? (
            <>
              {/* 2. KPI Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">{t('warehouses.inventory.detail.totalShortage')}</p>
                  <p className="text-2xl font-bold text-destructive">−{formatCurrency(totalShortage)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">{t('warehouses.inventory.detail.totalSurplus')}</p>
                  <p className="text-2xl font-bold text-green-600">+{formatCurrency(totalSurplus)}</p>
                </Card>
              </div>

              {/* 3. Table Block (Search + Table) */}
              <div className="space-y-0">
                {/* Search and buttons with padding */}
                <Card className="p-6 rounded-b-none">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder={t('warehouses.inventory.detail.searchProducts')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {inventory.type === 'partial' && inventory.status === 'draft' && (
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
                          {t('warehouses.inventory.detail.addProduct')}
                        </Button>
                      </>
                    )}
                    {inventory.status === 'published' && hasUnsavedChanges && (
                      <Button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white">
                        <Check className="mr-2 h-4 w-4" />
                        {t('warehouses.inventory.detail.saveChanges')}
                      </Button>
                    )}
                  </div>
                </Card>

                {/* Table without padding */}
                <Card className="rounded-t-none border-t-0">
                  <DataTable
                    data={filteredItems}
                    columns={inventoryColumns}
                    pagination={{ enabled: false }}
                  />
                </Card>
              </div>
            </>
          ) : (
            /* Documents Tab Content */
            <Card className="p-6">
              {inventory.status !== 'published' ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {t('warehouses.inventory.detail.noDocuments')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Receipt Document Card */}
                  {totalSurplus > 0 && (
                    <Card className="p-6 border-green-200">
                      <h3 className="text-lg font-semibold mb-4 text-green-700">
                        {t('warehouses.inventory.detail.receiptDocument')}
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('warehouses.inventory.detail.documentNumber')}</p>
                          <p className="font-medium">{mockDocuments[0]?.number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('warehouses.inventory.detail.documentDate')}</p>
                          <p className="font-medium">{formatDate(mockDocuments[0]?.date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('warehouses.inventory.detail.itemsCount')}</p>
                          <p className="font-medium">{mockDocuments[0]?.itemsCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('warehouses.inventory.detail.totalAmount')}</p>
                          <p className="text-lg font-bold text-green-600">+{formatCurrency(mockDocuments[0]?.totalAmount)}</p>
                        </div>
                        <Button variant="outline" className="w-full mt-4">
                          {t('warehouses.inventory.detail.openDocument')}
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Writeoff Document Card */}
                  {totalShortage > 0 && (
                    <Card className="p-6 border-red-200">
                      <h3 className="text-lg font-semibold mb-4 text-red-700">
                        {t('warehouses.inventory.detail.writeoffDocument')}
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('warehouses.inventory.detail.documentNumber')}</p>
                          <p className="font-medium">{mockDocuments[1]?.number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('warehouses.inventory.detail.documentDate')}</p>
                          <p className="font-medium">{formatDate(mockDocuments[1]?.date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('warehouses.inventory.detail.itemsCount')}</p>
                          <p className="font-medium">{mockDocuments[1]?.itemsCount}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('warehouses.inventory.detail.totalAmount')}</p>
                          <p className="text-lg font-bold text-destructive">−{formatCurrency(mockDocuments[1]?.totalAmount)}</p>
                        </div>
                        <Button variant="outline" className="w-full mt-4">
                          {t('warehouses.inventory.detail.openDocument')}
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Dialogs */}

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('warehouses.inventory.detail.confirmDialogs.publish.title')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.inventory.detail.confirmDialogs.publish.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={confirmPublish} className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white">
              {t('warehouses.inventory.detail.actions.publish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('warehouses.inventory.detail.confirmDialogs.cancel.title')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.inventory.detail.confirmDialogs.cancel.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              {t('warehouses.inventory.detail.actions.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('warehouses.inventory.detail.confirmDialogs.delete.title')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.inventory.detail.confirmDialogs.delete.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('warehouses.inventory.detail.actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Items Dialog (simplified - full implementation would have product search/selection) */}
      <Dialog open={addItemsDialogOpen} onOpenChange={setAddItemsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('warehouses.inventory.detail.selectProducts')}</DialogTitle>
            <DialogDescription>
              {t('warehouses.inventory.detail.selectProductsDescription')}
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('warehouses.inventory.detail.searchProducts')}
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
                    ? t('warehouses.inventory.detail.noProductsFound')
                    : t('warehouses.inventory.detail.noProductsAvailable')}
                </p>
              </div>
            )}
          </div>

          {/* Footer with selection counter and actions */}
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedVariantIds.size > 0 && (
                <>
                  {t('warehouses.inventory.detail.selectedProducts')}: <span className="font-medium">{selectedVariantIds.size}</span>
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
                {t('warehouses.inventory.detail.addSelectedProducts')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
