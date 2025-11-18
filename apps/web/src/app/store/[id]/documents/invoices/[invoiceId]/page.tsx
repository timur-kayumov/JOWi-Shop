'use client';

import { useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  Warehouse,
  User,
  FileText,
  Package,
  DollarSign,
  Hash,
  Search,
  Plus,
  Trash,
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
  type Column,
  type Comment,
} from '@jowi/ui';

import { toast } from '@/lib/toast';

import type {
  InvoiceDetail,
  InvoiceLineItem,
  InvoiceStatus,
} from '@/types/invoice';
import {
  mockInvoiceDetails,
  mockInvoiceComments,
  mockInvoiceActivities,
} from '@/types/invoice';

// ==================== UTILITIES ====================

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

// ==================== COMPONENT ====================

export default function InvoiceDetailPage() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  // ==================== STATE ====================

  // Get mock data for this invoice
  const mockInvoice = mockInvoiceDetails[invoiceId];
  const mockComments = mockInvoiceComments[invoiceId] || [];
  const mockActivities = mockInvoiceActivities[invoiceId] || [];

  // Invoice data
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(mockInvoice);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>(
    mockInvoice?.lineItems || []
  );
  const [originalLineItems, setOriginalLineItems] = useState<InvoiceLineItem[]>(
    mockInvoice?.lineItems || []
  );

  // Comments & Activity
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const currentUserId = 'user1'; // Mock current user

  // UI State
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addProductsDialogOpen, setAddProductsDialogOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<'comments' | 'history'>('comments');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ==================== HANDLERS ====================

  // Navigate back to list
  const handleBack = () => {
    router.push(`/store/${params.id}/documents/invoices`);
  };

  // Publish invoice
  const handlePublish = () => {
    setPublishDialogOpen(true);
  };

  const confirmPublish = () => {
    if (!invoice) return;

    // Update invoice status
    setInvoice({ ...invoice, status: 'published', publishedAt: new Date() });
    setOriginalLineItems([...lineItems]); // Save snapshot
    setPublishDialogOpen(false);
    toast.success(t('documents.invoices.detail.toasts.publishSuccess'));
  };

  // Cancel invoice
  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (!invoice) return;

    // Update invoice status
    setInvoice({ ...invoice, status: 'canceled' });
    setCancelDialogOpen(false);
    toast.success(t('documents.invoices.detail.toasts.cancelSuccess'));
  };

  // Delete invoice
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setDeleteDialogOpen(false);
    toast.success(t('documents.invoices.detail.toasts.deleteSuccess'));
    // Navigate back after short delay
    setTimeout(() => handleBack(), 500);
  };

  // Save changes (for published invoices)
  const handleSaveChanges = () => {
    setOriginalLineItems([...lineItems]);
    setHasUnsavedChanges(false);
    toast.success(t('documents.invoices.detail.toasts.saveSuccess'));
  };

  // Line item quantity change
  const handleQuantityChange = (itemId: string, value: string) => {
    const quantity = parseNumber(value);

    const updatedItems = lineItems.map((item) => {
      if (item.id === itemId) {
        const total = quantity * item.price;
        return { ...item, quantity, total };
      }
      return item;
    });

    setLineItems(updatedItems);

    // Check for changes in published invoices
    if (invoice?.status === 'published') {
      const hasChanges = updatedItems.some((item, index) => {
        return (
          item.quantity !== originalLineItems[index]?.quantity ||
          item.price !== originalLineItems[index]?.price ||
          item.total !== originalLineItems[index]?.total
        );
      });
      setHasUnsavedChanges(hasChanges);
    }
  };

  // Line item price change
  const handlePriceChange = (itemId: string, value: string) => {
    const price = parseNumber(value);

    const updatedItems = lineItems.map((item) => {
      if (item.id === itemId) {
        const total = item.quantity * price;
        return { ...item, price, total };
      }
      return item;
    });

    setLineItems(updatedItems);

    // Check for changes in published invoices
    if (invoice?.status === 'published') {
      const hasChanges = updatedItems.some((item, index) => {
        return (
          item.quantity !== originalLineItems[index]?.quantity ||
          item.price !== originalLineItems[index]?.price ||
          item.total !== originalLineItems[index]?.total
        );
      });
      setHasUnsavedChanges(hasChanges);
    }
  };

  // Line item total change
  const handleTotalChange = (itemId: string, value: string) => {
    const total = parseNumber(value);

    const updatedItems = lineItems.map((item) => {
      if (item.id === itemId) {
        const price = item.quantity > 0 ? total / item.quantity : 0;
        return { ...item, total, price };
      }
      return item;
    });

    setLineItems(updatedItems);

    // Check for changes in published invoices
    if (invoice?.status === 'published') {
      const hasChanges = updatedItems.some((item, index) => {
        return (
          item.quantity !== originalLineItems[index]?.quantity ||
          item.price !== originalLineItems[index]?.price ||
          item.total !== originalLineItems[index]?.total
        );
      });
      setHasUnsavedChanges(hasChanges);
    }
  };

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

  // Bulk delete
  const handleBulkDelete = () => {
    setLineItems(lineItems.filter((item) => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };

  // Comments handlers
  const handleAddComment = async (text: string) => {
    const newComment: Comment = {
      id: `c${Date.now()}`,
      userId: currentUserId,
      userName: 'Текущий пользователь',
      text,
      createdAt: new Date(),
    };
    setComments([...comments, newComment]);
    toast.success(t('documents.invoices.detail.toasts.commentAdded'));
  };

  const handleEditComment = async (commentId: string, text: string) => {
    setComments(
      comments.map((c) =>
        c.id === commentId ? { ...c, text, updatedAt: new Date() } : c
      )
    );
    toast.success(t('documents.invoices.detail.toasts.commentUpdated'));
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
    toast.success(t('documents.invoices.detail.toasts.commentDeleted'));
  };

  // ==================== PERMISSIONS ====================

  const canEdit = invoice?.status !== 'canceled';
  const canPublish = invoice?.status === 'draft';
  const canCancelInvoice = invoice?.status === 'published';
  const canDelete = invoice?.status === 'draft';
  const canAddRemoveItems = invoice?.status === 'draft';

  // ==================== CALCULATIONS ====================

  const { totalAmount, totalItems } = useMemo(() => {
    let amount = 0;
    let count = 0;
    lineItems.forEach((item) => {
      amount += item.total;
      count += 1;
    });
    return { totalAmount: amount, totalItems: count };
  }, [lineItems]);

  const filteredLineItems = useMemo(() => {
    if (!searchQuery.trim()) return lineItems;
    const search = searchQuery.toLowerCase();
    return lineItems.filter(
      (item) =>
        item.productName.toLowerCase().includes(search) ||
        item.brandAndVolume?.toLowerCase().includes(search)
    );
  }, [lineItems, searchQuery]);

  // ==================== TABLE COLUMNS ====================

  const invoiceColumns: Column<InvoiceLineItem>[] = [];

  // Conditionally add checkbox for draft
  if (canAddRemoveItems) {
    invoiceColumns.push({
      key: 'checkbox',
      label: (
        <Checkbox
          checked={
            selectedItems.size === filteredLineItems.length &&
            filteredLineItems.length > 0
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

  // Product name column
  invoiceColumns.push({
    key: 'productName',
    label: t('documents.invoices.detail.table.product'),
    render: (item) => (
      <div>
        <p className="font-medium">{item.productName}</p>
        {item.brandAndVolume && (
          <p className="text-sm text-muted-foreground">{item.brandAndVolume}</p>
        )}
      </div>
    ),
  });

  // Quantity column (editable input for draft)
  invoiceColumns.push({
    key: 'quantity',
    label: t('documents.invoices.detail.table.quantity'),
    render: (item) =>
      canEdit ? (
        <InputGroup>
          <InputGroupInput
            type="text"
            value={formatNumber(item.quantity)}
            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{item.unit}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <div className="text-sm">
          {formatNumber(item.quantity)} {item.unit}
        </div>
      ),
  });

  // Price column (editable input for draft)
  invoiceColumns.push({
    key: 'price',
    label: t('documents.invoices.detail.table.price'),
    render: (item) =>
      canEdit ? (
        <InputGroup>
          <InputGroupInput
            type="text"
            value={formatNumber(item.price)}
            onChange={(e) => handlePriceChange(item.id, e.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>сўм</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <div className="text-sm">{formatCurrency(item.price)}</div>
      ),
  });

  // Total column (editable input for draft)
  invoiceColumns.push({
    key: 'total',
    label: t('documents.invoices.detail.table.total'),
    render: (item) =>
      canEdit ? (
        <InputGroup>
          <InputGroupInput
            type="text"
            value={formatNumber(item.total)}
            onChange={(e) => handleTotalChange(item.id, e.target.value)}
            className="font-medium"
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>сўм</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      ) : (
        <div className="text-sm font-medium">{formatCurrency(item.total)}</div>
      ),
  });

  // ==================== RENDER ====================

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">
          {t('documents.invoices.emptyMessage')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('documents.invoices.detail.backToList')}
        </Button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (33%) */}
        <div className="space-y-6">
          {/* Information Card */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <h2 className="text-2xl font-bold">{invoice.documentNumber}</h2>
                <div className="mt-2">
                  <StatusBadge
                    type="transaction"
                    status={invoice.status}
                    t={t}
                  />
                </div>
              </div>

              {/* Information fields */}
              <div className="space-y-3">
                {/* Supplier */}
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('documents.invoices.detail.supplier')}
                  </span>
                  <div className="text-right text-sm font-medium">
                    {invoice.supplierName}
                  </div>
                </div>

                {/* Warehouse */}
                <div className="flex items-start gap-3">
                  <Warehouse className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('documents.invoices.detail.warehouse')}
                  </span>
                  <div className="text-right text-sm font-medium">
                    {invoice.warehouseName}
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('documents.invoices.detail.created')}
                  </span>
                  <div className="text-right text-sm">
                    {formatDate(invoice.createdAt)}
                  </div>
                </div>

                {/* Published Date */}
                {invoice.publishedAt && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground flex-1">
                      {t('documents.invoices.detail.published')}
                    </span>
                    <div className="text-right text-sm">
                      {formatDate(invoice.publishedAt)}
                    </div>
                  </div>
                )}

                {/* Responsible */}
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('documents.invoices.detail.responsible')}
                  </span>
                  <div className="text-right text-sm font-medium">
                    {invoice.responsibleName}
                  </div>
                </div>

                {/* Items Count */}
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('documents.invoices.detail.itemsCount')}
                  </span>
                  <div className="text-right text-sm font-medium">
                    {totalItems}
                  </div>
                </div>

                {/* Total Amount */}
                <div className="flex items-start gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {t('documents.invoices.detail.totalAmount')}
                  </span>
                  <div className="text-right text-sm font-bold">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <>
                  <div className="border-t" />
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('documents.invoices.detail.notes')}
                      </p>
                      <p className="text-sm">{invoice.notes}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {canPublish && (
                  <Button
                    onClick={handlePublish}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {t('documents.invoices.detail.actions.publish')}
                  </Button>
                )}

                {canCancelInvoice && (
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    className="w-full"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('documents.invoices.detail.actions.cancel')}
                  </Button>
                )}

                {canDelete && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="w-full text-destructive hover:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    {t('documents.invoices.detail.actions.delete')}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Comments/History Tabs Card */}
          <Card className="p-6">
            <Tabs
              value={leftTab}
              onValueChange={(val) => setLeftTab(val as 'comments' | 'history')}
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="comments">
                  {t('documents.invoices.detail.comments')}
                </TabsTrigger>
                <TabsTrigger value="history">
                  {t('documents.invoices.detail.history')}
                </TabsTrigger>
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

        {/* RIGHT COLUMN (67%) */}
        <div className="lg:col-span-2 space-y-0">
          {/* Search and Buttons Card */}
          <Card className="p-6 rounded-b-none">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('documents.invoices.detail.searchProducts')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {canAddRemoveItems && selectedItems.size > 0 && (
                <Button variant="outline" onClick={handleBulkDelete}>
                  <Trash className="mr-2 h-4 w-4" />
                  {t('documents.invoices.detail.deleteSelected')} (
                  {selectedItems.size})
                </Button>
              )}

              {canAddRemoveItems && (
                <Button onClick={() => setAddProductsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('documents.invoices.detail.addProducts')}
                </Button>
              )}

              {invoice.status === 'published' && hasUnsavedChanges && (
                <Button
                  onClick={handleSaveChanges}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {t('documents.invoices.detail.saveChanges')}
                </Button>
              )}
            </div>
          </Card>

          {/* Table Card */}
          <Card className="rounded-t-none border-t-0">
            <DataTable
              data={filteredLineItems}
              columns={invoiceColumns}
              emptyMessage={t('documents.invoices.detail.table.noProducts')}
              pagination={{ enabled: false }}
              className="[&_table]:table-fixed"
            />
          </Card>
        </div>
      </div>

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('documents.invoices.detail.confirmDialogs.publish.title')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.invoices.detail.confirmDialogs.publish.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}
            >
              {t('actions.cancel')}
            </Button>
            <Button
              onClick={confirmPublish}
              className="bg-green-600 hover:bg-green-700"
            >
              {t('documents.invoices.detail.actions.publish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('documents.invoices.detail.confirmDialogs.cancel.title')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.invoices.detail.confirmDialogs.cancel.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              {t('documents.invoices.detail.actions.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('documents.invoices.detail.confirmDialogs.delete.title')}
            </DialogTitle>
            <DialogDescription>
              {t('documents.invoices.detail.confirmDialogs.delete.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('documents.invoices.detail.actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Products Dialog */}
      <Dialog
        open={addProductsDialogOpen}
        onOpenChange={setAddProductsDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {t('documents.invoices.detail.confirmDialogs.addProducts.title')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'documents.invoices.detail.confirmDialogs.addProducts.description'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              {t(
                'documents.invoices.detail.confirmDialogs.addProducts.noProductsAvailable'
              )}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddProductsDialogOpen(false)}
            >
              {t('actions.cancel')}
            </Button>
            <Button onClick={() => setAddProductsDialogOpen(false)}>
              {t(
                'documents.invoices.detail.confirmDialogs.addProducts.addSelected'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
