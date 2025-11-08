const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'jowi',
    password: 'jowi_dev_password',
    database: 'jowi_shop',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    console.log('Reading migration SQL...');
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'prisma/migrations/20251029_add_receipt_sequence/migration.sql'),
      'utf-8'
    );

    console.log('Applying migration...');
    await client.query(migrationSQL);

    console.log('✅ Migration applied successfully!');

    // Mark migration as applied in Prisma migrations table
    await client.query(`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
      VALUES (
        gen_random_uuid(),
        '',
        NOW(),
        '20251029_add_receipt_sequence_updated',
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
    await client.end();
  }
}

applyMigration();
