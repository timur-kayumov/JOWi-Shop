'use client';

import { SearchEntityType } from '@/types/search';
import { Badge } from '../badge';
import { X } from 'lucide-react';

interface SearchFiltersProps {
  selectedTypes: SearchEntityType[];
  onToggleType: (type: SearchEntityType) => void;
  onClearFilters: () => void;
}

const entityTypeLabels: Record<SearchEntityType, string> = {
  store: 'Магазины',
  employee: 'Сотрудники',
  customer: 'Клиенты',
  product: 'Товары',
  category: 'Категории',
  receipt: 'Чеки',
  document: 'Документы',
};

const allTypes: SearchEntityType[] = [
  'store',
  'employee',
  'customer',
  'product',
  'category',
  'receipt',
  'document',
];

export function SearchFilters({
  selectedTypes,
  onToggleType,
  onClearFilters,
}: SearchFiltersProps) {
  return (
    <div className="border-b border-gray-200 bg-gray-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">
          Фильтр по типу:
        </span>
        {selectedTypes.length > 0 && (
          <button
            onClick={onClearFilters}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Сбросить
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {allTypes.map((type) => {
          const isSelected = selectedTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {entityTypeLabels[type]}
              {isSelected && <X className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
