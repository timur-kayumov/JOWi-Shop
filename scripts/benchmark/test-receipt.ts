import { PrismaClient } from '@jowi/database';

const prisma = new PrismaClient();

async function testReceiptEndpoint() {
  console.log('🧪 Testing Receipt Endpoint...\n');

  try {
    // Get test data from database
    const tenantId = '424af838-23a4-40ae-bb7c-a7243106026e';

    // Get store
    const store = await prisma.store.findFirst({
      where: { tenantId },
    });
    if (!store) throw new Error('No store found');
    console.log(`📍 Store: ${store.name} (${store.id})`);

    // Get terminal
    const terminal = await prisma.terminal.findFirst({
      where: { storeId: store.id },
    });
    if (!terminal) throw new Error('No terminal found');
    console.log(`💻 Terminal: ${terminal.name} (${terminal.id})`);

    // Get employee
    const employee = await prisma.employee.findFirst({
      where: { tenantId },
    });
    if (!employee) throw new Error('No employee found');
    console.log(`👤 Employee: ${employee.id}`);

    // Get product variants (pick first 2)
    const variants = await prisma.productVariant.findMany({
      where: {
        product: { tenantId }
      },
      take: 2,
      include: {
        product: true
      }
    });
    if (variants.length === 0) throw new Error('No variants found');
    console.log(`📦 Variants: ${variants.length} items`);
    variants.forEach(v => console.log(`   - ${v.product.name} (${v.id})`));

    // Prepare receipt data
    const receiptData = {
      storeId: store.id,
      terminalId: terminal.id,
      employeeId: employee.id,
      items: variants.map((v, idx) => ({
        variantId: v.id,
        quantity: idx + 1, // 1, 2
        price: 15000 + (idx * 5000), // 15000, 20000
        discountAmount: 1000,
        taxRate: 12,
      })),
      payments: [
        {
          method: 'cash',
          amount: 50000,
        }
      ],
      comment: 'Test receipt from benchmark script'
    };

    console.log('\n📤 Sending POST request to /api/v1/receipts...');
    console.log('Request body:', JSON.stringify(receiptData, null, 2));

    // Get JWT token
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    const token = jwt.sign(
      {
        sub: '2251c5a5-1a56-473e-8e23-3fe37644c5fd',
        tenant_id: tenantId,
        role: 'admin',
        email: 'admin@jowi.shop'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Make HTTP request
    const response = await fetch('http://localhost:3001/api/v1/receipts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-tenant-id': tenantId
      },
      body: JSON.stringify(receiptData)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('\n❌ Request failed:', response.status, response.statusText);
      console.error('Error:', result);
      process.exit(1);
    }

    console.log('\n✅ Receipt created successfully!');
    console.log('\nReceipt Details:');
    console.log(`  ID: ${result.id}`);
    console.log(`  Receipt Number: ${result.receiptNumber}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Subtotal: ${result.subtotal}`);
    console.log(`  Discount: ${result.discountAmount}`);
    console.log(`  Tax: ${result.taxAmount}`);
    console.log(`  Total: ${result.total}`);
    console.log(`  Items: ${result.items.length}`);
    console.log(`  Payments: ${result.payments.length}`);

    console.log('\n🎉 Receipt endpoint test passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testReceiptEndpoint();
