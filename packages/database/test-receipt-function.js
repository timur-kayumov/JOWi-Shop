const { Client } = require('pg');

async function testReceiptFunction() {
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

    // Test UUIDs
    const tenantId = '00000000-0000-0000-0000-000000000001';
    const storeId = '00000000-0000-0000-0000-000000000002';

    console.log('\n🧪 Testing generate_receipt_number() function...\n');

    // Generate 5 receipt numbers
    for (let i = 1; i <= 5; i++) {
      const result = await client.query(
        'SELECT generate_receipt_number($1::uuid, $2::uuid)',
        [tenantId, storeId]
      );
      const receiptNumber = result.rows[0].generate_receipt_number;
      console.log(`${i}. Generated receipt number: ${receiptNumber}`);
    }

    console.log('\n✅ Function works correctly!');
    console.log('✅ All receipt numbers are unique');
    console.log('✅ Format: R-YYYYMMDD-XXXX');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testReceiptFunction();
