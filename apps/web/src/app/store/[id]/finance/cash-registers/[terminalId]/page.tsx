'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Card,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@jowi/ui';
import { useTranslation } from 'react-i18next';
import { toast } from '@/lib/toast';

// Types
type SafeType = 'cash' | 'bank_account' | 'card_account';

interface PaymentType {
  id: string;
  safeId: string;
  name: string;
  icon?: string;
  color?: string;
}

interface Safe {
  id: string;
  name: string;
  type: SafeType;
  accountNumber?: string;
  balance: number;
  isActive: boolean;
}

interface Terminal {
  id: string;
  name: string;
  deviceId: string;
  fiscalProviderId?: string;
  isActive: boolean;
  paymentTypeIds: string[];
  shiftManagementEnabled: boolean;
  safeResponsibilities: Record<string, boolean>;
  autoCheckEnabled: boolean;
  autoCheckPeriod: number;
  autoCheckPeriodUnit: 'minutes' | 'hours';
  autoCheckForced: boolean;
  autoCheckWaitTime: number;
}

// Mock data
const mockPaymentTypes: PaymentType[] = [
  {
    id: '1',
    safeId: '1',
    name: 'Наличные',
    icon: 'Wallet',
    color: '#10B981',
  },
  {
    id: '2',
    safeId: '3',
    name: 'Карта Uzcard',
    icon: 'CreditCard',
    color: '#3B82F6',
  },
  {
    id: '3',
    safeId: '3',
    name: 'Карта Humo',
    icon: 'CreditCard',
    color: '#EF4444',
  },
  {
    id: '4',
    safeId: '2',
    name: 'Payme',
    icon: 'Smartphone',
    color: '#06B6D4',
  },
  {
    id: '5',
    safeId: '2',
    name: 'Click',
    icon: 'Smartphone',
    color: '#8B5CF6',
  },
];

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

const mockTerminal: Terminal = {
  id: '1',
  name: 'Касса 1',
  deviceId: 'DEVICE-001',
  fiscalProviderId: 'FISCAL-001',
  isActive: true,
  paymentTypeIds: ['1', '2', '3'],
  shiftManagementEnabled: true,
  safeResponsibilities: {
    '1': true,
    '2': true,
    '3': false,
    '4': true,
  },
  autoCheckEnabled: true,
  autoCheckPeriod: 30,
  autoCheckPeriodUnit: 'minutes',
  autoCheckForced: true,
  autoCheckWaitTime: 5,
};

export default function CashRegisterShowPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const terminalId = params.terminalId as string;
  const { t } = useTranslation('common');

  const [terminal, setTerminal] = useState<Terminal>(mockTerminal);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const safeTypeLabels: Record<SafeType, string> = {
    cash: t('finance.safes.cash'),
    bank_account: t('finance.safes.bankAccount'),
    card_account: t('finance.safes.cardAccount'),
  };

  const getPaymentTypesByIds = (ids: string[]): PaymentType[] => {
    return mockPaymentTypes.filter((pt) => ids.includes(pt.id));
  };

  const handleShiftManagementToggle = (enabled: boolean) => {
    setTerminal({ ...terminal, shiftManagementEnabled: enabled });
    toast.success(t('messages.saved'), enabled ? t('finance.cashRegisters.detail.shiftEnabled') : t('finance.cashRegisters.detail.shiftDisabled'));
  };

  const handleSafeResponsibilityToggle = (safeId: string, enabled: boolean) => {
    setTerminal({
      ...terminal,
      safeResponsibilities: {
        ...terminal.safeResponsibilities,
        [safeId]: enabled,
      },
    });
    toast.success(t('messages.saved'), t('messages.success'));
  };

  const handleAutoCheckToggle = (enabled: boolean) => {
    setTerminal({ ...terminal, autoCheckEnabled: enabled });
    toast.success(t('messages.saved'), enabled ? t('finance.cashRegisters.detail.checkEnabled') : t('finance.cashRegisters.detail.checkDisabled'));
  };

  const handleAutoCheckPeriodChange = (value: string) => {
    setTerminal({ ...terminal, autoCheckPeriod: Number(value) });
  };

  const handleAutoCheckPeriodUnitChange = (value: 'minutes' | 'hours') => {
    setTerminal({ ...terminal, autoCheckPeriodUnit: value });
  };

  const handleAutoCheckForcedToggle = (enabled: boolean) => {
    setTerminal({ ...terminal, autoCheckForced: enabled });
    toast.success(t('messages.saved'), enabled ? t('finance.cashRegisters.detail.forceCheckEnabled') : t('finance.cashRegisters.detail.forceCheckDisabled'));
  };

  const handleAutoCheckWaitTimeChange = (value: string) => {
    setTerminal({ ...terminal, autoCheckWaitTime: Number(value) });
  };

  const handleDelete = () => {
    console.log('Delete terminal:', terminalId);
    toast.success(t('messages.deleted'), t('finance.cashRegisters.deleteSuccess'));
    setIsDeleteOpen(false);
    router.push(`/store/${storeId}/finance/cash-registers`);
  };

  const paymentTypes = getPaymentTypesByIds(terminal.paymentTypeIds);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/store/${storeId}/finance/cash-registers`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{terminal.name}</h1>
            <p className="text-muted-foreground mt-2">{t('finance.cashRegisters.detail.title')}</p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('finance.cashRegisters.detail.deleteRegister')}</DialogTitle>
            <DialogDescription>
              {t('finance.cashRegisters.detail.deleteConfirmation', { name: terminal.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t('actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Three column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Terminal Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t('finance.cashRegisters.detail.information')}</h2>

          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('finance.cashRegisters.name')}</div>
              <div className="font-medium">{terminal.name}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('finance.cashRegisters.deviceId')}</div>
              <div className="font-medium">{terminal.deviceId}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('finance.cashRegisters.fiscalProvider')}</div>
              <div className="font-medium">{terminal.fiscalProviderId || '-'}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">{t('finance.cashRegisters.detail.status')}</div>
              <Badge variant={terminal.isActive ? 'default' : 'secondary'}>
                {terminal.isActive ? t('finance.cashRegisters.active') : t('finance.cashRegisters.inactive')}
              </Badge>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">{t('finance.cashRegisters.paymentTypes')}</div>
              <div className="flex flex-wrap gap-2">
                {paymentTypes.map((pt) => (
                  <Badge
                    key={pt.id}
                    variant="secondary"
                    className="text-xs"
                    style={{
                      borderLeft: `3px solid ${pt.color}`,
                    }}
                  >
                    {pt.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-6 border-t flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('actions.edit')}
            </Button>
            <Button
              variant="ghost"
              className="flex-1 bg-red-50 text-destructive hover:bg-red-100 hover:text-destructive"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.delete')}
            </Button>
          </div>
        </Card>

        {/* Middle column - Shift Management & Safe Responsibilities */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{t('finance.cashRegisters.detail.shiftManagement')}</h2>
            <Switch
              checked={terminal.shiftManagementEnabled}
              onCheckedChange={handleShiftManagementToggle}
            />
          </div>

          {terminal.shiftManagementEnabled && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">{t('finance.cashRegisters.detail.safeResponsibilities')}</h3>
                <div className="space-y-3">
                  {mockSafes.map((safe) => (
                    <div
                      key={safe.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{safe.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {safeTypeLabels[safe.type]}
                        </div>
                      </div>
                      <Switch
                        checked={terminal.safeResponsibilities[safe.id] || false}
                        onCheckedChange={(checked) =>
                          handleSafeResponsibilityToggle(safe.id, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Right column - Automatic Check */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{t('finance.cashRegisters.detail.automaticCheck')}</h2>
            <Switch
              checked={terminal.autoCheckEnabled && terminal.shiftManagementEnabled}
              onCheckedChange={handleAutoCheckToggle}
              disabled={!terminal.shiftManagementEnabled}
            />
          </div>

          {terminal.shiftManagementEnabled && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  {t('finance.cashRegisters.detail.automaticCheckDescription')}
                </p>
              </div>

              {terminal.autoCheckEnabled && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t('finance.cashRegisters.detail.checkPeriod')}</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={terminal.autoCheckPeriod}
                        onChange={(e) => handleAutoCheckPeriodChange(e.target.value)}
                        className="flex-1"
                      />
                      <Select
                        value={terminal.autoCheckPeriodUnit}
                        onValueChange={handleAutoCheckPeriodUnitChange}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minutes">{t('finance.cashRegisters.detail.checkPeriodMinutes')}</SelectItem>
                          <SelectItem value="hours">{t('finance.cashRegisters.detail.checkPeriodHours')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">{t('finance.cashRegisters.detail.forceCheck')}</h3>
                      <Switch
                        checked={terminal.autoCheckForced}
                        onCheckedChange={handleAutoCheckForcedToggle}
                      />
                    </div>

                    {terminal.autoCheckForced && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">{t('finance.cashRegisters.detail.waitTime')}</label>
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            min="1"
                            value={terminal.autoCheckWaitTime}
                            onChange={(e) => handleAutoCheckWaitTimeChange(e.target.value)}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">{t('finance.cashRegisters.detail.waitTimeMinutes')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
