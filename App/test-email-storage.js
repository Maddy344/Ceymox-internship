// Test email storage functionality
require('dotenv').config();
const { saveEmailToDB, getEmailsFromDB } = require('./database');

async function testEmailStorage() {
  console.log('Testing email storage functionality...\n');
  
  // Test email record
  const testEmail = {
    subject: 'Test Low Stock Alert - ' + new Date().toISOString(),
    from: 'Low Stock Alert <alerts@lowstockalert.com>',
    to: process.env.NOTIFICATION_EMAIL || 'test@example.com',
    html: '<h2>Test Email</h2><p>This is a test to verify email storage is working.</p>',
    read: false
  };
  
  console.log('1. Testing email save to database...');
  const saveResult = await saveEmailToDB(testEmail);
  console.log('Save result:', saveResult ? '✅ SUCCESS' : '❌ FAILED');
  
  if (!saveResult) {
    console.log('\n❌ Email save failed. This means:');
    console.log('   - The emails table probably doesn\'t exist in Supabase');
    console.log('   - You need to run the SQL commands in SUPABASE_FIX.sql');
    console.log('   - Check the console output above for specific error details');
    return;
  }
  
  console.log('\n2. Testing email retrieval from database...');
  const emails = await getEmailsFromDB();
  console.log(`Retrieved ${emails.length} emails from database`);
  
  if (emails.length > 0) {
    console.log('✅ Email storage is working correctly!');
    console.log('\nLatest email:');
    console.log('- Subject:', emails[0].subject);
    console.log('- From:', emails[0].from);
    console.log('- Date:', emails[0].date);
  } else {
    console.log('❌ No emails found in database');
  }
  
  console.log('\n3. Summary:');
  if (saveResult && emails.length > 0) {
    console.log('✅ Email storage is working correctly!');
    console.log('✅ Your inbox should now display emails properly');
    console.log('✅ Low stock alerts will be saved to the database');
  } else {
    console.log('❌ Email storage is not working properly');
    console.log('📋 Please follow the steps in TROUBLESHOOTING_GUIDE.md');
  }
}

testEmailStorage().catch(console.error);