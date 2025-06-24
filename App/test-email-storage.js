// Test email storage functionality
require('dotenv').config();
const prisma = require('./prisma-client');

async function testEmailStorage() {
  console.log('Testing email storage functionality...\n');
  
  // Test email record
  const testEmail = {
    subject: 'Test Low Stock Alert - ' + new Date().toISOString(),
    fromEmail: 'Low Stock Alert <alerts@lowstockalert.com>',
    toEmail: process.env.NOTIFICATION_EMAIL || 'test@example.com',
    html: '<h2>Test Email</h2><p>This is a test to verify email storage is working.</p>',
    read: false
  };
  
  console.log('1. Testing email save to database...');
  try {
    await prisma.emailLog.create({ data: testEmail });
    console.log('Save result: ✅ SUCCESS');
  } catch (error) {
    console.log('Save result: ❌ FAILED', error.message);
    return;
  }
  
  console.log('\n2. Testing email retrieval from database...');
  const emails = await prisma.emailLog.findMany({ orderBy: { createdAt: 'desc' } });
  console.log(`Retrieved ${emails.length} emails from database`);
  
  if (emails.length > 0) {
    console.log('✅ Email storage is working correctly!');
    console.log('\nLatest email:');
    console.log('- Subject:', emails[0].subject);
    console.log('- From:', emails[0].fromEmail);
    console.log('- Date:', emails[0].createdAt);
  } else {
    console.log('❌ No emails found in database');
  }
  
  console.log('\n3. Summary:');
  if (emails.length > 0) {
    console.log('✅ Email storage is working correctly!');
    console.log('✅ Your inbox should now display emails properly');
    console.log('✅ Low stock alerts will be saved to database');
  } else {
    console.log('❌ Email storage is not working properly');
    console.log('📋 Please check the database connection and try again');
  }
  
  await prisma.$disconnect();
}

testEmailStorage().catch(console.error);