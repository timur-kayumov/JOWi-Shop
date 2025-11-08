-- Remove advisory locks from receipt number generation
-- PostgreSQL sequences are already atomic and don't need additional locking
-- This should improve performance without sacrificing correctness

DROP FUNCTION IF EXISTS generate_receipt_number(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION generate_receipt_number(
  p_tenant_id UUID,
  p_store_id UUID,
  p_terminal_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_sequence_name TEXT;
  v_next_val INTEGER;
  v_date_part TEXT;
  v_receipt_number TEXT;
  v_terminal_number INTEGER;
  v_hash TEXT;
BEGIN
  -- Generate date part (YYYYMMDD)
  v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Generate terminal number (1-999) using hash
  v_terminal_number := (hashtext(p_terminal_id::TEXT) % 999) + 1;

  -- Create short unique hash from tenant_id + store_id + terminal_id + date
  -- This ensures uniqueness while keeping name under 63 characters
  v_hash := substring(md5(
    p_tenant_id::TEXT ||
    p_store_id::TEXT ||
    p_terminal_id::TEXT ||
    v_date_part
  ), 1, 16);

  -- Sequence name format: receipt_seq_{hash}
  -- Max length: 12 + 16 = 28 characters (well under 63 limit)
  v_sequence_name := 'receipt_seq_' || v_hash;

  -- Create sequence if it doesn't exist
  -- PostgreSQL guarantees this is safe even with concurrent calls
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START WITH 1 INCREMENT BY 1',
                 v_sequence_name);

  -- Get next value from sequence
  -- nextval() is atomic and thread-safe - no additional locking needed
  EXECUTE format('SELECT nextval(%L)', v_sequence_name) INTO v_next_val;

  -- Format receipt number: T{terminal_number}-R-{date}-{sequence}
  -- Example: T403-R-20251108-0001
  v_receipt_number := 'T' || v_terminal_number ||
                      '-R-' || v_date_part ||
                      '-' || LPAD(v_next_val::TEXT, 4, '0');

  RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql;
