// Test Supabase connection
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseKey ? 'Key provided (hidden)' : 'No key provided');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by listing tables
    const { data, error } = await supabase.from('notification_settings').select('*').limit(1);
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return;
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Data:', data);
    
    // Check if tables exist
    const tables = [
      'notification_settings',
      'custom_thresholds',
      'emails',
      'low_stock_history',
      'stock_logs',
      'shops',
      'shop_settings'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);
        if (error) {
          console.error(`Error accessing table ${table}:`, error);
        } else {
          console.log(`Table ${table} exists and is accessible`);
        }
      } catch (tableError) {
        console.error(`Error checking table ${table}:`, tableError);
      }
    }
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
  }
}

testSupabaseConnection();