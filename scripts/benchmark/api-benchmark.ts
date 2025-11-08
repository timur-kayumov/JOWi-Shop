#!/usr/bin/env tsx
/**
 * JOWi Shop API Benchmark Script
 *
 * Проводит нагрузочное тестирование API endpoints с использованием autocannon.
 * Результаты сохраняются в JSON файлы для последующего анализа.
 *
 * Использование:
 *   pnpm tsx scripts/benchmark/api-benchmark.ts
 *
 * Опции через переменные окружения:
 *   API_URL - базовый URL API (default: http://localhost:3001)
 *   DURATION - длительность теста в секундах (default: 30)
 *   CONNECTIONS - количество одновременных соединений (default: 10)
 */

import autocannon, { type Result } from 'autocannon';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@jowi/database';

// Prisma client
const prisma = new PrismaClient();

// Конфигурация
const API_URL = process.env.API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';
const DURATION = parseInt(process.env.DURATION || '30', 10); // секунды
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '10', 10);
const PIPELINE = 1; // Request pipelining (1 = disabled for accurate latency)

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';

// Test user credentials (must match real user from seed-benchmark.ts)
const TEST_USER = {
  id: 'user-benchmark-test',
  tenantId: '424af838-23a4-40ae-bb7c-a7243106026e',
  role: 'admin',
  email: 'test@jowi.shop',
};

// JWT токен
let authToken: string | null = null;

// Test data for POST requests
let testReceiptData: Record<string, unknown> | null = null;
let testBarcodes: string[] = [];
let testLargeReceiptData: Record<string, unknown> | null = null;

// Директория для результатов
const RESULTS_DIR = join(process.cwd(), 'benchmark-results');

interface BenchmarkResult {
  scenario: string;
  timestamp: string;
  url: string;
  duration: number;
  connections: number;
  requests: {
    total: number;
    average: number; // RPS
    mean: number;
    stddev: number;
    min: number;
    max: number;
    p0_001: number;
    p0_01: number;
    p0_1: number;
    p1: number;
    p2_5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p97_5: number;
    p99: number;
    p99_9: number;
    p99_99: number;
    p99_999: number;
  };
  latency: {
    mean: number;
    stddev: number;
    min: number;
    max: number;
    p0_001: number;
    p0_01: number;
    p0_1: number;
    p1: number;
    p2_5: number;
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p97_5: number;
    p99: number;
    p99_9: number;
    p99_99: number;
    p99_999: number;
  };
  throughput: {
    average: number;
    mean: number;
    stddev: number;
    min: number;
    max: number;
    total: number;
  };
  errors: number;
  timeouts: number;
  non2xx: number;
}

const allResults: BenchmarkResult[] = [];

/**
 * Логирует сообщение с timestamp
 */
function log(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

/**
 * Создает директорию для результатов
 */
function ensureResultsDir() {
  try {
    mkdirSync(RESULTS_DIR, { recursive: true });
    log(`✓ Директория результатов: ${RESULTS_DIR}`);
  } catch (err) {
    log(`✗ Ошибка создания директории: ${err}`);
    process.exit(1);
  }
}

/**
 * Подготавливает тестовые данные для POST запросов
 */
async function prepareTestData() {
  log('Получение тестовых данных из базы...');

  try {
    // Get store
    const store = await prisma.store.findFirst({
      where: { tenantId: TEST_USER.tenantId },
    });
    if (!store) throw new Error('No store found');

    // Get terminal
    const terminal = await prisma.terminal.findFirst({
      where: { storeId: store.id },
    });
    if (!terminal) throw new Error('No terminal found');

    // Get employee
    const employee = await prisma.employee.findFirst({
      where: { tenantId: TEST_USER.tenantId },
    });
    if (!employee) throw new Error('No employee found');

    // Get product variants (at least 50 for large receipt test)
    const variants = await prisma.productVariant.findMany({
      where: {
        product: { tenantId: TEST_USER.tenantId }
      },
      take: 50,
    });
    if (variants.length < 2) throw new Error('Not enough variants found');

    // Collect barcodes for barcode scanning test (top 10)
    testBarcodes = variants.slice(0, 10).map(v => v.barcode).filter(Boolean) as string[];
    if (testBarcodes.length === 0) {
      log('⚠️  No barcodes found, barcode scanning test will be skipped');
    }

    // Prepare normal receipt data (2 items)
    testReceiptData = {
      storeId: store.id,
      terminalId: terminal.id,
      employeeId: employee.id,
      items: [
        {
          variantId: variants[0].id,
          quantity: 1,
          price: 15000,
          discountAmount: 0,
          taxRate: 12,
        },
        {
          variantId: variants[1].id,
          quantity: 2,
          price: 20000,
          discountAmount: 0,
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

    // Prepare large receipt data (20-50 items)
    const largeReceiptItemCount = Math.min(variants.length, 30); // Use 30 items
    const largeReceiptItems = variants.slice(0, largeReceiptItemCount).map((v, idx) => ({
      variantId: v.id,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: 15000 + (idx * 1000), // Use fixed prices like test-receipt.ts
      discountAmount: 0,
      taxRate: 12,
    }));
    const largeReceiptTotal = largeReceiptItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    testLargeReceiptData = {
      storeId: store.id,
      terminalId: terminal.id,
      employeeId: employee.id,
      items: largeReceiptItems,
      payments: [
        {
          method: 'cash',
          amount: largeReceiptTotal,
        }
      ],
      comment: 'Large receipt benchmark test'
    };

    log(`✓ Тестовые данные подготовлены (Store: ${store.name})`);
    log(`  - Barcodes for scanning: ${testBarcodes.length}`);
    log(`  - Large receipt items: ${largeReceiptItems.length}`);
  } catch (error) {
    log(`✗ Ошибка получения тестовых данных: ${error}`);
    throw error;
  }
}

/**
 * Генерирует JWT токен для тестового пользователя
 */
function generateAuthToken(): string {
  log('Генерация JWT токена...');

  const payload = {
    sub: TEST_USER.id,
    tenant_id: TEST_USER.tenantId,
    role: TEST_USER.role,
    email: TEST_USER.email,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

  log(`✓ JWT токен сгенерирован`);
  return token;
}

/**
 * Запускает benchmark для endpoint
 */
async function runBenchmark(
  scenario: string,
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  } = {}
): Promise<BenchmarkResult> {
  const url = `${API_URL}${API_PREFIX}${path}`;

  log(`\n${'='.repeat(60)}`);
  log(`Запуск benchmark: ${scenario}`);
  log(`URL: ${url}`);
  log(`Длительность: ${DURATION}s, Connections: ${CONNECTIONS}`);
  log(`${'='.repeat(60)}\n`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken && !path.startsWith('/auth')) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // TEMPORARY: Add x-tenant-id header for load testing (JwtGuard disabled globally)
  headers['x-tenant-id'] = TEST_USER.tenantId;

  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url,
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      connections: CONNECTIONS,
      pipelining: PIPELINE,
      duration: DURATION,
    }, (err: Error | null, result: Result) => {
      if (err) {
        log(`✗ Ошибка benchmark: ${err}`);
        reject(err);
        return;
      }

      log(`\n✓ Benchmark завершен: ${scenario}`);
      log(`  Requests: ${result.requests.total} total, ${result.requests.average.toFixed(2)} req/sec`);
      log(`  Latency: p50=${result.latency.p50}ms, p95=${result.latency.p97_5}ms, p99=${result.latency.p99}ms`);
      log(`  Throughput: ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB`);
      log(`  Errors: ${result.errors}, Timeouts: ${result.timeouts}`);

      const benchmarkResult: BenchmarkResult = {
        scenario,
        timestamp: new Date().toISOString(),
        url,
        duration: DURATION,
        connections: CONNECTIONS,
        requests: {
          total: result.requests.total,
          average: result.requests.average,
          mean: result.requests.mean,
          stddev: result.requests.stddev,
          min: result.requests.min,
          max: result.requests.max,
          p0_001: result.requests.p0_001,
          p0_01: result.requests.p0_01,
          p0_1: result.requests.p0_1,
          p1: result.requests.p1,
          p2_5: result.requests.p2_5,
          p10: result.requests.p10,
          p25: result.requests.p25,
          p50: result.requests.p50,
          p75: result.requests.p75,
          p90: result.requests.p90,
          p97_5: result.requests.p97_5,
          p99: result.requests.p99,
          p99_9: result.requests.p99_9,
          p99_99: result.requests.p99_99,
          p99_999: result.requests.p99_999,
        },
        latency: {
          mean: result.latency.mean,
          stddev: result.latency.stddev,
          min: result.latency.min,
          max: result.latency.max,
          p0_001: result.latency.p0_001,
          p0_01: result.latency.p0_01,
          p0_1: result.latency.p0_1,
          p1: result.latency.p1,
          p2_5: result.latency.p2_5,
          p10: result.latency.p10,
          p25: result.latency.p25,
          p50: result.latency.p50,
          p75: result.latency.p75,
          p90: result.latency.p90,
          p97_5: result.latency.p97_5,
          p99: result.latency.p99,
          p99_9: result.latency.p99_9,
          p99_99: result.latency.p99_99,
          p99_999: result.latency.p99_999,
        },
        throughput: {
          average: result.throughput.average,
          mean: result.throughput.mean,
          stddev: result.throughput.stddev,
          min: result.throughput.min,
          max: result.throughput.max,
          total: result.throughput.total,
        },
        errors: result.errors,
        timeouts: result.timeouts,
        non2xx: result.non2xx || 0,
      };

      allResults.push(benchmarkResult);
      resolve(benchmarkResult);
    });

    // Прогресс бар
    autocannon.track(instance, { renderProgressBar: true });
  });
}

/**
 * Сохраняет результаты в JSON файлы
 */
function saveResults() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  // Сохраняем все результаты в один файл
  const allResultsFile = join(RESULTS_DIR, `benchmark-${timestamp}.json`);
  writeFileSync(allResultsFile, JSON.stringify(allResults, null, 2));
  log(`\n✓ Все результаты сохранены: ${allResultsFile}`);

  // Сохраняем summary
  const summary = {
    timestamp: new Date().toISOString(),
    duration: DURATION,
    connections: CONNECTIONS,
    scenarios: allResults.map(r => ({
      scenario: r.scenario,
      rps: r.requests.average.toFixed(2),
      latency_p50: r.latency.p50,
      latency_p95: r.latency.p97_5,
      latency_p99: r.latency.p99,
      errors: r.errors,
      timeouts: r.timeouts,
    })),
  };

  const summaryFile = join(RESULTS_DIR, `summary-${timestamp}.json`);
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  log(`✓ Summary сохранен: ${summaryFile}`);

  // Печатаем summary в консоль
  log('\n' + '='.repeat(60));
  log('SUMMARY');
  log('='.repeat(60));
  console.table(summary.scenarios);
}

/**
 * Главная функция
 */
async function main() {
  log('🚀 Запуск benchmark для JOWi Shop API');
  log(`API: ${API_URL}`);
  log(`Длительность: ${DURATION}s`);
  log(`Соединения: ${CONNECTIONS}`);

  ensureResultsDir();

  try {
    // Генерируем токен для аутентифицированных запросов
    authToken = generateAuthToken();

    // Подготавливаем тестовые данные для POST запросов
    await prepareTestData();

    // Health check (public)
    await runBenchmark('Health Check', '/health', {});

    // Search (public, но может использовать tenantId из токена)
    await runBenchmark('Search - Global', '/search?query=product', {});

    // Stores - List (authenticated)
    if (authToken) {
      await runBenchmark('Stores - List', '/stores?page=1&limit=20', {});
    } else {
      log('⚠️  Пропуск Stores - List (требуется auth)');
    }

    // Customers - List (authenticated)
    if (authToken) {
      await runBenchmark('Customers - List', '/customers?page=1&limit=20', {});
    } else {
      log('⚠️  Пропуск Customers - List (требуется auth)');
    }

    // Receipts - Create (authenticated, POST - WRITE operation)
    if (authToken && testReceiptData) {
      await runBenchmark('Receipts - Create (POST)', '/receipts', {
        method: 'POST',
        body: testReceiptData,
      });
    } else {
      log('⚠️  Пропуск Receipts - Create (требуется auth и test data)');
    }

    // ========== NEW TESTS ==========

    // Barcode Scanning Test (critical for POS)
    // TEMPORARILY DISABLED: endpoint не реализован
    // if (authToken && testBarcodes.length > 0) {
    //   const randomBarcode = testBarcodes[Math.floor(Math.random() * testBarcodes.length)];
    //   await runBenchmark('Product Search by Barcode', `/products/by-barcode/${randomBarcode}`, {});
    // } else {
    //   log('⚠️  Пропуск Barcode Scanning (нет barcodes)');
    // }
    log('⚠️  Пропуск Barcode Scanning (endpoint не реализован)');

    // Large Receipt Test (20-50 items)
    if (authToken && testLargeReceiptData) {
      await runBenchmark('Receipts - Create Large (30 items)', '/receipts', {
        method: 'POST',
        body: testLargeReceiptData,
      });
    } else {
      log('⚠️  Пропуск Large Receipt (требуется auth и test data)');
    }

    // Concurrent Receipt Creation Test (race condition check)
    if (authToken && testReceiptData) {
      log('\n' + '='.repeat(60));
      log('Запуск concurrent receipt creation test (5 одновременных запросов)');
      log('='.repeat(60));

      const concurrentRequests = 5;
      const startTime = Date.now();

      try {
        const results = await Promise.all(
          Array.from({ length: concurrentRequests }, async (_, i) => {
            const response = await fetch(`${API_URL}${API_PREFIX}/receipts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-tenant-id': TEST_USER.tenantId,
              },
              body: JSON.stringify(testReceiptData),
            });
            return {
              index: i,
              status: response.status,
              ok: response.ok,
              data: response.ok ? await response.json() : null,
            };
          })
        );

        const endTime = Date.now();
        const duration = endTime - startTime;

        const successful = results.filter(r => r.ok).length;
        const failed = results.filter(r => !r.ok).length;

        log(`\n✓ Concurrent receipt creation завершен`);
        log(`  Всего запросов: ${concurrentRequests}`);
        log(`  Успешно: ${successful}`);
        log(`  Ошибки: ${failed}`);
        log(`  Время выполнения: ${duration}ms`);
        log(`  Средняя latency: ${(duration / concurrentRequests).toFixed(2)}ms`);

        // Check for unique receipt numbers (race condition validation)
        const receiptNumbers = results
          .filter(r => r.data?.receiptNumber)
          .map(r => r.data.receiptNumber);
        const uniqueReceiptNumbers = new Set(receiptNumbers);

        if (receiptNumbers.length === uniqueReceiptNumbers.size) {
          log(`  ✓ Все receipt numbers уникальны (race condition check passed)`);
        } else {
          log(`  ✗ ОБНАРУЖЕНА ПРОБЛЕМА: duplicate receipt numbers!`);
        }

      } catch (error) {
        log(`✗ Ошибка concurrent receipt creation: ${error}`);
      }
    }

    // Stock Decrement Validation Test
    if (authToken && testReceiptData) {
      log('\n' + '='.repeat(60));
      log('Запуск stock decrement validation test');
      log('='.repeat(60));

      try {
        // Get initial stock level
        const variantId = testReceiptData.items[0].variantId;
        const storeId = testReceiptData.storeId;

        const stockBefore = await prisma.stockLevel.findFirst({
          where: { variantId, storeId },
        });

        if (!stockBefore) {
          log('⚠️  Пропуск stock validation (stock level не найден)');
        } else {
          log(`  Stock before: ${stockBefore.quantity}`);

          // Create receipt
          const response = await fetch(`${API_URL}${API_PREFIX}/receipts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
              'x-tenant-id': TEST_USER.tenantId,
            },
            body: JSON.stringify(testReceiptData),
          });

          if (response.ok) {
            const receipt = await response.json();
            log(`  ✓ Receipt created: ${receipt.receiptNumber}`);

            // Get stock level after
            const stockAfter = await prisma.stockLevel.findFirst({
              where: { variantId, storeId },
            });

            if (stockAfter) {
              log(`  Stock after: ${stockAfter.quantity}`);
              const expectedStock = stockBefore.quantity - testReceiptData.items[0].quantity;
              const actualStock = stockAfter.quantity;

              if (actualStock === expectedStock) {
                log(`  ✓ Stock decrement correct: ${stockBefore.quantity} - ${testReceiptData.items[0].quantity} = ${actualStock}`);
              } else {
                log(`  ✗ Stock decrement INCORRECT: expected ${expectedStock}, got ${actualStock}`);
              }
            }
          } else {
            log(`  ✗ Receipt creation failed: ${response.status}`);
          }
        }
      } catch (error) {
        log(`✗ Ошибка stock validation: ${error}`);
      }
    }

    // Mixed Load Scenario (2 min, 20 connections)
    // 70% READ, 25% CREATE, 4% UPDATE, 1% DELETE
    if (authToken && testReceiptData) {
      log('\n' + '='.repeat(60));
      log('Запуск Mixed Load Scenario (реалистичная нагрузка)');
      log('Длительность: 2 минуты, Connections: 20');
      log('Mix: 70% READ, 25% CREATE, 4% UPDATE, 1% DELETE');
      log('='.repeat(60));

      const mixedLoadDuration = 120; // 2 minutes
      const mixedLoadConnections = 20;

      // Define weighted requests
      const requests: Array<{
        method: string;
        path: string;
        headers: Record<string, string>;
        body?: string;
      }> = [
        // 70% READ operations
        ...Array(35).fill({
          method: 'GET',
          path: `${API_PREFIX}/search?query=product`,
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }),
        ...Array(20).fill({
          method: 'GET',
          path: `${API_PREFIX}/stores?page=1&limit=20`,
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }),
        ...Array(15).fill({
          method: 'GET',
          path: `${API_PREFIX}/customers?page=1&limit=20`,
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }),

        // 25% CREATE operations
        ...Array(25).fill({
          method: 'POST',
          path: `${API_PREFIX}/receipts`,
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testReceiptData),
        }),

        // 4% UPDATE operations (note: need to implement PATCH endpoints for realistic test)
        // For now, use GET as placeholder
        ...Array(4).fill({
          method: 'GET',
          path: `${API_PREFIX}/health`,
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }),

        // 1% DELETE operations (note: need to implement DELETE endpoints for realistic test)
        // For now, use GET as placeholder
        ...Array(1).fill({
          method: 'GET',
          path: `${API_PREFIX}/health`,
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }),
      ];

      try {
        await new Promise<void>((resolve, reject) => {
          const instance = autocannon({
            url: API_URL,
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
            connections: mixedLoadConnections,
            pipelining: PIPELINE,
            duration: mixedLoadDuration,
            requests,
          }, (err: Error | null, result: Result) => {
            if (err) {
              log(`✗ Ошибка Mixed Load Scenario: ${err}`);
              reject(err);
              return;
            }

            log(`\n✓ Mixed Load Scenario завершен`);
            log(`  Requests: ${result.requests.total} total, ${result.requests.average.toFixed(2)} req/sec`);
            log(`  Latency: p50=${result.latency.p50}ms, p95=${result.latency.p97_5}ms, p99=${result.latency.p99}ms`);
            log(`  Throughput: ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB`);
            log(`  Errors: ${result.errors}, Timeouts: ${result.timeouts}`);

            const benchmarkResult: BenchmarkResult = {
              scenario: 'Mixed Load (70% R, 25% C, 4% U, 1% D)',
              timestamp: new Date().toISOString(),
              url: `${API_URL} (multiple endpoints)`,
              duration: mixedLoadDuration,
              connections: mixedLoadConnections,
              requests: {
                total: result.requests.total,
                average: result.requests.average,
                mean: result.requests.mean,
                stddev: result.requests.stddev,
                min: result.requests.min,
                max: result.requests.max,
                p0_001: result.requests.p0_001,
                p0_01: result.requests.p0_01,
                p0_1: result.requests.p0_1,
                p1: result.requests.p1,
                p2_5: result.requests.p2_5,
                p10: result.requests.p10,
                p25: result.requests.p25,
                p50: result.requests.p50,
                p75: result.requests.p75,
                p90: result.requests.p90,
                p97_5: result.requests.p97_5,
                p99: result.requests.p99,
                p99_9: result.requests.p99_9,
                p99_99: result.requests.p99_99,
                p99_999: result.requests.p99_999,
              },
              latency: {
                mean: result.latency.mean,
                stddev: result.latency.stddev,
                min: result.latency.min,
                max: result.latency.max,
                p0_001: result.latency.p0_001,
                p0_01: result.latency.p0_01,
                p0_1: result.latency.p0_1,
                p1: result.latency.p1,
                p2_5: result.latency.p2_5,
                p10: result.latency.p10,
                p25: result.latency.p25,
                p50: result.latency.p50,
                p75: result.latency.p75,
                p90: result.latency.p90,
                p97_5: result.latency.p97_5,
                p99: result.latency.p99,
                p99_9: result.latency.p99_9,
                p99_99: result.latency.p99_99,
                p99_999: result.latency.p99_999,
              },
              throughput: {
                average: result.throughput.average,
                mean: result.throughput.mean,
                stddev: result.throughput.stddev,
                min: result.throughput.min,
                max: result.throughput.max,
                total: result.throughput.total,
              },
              errors: result.errors,
              timeouts: result.timeouts,
              non2xx: result.non2xx || 0,
            };

            allResults.push(benchmarkResult);
            resolve();
          });

          autocannon.track(instance, { renderProgressBar: true });
        });
      } catch (error) {
        log(`✗ Ошибка Mixed Load Scenario: ${error}`);
      }
    }

    // Сохраняем результаты
    saveResults();

    log('\n✅ Benchmark завершен успешно!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    log(`\n❌ Benchmark завершен с ошибкой: ${err}`);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Запускаем
main();
