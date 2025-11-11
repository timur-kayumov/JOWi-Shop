import * as React from 'react';
import { Badge } from './badge';
import {
  getStatusConfig,
  type Status,
  type TransactionStatus,
  type BooleanStatus,
} from '../lib/status-config';

/**
 * Translation function type
 * Should match the signature of i18next's t() function
 */
export type TranslationFunction = (key: string) => string;

/**
 * StatusBadge component props
 */
export interface StatusBadgeProps {
  /**
   * The status value to display
   */
  status: Status;
  /**
   * The type of status
   * - 'transaction': for transaction statuses (draft, published, canceled)
   * - 'boolean': for boolean statuses (active, inactive, enabled, disabled)
   * - 'custom': for custom statuses (will use default configuration)
   * @default 'custom'
   */
  type?: 'transaction' | 'boolean' | 'custom';
  /**
   * Translation function (usually from i18next's useTranslation hook)
   * If not provided, will display the raw i18n key
   */
  t?: TranslationFunction;
  /**
   * Optional className to apply to the badge
   */
  className?: string;
}

/**
 * StatusBadge component
 * Displays a badge with appropriate color and text based on the status value
 *
 * @example
 * ```tsx
 * import { StatusBadge } from '@jowi/ui';
 * import { useTranslation } from 'react-i18next';
 *
 * function MyComponent() {
 *   const { t } = useTranslation('common');
 *
 *   return (
 *     <StatusBadge
 *       type="transaction"
 *       status="published"
 *       t={t}
 *     />
 *   );
 * }
 * ```
 */
export function StatusBadge({
  status,
  type = 'custom',
  t,
  className,
}: StatusBadgeProps) {
  const config = getStatusConfig(status, type);

  const label = t ? t(config.i18nKey) : config.i18nKey;

  return (
    <Badge variant={config.variant} className={className}>
      {label}
    </Badge>
  );
}

/**
 * Type-safe StatusBadge for transaction statuses
 * @example
 * ```tsx
 * <TransactionStatusBadge status="published" t={t} />
 * ```
 */
export function TransactionStatusBadge({
  status,
  t,
  className,
}: {
  status: TransactionStatus;
  t?: TranslationFunction;
  className?: string;
}) {
  return (
    <StatusBadge type="transaction" status={status} t={t} className={className} />
  );
}

/**
 * Type-safe StatusBadge for boolean statuses
 * @example
 * ```tsx
 * <BooleanStatusBadge status="active" t={t} />
 * ```
 */
export function BooleanStatusBadge({
  status,
  t,
  className,
}: {
  status: BooleanStatus;
  t?: TranslationFunction;
  className?: string;
}) {
  return (
    <StatusBadge type="boolean" status={status} t={t} className={className} />
  );
}
