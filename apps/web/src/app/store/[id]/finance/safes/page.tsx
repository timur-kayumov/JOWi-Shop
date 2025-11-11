'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Search, ArrowUpCircle, ArrowDownCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@jowi/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';

// Types and validation schema
type SafeType = 'cash' | 'bank_account' | 'card_account';

interface Safe {
  id: string;
  name: string;
  type: SafeType;
  accountNumber?: string;
  balance: number;
  isActive: boolean;
}

// Validation schema (shared with backend)
const createSafeSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['cash', 'bank_account', 'card_account']),
  accountNumber: z.string().optional(),
  balance: z.number().default(0),
  isActive: z.boolean().default(true),
});

type CreateSafeInput = z.infer<typeof createSafeSchema>;

// Mock data
const mockSafes: Safe[] = [
  {
    id: '1',
    name: 'Касса наличные',
    type: 'cash',
    balance: 5000000,
    isActive: true,
  },
  {
    id: '2',
    name: 'Расчётный счёт',
    type: 'bank_account',
    accountNumber: '20208810200000000001',
    balance: 15000000,
    isActive: true,
  },
  {
    id: '3',
    name: 'Эквайринг Uzcard',
    type: 'card_account',
    accountNumber: '8600',
    balance: 8500000,
    isActive: true,
  },
  {
    id: '4',
    name: 'Резервный фонд',
    type: 'cash',
    balance: 2000000,
    isActive: false,
  },
];

// Mock today's transactions
const mockTodayTransactions: Record<string, { income: number; expense: number }> = {
  '1': { income: 12500000, expense: 8200000 },
  '2': { income: 5300000, expense: 2100000 },
  '3': { income: 9800000, expense: 1500000 },
  '4': { income: 0, expense: 0 },
};

export default function SafesPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [data, setData] = useState<Safe[]>(mockSafes);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const createForm = useForm<CreateSafeInput>({
    resolver: zodResolver(createSafeSchema),
    defaultValues: {
      name: '',
      type: 'cash',
      accountNumber: '',
      balance: 0,
      isActive: true,
    },
  });

  const filteredData = data.filter((safe) => {
    const matchesSearch = safe.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || safe.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreate = (formData: CreateSafeInput) => {
    const newSafe: Safe = {
      id: String(data.length + 1),
      name: formData.name,
      type: formData.type,
      accountNumber: formData.accountNumber,
      balance: formData.balance,
      isActive: formData.isActive,
    };
    setData([...data, newSafe]);
    toast.success(t('messages.saved'), `${formData.name} ${t('messages.success')}`);
    setIsCreateDialogOpen(false);
    createForm.reset();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ` ${t('currency')}`;
  };

  const watchedType = createForm.watch('type');

  const safeTypeLabels: Record<SafeType, string> = {
    cash: t('finance.safes.cash'),
    bank_account: t('finance.safes.bankAccount'),
    card_account: t('finance.safes.cardAccount'),
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('finance.safes.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('finance.safes.description')}
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('finance.safes.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finance.safes.allTypes')}</SelectItem>
              <SelectItem value="cash">{t('finance.safes.cash')}</SelectItem>
              <SelectItem value="bank_account">{t('finance.safes.bankAccount')}</SelectItem>
              <SelectItem value="card_account">{t('finance.safes.cardAccount')}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('finance.safes.createSafe')}
          </Button>
        </div>
      </Card>

      {filteredData.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            {t('finance.safes.emptyMessage')}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((safe) => (
            <Card
              key={safe.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
              onClick={() => router.push(`/store/${storeId}/finance/safes/${safe.id}`)}
            >
              <div className="absolute top-6 right-6">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>

              <div className="flex items-start gap-3 mb-4 pr-12">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{safe.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {safeTypeLabels[safe.type]}
                  </Badge>
                </div>
              </div>

              <div className="mb-4">
                <div className={`text-3xl font-bold ${safe.balance >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                  {formatCurrency(safe.balance)}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowDownCircle className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">{t('finance.safes.incomeToday')}</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(mockTodayTransactions[safe.id]?.income || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-red-500" />
                    <span className="text-muted-foreground">{t('finance.safes.expenseToday')}</span>
                  </div>
                  <span className="font-medium">
                    {formatCurrency(mockTodayTransactions[safe.id]?.expense || 0)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('finance.safes.createSafe')}</DialogTitle>
            <DialogDescription>{t('finance.safes.createSafeDescription')}</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.safes.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('finance.safes.namePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.safes.safeType')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">{t('finance.safes.cash')}</SelectItem>
                        <SelectItem value="bank_account">{t('finance.safes.bankAccount')}</SelectItem>
                        <SelectItem value="card_account">{t('finance.safes.cardAccount')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('finance.safes.initialBalance')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="0"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(watchedType === 'bank_account' || watchedType === 'card_account') && (
                <FormField
                  control={createForm.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('finance.safes.accountNumber')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('finance.safes.accountNumberPlaceholder')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  {t('actions.cancel')}
                </Button>
                <Button type="submit">{t('actions.create')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
