export interface SearchResult {
  id: string;
  type: 'store' | 'employee' | 'customer' | 'product' | 'category' | 'receipt' | 'document';
  title: string;
  subtitle?: string;
  description?: string;
  path: string;
  metadata?: {
    icon?: string;
    color?: string;
    badge?: string;
    storeId?: string;
    [key: string]: any;
  };
}

export interface SearchResults {
  stores: SearchResult[];
  employees: SearchResult[];
  customers: SearchResult[];
  products: SearchResult[];
  categories: SearchResult[];
  receipts: SearchResult[];
  documents: SearchResult[];
  total: number;
}

export type SearchEntityType =
  | 'store'
  | 'employee'
  | 'customer'
  | 'product'
  | 'category'
  | 'receipt'
  | 'document';
