// Setup script for new Supabase project
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Replace these with your NEW Supabase credentials
const NEW_SUPABASE_URL = 'YOUR_NEW_SUPABASE_URL';
const NEW_SUPABASE_KEY = 'YOUR_NEW_SUPABASE_KEY';

async function setupNewSupabase() {
  console.log('Setting up new Supabase project...');
  
  const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_KEY);
  
  // Test connection
  const { data, error } = await supabase.from('test').select('*').limit(1);
  
  if (error && error.code === '42P01') {
    console.log('✅ New Supabase connection working');
    console.log('Now update your .env file with:');
    console.log(`SUPABASE_URL=${NEW_SUPABASE_URL}`);
    console.log(`SUPABASE_ANON_KEY=${NEW_SUPABASE_KEY}`);
  } else {
    console.log('Connection result:', { data, error });
  }
}

// Uncomment and run after getting new credentials
// setupNewSupabase();
console.log('Update the credentials in this file first, then uncomment the function call');