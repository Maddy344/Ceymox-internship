const prisma = require('./prisma-client');

async function testConnection() {
  try {
    console.log('Testing Prisma connection...');
    
    // Test notification settings
    const settings = await prisma.notificationSettings.findFirst();
    console.log('Current settings:', settings);
    
    // Test custom thresholds
    const thresholds = await prisma.customThreshold.findMany();
    console.log('Custom thresholds:', thresholds);
    
    // Test email logs
    const emailCount = await prisma.emailLog.count();
    console.log('Email logs count:', emailCount);
    
    console.log('✅ Prisma connection successful!');
  } catch (error) {
    console.error('❌ Prisma connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();