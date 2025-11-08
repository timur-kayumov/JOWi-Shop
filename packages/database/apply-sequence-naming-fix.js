const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('✅ Connected to database\n');

  console.log('Applying sequence naming fix migration...\n');

  try {
    // Step 1: Drop old function
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS generate_receipt_number(uuid, uuid, uuid)`);
    console.log('  ✓ Dropped old function');

    // Step 2: Create new function
    const createFunction = `
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
  v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  v_terminal_number := (hashtext(p_terminal_id::TEXT) % 999) + 1;
  v_hash := substring(md5(p_tenant_id::TEXT || p_store_id::TEXT || p_terminal_id::TEXT || v_date_part), 1, 16);
  v_sequence_name := 'receipt_seq_' || v_hash;
  v_lock_key := hashtext(v_sequence_name);
  PERFORM pg_advisory_xact_lock(v_lock_key);
  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I START WITH 1 INCREMENT BY 1', v_sequence_name);
  v_lock_key := hashtext(v_sequence_name || '_nextval');
  PERFORM pg_advisory_xact_lock(v_lock_key);
  EXECUTE format('SELECT nextval(%L)', v_sequence_name) INTO v_next_val;
  v_receipt_number := 'T' || v_terminal_number || '-R-' || v_date_part || '-' || LPAD(v_next_val::TEXT, 4, '0');
  RETURN v_receipt_number;
END;
$$ LANGUAGE plpgsql`;

    await prisma.$executeRawUnsafe(createFunction);
    console.log('  ✓ Created new function with short hash-based names');

    // Step 3: Drop old truncated sequences
    const dropOldSequences = `
DO $$
DECLARE
  seq RECORD;
BEGIN
  FOR seq IN
    SELECT sequencename
    FROM pg_sequences
    WHERE sequencename LIKE 'receipt_seq_%'
      AND length(sequencename) >= 60
  LOOP
    EXECUTE format('DROP SEQUENCE IF EXISTS %I', seq.sequencename);
    RAISE NOTICE 'Dropped old sequence: %', seq.sequencename;
  END LOOP;
END $$`;

    await prisma.$executeRawUnsafe(dropOldSequences);
    console.log('  ✓ Dropped old truncated sequences\n');

    console.log('✅ Migration applied successfully!\n');
    console.log('📝 Migration Summary:');
    console.log('   ✓ Fixed sequence name length issue (was 131 chars, now 28 chars)');
    console.log('   ✓ Uses MD5 hash instead of full UUIDs');
    console.log('   ✓ Dropped old truncated sequences');
    console.log('   ✓ Each terminal+date combination gets unique sequence');
    console.log('   ✓ Advisory locks prevent race conditions');
    console.log('\n🎯 Next step: Delete old receipts and test creation');
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
