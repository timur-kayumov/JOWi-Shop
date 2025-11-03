-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for fuzzy search on frequently searched fields

-- Stores
CREATE INDEX IF NOT EXISTS idx_stores_name_trgm ON stores USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stores_address_trgm ON stores USING gin (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_stores_city_trgm ON stores USING gin (city gin_trgm_ops);

-- Users (for employee search)
CREATE INDEX IF NOT EXISTS idx_users_first_name_trgm ON users USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_last_name_trgm ON users USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON users USING gin (email gin_trgm_ops);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_first_name_trgm ON customers USING gin (first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_last_name_trgm ON customers USING gin (last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm ON customers USING gin (phone gin_trgm_ops);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- Product Variants
CREATE INDEX IF NOT EXISTS idx_product_variants_name_trgm ON product_variants USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku_trgm ON product_variants USING gin (sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_product_variants_barcode_trgm ON product_variants USING gin (barcode gin_trgm_ops);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_name_trgm ON categories USING gin (name gin_trgm_ops);

-- Receipts
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number_trgm ON receipts USING gin (receipt_number gin_trgm_ops);

-- Movement Documents
CREATE INDEX IF NOT EXISTS idx_movement_documents_document_number_trgm ON movement_documents USING gin (document_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_movement_documents_notes_trgm ON movement_documents USING gin (notes gin_trgm_ops);
