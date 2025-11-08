-- Create function to generate receipt number with atomic sequence
-- This function ensures uniqueness even under high concurrency
-- UPDATED: Include date in sequence name to allow daily resets
CREATE OR REPLACE FUNCTION generate_receipt_number(
  p_tenant_id UUID,
  p_store_id UUID
) RETURNS TEXT AS $$
DECLARE
  v_sequence_name TEXT;
  v_next_val INTEGER;
  v_date_part TEXT;
  v_receipt_number TEXT;
BEGIN
  -- Format date part as YYYYMMDD
  v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Generate unique sequence name per tenant+store+date
  -- Format: receipt_seq_<tenant_id>_<store_id>_<YYYYMMDD>
  -- This ensures daily reset without manual intervention
  v_sequence_name := 'receipt_seq_' ||
                     REPLACE(p_tenant_id::TEXT, '-', '_') || '_' ||
                     REPLACE(p_store_id::TEXT, '-', '_') || '_' ||
                     v_date_part;

  -- Create sequence if it doesn't exist (for this specific day)
  -- Using pg_advisory_xact_lock to prevent concurrent creation conflicts
  PERFORM pg_advisory_xact_lock(hashtext(v_sequence_name));

  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START WITH 1 INCREMENT BY 1', v_sequence_name);

  -- Get next value from sequence (atomic operation)
  EXECUTE format('SELECT nextval(%L)', v_sequence_name) INTO v_next_val;

  -- Generate receipt number: R-YYYYMMDD-XXXX
  -- Example: R-20251107-0001
  v_receipt_number := 'R-' || v_date_part || '-' || LPAD(v_next_val::TEXT, 4, '0');

  RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql;

-- Create helper function to reset daily counters (optional, for future use)
CREATE OR REPLACE FUNCTION reset_daily_receipt_sequences() RETURNS VOID AS $$
DECLARE
  seq_record RECORD;
BEGIN
  -- Find all receipt sequences and reset them
  FOR seq_record IN
    SELECT sequencename
    FROM pg_sequences
    WHERE sequencename LIKE 'receipt_seq_%'
  LOOP
    EXECUTE format('ALTER SEQUENCE %I RESTART WITH 1', seq_record.sequencename);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION generate_receipt_number(UUID, UUID) IS
  'Generates unique receipt number using PostgreSQL sequence. Format: R-YYYYMMDD-XXXX. Thread-safe and prevents race conditions.';

COMMENT ON FUNCTION reset_daily_receipt_sequences() IS
  'Resets all receipt sequences to 1. Can be called daily via cron job.';
