#!/usr/bin/env node
/**
 * Apply standard indexes migration
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  const migrationPath = path.join(
    __dirname,
    'prisma',
    'migrations',
    '20251108_add_standard_indexes',
    'migration.sql'
  );

  console.log('✅ Connected to database');
  console.log(`Reading migration from: ${migrationPath}`);

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Applying migration...');

  try {
    // Remove comments (lines starting with --)
    const sqlWithoutComments = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');

    // Split SQL into individual statements
    const statements = sqlWithoutComments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} SQL statements`);

    for (const [index, statement] of statements.entries()) {
      if (!statement) continue;
      console.log(`Executing statement ${index + 1}/${statements.length}...`);
      await prisma.$executeRawUnsafe(statement);
    }

    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
