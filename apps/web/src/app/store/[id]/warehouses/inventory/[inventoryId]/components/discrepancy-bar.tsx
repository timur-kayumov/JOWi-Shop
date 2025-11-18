'use client';

import { cn } from '@jowi/ui';

interface DiscrepancyBarProps {
  discrepancy: number; // Расхождение (positive = излишек, negative = недостаток)
  maxDiscrepancy: number; // Максимальное расхождение для расчета ширины бара
  formatCurrency: (amount: number) => string;
}

export function DiscrepancyBar({
  discrepancy,
  maxDiscrepancy,
  formatCurrency
}: DiscrepancyBarProps) {
  if (discrepancy === 0) {
    return (
      <span className="text-sm text-muted-foreground">
        —
      </span>
    );
  }

  const isShortage = discrepancy < 0; // Недостаток
  const isSurplus = discrepancy > 0; // Излишек

  return (
    <span
      className={cn(
        "text-sm font-medium whitespace-nowrap",
        isShortage && "text-destructive",
        isSurplus && "text-green-600"
      )}
    >
      {isShortage ? '−' : '+'}{formatCurrency(Math.abs(discrepancy))}
    </span>
  );
}
