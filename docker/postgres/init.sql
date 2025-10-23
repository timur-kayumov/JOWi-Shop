-- PostgreSQL initialization script for JOWi Shop
-- This script runs once when the database is first created

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- Create a function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: Row-Level Security (RLS) policies will be added via migrations
-- after Prisma generates the initial schema

COMMENT ON DATABASE jowi_shop IS 'JOWi Shop - Multi-tenant retail management system';
