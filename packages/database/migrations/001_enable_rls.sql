-- Migration: Enable Row-Level Security (RLS) for Multi-Tenancy
-- This migration enables RLS on all tables with tenant_id and creates policies

-- ============================================
-- Enable RLS on all multi-tenant tables
-- ============================================

-- Business table (tenant root) - no RLS needed as it IS the tenant
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY; -- Not needed

-- Core tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Product catalog
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Inventory
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE movement_items ENABLE ROW LEVEL SECURITY;

-- Sales
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Customers & Loyalty
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

-- Shifts & Cash
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_operations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create RLS Policies
-- ============================================

-- Helper function to get current tenant_id from PostgreSQL session variable
-- This will be set by the application using: SET LOCAL app.tenant_id = 'tenant_id_value';
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS text AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Policy template: SELECT/INSERT/UPDATE/DELETE for tenant_id match
-- Format: CREATE POLICY "policy_name" ON table_name FOR operation USING (tenant_id = current_tenant_id());

-- STORES
CREATE POLICY "stores_tenant_isolation" ON stores
  USING (tenant_id = current_tenant_id());

-- TERMINALS
CREATE POLICY "terminals_tenant_isolation" ON terminals
  USING (tenant_id = current_tenant_id());

-- USERS
CREATE POLICY "users_tenant_isolation" ON users
  USING (tenant_id = current_tenant_id());

-- EMPLOYEES
CREATE POLICY "employees_tenant_isolation" ON employees
  USING (tenant_id = current_tenant_id());

-- CATEGORIES
CREATE POLICY "categories_tenant_isolation" ON categories
  USING (tenant_id = current_tenant_id());

-- PRODUCTS
CREATE POLICY "products_tenant_isolation" ON products
  USING (tenant_id = current_tenant_id());

-- PRODUCT_VARIANTS
CREATE POLICY "product_variants_tenant_isolation" ON product_variants
  USING (tenant_id = current_tenant_id());

-- STOCK_LEVELS
CREATE POLICY "stock_levels_tenant_isolation" ON stock_levels
  USING (tenant_id = current_tenant_id());

-- STOCK_BATCHES
CREATE POLICY "stock_batches_tenant_isolation" ON stock_batches
  USING (tenant_id = current_tenant_id());

-- MOVEMENT_DOCUMENTS
CREATE POLICY "movement_documents_tenant_isolation" ON movement_documents
  USING (tenant_id = current_tenant_id());

-- MOVEMENT_ITEMS (no direct tenant_id, rely on document join)
-- For now, no RLS on movement_items - enforce at application level or via JOIN

-- RECEIPTS
CREATE POLICY "receipts_tenant_isolation" ON receipts
  USING (tenant_id = current_tenant_id());

-- RECEIPT_ITEMS (no direct tenant_id, rely on receipt join)
-- For now, no RLS on receipt_items - enforce at application level or via JOIN

-- PAYMENTS (no direct tenant_id, rely on receipt join)
-- For now, no RLS on payments - enforce at application level or via JOIN

-- CUSTOMERS
CREATE POLICY "customers_tenant_isolation" ON customers
  USING (tenant_id = current_tenant_id());

-- LOYALTY_TRANSACTIONS
CREATE POLICY "loyalty_transactions_tenant_isolation" ON loyalty_transactions
  USING (tenant_id = current_tenant_id());

-- SHIFTS
CREATE POLICY "shifts_tenant_isolation" ON shifts
  USING (tenant_id = current_tenant_id());

-- CASH_OPERATIONS
CREATE POLICY "cash_operations_tenant_isolation" ON cash_operations
  USING (tenant_id = current_tenant_id());

-- ============================================
-- Indexes for RLS Performance
-- ============================================
-- These indexes ensure RLS policies perform well
-- Most of these should already exist from Prisma schema

-- Additional composite indexes for RLS + common queries
-- Note: Only create indexes for columns that exist in the schema
CREATE INDEX IF NOT EXISTS idx_customers_tenant_phone ON customers(tenant_id, phone);

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON FUNCTION current_tenant_id() IS 'Returns the current tenant_id from session variable app.tenant_id';

-- ============================================
-- IMPORTANT: Application Integration Notes
-- ============================================

-- To use RLS policies, the application must set the tenant_id before each query:
--
-- In Prisma/PostgreSQL:
--   await prisma.$executeRaw`SET LOCAL app.tenant_id = ${tenantId}`;
--
-- This should be done in a transaction or at the connection level.
-- See packages/database/src/index.ts withTenant() function for implementation.
