'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Check, XCircle } from 'lucide-react';
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
  type Comment,
  type Activity,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';

// ==================== TYPES ====================

type EntityType = 'safe' | 'cash_register' | 'counterparty';
type AccrualType = 'system' | 'user';
type AccrualStatus = 'draft' | 'published' | 'canceled';

interface EntityReference {
  type: EntityType;
  id: string;
  name: string;
  balance?: number; // For display purposes
}

interface Accrual {
  id: string;
  datetime: Date;
  purposeId: string;
  purposeName: string;
  source: EntityReference;
  recipient: EntityReference;
  amount: number;
  type: AccrualType;
  status: AccrualStatus;
}

// ==================== MOCK DATA ====================

// Mock accrual data (in real app, this would come from API)
const mockAccrual: Accrual = {
  id: '1',
  datetime: new Date('2025-11-10T10:30:00'),
  purposeId: 'p1',
  purposeName: 'Начисление зарплаты',
  source: { type: 'safe', id: 's2', name: 'Расчетный счет', balance: 5800000 },
  recipient: { type: 'counterparty', id: 'c2', name: 'ИП Иванов А.А.', balance: -5800000 },
  amount: 8000000,
  type: 'system',
  status: 'draft',
};

// Mock comments (fixed dates to avoid hydration errors)
const mockComments: Comment[] = [
  {
    id: '1',
    userId: '1',
    userName: 'UserName',
    text: '@Александр Разнообразный и богатый опыт постоянный количественный рост и сфера нашей активности представляет собой',
    createdAt: new Date('2025-11-12T01:21:00'), // 5 minutes before page load
  },
  {
    id: '2',
    userId: '2',
    userName: 'Иван Петров',
    text: 'Согласовано с руководством. Можно проводить начисление.',
    createdAt: new Date('2025-11-11T23:26:00'), // 2 hours before page load
  },
  {
    id: '3',
    userId: '1',
    userName: 'UserName',
    text: 'Спасибо за быстрый ответ!',
    createdAt: new Date('2025-11-11T01:26:00'), // yesterday
    updatedAt: new Date('2025-11-11T01:36:00'), // edited 10 min after
  },
];

// Mock activity history (sorted from newest to oldest)
const mockActivities: Activity[] = [
  {
    id: '7',
    type: 'status_changed',
    userId: '1',
    userName: 'Имя Пользователя',
    userAvatar: undefined,
    timestamp: new Date('2025-02-12T07:00:00'),
    newStatus: 'Отменено',
  },
  {
    id: '6',
    type: 'updated',
    userId: '1',
    userName: 'Имя Пользователя',
    userAvatar: undefined,
    timestamp: new Date('2025-02-12T07:00:00'),
    description: 'Отказ при рассмотрении',
  },
  {
    id: '5',
    type: 'updated',
    userId: '1',
    userName: 'Имя Пользователя',
    userAvatar: undefined,
    timestamp: new Date('2025-02-12T12:06:00'),
    description: 'Сменил сумму содержимого',
    changes: [
      {
        field: 'amount',
        fieldLabel: 'Сумма',
        oldValue: '7 500 000 сум',
        newValue: '8 000 000 сум',
      },
    ],
  },
  {
    id: '4',
    type: 'status_changed',
    userId: '1',
    userName: 'Имя Пользователя',
    userAvatar: undefined,
    timestamp: new Date('2025-02-12T12:06:00'),
    newStatus: 'Опубликовано',
  },
  {
    id: '3',
    type: 'created',
    userId: '1',
    userName: 'Имя Пользователя',
    userAvatar: undefined,
    timestamp: new Date('2025-02-12T07:00:00'),
    description: 'Создано со статусом Черновик',
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

const getEntityTypeLabel = (type: EntityType, t: any): string => {
  switch (type) {
    case 'safe':
      return t('finance.accruals.safe');
    case 'cash_register':
      return t('finance.accruals.cashRegister');
    case 'counterparty':
      return t('finance.accruals.counterparty');
  }
};

const getTypeLabel = (type: AccrualType, t: any): string => {
  switch (type) {
    case 'system':
      return t('finance.accruals.system');
    case 'user':
      return t('finance.accruals.user');
  }
};

// ==================== MAIN COMPONENT ====================

export default function AccrualDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const accrualId = params.accrualId as string;
  const { t } = useTranslation('common');

  // In real app, fetch accrual by ID
  const [accrual, setAccrual] = useState<Accrual>(mockAccrual);

  // State for comments
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const currentUserId = '1'; // Mock current user

  // Dialog states
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
    toast.success(t('messages.success'), t('finance.accruals.detail.commentAdded'));
  };

  const handleEditComment = (commentId: string, text: string) => {
    setComments(
      comments.map((c) =>
        c.id === commentId ? { ...c, text, updatedAt: new Date() } : c
      )
    );
    toast.success(t('messages.success'), t('finance.accruals.detail.commentEdited'));
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
    toast.success(t('messages.success'), t('finance.accruals.detail.commentDeleted'));
  };

  // Accrual actions
  const handleEdit = () => {
    toast.info(t('finance.accruals.detail.inDevelopment'), t('finance.accruals.editAccrual'));
    // TODO: Integrate with backend API
    // PATCH /api/accruals/{id}
    // Open edit dialog or navigate to edit page
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    // TODO: Integrate with backend API
    // DELETE /api/accruals/{id}
    toast.success(t('messages.success'), t('finance.accruals.deleteSuccess'));
    router.push(`/store/${storeId}/finance/accruals`);
  };

  const handlePublish = () => {
    setPublishDialogOpen(true);
  };

  const confirmPublish = () => {
    // TODO: Integrate with backend API
    // POST /api/accruals/{id}/publish
    setAccrual({ ...accrual, status: 'published' });
    toast.success(t('messages.success'), t('finance.accruals.detail.statusUpdated'));
    setPublishDialogOpen(false);
  };

  const handleCancel = () => {
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    // TODO: Integrate with backend API
    // POST /api/accruals/{id}/cancel
    setAccrual({ ...accrual, status: 'canceled' });
    toast.success(t('messages.success'), t('finance.accruals.detail.statusUpdated'));
    setCancelDialogOpen(false);
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/finance/accruals`);
  };

  // Determine which buttons to show based on status
  const canEdit = accrual.status !== 'canceled';
  const canPublish = accrual.status === 'draft';
  const canCancelAccrual = accrual.status === 'published';
  const canDelete = accrual.status === 'draft';

  return (
    <div className="space-y-6">
      {/* Header with back button only */}
      <div className="flex items-center">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('actions.backToList')}
        </Button>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Main info + Payment operations */}
        <div className="space-y-6">
          {/* Accrual Details Card */}
          <Card className="p-6">
            <div className="space-y-4">
              {/* Purpose Name as first field (larger text) */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">{t('finance.accruals.detail.purpose')}</p>
                <h2 className="text-2xl font-bold">{accrual.purposeName}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('finance.accruals.detail.date')}</p>
                  <p className="text-sm font-medium">{formatDate(accrual.datetime)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('finance.accruals.detail.amount')}</p>
                  <p className="text-lg font-semibold">{formatCurrency(accrual.amount)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('finance.accruals.detail.type')}</p>
                  <Badge variant={accrual.type === 'system' ? 'secondary' : 'default'}>
                    {getTypeLabel(accrual.type, t)}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('finance.accruals.detail.status')}</p>
                  <StatusBadge type="transaction" status={accrual.status} t={t} />
                </div>
              </div>

              {/* Action buttons inside card */}
              <TooltipProvider delayDuration={0}>
                <div className="flex items-center gap-2 pt-4 border-t">
                  {/* Icon-only buttons (Edit and Delete for draft, Edit for published) */}
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
                          <p>{t('finance.accruals.detail.delete')}</p>
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
                          <p>{t('finance.accruals.detail.edit')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  {/* Text buttons (Publish for draft, Cancel for published) */}
                  {canPublish && (
                    <Button onClick={handlePublish} size="sm" className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white">
                      <Check className="mr-2 h-4 w-4" />
                      {t('finance.accruals.detail.publish')}
                    </Button>
                  )}
                  {canCancelAccrual && (
                    <Button variant="outline" onClick={handleCancel} size="sm">
                      <XCircle className="mr-2 h-4 w-4" />
                      {t('finance.accruals.detail.cancel')}
                    </Button>
                  )}
                </div>
              </TooltipProvider>
            </div>
          </Card>

          {/* Payment Operations Card - Compact Design */}
          <Card className="p-6">
            <div className="text-lg font-semibold mb-4">{t('finance.accruals.detail.paymentOperations')}</div>

            <div className="space-y-4">
              {/* Source */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-2">
                  {/* Name and balance on same line */}
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{accrual.source.name}</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(accrual.source.balance || 0)}
                    </p>
                  </div>
                  {/* Label below */}
                  <p className="text-xs text-muted-foreground">
                    {t('finance.accruals.detail.source')}
                  </p>
                </div>
              </div>

              {/* Recipient */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="space-y-2">
                  {/* Name and balance on same line */}
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{accrual.recipient.name}</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(accrual.recipient.balance || 0)}
                    </p>
                  </div>
                  {/* Label below */}
                  <p className="text-xs text-muted-foreground">
                    {t('finance.accruals.detail.recipient')}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Middle column: Comments */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">{t('finance.accruals.detail.comments')}</h2>
            <Comments
              comments={comments}
              currentUserId={currentUserId}
              onAdd={handleAddComment}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          </Card>
        </div>

        {/* Right column: History */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">{t('finance.accruals.detail.history')}</h2>
            <ActivityHistory activities={mockActivities} />
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finance.accruals.detail.publishConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('finance.accruals.detail.publishConfirm.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={confirmPublish} className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white">
              {t('finance.accruals.detail.publish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finance.accruals.detail.cancelConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('finance.accruals.detail.cancelConfirm.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              {t('finance.accruals.detail.cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finance.accruals.detail.deleteConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('finance.accruals.detail.deleteConfirm.message')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('finance.accruals.detail.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
