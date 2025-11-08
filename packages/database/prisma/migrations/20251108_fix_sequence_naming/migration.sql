-- Fix sequence name length issue
-- Use hash instead of full UUIDs to keep names under 63 characters

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
  v_lock_key BIGINT;
  v_hash TEXT;
BEGIN
  -- Generate date part
  v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Generate terminal number (1-999)
  v_terminal_number := (hashtext(p_terminal_id::TEXT) % 999) + 1;

  -- Create short unique hash from tenant_id + store_id + terminal_id + date
  -- This ensures uniqueness while keeping name under 63 characters
  v_hash := substring(md5(p_tenant_id::TEXT || p_store_id::TEXT || p_terminal_id::TEXT || v_date_part), 1, 16);

  -- Sequence name format: receipt_seq_{hash}
  -- Max length: 12 + 16 = 28 characters (well under 63 limit)
  v_sequence_name := 'receipt_seq_' || v_hash;

  -- Acquire advisory lock on sequence creation
  v_lock_key := hashtext(v_sequence_name);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Create sequence if it doesn't exist
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START WITH 1 INCREMENT BY 1', v_sequence_name);

  -- Acquire advisory lock on nextval operation
  v_lock_key := hashtext(v_sequence_name || '_nextval');
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Get next value
  EXECUTE format('SELECT nextval(%L)', v_sequence_name) INTO v_next_val;

  -- Format: T{terminal_number}-R-{date}-{sequence}
  -- Example: T403-R-20251108-0001
  v_receipt_number := 'T' || v_terminal_number || '-R-' || v_date_part || '-' || LPAD(v_next_val::TEXT, 4, '0');

  RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Clean up old sequences with truncated names
DO $$
DECLARE
  seq RECORD;
BEGIN
  FOR seq IN
    SELECT sequencename
    FROM pg_sequences
    WHERE sequencename LIKE 'receipt_seq_%'
      AND length(sequencename) >= 60  -- Old truncated sequences
  LOOP
    EXECUTE format('DROP SEQUENCE IF EXISTS %I', seq.sequencename);
    RAISE NOTICE 'Dropped old sequence: %', seq.sequencename;
  END LOOP;
END $$;
