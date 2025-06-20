// Test script to verify Vercel deployment fixes
const fetch = require('node-fetch');
const chalk = require('chalk');

// Replace with your Vercel deployment URL
const BASE_URL = process.env.VERCEL_URL || 'https://ceymox-internship-low-stock-alert-a.vercel.app';

async function runTests() {
  console.log(chalk.blue('=== Testing Low Stock Alert App Vercel Fixes ==='));
  
  try {
    // Test 1: Check settings API
    console.log(chalk.yellow('\nTest 1: Checking settings API...'));
    const settingsResponse = await fetch(`${BASE_URL}/api/settings`);
    
    if (!settingsResponse.ok) {
      throw new Error(`Settings API returned ${settingsResponse.status}`);
    }
    
    const settings = await settingsResponse.json();
    console.log(chalk.green('✓ Settings API working'));
    console.log('Current settings:', settings);
    
    // Test 2: Check custom thresholds API
    console.log(chalk.yellow('\nTest 2: Checking custom thresholds API...'));
    const thresholdsResponse = await fetch(`${BASE_URL}/api/custom-thresholds`);
    
    if (!thresholdsResponse.ok) {
      throw new Error(`Custom thresholds API returned ${thresholdsResponse.status}`);
    }
    
    const thresholds = await thresholdsResponse.json();
    console.log(chalk.green('✓ Custom thresholds API working'));
    console.log('Current thresholds:', thresholds);
    
    // Test 3: Check emails API
    console.log(chalk.yellow('\nTest 3: Checking emails API...'));
    const emailsResponse = await fetch(`${BASE_URL}/api/emails`);
    
    if (!emailsResponse.ok) {
      throw new Error(`Emails API returned ${emailsResponse.status}`);
    }
    
    const emails = await emailsResponse.json();
    console.log(chalk.green('✓ Emails API working'));
    console.log(`Found ${emails.length} emails`);
    
    // Test 4: Check low stock API
    console.log(chalk.yellow('\nTest 4: Checking low stock API...'));
    const lowStockResponse = await fetch(`${BASE_URL}/check-low-stock?threshold=5`);
    
    if (!lowStockResponse.ok) {
      throw new Error(`Low stock API returned ${lowStockResponse.status}`);
    }
    
    const lowStockData = await lowStockResponse.json();
    console.log(chalk.green('✓ Low stock API working'));
    console.log(`Found ${lowStockData.items.length} low stock items`);
    
    console.log(chalk.blue('\n=== All tests passed! ==='));
  } catch (error) {
    console.error(chalk.red(`\n❌ Test failed: ${error.message}`));
    process.exit(1);
  }
}

runTests();