#!/usr/bin/env tsx
/**
 * Receipt Creation Benchmark - Focused Test
 *
 * Тестирует только создание чеков с per-terminal sequences
 */

import autocannon, { type Result } from 'autocannon';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@jowi/database';

const prisma = new PrismaClient();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';
const DURATION = parseInt(process.env.DURATION || '30', 10); // seconds
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '10', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';

// Test user
const TEST_USER = {
  id: 'user-benchmark-test',
  tenantId: '424af838-23a4-40ae-bb7c-a7243106026e',
  role: 'admin',
  email: 'test@jowi.shop',
};

// Results directory
const RESULTS_DIR = join(process.cwd(), 'benchmark-results');

let authToken: string;
let testReceiptData: Record<string, unknown>;

function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function ensureResultsDir() {
  try {
    mkdirSync(RESULTS_DIR, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
}

async function prepareTestData() {
  log('Getting test data from database...');

  try {
    const store = await prisma.store.findFirst({
      where: { tenantId: TEST_USER.tenantId },
    });
    if (!store) throw new Error('No store found');

    const terminal = await prisma.terminal.findFirst({
      where: { storeId: store.id },
    });
    if (!terminal) throw new Error('No terminal found');

    const employee = await prisma.employee.findFirst({
      where: { tenantId: TEST_USER.tenantId },
    });
    if (!employee) throw new Error('No employee found');

    const variants = await prisma.productVariant.findMany({
      where: {
        product: { tenantId: TEST_USER.tenantId }
      },
      take: 2,
    });
    if (variants.length < 2) throw new Error('Not enough variants found');

    testReceiptData = {
      storeId: store.id,
      terminalId: terminal.id,
      employeeId: employee.id,
      items: [
        {
          variantId: variants[0].id,
          quantity: 1,
          price: 15000,
          discountAmount: 1000,
          taxRate: 12,
        },
        {
          variantId: variants[1].id,
          quantity: 2,
          price: 20000,
          discountAmount: 1000,
          taxRate: 12,
        }
      ],
      payments: [
        {
          method: 'cash',
          amount: 70000,
        }
      ],
      comment: 'Benchmark test receipt'
    };

    log(`✓ Test data prepared (Store: ${store.name}, Terminal: ${terminal.name})`);
  } catch (error) {
    log(`✗ Error getting test data: ${error}`);
    throw error;
  }
}

function generateAuthToken(): string {
  const payload = {
    sub: TEST_USER.id,
    tenant_id: TEST_USER.tenantId,
    role: TEST_USER.role,
    email: TEST_USER.email,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

async function runBenchmark(): Promise<Result> {
  const url = `${API_URL}${API_PREFIX}/receipts`;

  log('\\n' + '='.repeat(60));
  log(`Starting Receipt Creation Benchmark`);
  log(`URL: ${url}`);
  log(`Duration: ${DURATION}s, Connections: ${CONNECTIONS}`);
  log('='.repeat(60) + '\\n');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
    'x-tenant-id': TEST_USER.tenantId,
  };

  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url,
      method: 'POST',
      headers,
      body: JSON.stringify(testReceiptData),
      connections: CONNECTIONS,
      pipelining: 1,
      duration: DURATION,
    }, (err: Error | null, result: Result) => {
      if (err) {
        log(`✗ Benchmark error: ${err}`);
        reject(err);
        return;
      }

      log('\\n✓ Benchmark completed');
      log(`  Total requests: ${result.requests.total}`);
      log(`  RPS: ${result.requests.average.toFixed(2)}`);
      log(`  Latency p50: ${result.latency.p50}ms`);
      log(`  Latency p95: ${result.latency.p97_5}ms`);
      log(`  Latency p99: ${result.latency.p99}ms`);
      log(`  Errors: ${result.errors}`);
      log(`  Timeouts: ${result.timeouts}`);
      log(`  Non-2xx: ${result.non2xx || 0}`);
      log(`  2xx responses: ${result.requests.total - (result.non2xx || 0)}`);

      const successRate = ((result.requests.total - (result.non2xx || 0)) / result.requests.total * 100).toFixed(2);
      log(`  Success rate: ${successRate}%`);

      resolve(result);
    });

    autocannon.track(instance, { renderProgressBar: true });
  });
}

function saveResults(result: Result) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  const summary = {
    timestamp: new Date().toISOString(),
    duration: DURATION,
    connections: CONNECTIONS,
    totalRequests: result.requests.total,
    rps: result.requests.average.toFixed(2),
    latency: {
      p50: result.latency.p50,
      p95: result.latency.p97_5,
      p99: result.latency.p99,
    },
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx || 0,
    successfulRequests: result.requests.total - (result.non2xx || 0),
    successRate: ((result.requests.total - (result.non2xx || 0)) / result.requests.total * 100).toFixed(2) + '%',
  };

  const summaryFile = join(RESULTS_DIR, `receipt-benchmark-${timestamp}.json`);
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  log(`\\n✓ Results saved: ${summaryFile}`);

  return summary;
}

async function main() {
  log('🚀 Starting Receipt Creation Benchmark');
  log(`API: ${API_URL}`);
  log(`Duration: ${DURATION}s`);
  log(`Connections: ${CONNECTIONS}`);

  ensureResultsDir();

  try {
    authToken = generateAuthToken();
    log('✓ JWT token generated');

    await prepareTestData();

    const result = await runBenchmark();
    const summary = saveResults(result);

    log('\\n' + '='.repeat(60));
    log('FINAL RESULTS');
    log('='.repeat(60));
    console.table([summary]);

    log('\\n✅ Benchmark completed successfully!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    log(`\\n❌ Benchmark failed: ${err}`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
