#!/usr/bin/env tsx
/**
 * Load test for receipt number generation race condition fix
 *
 * Tests that the database sequence solution prevents duplicate receipt numbers
 * under high concurrency (229+ RPS target).
 *
 * Usage:
 *   npx tsx scripts/test-receipt-race-condition.ts
 */

import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:4000/api/v1';
const TENANT_ID = '424af838-23a4-40ae-bb7c-a7243106026e';
const STORE_ID = 'store-benchmark-1';
const TERMINAL_ID = 'terminal-benchmark-1';
const TEST_USER_ID = 'user-benchmark-test';

// Test parameters
const CONCURRENT_REQUESTS = 500; // Total requests
const BATCH_SIZE = 50; // Concurrent requests per batch
const TARGET_RPS = 229;

interface TestResult {
  receiptNumber: string;
  success: boolean;
  error?: string;
  duration: number;
}

async function createReceipt(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await axios.post(
      `${API_URL}/receipts`,
      {
        storeId: STORE_ID,
        terminalId: TERMINAL_ID,
        employeeId: TEST_USER_ID,
        items: [
          {
            variantId: 'dummy-variant-id',
            quantity: 1,
            price: 10000,
            discountAmount: 0,
            taxRate: 12,
          },
        ],
        payments: [
          {
            method: 'cash',
            amount: 11200, // 10000 + 12% tax
          },
        ],
      },
      {
        headers: {
          'x-tenant-id': TENANT_ID,
        },
      }
    );

    return {
      receiptNumber: response.data.receiptNumber,
      success: true,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || error.response?.status || error.message;
    const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : '';
    return {
      receiptNumber: '',
      success: false,
      error: `${errorMsg} ${errorDetails}`,
      duration: Date.now() - startTime,
    };
  }
}

async function runBatch(batchSize: number): Promise<TestResult[]> {
  const promises = Array(batchSize)
    .fill(null)
    .map(() => createReceipt());

  return Promise.all(promises);
}

async function main() {
  console.log('🧪 Testing receipt number generation race condition fix\n');
  console.log('Configuration:');
  console.log(`  API URL: ${API_URL}`);
  console.log(`  Tenant ID: ${TENANT_ID}`);
  console.log(`  Store ID: ${STORE_ID}`);
  console.log(`  Total Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`  Batch Size: ${BATCH_SIZE}`);
  console.log(`  Target RPS: ${TARGET_RPS}`);
  console.log('\n' + '='.repeat(60) + '\n');

  // Health check
  console.log('🔍 Checking API health...');
  try {
    await axios.get(`${API_URL}/health`);
    console.log('✅ API is healthy\n');
  } catch (error) {
    console.error('❌ API is not responding. Please start the API server.');
    console.error(`   Tried: ${API_URL}/health`);
    process.exit(1);
  }

  // Run load test
  const allResults: TestResult[] = [];
  const startTime = Date.now();
  const batches = Math.ceil(CONCURRENT_REQUESTS / BATCH_SIZE);

  console.log(`🚀 Starting load test with ${batches} batches...\n`);

  for (let i = 0; i < batches; i++) {
    const batchStart = Date.now();
    const currentBatchSize = Math.min(BATCH_SIZE, CONCURRENT_REQUESTS - allResults.length);

    console.log(`  Batch ${i + 1}/${batches}: ${currentBatchSize} requests...`);

    const results = await runBatch(currentBatchSize);
    allResults.push(...results);

    const batchDuration = Date.now() - batchStart;
    const batchRPS = (currentBatchSize / batchDuration) * 1000;

    console.log(`    ✓ Completed in ${batchDuration}ms (~${Math.round(batchRPS)} RPS)`);
  }

  const totalDuration = Date.now() - startTime;
  const actualRPS = (CONCURRENT_REQUESTS / totalDuration) * 1000;

  // Analyze results
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results\n');

  const successful = allResults.filter((r) => r.success);
  const failed = allResults.filter((r) => !r.success);
  const receiptNumbers = successful.map((r) => r.receiptNumber);
  const uniqueReceiptNumbers = new Set(receiptNumbers);
  const duplicates = receiptNumbers.length - uniqueReceiptNumbers.size;

  const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
  const minDuration = Math.min(...successful.map((r) => r.duration));
  const maxDuration = Math.max(...successful.map((r) => r.duration));

  console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`Successful: ${successful.length} (${((successful.length / CONCURRENT_REQUESTS) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${failed.length} (${((failed.length / CONCURRENT_REQUESTS) * 100).toFixed(2)}%)`);
  console.log(`\nDuplicate Receipt Numbers: ${duplicates}`);
  console.log(`Unique Receipt Numbers: ${uniqueReceiptNumbers.size}`);

  console.log(`\nPerformance:`);
  console.log(`  Total Duration: ${totalDuration}ms`);
  console.log(`  Actual RPS: ${Math.round(actualRPS)}`);
  console.log(`  Avg Response Time: ${Math.round(avgDuration)}ms`);
  console.log(`  Min Response Time: ${minDuration}ms`);
  console.log(`  Max Response Time: ${maxDuration}ms`);

  if (failed.length > 0) {
    console.log('\n❌ Failed Requests:');
    const errorCounts = new Map<string, number>();
    failed.forEach((r) => {
      const error = r.error || 'Unknown error';
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    });
    errorCounts.forEach((count, error) => {
      console.log(`  - ${error}: ${count} times`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // Final verdict
  if (duplicates === 0 && failed.length === 0) {
    console.log('✅ SUCCESS: No duplicate receipt numbers, 0% error rate!');
    console.log('✅ Race condition is FIXED!');
  } else if (duplicates > 0) {
    console.log(`❌ FAILURE: Found ${duplicates} duplicate receipt numbers!`);
    console.log('❌ Race condition still exists!');
  } else if (failed.length > 0) {
    console.log(`⚠️  PARTIAL SUCCESS: No duplicates, but ${failed.length} requests failed`);
  }

  console.log('='.repeat(60));

  // Sample receipt numbers
  if (uniqueReceiptNumbers.size > 0) {
    console.log('\n📝 Sample Receipt Numbers:');
    const samples = Array.from(uniqueReceiptNumbers).slice(0, 10);
    samples.forEach((num, idx) => {
      console.log(`  ${idx + 1}. ${num}`);
    });
  }

  process.exit(duplicates > 0 || failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ Test failed with error:', error.message);
  process.exit(1);
});
