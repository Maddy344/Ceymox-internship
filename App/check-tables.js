// Check what tables exist in Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function checkTables() {
  console.log('Checking Supabase tables...');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const tables = [
      'shops',
      'shop_settings', 
      'stock_logs',
      'emails',
      'low_stock_history',
      'notification_settings',
      'custom_thresholds'
    ];
    
    for (const table of tables) {
      try {
        console.log(`Checking table: ${table}`);
        const { data, error } = await supabase.from(table).select('*').limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: exists and accessible (${data.length} rows found)`);
        }
      } catch (tableError) {
        console.log(`❌ Table ${table}: ${tableError.message}`);
      }
    }
    
    // Try to create a simple table to test permissions
    console.log('\nTesting table creation permissions...');
    try {
      const { error } = await supabase.from('test_table').select('*').limit(1);
      console.log('Table creation test result:', error ? error.message : 'Success');
    } catch (e) {
      console.log('Table creation test error:', e.message);
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();