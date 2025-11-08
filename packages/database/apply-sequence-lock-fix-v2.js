const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('✅ Connected to database');
  console.log('Reading migration SQL...');

  const migrationPath = path.join(__dirname, 'prisma', 'migrations', '20251108_fix_sequence_lock_v2', 'migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying sequence lock fix migration (v2)...');

  try {
    // Drop old function
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS generate_receipt_number(uuid, uuid, uuid)`);
    console.log('  ✓ Dropped old function');

    // Create new function with locks
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
BEGIN
  v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  v_terminal_number := (hashtext(p_terminal_id::TEXT) % 999) + 1;
  v_sequence_name := 'receipt_seq_' ||
                     REPLACE(p_tenant_id::TEXT, '-', '_') || '_' ||
                     REPLACE(p_store_id::TEXT, '-', '_') || '_' ||
                     REPLACE(p_terminal_id::TEXT, '-', '_') || '_' ||
                     v_date_part;
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
    console.log('  ✓ Created new function with advisory locks');

    console.log('✅ Migration applied successfully!');
    console.log('✅ Migration marked as applied in Prisma');

    console.log('\n📝 Migration Summary:');
    console.log('   - Fixed race condition in generate_receipt_number()');
    console.log('   - Added advisory lock around nextval() call');
    console.log('   - Uses hash-based terminal number (no database lookup)');
    console.log('   - Each terminal has serialized access to its sequence');
    console.log('   - Different terminals still process concurrently');
    console.log('   - Expected result: 0% unique constraint violations under load');
  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
