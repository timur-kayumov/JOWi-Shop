#!/usr/bin/env tsx
/**
 * Generate JWT token for test user
 *
 * Creates a JWT token for benchmark testing without OTP verification.
 * This is for development/testing purposes only.
 *
 * Usage:
 *   pnpm tsx scripts/benchmark/get-test-token.ts
 */

import * as jwt from 'jsonwebtoken';

// Configuration from .env
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Test user from database
const TEST_USER = {
  id: '2251c5a5-1a56-473e-8e23-3fe37644c5fd',
  tenantId: '424af838-23a4-40ae-bb7c-a7243106026e',
  role: 'admin',
  email: 'admin@jowi.shop',
  phone: '+998901234567',
};

interface JwtPayload {
  sub: string;
  tenant_id: string;
  role: string;
  email: string;
}

function generateToken(): string {
  const payload: JwtPayload = {
    sub: TEST_USER.id,
    tenant_id: TEST_USER.tenantId,
    role: TEST_USER.role,
    email: TEST_USER.email,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function main() {
  console.log('🔑 Generating JWT token for test user...\n');

  const token = generateToken();

  console.log('Test User:');
  console.log(`  ID: ${TEST_USER.id}`);
  console.log(`  Email: ${TEST_USER.email}`);
  console.log(`  Phone: ${TEST_USER.phone}`);
  console.log(`  Role: ${TEST_USER.role}`);
  console.log(`  Tenant: ${TEST_USER.tenantId}\n`);

  console.log('JWT Token:');
  console.log(token);
  console.log('\n');

  console.log('Usage in curl:');
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/v1/stores`);
  console.log('\n');

  console.log('✅ Token generated successfully!');
}

main();
