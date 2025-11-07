import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResult, SearchResults } from './interfaces/search-result.interface';

@Injectable()
export class SearchService {
  constructor(private prisma: DatabaseService) {}

  async globalSearch(dto: SearchQueryDto, tenantId: string): Promise<SearchResults> {
    const { query, types } = dto;
    const searchTerm = query.toLowerCase().trim();

    // If types filter is provided, only search those types
    const searchTypes = types && types.length > 0 ? types : [
      'store',
      'employee',
      'customer',
      'product',
      'category',
      'receipt',
      'document',
    ];

    const results: SearchResults = {
      stores: [],
      employees: [],
      customers: [],
      products: [],
      categories: [],
      receipts: [],
      documents: [],
      total: 0,
    };

    // Search Stores
    if (searchTypes.includes('store')) {
      const stores = await this.searchStores(searchTerm, tenantId);
      results.stores = stores;
      results.total += stores.length;
    }

    // Search Employees
    if (searchTypes.includes('employee')) {
      const employees = await this.searchEmployees(searchTerm, tenantId);
      results.employees = employees;
      results.total += employees.length;
    }

    // Search Customers
    if (searchTypes.includes('customer')) {
      const customers = await this.searchCustomers(searchTerm, tenantId);
      results.customers = customers;
      results.total += customers.length;
    }

    // Search Products
    if (searchTypes.includes('product')) {
      const products = await this.searchProducts(searchTerm, tenantId);
      results.products = products;
      results.total += products.length;
    }

    // Search Categories
    if (searchTypes.includes('category')) {
      const categories = await this.searchCategories(searchTerm, tenantId);
      results.categories = categories;
      results.total += categories.length;
    }

    // Search Receipts
    if (searchTypes.includes('receipt')) {
      const receipts = await this.searchReceipts(searchTerm, tenantId);
      results.receipts = receipts;
      results.total += receipts.length;
    }

    // Search Movement Documents
    if (searchTypes.includes('document')) {
      const documents = await this.searchDocuments(searchTerm, tenantId);
      results.documents = documents;
      results.total += documents.length;
    }

    return results;
  }

  private async searchStores(searchTerm: string, tenantId: string): Promise<SearchResult[]> {
    const normalizedTerm = searchTerm.replace(/[-.\s]/g, '');
    const searchPattern = `%${normalizedTerm}%`;

    const stores = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, city, address
      FROM stores
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND (
          LOWER(REPLACE(REPLACE(REPLACE(name, '-', ''), '.', ''), ' ', '')::text COLLATE "ru-RU-x-icu") LIKE LOWER(${searchPattern}::text COLLATE "ru-RU-x-icu")
          OR LOWER(REPLACE(REPLACE(REPLACE(address, '-', ''), '.', ''), ' ', '')::text COLLATE "ru-RU-x-icu") LIKE LOWER(${searchPattern}::text COLLATE "ru-RU-x-icu")
          OR LOWER(REPLACE(REPLACE(REPLACE(city, '-', ''), '.', ''), ' ', '')::text COLLATE "ru-RU-x-icu") LIKE LOWER(${searchPattern}::text COLLATE "ru-RU-x-icu")
          OR LOWER(REPLACE(REPLACE(REPLACE(phone, '-', ''), '.', ''), ' ', '')::text COLLATE "ru-RU-x-icu") LIKE LOWER(${searchPattern}::text COLLATE "ru-RU-x-icu")
        )
      ORDER BY name
      LIMIT 5
    `;

    return stores.map((store) => ({
      id: store.id,
      type: 'store' as const,
      title: store.name,
      subtitle: store.city,
      description: store.address,
      path: `/intranet/stores/${store.id}`,
      metadata: {
        icon: 'Store',
      },
    }));
  }

  private async searchEmployees(searchTerm: string, tenantId: string): Promise<SearchResult[]> {
    const normalizedTerm = searchTerm.replace(/[-.\s]/g, '').toLowerCase();
    const searchPattern = `%${normalizedTerm}%`;

    const employees = await this.prisma.$queryRaw<any[]>`
      SELECT e.id, u.first_name, u.last_name, u.email, s.name as store_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      JOIN stores s ON e.store_id = s.id
      WHERE e.tenant_id = ${tenantId}
        AND e.deleted_at IS NULL
        AND (
          -- Direct match (same alphabet)
          LOWER(u.first_name) LIKE ${searchPattern}
          OR LOWER(u.last_name) LIKE ${searchPattern}
          -- Transliterated match (Cyrillic search → Latin data)
          OR LOWER(u.first_name) LIKE '%' || cyrillic_to_latin(${normalizedTerm}) || '%'
          OR LOWER(u.last_name) LIKE '%' || cyrillic_to_latin(${normalizedTerm}) || '%'
          -- Transliterated match (Latin search → Cyrillic data)
          OR LOWER(u.first_name) LIKE '%' || latin_to_cyrillic(${normalizedTerm}) || '%'
          OR LOWER(u.last_name) LIKE '%' || latin_to_cyrillic(${normalizedTerm}) || '%'
          -- Other fields
          OR LOWER(COALESCE(u.email, '')) LIKE ${searchPattern}
          OR LOWER(COALESCE(u.phone, '')) LIKE ${searchPattern}
        )
      ORDER BY u.first_name, u.last_name
      LIMIT 5
    `;

    return employees.map((employee) => ({
      id: employee.id,
      type: 'employee' as const,
      title: `${employee.first_name} ${employee.last_name}`,
      subtitle: employee.email,
      description: employee.store_name,
      path: `/intranet/employees/${employee.id}`,
      metadata: {
        icon: 'Users',
      },
    }));
  }

  private async searchCustomers(searchTerm: string, tenantId: string): Promise<SearchResult[]> {
    const normalizedTerm = searchTerm.replace(/[-.\s]/g, '').toLowerCase();
    const searchPattern = `%${normalizedTerm}%`;

    const customers = await this.prisma.$queryRaw<any[]>`
      SELECT id, first_name, last_name, phone, email, loyalty_card_number
      FROM customers
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND (
          -- Direct match (same alphabet)
          LOWER(first_name) LIKE ${searchPattern}
          OR LOWER(last_name) LIKE ${searchPattern}
          -- Transliterated match (Cyrillic search → Latin data)
          OR LOWER(first_name) LIKE '%' || cyrillic_to_latin(${normalizedTerm}) || '%'
          OR LOWER(last_name) LIKE '%' || cyrillic_to_latin(${normalizedTerm}) || '%'
          -- Transliterated match (Latin search → Cyrillic data)
          OR LOWER(first_name) LIKE '%' || latin_to_cyrillic(${normalizedTerm}) || '%'
          OR LOWER(last_name) LIKE '%' || latin_to_cyrillic(${normalizedTerm}) || '%'
          -- Other fields
          OR LOWER(COALESCE(phone, '')) LIKE ${searchPattern}
          OR LOWER(COALESCE(email, '')) LIKE ${searchPattern}
          OR LOWER(COALESCE(loyalty_card_number, '')) LIKE ${searchPattern}
        )
      ORDER BY first_name, last_name
      LIMIT 5
    `;

    return customers.map((customer) => ({
      id: customer.id,
      type: 'customer' as const,
      title: `${customer.first_name} ${customer.last_name}`,
      subtitle: customer.phone || customer.email || '',
      description: customer.loyalty_card_number ? `Карта: ${customer.loyalty_card_number}` : undefined,
      path: `/intranet/customers/${customer.id}`,
      metadata: {
        icon: 'UserCircle',
      },
    }));
  }

  private async searchProducts(searchTerm: string, tenantId: string): Promise<SearchResult[]> {
    // Normalize search term: remove special chars (hyphens, dots, spaces) for flexible matching
    const normalizedTerm = searchTerm.replace(/[-.\s]/g, '');
    const searchPattern = `%${normalizedTerm}%`;

    const variants = await this.prisma.$queryRaw<any[]>`
      SELECT
        pv.id,
        pv.name,
        pv.sku,
        pv.barcode,
        c.name as category_name
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE pv.tenant_id = ${tenantId}
        AND pv.deleted_at IS NULL
        AND (
          LOWER(REPLACE(REPLACE(REPLACE(pv.name, '-', ''), '.', ''), ' ', '')::text COLLATE "ru-RU-x-icu") LIKE LOWER(${searchPattern}::text COLLATE "ru-RU-x-icu")
          OR LOWER(REPLACE(REPLACE(REPLACE(pv.sku, '-', ''), '.', ''), ' ', '')::text COLLATE "ru-RU-x-icu") LIKE LOWER(${searchPattern}::text COLLATE "ru-RU-x-icu")
          OR LOWER(REPLACE(REPLACE(REPLACE(COALESCE(pv.barcode, ''), '-', ''), '.', ''), ' ', '')::text COLLATE "ru-RU-x-icu") LIKE LOWER(${searchPattern}::text COLLATE "ru-RU-x-icu")
          OR LOWER(REPLACE(REPLACE(REPLACE(p.name, '-', ''), '.', ''), ' ', '')::text COLLATE "ru-RU-x-icu") LIKE LOWER(${searchPattern}::text COLLATE "ru-RU-x-icu")
        )
      ORDER BY
        CASE
          WHEN LOWER(pv.name::text COLLATE "ru-RU-x-icu") = LOWER(${searchTerm}::text COLLATE "ru-RU-x-icu") THEN 1
          WHEN LOWER(p.name::text COLLATE "ru-RU-x-icu") = LOWER(${searchTerm}::text COLLATE "ru-RU-x-icu") THEN 2
          WHEN LOWER(pv.name::text COLLATE "ru-RU-x-icu") LIKE LOWER(${searchTerm}::text COLLATE "ru-RU-x-icu") || '%' THEN 3
          ELSE 4
        END,
        pv.name
      LIMIT 5
    `;

    return variants.map((variant) => ({
      id: variant.id,
      type: 'product' as const,
      title: variant.name,
      subtitle: `SKU: ${variant.sku}`,
      description: variant.category_name,
      path: `/store/[storeId]/products/${variant.id}`,
      metadata: {
        icon: 'Package',
        barcode: variant.barcode,
      },
    }));
  }

  private async searchCategories(searchTerm: string, tenantId: string): Promise<SearchResult[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        tenantId,
        deletedAt: null,
        name: { contains: searchTerm, mode: 'insensitive' },
      },
      take: 5,
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => ({
      id: category.id,
      type: 'category' as const,
      title: category.name,
      subtitle: undefined,
      description: undefined,
      path: `/store/[storeId]/categories/${category.id}`, // Will be resolved on frontend
      metadata: {
        icon: category.icon || 'FolderTree',
        color: category.color || undefined,
      },
    }));
  }

  private async searchReceipts(searchTerm: string, tenantId: string): Promise<SearchResult[]> {
    const receipts = await this.prisma.receipt.findMany({
      where: {
        tenantId,
        OR: [
          { receiptNumber: { contains: searchTerm, mode: 'insensitive' } },
          {
            customer: {
              OR: [
                { firstName: { contains: searchTerm, mode: 'insensitive' } },
                { lastName: { contains: searchTerm, mode: 'insensitive' } },
              ],
            },
          },
        ],
      },
      include: {
        customer: true,
        employee: {
          include: {
            user: true,
          },
        },
        store: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return receipts.map((receipt) => ({
      id: receipt.id,
      type: 'receipt' as const,
      title: `Чек №${receipt.receiptNumber}`,
      subtitle: receipt.customer
        ? `${receipt.customer.firstName} ${receipt.customer.lastName}`
        : 'Без клиента',
      description: `${receipt.total.toString()} UZS • ${receipt.store.name}`,
      path: `/store/${receipt.storeId}/orders/${receipt.id}`,
      metadata: {
        icon: 'Receipt',
        storeId: receipt.storeId,
        badge: receipt.status,
      },
    }));
  }

  private async searchDocuments(searchTerm: string, tenantId: string): Promise<SearchResult[]> {
    const documents = await this.prisma.movementDocument.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { documentNumber: { contains: searchTerm, mode: 'insensitive' } },
          { type: { contains: searchTerm, mode: 'insensitive' } },
          { notes: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: {
        store: true,
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((doc) => {
      const typeLabels: Record<string, string> = {
        receipt: 'Приход',
        transfer: 'Перемещение',
        return: 'Возврат',
        writeoff: 'Списание',
        count: 'Инвентаризация',
      };

      return {
        id: doc.id,
        type: 'document' as const,
        title: `Документ №${doc.documentNumber}`,
        subtitle: typeLabels[doc.type] || doc.type,
        description: doc.store.name,
        path: `/store/${doc.storeId}/inventory/documents/${doc.id}`,
        metadata: {
          icon: 'FileText',
          storeId: doc.storeId,
          badge: doc.status,
        },
      };
    });
  }
}
