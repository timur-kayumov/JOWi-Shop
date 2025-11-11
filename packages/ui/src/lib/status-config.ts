import type { BadgeProps } from '../components/badge';

/**
 * Status configuration type
 * Defines the structure for each status configuration
 */
export interface StatusConfig {
  variant: BadgeProps['variant'];
  i18nKey: string;
}

/**
 * Transaction status types
 */
export type TransactionStatus = 'draft' | 'published' | 'canceled';

/**
 * Boolean status types (for active/inactive, enabled/disabled states)
 */
export type BooleanStatus = 'active' | 'inactive' | 'enabled' | 'disabled';

/**
 * All possible status types
 */
export type Status = TransactionStatus | BooleanStatus | string;

/**
 * Transaction statuses configuration
 * Maps transaction status values to their badge variants and i18n keys
 */
export const transactionStatusConfig: Record<TransactionStatus, StatusConfig> = {
  draft: {
    variant: 'neutral-light',
    i18nKey: 'status.draft',
  },
  published: {
    variant: 'success-light',
    i18nKey: 'status.published',
  },
  canceled: {
    variant: 'destructive-light',
    i18nKey: 'status.canceled',
  },
};

/**
 * Boolean statuses configuration
 * Maps boolean status values to their badge variants and i18n keys
 */
export const booleanStatusConfig: Record<BooleanStatus, StatusConfig> = {
  active: {
    variant: 'success-light',
    i18nKey: 'status.active',
  },
  inactive: {
    variant: 'neutral-light',
    i18nKey: 'status.inactive',
  },
  enabled: {
    variant: 'success-light',
    i18nKey: 'status.enabled',
  },
  disabled: {
    variant: 'neutral-light',
    i18nKey: 'status.disabled',
  },
};

/**
 * Get status configuration by status value and type
 * @param status - The status value
 * @param type - The type of status ('transaction' | 'boolean' | 'custom')
 * @returns StatusConfig object with variant and i18nKey
 */
export function getStatusConfig(
  status: Status,
  type: 'transaction' | 'boolean' | 'custom' = 'custom'
): StatusConfig {
  if (type === 'transaction' && status in transactionStatusConfig) {
    return transactionStatusConfig[status as TransactionStatus];
  }

  if (type === 'boolean' && status in booleanStatusConfig) {
    return booleanStatusConfig[status as BooleanStatus];
  }

  // Fallback for custom statuses
  return {
    variant: 'neutral-light',
    i18nKey: `status.${status}`,
  };
}
