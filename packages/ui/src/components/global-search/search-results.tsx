'use client';

import { useRouter } from 'next/navigation';
import {
  Store,
  Users,
  UserCircle,
  Package,
  FolderTree,
  Receipt,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { SearchResults as SearchResultsType, SearchResult, SearchEntityType } from '@/types/search';
import { Badge } from '../badge';

interface SearchResultsProps {
  results: SearchResultsType;
  onResultClick: (result: SearchResult) => void;
  onClose: () => void;
}

const iconMap = {
  Store,
  Users,
  UserCircle,
  Package,
  FolderTree,
  Receipt,
  FileText,
};

const entityTypeLabels: Record<SearchEntityType, string> = {
  store: 'Магазины',
  employee: 'Сотрудники',
  customer: 'Клиенты',
  product: 'Товары',
  category: 'Категории',
  receipt: 'Чеки',
  document: 'Документы',
};

export function SearchResults({
  results,
  onResultClick,
  onClose,
}: SearchResultsProps) {
  const router = useRouter();

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result);
    onClose();
  };

  const renderResultGroup = (
    title: string,
    items: SearchResult[],
    Icon: React.ComponentType<{ className?: string }>
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <div className="bg-gray-50 px-4 py-2">
          <span className="text-xs font-semibold uppercase text-gray-600">
            {title}
          </span>
        </div>
        <div>
          {items.map((item) => {
            const ItemIcon = item.metadata?.icon
              ? iconMap[item.metadata.icon as keyof typeof iconMap] || Icon
              : Icon;

            return (
              <button
                key={item.id}
                onClick={() => handleResultClick(item)}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-100 focus:outline-none"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: item.metadata?.color
                      ? `${item.metadata.color}20`
                      : '#f3f4f6',
                  }}
                >
                  <ItemIcon
                    className="h-5 w-5"
                    style={{
                      color: item.metadata?.color || '#6b7280',
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-gray-900">
                      {item.title}
                    </span>
                    {item.metadata?.badge && (
                      <Badge variant="outline" className="text-xs">
                        {item.metadata.badge}
                      </Badge>
                    )}
                  </div>
                  {item.subtitle && (
                    <div className="truncate text-sm text-gray-600">
                      {item.subtitle}
                    </div>
                  )}
                  {item.description && (
                    <div className="truncate text-xs text-gray-500">
                      {item.description}
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100" />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (results.total === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="mb-2 text-sm font-medium text-gray-900">
          Ничего не найдено
        </div>
        <div className="text-xs text-gray-500">
          Попробуйте изменить поисковый запрос
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[500px] overflow-y-auto">
      {renderResultGroup('Магазины', results.stores, Store)}
      {renderResultGroup('Сотрудники', results.employees, Users)}
      {renderResultGroup('Клиенты', results.customers, UserCircle)}
      {renderResultGroup('Товары', results.products, Package)}
      {renderResultGroup('Категории', results.categories, FolderTree)}
      {renderResultGroup('Чеки', results.receipts, Receipt)}
      {renderResultGroup('Документы', results.documents, FileText)}
    </div>
  );
}
