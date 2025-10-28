'use client';

import * as React from 'react';
import { ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  key: string | null;
  direction: SortDirection;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'Нет данных',
  className,
}: DataTableProps<T>) {
  const [sortState, setSortState] = React.useState<SortState>({
    key: null,
    direction: null,
  });

  const handleSort = (columnKey: string) => {
    setSortState((prev) => {
      if (prev.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return { key: null, direction: null };
    });
  };

  const sortedData = React.useMemo(() => {
    if (!sortState.key || !sortState.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortState.key!];
      const bValue = b[sortState.key!];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortState]);

  return (
    <div className={cn('rounded-2xl border bg-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-left text-sm font-medium',
                    column.sortable && 'cursor-pointer select-none hover:bg-muted/70',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        {sortState.key === column.key ? (
                          sortState.direction === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )
                        ) : (
                          <div className="h-4 w-4 opacity-30">
                            <ArrowUp className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {onRowClick && (
                <th className="px-4 py-3 text-right text-sm font-medium w-12"></th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onRowClick ? 1 : 0)}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((item, index) => (
                <tr
                  key={index}
                  className={cn(
                    'transition-colors',
                    onRowClick &&
                      'cursor-pointer hover:bg-table-row-hover'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn('px-4 py-3 text-sm', column.className)}
                    >
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                  {onRowClick && (
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="h-5 w-5 text-muted-foreground inline-block" />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
