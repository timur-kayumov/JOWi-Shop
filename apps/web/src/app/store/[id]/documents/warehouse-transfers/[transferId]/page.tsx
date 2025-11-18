'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Search,
  Warehouse,
  Calendar,
  User,
  FileText,
  DollarSign,
  ArrowRightLeft,
  Trash2,
  Pencil,
  Check,
  XCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  Input,
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
  StatusBadge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DataTable,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Checkbox,
  Comments,
  ActivityHistory,
  formatDate,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type Column,
  type Comment,
} from '@jowi/ui';
import type {
  WarehouseTransferDetail,
  WarehouseTransferLineItem,
  Activity,
} from '@/types/warehouse-transfer';
import {
  mockWarehouseTransferDetails,
  mockWarehouseTransferComments,
  mockWarehouseTransferActivities,
} from '@/types/warehouse-transfer';

export default function WarehouseTransferDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const transferId = params.transferId as string;

  // Get mock data for this warehouse transfer
  const mockTransfer = mockWarehouseTransferDetails[transferId];
  const mockComments = mockWarehouseTransferComments[transferId] || [];
  const mockActivities = mockWarehouseTransferActivities[transferId] || [];

  // State management
  const [transfer, setTransfer] = useState<WarehouseTransferDetail | null>(mockTransfer);
  const [lineItems, setLineItems] = useState<WarehouseTransferLineItem[]>(
    mockTransfer?.lineItems || []
  );
  const [originalLineItems, setOriginalLineItems] = useState<WarehouseTransferLineItem[]>(
    mockTransfer?.lineItems || []
  );
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addProductsDialogOpen, setAddProductsDialogOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<'comments' | 'history'>('comments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [activities, setActivities] = useState<Activity[]>(mockActivities);

  const currentUserId = 'user1';

  // Permissions based on status
  const canEdit = transfer?.status !== 'canceled';
  const canPublish = transfer?.status === 'draft';
  const canCancelTransfer = transfer?.status === 'published';
  const canDelete = transfer?.status === 'draft';
  const canAddRemoveItems = transfer?.status === 'draft';
  const canEditQuantity = transfer?.status !== 'canceled';
  const canEditPrices = transfer?.status === 'draft';
  const showAvailableColumn = transfer?.status === 'draft';

  // Calculate KPI metrics
  const kpiMetrics = useMemo(() => {
    const costPrice = lineItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
    const total = lineItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
    const profit = total - costPrice;

    return { costPrice, total, profit };
  }, [lineItems]);

  // Utility functions
  const formatCurrency = (amount: number): string => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сўм';
  };

  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/\s/g, '');
    return parseFloat(cleaned) || 0;
  };

  const formatNumber = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Navigation
  const handleBack = () => {
    router.push(`/store/${params.id}/documents/warehouse-transfers`);
  };

  // Filter line items by search query
  const filteredLineItems = useMemo(() => {
    if (!searchQuery.trim()) return lineItems;
    const search = searchQuery.toLowerCase();
    return lineItems.filter(
      (item) =>
        item.productName.toLowerCase().includes(search) ||
        item.brandAndVolume?.toLowerCase().includes(search)
    );
  }, [lineItems, searchQuery]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedItems.size === filteredLineItems.length && filteredLineItems.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredLineItems.map((item) => item.id)));
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

  // Item edit handlers
  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseNumber(value);

    const updatedItems = lineItems.map((item) => {
      if (item.id === itemId) {
        const total = quantity * item.sellingPrice;
        return { ...item, quantity, total };
      }
      return item;
    });

    setLineItems(updatedItems);

    // Check for changes in published transfers
    if (transfer?.status === 'published') {
      const hasChanges = updatedItems.some((item, index) => {
        return (
          item.quantity !== originalLineItems[index]?.quantity ||
          item.costPrice !== originalLineItems[index]?.costPrice ||
          item.sellingPrice !== originalLineItems[index]?.sellingPrice ||
          item.total !== originalLineItems[index]?.total
        );
      });
      setHasUnsavedChanges(hasChanges);
    }
  };

  const handleCostPriceChange = (itemId: string, value: string) => {
    if (!canEditPrices) return;

    const costPrice = parseNumber(value);

    const updatedItems = lineItems.map((item) => {
      if (item.id === itemId) {
        return { ...item, costPrice };
      }
      return item;
    });

    setLineItems(updatedItems);

    // Check for changes in published transfers
    if (transfer?.status === 'published') {
      const hasChanges = updatedItems.some((item, index) => {
        return (
          item.quantity !== originalLineItems[index]?.quantity ||
          item.costPrice !== originalLineItems[index]?.costPrice ||
          item.sellingPrice !== originalLineItems[index]?.sellingPrice ||
          item.total !== originalLineItems[index]?.total
        );
      });
      setHasUnsavedChanges(hasChanges);
    }
  };

  const handleSellingPriceChange = (itemId: string, value: string) => {
    if (!canEditPrices) return;

    const sellingPrice = parseNumber(value);

    const updatedItems = lineItems.map((item) => {
      if (item.id === itemId) {
        const total = item.quantity * sellingPrice;
        return { ...item, sellingPrice, total };
      }
      return item;
    });

    setLineItems(updatedItems);

    // Check for changes in published transfers
    if (transfer?.status === 'published') {
      const hasChanges = updatedItems.some((item, index) => {
        return (
          item.quantity !== originalLineItems[index]?.quantity ||
          item.costPrice !== originalLineItems[index]?.costPrice ||
          item.sellingPrice !== originalLineItems[index]?.sellingPrice ||
          item.total !== originalLineItems[index]?.total
        );
      });
      setHasUnsavedChanges(hasChanges);
    }
  };

  // Action handlers
  const handlePublish = () => {
    setPublishDialogOpen(true);
  };

  const confirmPublish = () => {
    if (transfer) {
      setTransfer({
        ...transfer,
        status: 'published',
        publishedAt: new Date(),
      });
      setOriginalLineItems([...lineItems]);
      setHasUnsavedChanges(false);
      setPublishDialogOpen(false);

      // Add activity
      const newActivity: Activity = {
        id: `a${activities.length + 1}`,
        type: 'status_changed',
        userId: currentUserId,
        userName: transfer.responsibleName,
        description: t('documents.warehouseTransfers.detail.toasts.publishSuccess'),
        newStatus: 'Опубликовано',
        timestamp: new Date(),
      };
      setActivities([...activities, newActivity]);
    }
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (transfer) {
      setTransfer({
        ...transfer,
        status: 'canceled',
      });
      setCancelDialogOpen(false);

      // Add activity
      const newActivity: Activity = {
        id: `a${activities.length + 1}`,
        type: 'status_changed',
        userId: currentUserId,
        userName: transfer.responsibleName,
        description: t('documents.warehouseTransfers.detail.toasts.cancelSuccess'),
        newStatus: 'Отменено',
        timestamp: new Date(),
      };
      setActivities([...activities, newActivity]);
    }
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setDeleteDialogOpen(false);
    // In real implementation, delete from backend and redirect
    handleBack();
  };

  const handleDeleteSelected = () => {
    const updatedItems = lineItems.filter((item) => !selectedItems.has(item.id));
    setLineItems(updatedItems);
    setSelectedItems(new Set());

    if (transfer) {
      setTransfer({
        ...transfer,
        itemsCount: updatedItems.length,
      });
    }
  };

  const handleSaveChanges = () => {
    setOriginalLineItems([...lineItems]);
    setHasUnsavedChanges(false);
  };

  // Comment handlers
  const handleAddComment = (text: string) => {
    const newComment: Comment = {
      id: `c${comments.length + 1}`,
      userId: currentUserId,
      userName: transfer?.responsibleName || 'Current User',
      text,
      createdAt: new Date(),
    };
    setComments([...comments, newComment]);
  };

  const handleEditComment = (commentId: string, newText: string) => {
    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              text: newText,
              updatedAt: new Date(),
              isEdited: true,
            }
          : comment
      )
    );
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((comment) => comment.id !== commentId));
  };

  // Table columns
  const transferColumns: Column<WarehouseTransferLineItem>[] = [];

  if (canAddRemoveItems) {
    transferColumns.push({
      key: 'checkbox',
      label: (
        <Checkbox
          checked={
            selectedItems.size === filteredLineItems.length && filteredLineItems.length > 0
          }
          onCheckedChange={handleSelectAll}
        />
      ),
      className: 'w-12',
      render: (item) => (
        <Checkbox
          checked={selectedItems.has(item.id)}
          onCheckedChange={() => handleSelectItem(item.id)}
        />
      ),
    });
  }

  transferColumns.push({
    key: 'productName',
    label: t('documents.warehouseTransfers.detail.table.product'),
    render: (item) => (
      <div>
        <p className="font-medium">{item.productName}</p>
        {item.brandAndVolume && (
          <p className="text-sm text-muted-foreground">{item.brandAndVolume}</p>
        )}
      </div>
    ),
  });

  // Available column - only in draft status
  if (showAvailableColumn) {
    transferColumns.push({
      key: 'available',
      label: t('documents.warehouseTransfers.detail.table.available'),
      className: 'w-[140px]',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{formatNumber(item.availableQuantity || 0)}</span>
          <span className="text-sm text-muted-foreground">{item.unit}</span>
        </div>
      ),
    });
  }

  transferColumns.push({
    key: 'quantity',
    label: t('documents.warehouseTransfers.detail.table.quantity'),
    className: 'w-[180px]',
    render: (item) =>
      canEditQuantity ? (
        <InputGroup>
          <InputGroupInput
            type="text"
            value={formatNumber(item.quantity)}
            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
          />
          <InputGroupAddon side="right">
            <InputGroupText>{item.unit}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-medium">{formatNumber(item.quantity)}</span>
          <span className="text-sm text-muted-foreground">{item.unit}</span>
        </div>
      ),
  });

  transferColumns.push({
    key: 'price',
    label: t('documents.warehouseTransfers.detail.table.price'),
    className: 'w-[180px]',
    render: (item) =>
      canEditPrices ? (
        <InputGroup>
          <InputGroupInput
            type="text"
            value={formatNumber(item.costPrice)}
            onChange={(e) => handleCostPriceChange(item.id, e.target.value)}
          />
          <InputGroupAddon side="right">
            <InputGroupText>сўм</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <span className="font-medium">{formatCurrency(item.costPrice)}</span>
      ),
  });

  transferColumns.push({
    key: 'amount',
    label: t('documents.warehouseTransfers.detail.table.amount'),
    className: 'w-[180px]',
    render: (item) =>
      canEditPrices ? (
        <InputGroup>
          <InputGroupInput
            type="text"
            value={formatNumber(item.sellingPrice)}
            onChange={(e) => handleSellingPriceChange(item.id, e.target.value)}
          />
          <InputGroupAddon side="right">
            <InputGroupText>сўм</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <span className="font-medium">{formatCurrency(item.sellingPrice)}</span>
      ),
  });

  if (!transfer) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          {t('documents.warehouseTransfers.detail.table.noProducts')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={handleBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        {t('documents.warehouseTransfers.detail.backToList')}
      </Button>

      {/* Main grid layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6">
          {/* Information card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{transfer.documentNumber}</h2>
                <StatusBadge type="transaction" status={transfer.status} />
              </div>

              <div className="space-y-3">
                {/* Source Warehouse */}
                <div className="flex items-start gap-3">
                  <Warehouse className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm text-muted-foreground">
                    {t('documents.warehouseTransfers.detail.sourceWarehouse')}
                  </span>
                  <span className="text-right text-sm font-medium">
                    {transfer.sourceWarehouseName}
                  </span>
                </div>

                {/* Destination Warehouse */}
                <div className="flex items-start gap-3">
                  <ArrowRightLeft className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm text-muted-foreground">
                    {t('documents.warehouseTransfers.detail.destinationWarehouse')}
                  </span>
                  <span className="text-right text-sm font-medium">
                    {transfer.destinationWarehouseName}
                  </span>
                </div>

                {/* Created Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm text-muted-foreground">
                    {t('documents.warehouseTransfers.detail.created')}
                  </span>
                  <span className="text-right text-sm font-medium">
                    {formatDate(transfer.createdAt)}
                  </span>
                </div>

                {/* Published Date */}
                {transfer.publishedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-sm text-muted-foreground">
                      {t('documents.warehouseTransfers.detail.published')}
                    </span>
                    <span className="text-right text-sm font-medium">
                      {formatDate(transfer.publishedAt)}
                    </span>
                  </div>
                )}

                {/* Responsible */}
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm text-muted-foreground">
                    {t('documents.warehouseTransfers.detail.responsible')}
                  </span>
                  <span className="text-right text-sm font-medium">{transfer.responsibleName}</span>
                </div>

                {/* Items Count */}
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-sm text-muted-foreground">
                    {t('documents.warehouseTransfers.detail.itemsCount')}
                  </span>
                  <span className="text-right text-sm font-medium">{transfer.itemsCount}</span>
                </div>
              </div>

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
                          <p>{t('documents.warehouseTransfers.detail.actions.delete')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {canEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {}}
                            className="h-10 w-10 bg-muted hover:bg-muted/80"
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('documents.warehouseTransfers.detail.actions.edit')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {canPublish && (
                    <Button onClick={handlePublish} size="sm" className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white">
                      <Check className="mr-2 h-4 w-4" />
                      {t('documents.warehouseTransfers.detail.actions.publish')}
                    </Button>
                  )}
                  {canCancelTransfer && (
                    <Button variant="outline" onClick={handleCancel} size="sm">
                      <XCircle className="mr-2 h-4 w-4" />
                      {t('documents.warehouseTransfers.detail.actions.cancel')}
                    </Button>
                  )}
                </div>
              </TooltipProvider>
            </div>
          </Card>

          {/* Comments/History tabs */}
          <Card className="p-6">
            <Tabs value={leftTab} onValueChange={(value) => setLeftTab(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comments">
                  {t('documents.warehouseTransfers.detail.comments')}
                </TabsTrigger>
                <TabsTrigger value="history">
                  {t('documents.warehouseTransfers.detail.history')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="comments" className="mt-4">
                <Comments
                  comments={comments}
                  currentUserId={currentUserId}
                  onAdd={handleAddComment}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                />
              </TabsContent>
              <TabsContent value="history" className="mt-4">
                <ActivityHistory activities={activities} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6 lg:col-span-2">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {t('documents.warehouseTransfers.detail.kpi.costPrice')}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(kpiMetrics.costPrice)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {t('documents.warehouseTransfers.detail.kpi.total')}
              </p>
              <p className="text-2xl font-bold">{formatCurrency(kpiMetrics.total)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {t('documents.warehouseTransfers.detail.kpi.profit')}
              </p>
              <p className={`text-2xl font-bold ${
                kpiMetrics.profit >= 0 ? 'text-green-600' : 'text-destructive'
              }`}>
                {kpiMetrics.profit >= 0 ? '+' : '−'}{formatCurrency(Math.abs(kpiMetrics.profit))}
              </p>
            </Card>
          </div>

          {/* Table Block */}
          <div className="space-y-0">
          {/* Search and actions card */}
          <Card className="rounded-b-none p-6">
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('documents.warehouseTransfers.detail.searchProducts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Delete selected */}
              {canAddRemoveItems && selectedItems.size > 0 && (
                <Button variant="destructive" onClick={handleDeleteSelected}>
                  {t('documents.warehouseTransfers.detail.deleteSelected')} ({selectedItems.size})
                </Button>
              )}

              {/* Add products */}
              {canAddRemoveItems && (
                <Button onClick={() => setAddProductsDialogOpen(true)}>
                  {t('documents.warehouseTransfers.detail.addProducts')}
                </Button>
              )}

              {/* Save changes */}
              {transfer.status === 'published' && hasUnsavedChanges && (
                <Button onClick={handleSaveChanges}>
                  {t('documents.warehouseTransfers.detail.saveChanges')}
                </Button>
              )}
            </div>
          </Card>

          {/* Data table card */}
          <Card className="rounded-t-none border-t-0">
            <DataTable
              columns={transferColumns}
              data={filteredLineItems}
              emptyMessage={t('documents.warehouseTransfers.detail.table.noProducts')}
            />
          </Card>
          </div>
        </div>
      </div>

      {/* Publish confirmation dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('documents.warehouseTransfers.detail.confirmDialogs.publish.title')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.warehouseTransfers.detail.confirmDialogs.publish.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={confirmPublish} className="bg-green-600 hover:bg-green-700">
              {t('documents.warehouseTransfers.detail.actions.publish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('documents.warehouseTransfers.detail.confirmDialogs.cancel.title')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.warehouseTransfers.detail.confirmDialogs.cancel.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={confirmCancel} variant="destructive">
              {t('documents.warehouseTransfers.detail.actions.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('documents.warehouseTransfers.detail.confirmDialogs.delete.title')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.warehouseTransfers.detail.confirmDialogs.delete.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              {t('documents.warehouseTransfers.detail.actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add products dialog (placeholder) */}
      <Dialog open={addProductsDialogOpen} onOpenChange={setAddProductsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('documents.warehouseTransfers.detail.confirmDialogs.addProducts.title')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.warehouseTransfers.detail.confirmDialogs.addProducts.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-muted-foreground">
              {t('documents.warehouseTransfers.detail.confirmDialogs.addProducts.noProductsAvailable')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProductsDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button disabled>
              {t('documents.warehouseTransfers.detail.confirmDialogs.addProducts.addSelected')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
