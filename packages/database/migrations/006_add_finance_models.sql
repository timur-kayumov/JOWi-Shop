-- Migration: Add Finance Models (Safes, PaymentTypes, TerminalPaymentTypes)
-- Created: 2025-01-07

-- Create safes table
CREATE TABLE IF NOT EXISTS safes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    store_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cash', 'bank_account', 'card_account')),
    account_number TEXT,
    balance NUMERIC(15, 0) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_safes_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Create payment_types table
CREATE TABLE IF NOT EXISTS payment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    safe_id UUID NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT fk_payment_types_safe FOREIGN KEY (safe_id) REFERENCES safes(id) ON DELETE CASCADE
);

-- Create terminal_payment_types junction table
CREATE TABLE IF NOT EXISTS terminal_payment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    terminal_id UUID NOT NULL,
    payment_type_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_terminal_payment_types_payment_type FOREIGN KEY (payment_type_id) REFERENCES payment_types(id) ON DELETE CASCADE,
    CONSTRAINT unique_terminal_payment_type UNIQUE (terminal_id, payment_type_id)
);

-- Create indexes for safes
CREATE INDEX IF NOT EXISTS idx_safes_tenant_id ON safes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_safes_store_id ON safes(store_id);

-- Create indexes for payment_types
CREATE INDEX IF NOT EXISTS idx_payment_types_tenant_id ON payment_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_types_safe_id ON payment_types(safe_id);

-- Create indexes for terminal_payment_types
CREATE INDEX IF NOT EXISTS idx_terminal_payment_types_terminal_id ON terminal_payment_types(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminal_payment_types_payment_type_id ON terminal_payment_types(payment_type_id);

-- Add updated_at trigger for safes
CREATE OR REPLACE FUNCTION update_safes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_safes_updated_at
    BEFORE UPDATE ON safes
    FOR EACH ROW
    EXECUTE FUNCTION update_safes_updated_at();

-- Add updated_at trigger for payment_types
CREATE OR REPLACE FUNCTION update_payment_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_types_updated_at
    BEFORE UPDATE ON payment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_types_updated_at();
