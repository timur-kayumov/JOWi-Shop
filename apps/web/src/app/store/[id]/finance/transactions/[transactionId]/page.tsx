'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, ArrowDown } from 'lucide-react';
import {
  Button,
  Card,
  Badge,
  StatusBadge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  formatDate,
  Comments,
  ActivityHistory,
  type Comment,
  type Activity,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';

// ==================== TYPES ====================

type EntityType = 'safe' | 'cash_register' | 'counterparty';
type TransactionType = 'system' | 'user';
type TransactionStatus = 'draft' | 'published' | 'canceled';

interface EntityReference {
  type: EntityType;
  id: string;
  name: string;
  balance?: number; // For display purposes
}

interface Transaction {
  id: string;
  datetime: Date;
  purposeId: string;
  purposeName: string;
  source: EntityReference;
  recipient: EntityReference;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
}

// ==================== MOCK DATA ====================

// Mock transaction data (in real app, this would come from API)
const mockTransaction: Transaction = {
  id: '1',
  datetime: new Date('2025-01-25T15:51:00'),
  purposeId: '4',
  purposeName: 'Оплата аренды',
  source: { type: 'safe', id: '1', name: 'Сейф 1', balance: 5800000 },
  recipient: { type: 'counterparty', id: '2', name: 'Контрагент X', balance: -5800000 },
  amount: 4508544,
  type: 'system',
  status: 'draft',
};

// Mock comments
const mockComments: Comment[] = [
  {
    id: '1',
    userId: '1',
    userName: 'UserName',
    text: '@Александр Разнообразный и богатый опыт постоянный количественный рост и сфера нашей активности представляет собой',
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
  },
  {
    id: '2',
    userId: '2',
    userName: 'Иван Петров',
    text: 'Согласовано с руководством. Можно проводить оплату.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '3',
    userId: '1',
    userName: 'UserName',
    text: 'Спасибо за быстрый ответ!',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // yesterday
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000), // edited 10 min after
  },
];

// Mock activity history
const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'created',
    userId: '1',
    userName: 'Имя Пользователя',
    timestamp: new Date('2025-12-02T17:00:00'),
    description: 'Добавил транзакцию Назначение транзакции',
  },
  {
    id: '2',
    type: 'updated',
    userId: '1',
    userName: 'Имя Пользователя',
    timestamp: new Date('2025-12-02T17:00:00'),
    description: 'Корректировка',
    changes: [
      {
        field: 'amount',
        fieldLabel: 'Сумма',
        oldValue: '100 000 000 сум',
        newValue: '100 000 000 сум',
      },
    ],
  },
  {
    id: '3',
    type: 'status_changed',
    userId: '1',
    userName: 'Имя Пользователя',
    timestamp: new Date('2025-12-02T17:00:00'),
    oldStatus: 'Черновик',
    newStatus: 'Назначение транзакции',
  },
  {
    id: '4',
    type: 'updated',
    userId: '1',
    userName: 'Имя Пользователя',
    timestamp: new Date('2025-12-02T17:00:00'),
    description: 'Отказ при рассмотрении',
  },
  {
    id: '5',
    type: 'status_changed',
    userId: '1',
    userName: 'Имя Пользователя',
    timestamp: new Date('2025-12-02T17:00:00'),
    description: 'Согласие на корректировку',
  },
  {
    id: '6',
    type: 'updated',
    userId: '1',
    userName: 'Имя Пользователя',
    timestamp: new Date('2025-12-02T17:00:00'),
    description: 'Отменил',
  },
  {
    id: '7',
    type: 'created',
    userId: '1',
    userName: 'Имя Пользователя',
    timestamp: new Date('2025-12-02T17:00:00'),
    description: 'Опубликовал',
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
      return t('finance.transactions.safe');
    case 'cash_register':
      return t('finance.transactions.cashRegister');
    case 'counterparty':
      return t('finance.transactions.counterparty');
  }
};

// Status handling is now done by StatusBadge component with i18n

const getTypeLabel = (type: TransactionType, t: any): string => {
  switch (type) {
    case 'system':
      return t('finance.transactions.system');
    case 'user':
      return t('finance.transactions.user');
  }
};

// ==================== MAIN COMPONENT ====================

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const transactionId = params.transactionId as string;
  const { t } = useTranslation('common');

  // In real app, fetch transaction by ID
  const transaction = mockTransaction;

  // State for comments
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const currentUserId = '1'; // Mock current user

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
    toast.success(t('messages.success'), t('finance.transactions.detail.commentAdded'));
  };

  const handleEditComment = (commentId: string, text: string) => {
    setComments(
      comments.map((c) =>
        c.id === commentId ? { ...c, text, updatedAt: new Date() } : c
      )
    );
    toast.success(t('messages.success'), t('finance.transactions.detail.commentEdited'));
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter((c) => c.id !== commentId));
    toast.success(t('messages.success'), t('finance.transactions.detail.commentDeleted'));
  };

  // Transaction actions
  const handleEdit = () => {
    toast.info(t('finance.transactions.detail.inDevelopment'), t('finance.transactions.editTransaction'));
    // In real app, open edit dialog or navigate to edit page
  };

  const handleDelete = () => {
    if (confirm(t('finance.transactions.deleteConfirm', { name: transaction.purposeName }))) {
      toast.success(t('messages.success'), t('finance.transactions.deleteSuccess'));
      router.push(`/store/${storeId}/finance/transactions`);
    }
  };

  const handleBack = () => {
    router.push(`/store/${storeId}/finance/transactions`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {transaction.purposeName}
          </h1>
          <p className="text-muted-foreground mt-2">{t('finance.transactions.detail.title')}</p>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Transaction Details */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t('finance.transactions.detail.basicInfo')}</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('finance.transactions.detail.date')}</p>
              <p className="text-sm font-medium">{formatDate(transaction.datetime)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('finance.transactions.detail.amount')}</p>
              <p className="text-lg font-semibold">{formatCurrency(transaction.amount)}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('finance.transactions.detail.purpose')}</p>
              <p className="text-sm font-medium">{transaction.purposeName}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('finance.transactions.detail.type')}</p>
              <Badge variant={transaction.type === 'system' ? 'secondary' : 'default'}>
                {getTypeLabel(transaction.type, t)}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('finance.transactions.detail.status')}</p>
              <StatusBadge type="transaction" status={transaction.status} t={t} />
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-4 mt-6 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {t('finance.transactions.detail.edit')}
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('finance.transactions.detail.delete')}
            </Button>
          </div>
        </Card>

        {/* Column 2: Payment Operations */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t('finance.transactions.detail.paymentOperations')}</h2>

          <div className="space-y-4">
            {/* Source */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                {t('finance.transactions.detail.source')}
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium">{transaction.source.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {getEntityTypeLabel(transaction.source.type, t)}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(transaction.source.balance || 0)}
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Recipient */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                {t('finance.transactions.detail.recipient')}
              </p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-medium">{transaction.recipient.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {getEntityTypeLabel(transaction.recipient.type, t)}
                  </Badge>
                </div>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(transaction.recipient.balance || 0)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Column 3: Comments and History */}
        <Card className="p-6">
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="comments">{t('finance.transactions.detail.comments')}</TabsTrigger>
              <TabsTrigger value="history">{t('finance.transactions.detail.history')}</TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-0">
              <Comments
                comments={comments}
                currentUserId={currentUserId}
                onAdd={handleAddComment}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <ActivityHistory activities={mockActivities} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
