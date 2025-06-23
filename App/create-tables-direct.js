// Create tables directly through Supabase client
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

async function createTablesDirectly() {
  console.log('Creating tables directly...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Try to insert a test record to emails table - this will fail if table doesn't exist
    console.log('Testing emails table...');
    const { data, error } = await supabase
      .from('emails')
      .insert({
        shop_domain: 'test',
        subject: 'test',
        from_address: 'test',
        to_address: 'test',
        html_content: 'test'
      })
      .select();
    
    if (error) {
      console.log('Emails table error:', error.message);
      if (error.code === '42P01') {
        console.log('❌ emails table does not exist');
        console.log('Go to Supabase Dashboard > Table Editor > New Table');
        console.log('Create table named: emails');
        console.log('Add these columns:');
        console.log('- id (int8, primary key, auto-increment)');
        console.log('- shop_domain (text)');
        console.log('- subject (text)');
        console.log('- from_address (text)');
        console.log('- to_address (text)');
        console.log('- html_content (text)');
        console.log('- read (bool, default: false)');
        console.log('- created_at (timestamptz, default: now())');
      }
    } else {
      console.log('✅ emails table exists and working');
      // Clean up test record
      await supabase.from('emails').delete().eq('shop_domain', 'test');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createTablesDirectly();