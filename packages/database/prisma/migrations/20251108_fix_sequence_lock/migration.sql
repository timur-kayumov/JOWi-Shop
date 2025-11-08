-- Fix Race Condition in Per-Terminal Receipt Number Generation
--
-- Problem: Multiple concurrent requests from the same terminal can call nextval()
-- simultaneously, but without proper locking around the nextval() call itself.
-- The previous advisory lock only protected sequence CREATION, not VALUE RETRIEVAL.
--
-- Solution: Add advisory lock around nextval() to serialize access per terminal
--
-- Performance: Advisory locks are lightweight and release automatically at transaction end.
-- Each terminal has its own lock, so different terminals don't block each other.

-- Drop the old function
DROP FUNCTION IF EXISTS generate_receipt_number(uuid, uuid, uuid);

-- Create improved function with proper locking
CREATE OR REPLACE FUNCTION generate_receipt_number(
  p_tenant_id uuid,
  p_store_id uuid,
  p_terminal_id uuid
) RETURNS TEXT AS $$
DECLARE
  v_sequence_name TEXT;
  v_terminal_number INTEGER;
  v_date_part TEXT;
  v_next_val INTEGER;
  v_receipt_number TEXT;
  v_lock_key BIGINT;
BEGIN
  -- Get terminal number for human-readable receipt format
  SELECT terminal_number INTO v_terminal_number
  FROM terminals
  WHERE id = p_terminal_id AND tenant_id = p_tenant_id;

  IF v_terminal_number IS NULL THEN
    RAISE EXCEPTION 'Terminal not found: %', p_terminal_id;
  END IF;

  -- Generate date part: YYYYMMDD
  v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Sequence name: receipt_seq_tenant_{tenant_id}_terminal_{terminal_id}_date_{YYYYMMDD}
  v_sequence_name := 'receipt_seq_tenant_' || REPLACE(p_tenant_id::TEXT, '-', '_')
                     || '_terminal_' || REPLACE(p_terminal_id::TEXT, '-', '_')
                     || '_date_' || v_date_part;

  -- Calculate consistent hash for advisory lock (for sequence creation)
  v_lock_key := hashtext(v_sequence_name);

  -- Advisory lock for sequence creation (prevents concurrent CREATE SEQUENCE)
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Create sequence if it doesn't exist
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START WITH 1 INCREMENT BY 1', v_sequence_name);

  -- CRITICAL FIX: Advisory lock for nextval() call
  -- This serializes access to the sequence VALUE retrieval per terminal
  -- Lock key is different from creation lock to avoid deadlocks
  v_lock_key := hashtext(v_sequence_name || '_nextval');
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Get next value from sequence (now protected by advisory lock)
  EXECUTE format('SELECT nextval(%L)', v_sequence_name) INTO v_next_val;

  -- Generate receipt number: T{terminal_number}-R-YYYYMMDD-XXXX
  -- Example: T1-R-20251108-0001
  v_receipt_number := 'T' || v_terminal_number || '-R-' || v_date_part || '-' || LPAD(v_next_val::TEXT, 4, '0');

  RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the locking strategy
COMMENT ON FUNCTION generate_receipt_number(uuid, uuid, uuid) IS
'Generates unique receipt numbers per terminal with proper locking.
Uses two advisory locks:
1. Lock on sequence name: prevents concurrent sequence creation
2. Lock on sequence name + ''_nextval'': serializes nextval() calls per terminal
Both locks are transaction-scoped and release automatically.
Different terminals use different sequences, so they never block each other.';
