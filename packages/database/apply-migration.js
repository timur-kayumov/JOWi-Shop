const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Reading migration SQL...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'prisma/migrations/20250107_add_receipt_sequence/migration.sql'),
      'utf-8'
    );

    console.log('Applying migration commands...');

    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      try {
        await prisma.$executeRawUnsafe(stmt);
      } catch (err) {
        // Skip errors for IF NOT EXISTS and similar idempotent operations
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }

    console.log('✅ Migration applied successfully!');

    // Mark migration as applied in Prisma migrations table
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        gen_random_uuid(),
        '',
        NOW(),
        '20250107_add_receipt_sequence',
        NULL,
        NULL,
        NOW(),
        1
      )
      ON CONFLICT DO NOTHING
    `);

    console.log('✅ Migration marked as applied in Prisma');

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
