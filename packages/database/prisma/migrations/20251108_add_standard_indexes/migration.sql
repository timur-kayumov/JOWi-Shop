-- Simplified standard B-tree indexes for performance optimization
-- Stage 3: Database Indexes
-- Created: 2025-11-08
-- Note: Table and column names must match actual database schema
-- Note: CONCURRENTLY removed for compatibility with Prisma migrate reset

-- Stores: tenant + name (for list queries with filtering)
CREATE INDEX IF NOT EXISTS idx_stores_tenant_name
  ON stores(tenant_id, name);

-- Customers: tenant + phone (for loyalty card lookup)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone
  ON customers(tenant_id, phone) WHERE deleted_at IS NULL;

-- Customers: tenant + email (for customer search)
CREATE INDEX IF NOT EXISTS idx_customers_tenant_email
  ON customers(tenant_id, email) WHERE deleted_at IS NULL;

-- Product Variants: tenant + barcode (for POS barcode scanning)
CREATE INDEX IF NOT EXISTS idx_product_variants_tenant_barcode
  ON product_variants(tenant_id, barcode) WHERE deleted_at IS NULL AND barcode IS NOT NULL;

-- Product Variants: tenant + SKU (for product search)
CREATE INDEX IF NOT EXISTS idx_product_variants_tenant_sku
  ON product_variants(tenant_id, sku) WHERE deleted_at IS NULL;

-- Receipts: tenant + store (for store-specific receipt lists)
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_store
  ON receipts(tenant_id, store_id);

-- Receipts: tenant + customer (for customer purchase history)
CREATE INDEX IF NOT EXISTS idx_receipts_tenant_customer
  ON receipts(tenant_id, customer_id) WHERE customer_id IS NOT NULL;

-- Employees: tenant + store (for store employee lists)
CREATE INDEX IF NOT EXISTS idx_employees_tenant_store
  ON employees(tenant_id, store_id) WHERE deleted_at IS NULL;

-- Employees: tenant + user_id (for auth lookup)
CREATE INDEX IF NOT EXISTS idx_employees_tenant_user
  ON employees(tenant_id, user_id) WHERE deleted_at IS NULL;
